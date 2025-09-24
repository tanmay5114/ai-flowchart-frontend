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

// Updated to match backend
export type VisualizationType = 'circle' | 'rectangle' | 'rect' | 'text' | 'line' | 'arrow' 
  | 'ellipse' | 'triangle' | 'star' | 'polygon' | 'arc' | 'wave' 
  | 'grid' | 'vector' | 'molecule' | 'beam' | 'particle' | 'orbit' 
  | 'pendulum' | 'spring' | 'path';

export interface VisualizationProperties {
  // Common properties
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
  opacity?: number;
  color?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  lineCap?: 'butt' | 'round' | 'square';
  dashPattern?: number[];

  // All the other properties from your backend...
  r?: number;
  radius?: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  font?: string;
  textAlign?: 'left' | 'center' | 'right';
  textBaseline?: 'top' | 'middle' | 'bottom';
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  arrowHeadSize?: number;
  // ... copy all other properties from backend
}

export interface VisualizationObject {
  id: string;
  type: VisualizationType;
  properties: VisualizationProperties;
}

export interface Frame {
  timestamp: number;
  objects: VisualizationObject[];
}

export interface VisualizationData {
  id: string;
  title: string;
  description: string;
  duration: number;
  fps: number;  // Added missing field
  metadata?: Record<string, any>;
  frames: Frame[];
}

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

export interface AnimationState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number; // 0 to 1
}