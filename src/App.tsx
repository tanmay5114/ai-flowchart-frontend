// src/App.tsx

import { useState, useEffect, useCallback } from 'react';
import ChatPanel from './components/ChatPanel';
import VisualizationCanvas from './components/VisualizationCanvas';
import Controls from './components/Controls';
import { apiService } from './services/apiService';
import { sseService } from './services/sseService';
import type { AnimationState, Message, VisualizationData } from './types';

function App() {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentVisualization, setCurrentVisualization] = useState<VisualizationData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    progress: 0,
  });

  // Animation timer
  const [animationTimer, setAnimationTimer] = useState<number | null>(null);

  // Initialize SSE connection - FIXED VERSION
  useEffect(() => {
    console.log('🚀 SSE useEffect triggered');
    
    // CRITICAL: Clear existing listeners first (for HMR)
    console.log('🧹 Clearing existing listeners before setup...');
    sseService.clearAllListeners();
    
    // Now check how many listeners we have after clearing
    sseService.debugListeners();
    
    // Create named handler functions (easier to debug and cleanup)
    const handleQuestionCreated = (data: any) => {
      console.log('❓ Question created event received:', data);
      const question = data.question;
      if (question) {
        console.log('✅ Question created:', question);
      }
    };

    const handleAnswerCreated = (data: any) => {
      console.log('📨 Answer created event received (RAW):', data);
      console.log('🕐 Event timestamp:', new Date().toISOString());
      
      const answer = data.answer;
      if (!answer) {
        console.error('❌ No answer data found in SSE event:', data);
        return;
      }
      
      console.log('✅ Valid answer data:', answer);
      setIsLoading(false);
      
      const answerMessage: Message = {
        id: answer.id,
        type: 'answer',
        content: answer.text, // Backend sends 'text', not 'content'
        timestamp: new Date(answer.createdAt), // Backend sends 'createdAt', not 'timestamp'
        status: 'completed',
      };
      
      console.log('🆕 Creating answer message:', answerMessage.id);
      
      setMessages(prev => {
        console.log('📝 setMessages callback - prev count:', prev.length);
        
        // Check for duplicates
        const existingMessage = prev.find(msg => msg.id === answer.id);
        if (existingMessage) {
          console.warn('⚠️ DUPLICATE DETECTED - Message already exists:', answer.id);
          return prev; // Don't add duplicate
        }
        
        console.log('✅ Adding new unique message:', answer.id);
        const newMessages = [...prev, answerMessage];
        console.log('📊 New messages count:', newMessages.length);
        return newMessages;
      });
      
      // Handle visualization
      if (answer.visualization) {
        console.log('🎨 Setting visualization:', answer.visualization.id);
        const frontendVisualization: VisualizationData = {
          id: answer.visualization.id,
          title: answer.visualization.title,
          description: answer.visualization.description,
          duration: answer.visualization.duration,
          fps: answer.visualization.fps,
          metadata: answer.visualization.metadata ?? "",
          frames: answer.visualization.frames || []
        };
        
        setCurrentVisualization(frontendVisualization);
        setAnimationState(prev => ({
          ...prev,
          duration: frontendVisualization.duration,
          currentTime: 0,
          progress: 0,
        }));
      }
    };

    const handleAnswerError = (data: { questionId: string; error: string }) => {
      console.error('❌ Answer error event received:', data);
      setIsLoading(false);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.questionId 
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );
    };

    const handleConnectionChange = (connected: boolean) => {
      console.log('🔌 SSE connection status changed:', connected);
      setIsConnected(connected);
    };

    // Register listeners with named functions
    console.log('👂 Registering event listeners...');
    sseService.on('question_created', handleQuestionCreated);
    sseService.on('answer_created', handleAnswerCreated);
    sseService.on('answer_error', handleAnswerError);
    sseService.on('connection_change', handleConnectionChange);
    
    // Debug: Check listener count after registration
    sseService.debugListeners();
    
    // Connect to SSE
    console.log('📡 Connecting to SSE...');
    sseService.connect();

    // CLEANUP FUNCTION - This is the critical fix
    return () => {
      console.log('🧹 Cleaning up SSE listeners...');
      
      // Remove specific listeners using the exact function references
      sseService.off('question_created', handleQuestionCreated);
      sseService.off('answer_created', handleAnswerCreated);
      sseService.off('answer_error', handleAnswerError);
      sseService.off('connection_change', handleConnectionChange);
      
      // Debug: Check listener count after removal
      console.log('📊 Listeners after cleanup:');
      sseService.debugListeners();
      
      // Disconnect with listener clearing (for development/HMR)
      sseService.disconnect(true); // true = clear all listeners
      
      if (animationTimer) {
        clearInterval(animationTimer);
      }
    };
  }, []); // Empty dependency array is correct

  // Animation timer effect
  useEffect(() => {
    if (animationState.isPlaying && animationState.duration > 0) {
      const timer = setInterval(() => {
        setAnimationState(prev => {
          const newTime = Math.min(prev.currentTime + 16, prev.duration); // 60fps
          const newProgress = newTime / prev.duration;
          
          if (newTime >= prev.duration) {
            return {
              ...prev,
              currentTime: newTime,
              progress: newProgress,
              isPlaying: false,
            };
          }
          
          return {
            ...prev,
            currentTime: newTime,
            progress: newProgress,
          };
        });
      }, 16);
      
      setAnimationTimer(timer);
      
      return () => {
        clearInterval(timer);
        setAnimationTimer(null);
      };
    } else if (animationTimer) {
      clearInterval(animationTimer);
      setAnimationTimer(null);
    }
  }, [animationState.isPlaying, animationState.duration]);

  const handleSendMessage = useCallback(async (content: string) => {
    console.log('💬 handleSendMessage called with:', content);
    console.log('🕐 Send timestamp:', new Date().toISOString());
    
    // Check if already sending this message
    if (isLoading) {
      console.warn('⚠️ Already sending a message, ignoring duplicate');
      return;
    }
    
    const tempId = Date.now().toString();
    console.log('🆔 Generated temp ID:', tempId);
    
    setIsLoading(true);

    // Add temporary message immediately
    const tempMessage: Message = {
      id: tempId,
      type: 'question',
      content,
      timestamp: new Date(),
      status: 'pending',
    };
    
    setMessages(prev => {
      console.log('📝 Adding temporary message, prev count:', prev.length);
      return [...prev, tempMessage];
    });

    try {
      const defaultUserId = 'default-user';
      console.log('📤 Submitting question to API...');
      
      const question = await apiService.submitQuestion(defaultUserId, content);
      console.log('✅ Question submitted successfully:', question);

      // Update the temporary message with real ID
      setMessages(prev => {
        console.log('📝 Updating temp message to real ID:', question.id);
        return prev.map(msg => 
          msg.id === tempId
            ? { ...msg, id: question.id, status: 'pending' as const }
            : msg
        );
      });
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      setIsLoading(false);
      
      // Update temp message to error state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );
    }
  }, [isLoading]);

  // Animation controls
  const handlePlay = useCallback(() => {
    setAnimationState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const handlePause = useCallback(() => {
    setAnimationState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const handleRestart = useCallback(() => {
    setAnimationState(prev => ({
      ...prev,
      currentTime: 0,
      progress: 0,
      isPlaying: false,
    }));
  }, []);

  const handleSeek = useCallback((time: number) => {
    setAnimationState(prev => ({
      ...prev,
      currentTime: Math.max(0, Math.min(time, prev.duration)),
      progress: Math.max(0, Math.min(time / prev.duration, 1)),
    }));
  }, []);

  // Load initial conversation history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        console.log('Loading conversation history...');
        const { questions, answers } = await apiService.getQuestionHistory();
        console.log('Loaded history:', { questions: questions.length, answers: answers.length });
        
        const messageHistory: Message[] = [];
        
        // Combine questions and answers chronologically
        questions.forEach(question => {
          messageHistory.push({
            id: question.id,
            type: 'question',
            content: question.content,
            timestamp: new Date(question.timestamp),
            status: question.status === 'answered' ? 'completed' : question.status,
          });
          
          const answer = answers.find(a => a.questionId === question.id);
          if (answer) {
            messageHistory.push({
              id: answer.id,
              type: 'answer',
              content: answer.content,
              timestamp: new Date(answer.timestamp),
              status: 'completed',
            });
          }
        });
        
        // Sort by timestamp
        messageHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        console.log('Setting message history:', messageHistory.length, 'messages');
        setMessages(messageHistory);
        
      } catch (error) {
        console.error('Failed to load conversation history:', error);
      }
    };
    
    loadHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4 h-screen flex flex-col gap-4">
        {/* Header */}
        <header className="text-center py-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Chat-to-Visualization AI
          </h1>
          <p className="text-gray-600">
            Ask questions and learn through interactive animations
          </p>
          {/* Add debug info */}
          <div className="text-xs text-gray-400 mt-2">
            Messages: {messages.length} | Connected: {isConnected ? 'Yes' : 'No'} | Loading: {isLoading ? 'Yes' : 'No'}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          {/* Chat Panel */}
          <div className="flex flex-col min-h-0">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isConnected={isConnected}
            />
          </div>

          {/* Visualization Panel */}
          <div className="flex flex-col gap-4">
            {/* Visualization Canvas */}
            <div className="flex-1">
              {currentVisualization ? (
                <VisualizationCanvas
                  visualization={currentVisualization}
                  animationState={animationState}
                  width={800}
                  height={500}
                />
              ) : (
                <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2m-5 6l2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Visualization Yet</h3>
                    <p className="text-sm">
                      Ask a question in the chat to see an interactive visualization
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Animation Controls */}
            {currentVisualization && (
              <Controls
                animationState={animationState}
                onPlay={handlePlay}
                onPause={handlePause}
                onRestart={handleRestart}
                onSeek={handleSeek}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 text-sm text-gray-500 border-t border-gray-200">
          <p>
            Powered by AI • Real-time visualizations • Interactive learning
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;