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
        content: data.answer.text || "Here is the visualization to explain the related concept", // ← Backend response content
        timestamp: new Date(),
        status: 'completed',
      };
      
      // Add AI message to chat
      setMessages(prev => [...prev, aiMessage]);
      
      // Update chart if provided
      if (data.answer.chart) {
        setFlowChartDefinition(data.answer.chart.chartDefinition);
      }
      
      setIsLoading(false);
    });

    // Listen for question_created events (confirmation from backend)
    sseService.on('question_created', (data: any) => {
      console.log('Question created:', data);
      // You could update the user's message status here if needed
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
      
      // The response will come via SSE (answer_created event)
      // so we don't setIsLoading(false) here - it happens in the SSE handler
      
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
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <div style={{ width: '600px', height: '100vh', borderRight: '1px solid #ccc' }}>
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isConnected={isConnected} // ← Use real SSE connection status
        />
      </div>

      <div style={{ width: '800px', height: '100vh', backgroundColor: '#f9f9f9' }}>
        <VisualizationCanvas
          chartDefinition={flowchartDefinition}
          title="Process Flow"
          description="AI request processing workflow"
          theme="default"
        />
      </div>
    </div>
  );
}

export default App;