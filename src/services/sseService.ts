// src/services/sseService.ts
import type { SSEEvent } from "../types";

type EventCallback<T = any> = (data: T) => void;

class SSEService {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, EventCallback[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  private url: string;
  private _isConnected = false;

  constructor(url?: string) {
    this.url = url || import.meta.env.VITE_SSE_URL || 'http://localhost:3001/api/stream';
    console.log('SSE Service initialized with URL:', this.url);
  }

  get isConnected(){
    return this._isConnected;
  }

  private setConnected(value: boolean){
    console.log('SSE connection status changed:', value);
    this._isConnected = value;
    const callbacks = this.listeners.get("connection_change") || [];
    callbacks.forEach(cb => cb(value));
  }

  connect(): void {
    if (this.eventSource?.readyState === EventSource.OPEN) {
      console.log('SSE already connected');
      return;
    }

    console.log('Attempting to connect to SSE at:', this.url);
    
    try {
      this.eventSource = new EventSource(this.url);
      
      this.eventSource.onopen = () => {
        console.log('SSE connection established successfully');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.setConnected(true);
      };

      this.eventSource.onmessage = (event) => {
        console.log('SSE message received:', event);
        console.log('Event type:', event.type);
        console.log('Event data:', event.data);
        
        try {
          const data = JSON.parse(event.data);
          console.log('Parsed SSE data:', data);
          
          // Handle the event with the correct format
          this.handleEvent({
            type: event.type || 'message', // Use the SSE event type
            data: data
          });
        } catch (error) {
          console.error('Failed to parse SSE message:', error, 'Raw data:', event.data);
        }
      };

      // Also listen for specific event types
      this.eventSource.addEventListener('answer_created', (event) => {
        console.log('answer_created event received:', event.data);
        try {
          const data = JSON.parse(event.data);
          this.handleEvent({
            type: 'answer_created',
            data: data
          });
        } catch (error) {
          console.error('Failed to parse answer_created event:', error);
        }
      });

      this.eventSource.addEventListener('question_created', (event) => {
        console.log('question_created event received:', event.data);
        try {
          const data = JSON.parse(event.data);
          this.handleEvent({
            type: 'question_created',
            data: data
          });
        } catch (error) {
          console.error('Failed to parse question_created event:', error);
        }
      });

      this.eventSource.addEventListener('answer_error', (event) => {
        console.log('answer_error event received:', event.data);
        try {
          const data = JSON.parse(event.data);
          this.handleEvent({
            type: 'answer_error',
            data: data
          });
        } catch (error) {
          console.error('Failed to parse answer_error event:', error);
        }
      });

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        console.log('EventSource readyState:', this.eventSource?.readyState);
        this.setConnected(false);
        
        // Only attempt reconnect if we're not intentionally closing
        if (this.eventSource?.readyState !== EventSource.CLOSED) {
          this.handleReconnect();
        }
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      this.setConnected(false);
      this.handleReconnect();
    }
  }

  private handleEvent(event: SSEEvent): void {
    console.log(`Handling SSE event: ${event.type}`, event.data);
    const callbacks = this.listeners.get(event.type) || [];
    console.log(`Found ${callbacks.length} callbacks for event type: ${event.type}`);
    
    callbacks.forEach(callback => {
      try {
        callback(event.data);
      } catch (error) {
        console.error(`Error in SSE event handler for ${event.type}:`, error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`);

    setTimeout(() => {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  on<T = any>(eventType: string, callback: EventCallback<T>): void {
    console.log(`Registering listener for event type: ${eventType}`);
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
    console.log(`Total listeners for ${eventType}:`, this.listeners.get(eventType)!.length);
  }

  off<T = any>(eventType: string, callback: EventCallback<T>): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        console.log(`Removed listener for ${eventType}, remaining:`, callbacks.length);
      }
    }
  }

  disconnect(): void {
    console.log('Disconnecting SSE service');
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.setConnected(false);
    // Don't clear listeners - they should persist across reconnections
    // this.listeners.clear(); // Commented out this problematic line
  }

  getConnectionState(): number {
    const state = this.eventSource?.readyState ?? EventSource.CLOSED;
    console.log("EventSource readyState:", state);
    return state;
  }

  // Debug method to check current state
  debug(): void {
    console.log('=== SSE Service Debug Info ===');
    console.log('URL:', this.url);
    console.log('Connected:', this._isConnected);
    console.log('EventSource state:', this.eventSource?.readyState);
    console.log('Registered listeners:', Array.from(this.listeners.keys()));
    console.log('Reconnect attempts:', this.reconnectAttempts);
    console.log('==============================');
  }
}

export const sseService = new SSEService();