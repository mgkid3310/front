'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { dmAPI, profileAPI } from '@/lib/api';
import type { Message, Profile } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import styles from './dm.module.css';

export default function DMPage() {
  const router = useRouter();
  const { user, profileUid } = useAuthStore();
  const [characterList, setCharacterList] = useState<Profile[]>([]);
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
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

  // Load target profile and initial messages
  useEffect(() => {
    if (!user || !profileUid) {
      router.push('/login');
      return;
    }

    const init = async () => {
      try {
        // 1. Fetch available characters
        const characters = await profileAPI.getCharacterProfiles();
        setCharacterList(characters);
      } catch (error) {
        console.error('Failed to initialize DM:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, profileUid, router]);

  // Load messages when targetProfile changes
  useEffect(() => {
    if (!user || !profileUid || !targetProfile) return;

    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await dmAPI.getMessages(profileUid, targetProfile.uid, undefined, 50);
        setMessages(response.messages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [user, profileUid, targetProfile]);

  // Set up SSE stream
  useEffect(() => {
    if (!profileUid || !targetProfile) return;

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
        } else if (data.typing_ref === '') {
          // Empty string means typing without a reference message (e.g., first message)
          // Only show typing if there are no messages from the character yet
          setMessages((prev) => {
            const hasCharacterMessage = prev.some((msg) => msg.source_uid === targetProfile.uid);
            if (!hasCharacterMessage) {
              setIsTyping(true);
            }
            return prev;
          });
        } else {
          // Show typing only if the typing_ref matches the last message FROM THE CHARACTER
          setMessages((prev) => {
            // Find the last message sent by the character (not by user)
            const lastCharacterMessage = [...prev]
              .reverse()
              .find((msg) => msg.source_uid === targetProfile.uid);

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
      targetProfile.uid,
      handleMessage,
      handleError
    );

    return () => {
      stream.close();
    };
  }, [profileUid, targetProfile]);

  // Send typing indicator (throttled to max once per second)
  const sendTypingIndicator = useCallback(async () => {
    if (!profileUid || !targetProfile) return;

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
        target_uid: targetProfile.uid,
        message_uid: lastMessage?.uid,
      });
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }, [profileUid, targetProfile, messages]);

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
        target_uid: targetProfile!.uid,
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

  // Go back to home or deselect profile
  const handleBack = () => {
    if (targetProfile) {
      setTargetProfile(null);
    } else {
      router.push('/home');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Character List */}
      <div
        className={`border-r border-gray-200 flex flex-col bg-gray-50 ${targetProfile ? 'hidden md:flex md:w-80' : 'w-full md:w-80 flex'}`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <h1 className="font-bold text-lg">Messages</h1>
          <button
            onClick={() => router.push('/home')}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            Exit
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {characterList.map((char) => (
            <div
              key={char.uid}
              onClick={() => setTargetProfile(char)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${
                targetProfile?.uid === char.uid ? 'bg-blue-50' : ''
              }`}
            >
              <div className="font-semibold">{char.name}</div>
              <div className="text-xs text-gray-500 truncate">{char.bio || 'No bio'}</div>
            </div>
          ))}
          {characterList.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">No characters available.</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col bg-white relative ${targetProfile ? 'flex' : 'hidden md:flex'}`}
      >
        {targetProfile ? (
          <>
            {/* Header */}
            <header className={styles.header}>
              <button onClick={handleBack} className={`${styles.backButton} md:hidden`}>
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
                <h2>{targetProfile.name}</h2>
                <span className={styles.status}>온라인</span>
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
              <p>Select a character to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
