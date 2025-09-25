// src/App.tsx
import { useState, useCallback, useEffect } from 'react';
import ChatPanel from './components/ChatPanel';
import VisualizationCanvas from './components/VisualizationCanvas';
import { apiService } from './services/apiService';
import { sseService } from './services/sseService';
import type { Message } from './types';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [flowchartDefinition, setFlowChartDefinition] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [theme, setTheme] = useState<'default' | 'dark' | 'forest' | 'neutral'>("default");
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Set up SSE listeners on component mount
  useEffect(() => {
    // Listen for connection changes
    sseService.on('connection_change', (connected: boolean) => {
      setIsConnected(connected);
    });

    // Listen for answer_created events (when backend sends response)
    sseService.on('answer_created', (data: any) => {
      console.log('Received answer_created:', data);
      
      // Create AI response message from backend data
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'answer',
        content: data.answer.text || "Here is the visualization to explain the related concept",
        timestamp: new Date(),
        status: 'completed',
      };
      
      // Add AI message to chat
      setMessages(prev => [...prev, aiMessage]);
      
      // Update chart if provided
      if (data.answer.chart) {
        setFlowChartDefinition(data.answer.chart.chartDefinition);
        setTheme(data.answer.chart.theme);
        setTitle(data.answer.chart.title);
        setDescription(data.answer.chart.description);
      }
      
      setIsLoading(false);
    });

    // Listen for question_created events (confirmation from backend)
    sseService.on('question_created', (data: any) => {
      console.log('Question created:', data);
    });

    // Listen for answer_error events
    sseService.on('answer_error', (data: any) => {
      console.log('Answer error:', data);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'answer',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date(),
        status: 'error',
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    });

    // Connect to SSE
    sseService.connect();

    // Cleanup on unmount
    return () => {
      sseService.disconnect(true);
    };
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // 1. Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'question',
      content,
      timestamp: new Date(),
      status: 'pending',
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // 2. Submit question to backend via API
      const questionResponse = await apiService.submitQuestion('user123', content);
      console.log('Question submitted:', questionResponse);
      
      // 3. Update user message status to completed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'completed' as const }
            : msg
        )
      );
      
    } catch (error) {
      console.error('Failed to submit question:', error);
      
      // Update user message to show error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );
      
      setIsLoading(false);
    }
  }, [isLoading]);

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 -z-10"></div>
      
      {/* Main content */}
      <div className="flex w-full h-full gap-6 p-6 box-border flex-col lg:flex-row">
        {/* Chat Panel */}
        <div className="w-full lg:w-[600px] lg:flex-shrink-0 h-full">
          <div className="h-full bg-white rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm border border-white/20 flex flex-col transition-all duration-300 hover:shadow-3xl hover:-translate-y-0.5 bg-gradient-to-br from-white to-slate-50">
            <div className="px-6 py-5 border-b border-black/5 bg-gradient-to-r from-white/80 to-slate-50/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.418 16.97 20 12 20C10.89 20 9.84 19.8 8.87 19.44L3 21L4.56 15.13C4.2 14.16 4 13.11 4 12C4 7.582 8.03 4 12 4C16.97 4 21 7.582 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Chat Assistant</h2>
                <div className={`flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
                  isConnected 
                    ? 'bg-green-500/10 text-green-600' 
                    : 'bg-red-500/10 text-red-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                isConnected={isConnected}
              />
            </div>
          </div>
        </div>

        {/* Visualization Panel */}
        <div className="flex-1 min-w-0 h-full">
          <div className="h-full bg-white rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm border border-white/20 flex flex-col transition-all duration-300 hover:shadow-3xl hover:-translate-y-0.5 bg-gradient-to-br from-white to-slate-100">
            <div className="px-6 py-5 border-b border-black/5 bg-gradient-to-r from-white/80 to-slate-100/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 9L12 6L16 10L20 6L22 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Visualization Canvas</h2>
                {title && (
                  <div className="flex items-center px-3 py-1 bg-indigo-500/10 rounded-xl ml-auto">
                    <span className="text-xs font-medium text-indigo-600 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {title}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
              <VisualizationCanvas
                chartDefinition={flowchartDefinition}
                title={title}
                description={description}
                theme={theme}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Custom animation styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          .shadow-3xl {
            box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
          }
        `
      }} />
    </div>
  );
}

export default App;