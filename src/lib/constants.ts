/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * App Routes
 */
export const ROUTES = {
  HOME: '/home',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DM: '/dm',
} as const;

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER: 'user',
  PROFILE_UID: 'profileUid',
} as const;

/**
 * Message Limits
 */
export const MESSAGE_CONFIG = {
  MAX_LENGTH: 2000,
  LOAD_LIMIT: 50,
  TYPING_DEBOUNCE_MS: 1000,
  TYPING_TIMEOUT_MS: 600000, // 10 minutes
} as const;

/**
 * UI Constants
 */
export const UI_CONFIG = {
  ANIMATION_DURATION_MS: 300,
  SCROLL_BEHAVIOR: 'smooth' as ScrollBehavior,
} as const;
