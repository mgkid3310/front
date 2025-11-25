export interface User {
  uid: string;
  email: string;
  username: string;
  is_admin: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Message {
  uid: string;
  source_uid: string;
  target_uid: string;
  content: string;
  created: string;
}

export interface MessageHistoryResponse {
  messages: Message[];
  has_more: boolean;
}

export interface MessageStream {
  messages: Message[];
  typing_ref: string | null;
}

export interface SendMessageRequest {
  source_uid: string;
  target_uid: string;
  content: string;
}

export interface TypingRequest {
  source_uid: string;
  target_uid: string;
  message_uid?: string;
}
