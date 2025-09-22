import type { Answer, Question } from "../types";

// src/services/apiService.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async submitQuestion(content: string): Promise<Question> {
    return this.request<Question>('/questions', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getQuestions(): Promise<Question[]> {
    return this.request<Question[]>('/questions');
  }

  async getAnswer(questionId: string): Promise<Answer> {
    return this.request<Answer>(`/answers/${questionId}`);
  }

  async getQuestionHistory(): Promise<{ questions: Question[]; answers: Answer[] }> {
    const questions = await this.getQuestions();
    const answers = await Promise.all(
      questions
        .filter(q => q.status === 'answered')
        .map(q => this.getAnswer(q.id))
    );
    
    return { questions, answers };
  }
}

export const apiService = new ApiService();