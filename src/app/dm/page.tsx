'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { dmAPI } from '@/lib/api';
import type { Message } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { CHARACTER_CONFIG } from '@/lib/constants';
import styles from './dm.module.css';

export default function DMPage() {
  const router = useRouter();
  const { user, profileUid } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastTypingTimeRef = useRef<number>(0);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load initial messages
  useEffect(() => {
    if (!user || !profileUid) {
      router.push('/login');
      return;
    }

    const loadMessages = async () => {
      try {
        const response = await dmAPI.getMessages(
          profileUid,
          CHARACTER_CONFIG.PROFILE_UID,
          undefined,
          50
        );
        // Backend returns messages in chronological order (oldest to newest)
        setMessages(response.messages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [user, profileUid, router]);

  // Set up SSE stream
  useEffect(() => {
    if (!profileUid) return;

    const handleMessage = (data: any) => {
      // Handle new messages
      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          const newMessages = data.messages.filter(
            (newMsg: Message) => !prev.some((m) => m.uid === newMsg.uid)
          );
          return [...prev, ...newMessages];
        });
        // When new messages arrive, hide typing indicator
        setIsTyping(false);
      }

      // Handle typing indicator
      if (data.typing_ref !== undefined) {
        if (data.typing_ref === null) {
          setIsTyping(false);
        } else {
          // Show typing only if the typing_ref matches the last message FROM THE CHARACTER
          setMessages((prev) => {
            // Find the last message sent by the character (not by user)
            const lastCharacterMessage = [...prev]
              .reverse()
              .find((msg) => msg.source_uid === CHARACTER_CONFIG.PROFILE_UID);

            if (lastCharacterMessage && lastCharacterMessage.uid === data.typing_ref) {
              // typing_ref matches the last character message -> character is typing
              setIsTyping(true);
            } else {
              // typing_ref doesn't match or no character message found -> expired flag
              setIsTyping(false);
            }
            return prev;
          });
        }
      }
    };

    const handleError = (error: Error) => {
      console.error('SSE connection error:', error);
    };

    const stream = dmAPI.createMessageStream(
      profileUid,
      CHARACTER_CONFIG.PROFILE_UID,
      handleMessage,
      handleError
    );

    return () => {
      stream.close();
    };
  }, [profileUid]);

  // Send typing indicator (throttled to max once per second)
  const sendTypingIndicator = useCallback(async () => {
    if (!profileUid) return;

    const now = Date.now();
    const timeSinceLastTyping = now - lastTypingTimeRef.current;

    // Throttle: only send if at least 1 second has passed since last typing indicator
    if (timeSinceLastTyping < 1000) {
      return;
    }

    lastTypingTimeRef.current = now;

    try {
      const lastMessage = messages[messages.length - 1];
      await dmAPI.updateTyping({
        source_uid: profileUid,
        target_uid: CHARACTER_CONFIG.PROFILE_UID,
        message_uid: lastMessage?.uid,
      });
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }, [profileUid, messages]);

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;

    // Send typing indicator if user is actively typing
    if (e.target.value.length > 0) {
      sendTypingIndicator();
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !profileUid || sending) return;

    const content = inputValue.trim();
    setInputValue('');

    // Reset textarea height immediately
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    setSending(true);

    try {
      const newMessage = await dmAPI.sendMessage({
        source_uid: profileUid,
        target_uid: CHARACTER_CONFIG.PROFILE_UID,
        content,
      });

      // Add message to local state
      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore input value on error
      setInputValue(content);
    } finally {
      setSending(false);
      // Focus back to textarea
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  };

  // Go back to home
  const handleBack = () => {
    router.push('/home');
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className={styles.headerInfo}>
          <h2>{CHARACTER_CONFIG.NAME}</h2>
          <span className={styles.status}>{CHARACTER_CONFIG.STATUS}</span>
        </div>
      </header>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {loading ? (
          <div className={styles.loading}>메시지 로딩 중...</div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>대화를 시작해보세요!</p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((message) => {
              const isOwn = message.source_uid === profileUid;
              return (
                <div
                  key={message.uid}
                  className={`${styles.messageWrapper} ${isOwn ? styles.own : styles.other}`}
                >
                  <div className={styles.messageBubble}>
                    <p>{message.content}</p>
                    <span className={styles.timestamp}>
                      {formatDistanceToNow(new Date(message.created + 'Z'), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className={`${styles.messageWrapper} ${styles.other}`}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className={styles.inputContainer}>
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          placeholder="메시지 입력..."
          className={styles.input}
          disabled={sending}
          rows={1}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (inputValue.trim() && !sending) {
                await handleSendMessage(e as any);
                // Ensure focus after sending
                requestAnimationFrame(() => {
                  inputRef.current?.focus();
                });
              }
            }
          }}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || sending}
          className={styles.sendButton}
        >
          {sending ? '전송 중...' : '전송'}
        </button>
      </form>
    </div>
  );
}
