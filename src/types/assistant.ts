export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted';

export interface PermissionsState {
  recordAudio: boolean;
  readContacts: boolean;
  callPhone: boolean;
  postNotifications: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarColor: string;
  relation?: string;
}

export interface AndroidApp {
  name: string;
  packageName: string;
  icon: string;
  category: 'social' | 'media' | 'utility' | 'communication';
  webUrl?: string;
}

export interface IntentActionLog {
  id: string;
  timestamp: Date;
  toolName: 'openApp' | 'searchAndCallContact' | 'sendWhatsAppMessage' | 'sendGmail';
  intentAction: string;
  parameters: Record<string, any>;
  status: 'executing' | 'success' | 'permission_denied' | 'failed';
  resultMessage?: string;
  deepLink?: string;
}

export interface LiveMessage {
  id: string;
  sender: 'user' | 'sara' | 'system';
  text: string;
  timestamp: Date;
}
