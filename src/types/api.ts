export interface User {
  uid: string;
  email: string;
  username: string;
  is_admin: boolean;
  created?: string;
  last_login?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
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

// Admin Types

export interface Universe {
  uid: string;
  name: string;
  description: string;
}

export interface UniverseCreate {
  name: string;
  description?: string;
}

export interface World {
  uid: string;
  universe_uid: string;
  real_origin: string | null;
  world_origin: string | null;
  time_scale: number;
  timezone: string;
}

export interface WorldCreate {
  universe_uid: string;
  real_origin?: string | null;
  world_origin?: string | null;
  time_scale?: number;
  timezone?: string;
}

export interface Character {
  uid: string;
  name: string;
  personality: string;
}

export interface CharacterCreate {
  name: string;
  personality: string;
}

export interface Life {
  uid: string;
  character_uid: string;
  world_uid: string;
  memory_uid: string;
  profile_uid: string;
  profile?: Profile; // In detail view
  latest_action?: any; // In detail view
}

export interface LifeDeployRequest {
  character_uid: string;
  world_uid: string;
}

export interface Profile {
  uid: string;
  owner_uid: string;
  owner_type: string;
  name: string;
  age?: number;
  bio?: string;
  status?: string;
  created: string;
}

export interface ProfileCreate {
  name: string;
  age?: number;
  bio?: string;
  status?: string;
}

export interface Relationship {
  source_uid: string;
  target_uid: string;
  memory_uid: string;
  following: boolean;
}

export interface Memory {
  uid: string;
  short_term: string;
  memo_items: Record<string, string>[];
  monologues: Record<string, string>[];
}

export interface MemoryUpdate {
  short_term?: string;
}

export interface ProfileListResponse {
  profiles: Profile[];
}
