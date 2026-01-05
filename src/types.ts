// Common types
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface Conversation {
  id: string;
  title?: string;
  messages: Message[];
  timestamp?: string;
  platform: Platform;
}

export type Platform = 'ollama' | 'lmstudio' | 'chatgpt' | 'gemini' | 'claude';

export type SourceType = 'local' | 'online';

// Ollama types
export interface OllamaMessage {
  role: string;
  content: string;
  created_at?: string;
}

export interface OllamaConversation {
  id?: string;
  name?: string;
  messages: OllamaMessage[];
  created_at?: string;
}

// LM Studio types
export interface LMStudioMessage {
  role: string;
  content: string;
  timestamp?: number;
}

export interface LMStudioConversation {
  id?: string;
  title?: string;
  messages: LMStudioMessage[];
  createdAt?: number;
}

// ChatGPT types
export interface ChatGPTMessage {
  role: string;
  content: {
    parts?: string[];
    text?: string;
  };
  create_time?: number;
}

export interface ChatGPTConversation {
  id?: string;
  title?: string;
  mapping?: {
    [key: string]: {
      message?: ChatGPTMessage;
    };
  };
  create_time?: number;
}

// Gemini types (Google AI Studio)
export interface GeminiMessage {
  role?: string;
  parts?: Array<{ text: string }>;
  text?: string;
}

export interface GeminiConversation {
  id?: string;
  name?: string;
  contents?: GeminiMessage[];
  history?: GeminiMessage[];
  createTime?: string;
}

// Claude types (Anthropic)
export interface ClaudeMessage {
  role: string;
  content: string | Array<{ type: string; text: string }>;
  timestamp?: string;
}

export interface ClaudeConversation {
  id?: string;
  name?: string;
  messages?: ClaudeMessage[];
  created_at?: string;
}

// Export result
export interface ExportResult {
  conversations: Conversation[];
  platform: Platform;
  exportDate: string;
}
