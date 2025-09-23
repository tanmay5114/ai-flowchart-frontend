// src/types/index.ts

export interface Message {
  id: string;
  type: 'question' | 'answer';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'completed' | 'error';
}

export interface Question {
  id: string;
  content: string;
  timestamp: Date;
  status: 'pending' | 'answered' | 'error';
}

export interface Answer {
  id: string;
  questionId: string;
  content: string;
  visualization?: VisualizationData;
  timestamp: Date;
}

// Animation Types
export type EasingFunction = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface Animation {
  property: string;
  from: number | string;
  to: number | string;
  start: number; // milliseconds
  end: number; // milliseconds
  easing?: EasingFunction;
}

export interface ShapeProps {
  x?: number;
  y?: number;
  r?: number; // radius for circles
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  opacity?: number;
  rotation?: number;
}

export interface Shape {
  id: string;
  type: 'circle' | 'rectangle' | 'text' | 'arrow' | 'line';
  props: ShapeProps;
  animations: Animation[];
}

export interface VisualizationData {
  id: string;
  type: string;
  title: string;
  description: string;
  duration: number;
  frames: Array<{
    timestamp: number;
    objects: Array<{
      id: string;
      type: string;
      properties: any;
    }>;
  }>;
  metadata?: any;
}
// SSE Event Types
export interface SSEEvent {
  type: string;
  data: any;
}

export interface QuestionCreatedEvent extends SSEEvent {
  type: 'question_created';
  data: Question;
}

export interface AnswerCreatedEvent extends SSEEvent {
  type: 'answer_created';
  data: Answer;
}

export interface AnswerErrorEvent extends SSEEvent {
  type: 'answer_error';
  data: { questionId: string; error: string };
}

// Animation Control Types
export interface AnimationState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number; // 0 to 1
}