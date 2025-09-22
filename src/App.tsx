// src/App.tsx

import { useState, useEffect, useCallback } from 'react';
import ChatPanel from './components/ChatPanel';
import VisualizationCanvas from './components/VisualizationCanvas';
import Controls from './components/Controls';
import { apiService } from './services/apiService';
import { sseService } from './services/sseService';
import type { AnimationState, Answer, Message, Question, VisualizationData } from './types';

function App() {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentVisualization, setCurrentVisualization] = useState<VisualizationData | null>(null);
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
    // Set up SSE event listeners
    sseService.on('question_created', (question: Question) => {
      console.log('Question created:', question);
    });

    sseService.on('answer_created', (answer: Answer) => {
      console.log('Answer received:', answer);
      setIsLoading(false);
      
      // Add answer message
      const answerMessage: Message = {
        id: answer.id,
        type: 'answer',
        content: answer.content,
        timestamp: new Date(answer.timestamp),
        status: 'completed',
      };
      
      setMessages(prev => [...prev, answerMessage]);
      
      // Set visualization if available
      if (answer.visualization) {
        setCurrentVisualization(answer.visualization);
        setAnimationState(prev => ({
          ...prev,
          duration: answer.visualization!.duration,
          currentTime: 0,
          progress: 0,
        }));
      }
    });

    sseService.on('answer_error', (error: { questionId: string; error: string }) => {
      console.error('Answer error:', error);
      setIsLoading(false);
      
      // Update question status to error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === error.questionId 
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );
    });

    sseService.on('ping', () => {
      setIsConnected(true);
    });

    // Connect to SSE
    sseService.connect();
    setIsConnected(sseService.getConnectionState() === EventSource.OPEN);

    // Cleanup
    return () => {
      sseService.disconnect();
      if (animationTimer) {
        clearInterval(animationTimer);
      }
    };
  }, [animationTimer]);

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
  }, [animationState.isPlaying, animationState.duration, animationTimer]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);
      
      // Add user message immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'question',
        content,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Submit question to API
      const question = await apiService.submitQuestion(content);
      
      // Update message with question ID
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, id: question.id, status: 'pending' as const }
            : msg
        )
      );
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
      
      // Update message status to error
      setMessages(prev => 
        prev.map(msg => 
          msg.content === content 
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );
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
        const { questions, answers } = await apiService.getQuestionHistory();
        
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