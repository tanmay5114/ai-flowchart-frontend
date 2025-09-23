// src/components/DebugPanel.tsx
import React, { useState, useEffect } from 'react';
import { sseService } from '../services/sseService';
import { apiService } from '../services/apiService';

const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [sseEvents, setSseEvents] = useState<string[]>([]);
  const [connectionState, setConnectionState] = useState<number>(EventSource.CLOSED);

  useEffect(() => {
    // Monitor connection state
    const interval = setInterval(() => {
      setConnectionState(sseService.getConnectionState());
    }, 1000);

    // Listen to all SSE events for debugging
    const eventLogger = (eventType: string) => (data: any) => {
      const timestamp = new Date().toISOString();
      setSseEvents(prev => [...prev.slice(-9), `[${timestamp}] ${eventType}: ${JSON.stringify(data)}`]);
    };

    sseService.on('question_created', eventLogger('question_created'));
    sseService.on('answer_created', eventLogger('answer_created'));
    sseService.on('answer_error', eventLogger('answer_error'));
    sseService.on('connection_change', eventLogger('connection_change'));

    return () => {
      clearInterval(interval);
    };
  }, []);

  const testSSEConnection = () => {
    console.log('Testing SSE connection...');
    sseService.debug();
    sseService.disconnect();
    setTimeout(() => sseService.connect(), 1000);
  };

  const testAPICall = async () => {
    try {
      console.log('Testing API call...');
      const result = await apiService.submitQuestion('debug-user', 'Test question from debug panel');
      console.log('API call successful:', result);
    } catch (error) {
      console.error('API call failed:', error);
    }
  };

  const clearEventLog = () => {
    setSseEvents([]);
  };

  const getStateText = (state: number) => {
    switch (state) {
      case EventSource.CONNECTING: return 'CONNECTING';
      case EventSource.OPEN: return 'OPEN';
      case EventSource.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-red-500 text-white px-3 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-red-600"
        >
          🐛 Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50">
      <div className="bg-red-500 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold">Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
      
      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Connection Status */}
        <div className="mb-4">
          <h4 className="font-semibold mb-2">SSE Connection</h4>
          <div className="text-sm space-y-1">
            <div>State: <span className={`font-mono ${connectionState === EventSource.OPEN ? 'text-green-600' : 'text-red-600'}`}>
              {getStateText(connectionState)}
            </span></div>
            <div>Connected: <span className={`font-mono ${sseService.isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {sseService.isConnected ? 'YES' : 'NO'}
            </span></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-4 space-y-2">
          <button
            onClick={testSSEConnection}
            className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
          >
            Reconnect SSE
          </button>
          <button
            onClick={testAPICall}
            className="w-full bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
          >
            Test API Call
          </button>
          <button
            onClick={clearEventLog}
            className="w-full bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
          >
            Clear Event Log
          </button>
        </div>

        {/* Event Log */}
        <div>
          <h4 className="font-semibold mb-2">Recent SSE Events</h4>
          <div className="bg-gray-100 rounded p-2 max-h-48 overflow-y-auto">
            {sseEvents.length === 0 ? (
              <div className="text-gray-500 text-sm">No events received yet...</div>
            ) : (
              sseEvents.map((event, index) => (
                <div key={index} className="text-xs font-mono mb-1 break-all">
                  {event}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;