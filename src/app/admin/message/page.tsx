'use client';

import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '@/lib/adminApi';
import { dmAPI } from '@/lib/api';
import type { Message } from '@/types/api';
import { format } from 'date-fns';

export default function MessageDebuggerPage() {
  const [sourceUid, setSourceUid] = useState('');
  const [targetUid, setTargetUid] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamCleanupRef = useRef<(() => void) | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
      }
    };
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUid || !targetUid) return;

    setLoading(true);
    try {
      // 1. Load initial messages
      const response = await adminAPI.getMessages(sourceUid, targetUid, undefined, 50);
      setMessages(response.messages);
      setIsConnected(true);

      // 2. Start Stream
      if (streamCleanupRef.current) streamCleanupRef.current();

      const cleanup = dmAPI.createMessageStream(
        sourceUid,
        targetUid,
        (data) => {
          if (data.messages && data.messages.length > 0) {
            setMessages((prev) => {
              const newMessages = data.messages.filter(
                (newMsg: Message) => !prev.some((m) => m.uid === newMsg.uid)
              );
              return [...prev, ...newMessages];
            });
          }
        },
        (error) => {
          console.error('Stream error:', error);
          setIsConnected(false);
        }
      );
      streamCleanupRef.current = cleanup.close;
    } catch (e) {
      console.error(e);
      alert('Failed to connect or load messages');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
    }
    setIsConnected(false);
    setMessages([]);
  };

  return (
    <div className="h-full flex flex-col bg-white border border-[#dbdbdb] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#dbdbdb] bg-gray-50 flex justify-between items-center">
        <h2 className="font-semibold text-[#262626]">Message Debugger</h2>
        <div className="text-xs text-gray-500">Monitor chat between two profiles (Read-only)</div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-[#dbdbdb] bg-white">
        <form onSubmit={handleConnect} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
              Source Profile UID
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-50 border border-[#dbdbdb] rounded-[4px] text-sm focus:border-[#a8a8a8] focus:outline-none font-mono"
              value={sourceUid}
              onChange={(e) => setSourceUid(e.target.value)}
              placeholder="User Profile UID"
              disabled={isConnected}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
              Target Profile UID
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-50 border border-[#dbdbdb] rounded-[4px] text-sm focus:border-[#a8a8a8] focus:outline-none font-mono"
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              placeholder="Character Profile UID"
              disabled={isConnected}
              required
            />
          </div>
          {isConnected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-6 py-2 bg-[#ed4956] text-white rounded-[4px] text-sm font-semibold hover:opacity-90 transition-opacity h-[38px]"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#0095f6] text-white rounded-[4px] text-sm font-semibold hover:bg-[#1877f2] disabled:opacity-50 transition-all h-[38px]"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </form>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#fafafa] space-y-4">
        {messages.length === 0 && isConnected && (
          <div className="text-center text-gray-400 mt-10">No messages found.</div>
        )}
        {messages.map((msg) => {
          const isSource = msg.source_uid === sourceUid;
          return (
            <div key={msg.uid} className={`flex ${isSource ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                  isSource
                    ? 'bg-[#0095f6] text-white rounded-br-none'
                    : 'bg-white border border-[#dbdbdb] text-[#262626] rounded-bl-none'
                }`}
              >
                <div className="mb-1">{msg.content}</div>
                <div
                  className={`text-[10px] ${isSource ? 'text-blue-100' : 'text-gray-400'} text-right`}
                >
                  {format(new Date(msg.created), 'HH:mm:ss')}
                </div>
                <div
                  className={`text-[8px] font-mono mt-1 ${isSource ? 'text-blue-200' : 'text-gray-300'}`}
                >
                  {msg.uid}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
