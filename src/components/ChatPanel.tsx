// src/components/ChatPanel.tsx

import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';

interface Props {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  isConnected: boolean;
}

const ChatPanel: React.FC<Props> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  isConnected 
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed && !isLoading) {
      onSendMessage(trimmed);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-rose-400 text-white p-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Chat with AI</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Welcome! 👋</h3>
                <p className="text-gray-600 mb-6">
                  Ask me any question and I'll explain it with interactive visualizations.
                </p>
                <div className="text-left bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Try asking:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      "How does gravity work?"
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      "Explain photosynthesis"
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      "What is machine learning?"
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      "How do electric circuits work?"
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'question' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl px-4 py-3 ${
                message.type === 'question' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                <div className={`flex items-center justify-between mt-2 text-xs ${
                  message.type === 'question' ? 'text-red-100' : 'text-gray-500'
                }`}>
                  <span>{formatTime(message.timestamp)}</span>
                  {message.status && (
                    <span className="ml-2">
                      {message.status === 'pending' && '⏳'}
                      {message.status === 'completed' && '✓'}
                      {message.status === 'error' && '❌'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Tanmay is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything... (Shift+Enter for new line)"
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                         disabled:bg-gray-100 disabled:cursor-not-allowed
                         min-h-[44px] max-h-32"
                disabled={isLoading || !isConnected}
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || !isConnected}
              className="w-11 h-11 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-gray-300 
                       disabled:cursor-not-allowed text-white flex items-center justify-center
                       transition-colors duration-200 text-lg flex-shrink-0"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                '🚀'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;