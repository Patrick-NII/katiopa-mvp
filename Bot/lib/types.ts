
// lib/types.ts
export type Sender = 'user' | 'bot';

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
}

export interface LinkAction {
  label: string;
  href: string;
}

export interface KBItem {
  id: string;
  q: string;
  tags: string[];
  a?: string;      // generic
  a_kid?: string;  // child tone
  a_pro?: string;  // parent/pro tone
  actions?: LinkAction[];
  topic?: string;  // ai, math, science, reading, etc.
  kind?: string;   // site, pedago, fun, lesson, problem
}
