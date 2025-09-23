// src/App.tsx

import { useState, useEffect, useCallback } from 'react';
import ChatPanel from './components/ChatPanel';
import VisualizationCanvas from './components/VisualizationCanvas';
import Controls from './components/Controls';
import { apiService } from './services/apiService';
import { sseService } from './services/sseService';
import type { AnimationState, Message, VisualizationData } from './types';

// Helper function to transform database visualization to frontend format
function transformVisualizationData(dbVisualization: any): Partial<VisualizationData> {
  if (!dbVisualization || !dbVisualization.layers) {
    return {};
  }

  // Convert database layers/animations to frontend frames format
  const frames = [];
  const duration = dbVisualization.duration || 5000;
  const frameCount = Math.ceil(duration / 16); // 60fps = 16ms per frame

  for (let i = 0; i < frameCount; i++) {
    const timestamp = i * 16;
    const objects = dbVisualization.layers.map((layer: any) => {
      let properties = { ...layer.props };

      // Apply animations to properties at this timestamp
      if (layer.animations) {
        layer.animations.forEach((anim: any) => {
          if (timestamp >= anim.startTime && timestamp <= anim.endTime) {
            const progress = (timestamp - anim.startTime) / (anim.endTime - anim.startTime);
            const easedProgress = applyEasing(progress, anim.easing);
            
            // Interpolate between from and to values
            if (typeof anim.fromValue === 'number' && typeof anim.toValue === 'number') {
              properties[anim.property] = anim.fromValue + (anim.toValue - anim.fromValue) * easedProgress;
            }
          }
        });
      }

      return {
        id: layer.layerId,
        type: layer.type,
        properties
      };
    });

    frames.push({
      timestamp,
      objects
    });
  }

  return {
    frames,
    metadata: dbVisualization.metadata
  };
}

// Simple easing function
function applyEasing(t: number, easing: string = 'linear'): number {
  switch (easing) {
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return 1 - (1 - t) * (1 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
    default:
      return t; // linear
  }
}

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

  // Initialize SSE connection
  useEffect(() => {
    console.log('Setting up SSE listeners...');
    
    // Set up SSE event listeners
    sseService.on('question_created', (data: any) => {
      console.log('Question created event received:', data);
      const question = data.question;
      if (question) {
        console.log('Question created:', question);
      }
    });

    sseService.on('answer_created', (data: any) => {
      console.log('Answer created event received:', data);
      
      // Extract answer from the data structure sent by backend
      const answer = data.answer;
      if (!answer) {
        console.error('No answer data found in SSE event:', data);
        return;
      }
      
      setIsLoading(false);
      
      // Add answer message
      const answerMessage: Message = {
        id: answer.id,
        type: 'answer',
        content: answer.text, // Backend sends 'text', not 'content'
        timestamp: new Date(answer.createdAt), // Backend sends 'createdAt', not 'timestamp'
        status: 'completed',
      };
      
      setMessages(prev => {
        console.log('Adding answer message to:', prev.length, 'existing messages');
        return [...prev, answerMessage];
      });
      
      // Set visualization if available
      if (answer.visualization) {
        console.log('Setting visualization:', answer.visualization);
        
        // Transform the database visualization to frontend format
        const frontendVisualization: VisualizationData = {
          id: answer.visualization.id,
          type: 'animation', // Default type
          title: 'AI Generated Visualization',
          description: 'Interactive visualization of the answer',
          duration: answer.visualization.duration,
          frames: [], // Will be populated from layers/animations
          // Convert database structure to frontend format
          ...transformVisualizationData(answer.visualization)
        };
        
        setCurrentVisualization(frontendVisualization);
        setAnimationState(prev => ({
          ...prev,
          duration: frontendVisualization.duration,
          currentTime: 0,
          progress: 0,
        }));
      }
    });

    sseService.on('answer_error', (data: { questionId: string; error: string }) => {
      console.error('Answer error event received:', data);
      setIsLoading(false);
      
      // Update question status to error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.questionId 
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );
    });

    const handleConnectionChange = (connected: boolean) => {
      console.log('SSE connection status changed:', connected);
      setIsConnected(connected);
    }

    sseService.on("connection_change", handleConnectionChange);

    // Connect to SSE
    console.log('Connecting to SSE...');
    sseService.connect();

    // Cleanup
    return () => {
      console.log('Cleaning up SSE connection...');
      sseService.disconnect();
      if (animationTimer) {
        clearInterval(animationTimer);
      }
    };
  }, []); // Remove animationTimer from dependencies

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
  }, [animationState.isPlaying, animationState.duration]); // Remove animationTimer from dependencies

  const handleSendMessage = useCallback(async (content: string) => {
    console.log('Sending message:', content);
    const tempId = Date.now().toString();
    setIsLoading(true);

    try {
      const defaultUserId = 'default-user';
      const question = await apiService.submitQuestion(defaultUserId, content);

      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        if(existingIds.has(question.id)){
          return prev.map(msg => 
            msg.id === tempId
              ? { ...msg, status: 'pending' as const }
              : msg
          );
        } else {
          return prev.map(msg => 
            msg.id === tempId
              ? { ...msg, id: question.id, status: 'pending' as const }
              : msg
          );
        }
      })
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
      
      // For error case, create a message with a unique temp ID
      const errorMessage: Message = {
        id: `error-${Date.now()}`, // Ensure unique ID for errors
        type: 'question',
        content,
        timestamp: new Date(),
        status: 'error',
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  }, []);

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