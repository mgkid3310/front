'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/lib/adminApi';
import type { Memory, MemorySearchResult } from '@/types/api';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function MemoryDetailPage() {
  const { uid } = useParams();
  const router = useRouter();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [shortTerm, setShortTerm] = useState('');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadMemory = useCallback(
    async (id: string) => {
      try {
        const data = await adminAPI.getMemory(id);
        setMemory(data);
        setShortTerm(data.short_term || '');
      } catch {
        alert('Failed to load memory');
        router.push('/admin/memory');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (uid) {
      loadMemory(uid as string);
    }
  }, [uid, loadMemory]);

  const handleSave = async () => {
    if (!memory) return;
    try {
      await adminAPI.updateMemory(memory.uid, {
        short_term: shortTerm,
      });
      alert('Memory updated successfully');
      loadMemory(memory.uid);
    } catch (e) {
      console.error(e);
      alert('Failed to update memory');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memory || !searchQuery) return;
    setIsSearching(true);
    try {
      const data = await adminAPI.searchMemory(memory.uid, searchQuery);
      setSearchResults(data.results);
    } catch (e) {
      console.error(e);
      alert('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) return <div className="p-8 text-[#262626]">Loading...</div>;
  if (!memory) return <div className="p-8 text-[#262626]">Memory not found</div>;

  return (
    <div className="h-full flex flex-col bg-white border border-[#dbdbdb] rounded-lg p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6 border-b border-[#dbdbdb] pb-4">
        <h2 className="text-xl font-semibold text-[#262626]">Memory Editor</h2>
        <div className="text-sm text-[#8e8e8e] font-mono">UID: {memory.uid}</div>
      </div>

      <div className="space-y-8 max-w-4xl mx-auto w-full pb-10">
        {/* Search Section */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="font-bold text-[#262626] mb-4 flex items-center gap-2">
            <span>🔍</span> Vector Search (RAG)
          </h3>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search memory content..."
              className="flex-1 px-4 py-2 border border-[#dbdbdb] rounded-[4px] focus:border-[#0095f6] focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              disabled={isSearching}
              className="bg-[#0095f6] text-white px-6 py-2 rounded-[4px] font-semibold hover:bg-[#1877f2] disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto bg-white rounded border border-[#dbdbdb] p-2">
              {searchResults.map((res, idx) => (
                <div
                  key={idx}
                  className="p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <div className="text-xs text-gray-400 mb-1">
                    {res.timestamp ? format(new Date(res.timestamp), 'yyyy-MM-dd HH:mm:ss') : '-'}
                  </div>
                  <div className="text-sm text-[#262626]">{res.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Short Term Memory */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#262626]">
            Short Term Memory (Summary)
          </label>
          <textarea
            className="w-full p-3 bg-gray-50 border border-[#dbdbdb] rounded-[4px] h-32 focus:border-[#a8a8a8] focus:outline-none resize-none"
            value={shortTerm}
            onChange={(e) => setShortTerm(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSave}
              className="bg-[#ed4956] text-white px-6 py-2 rounded-[4px] text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Episodes */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#262626]">
            Episodes (Long Term)
          </label>
          <div className="bg-gray-50 border border-[#dbdbdb] rounded-[4px] max-h-64 overflow-auto">
            {(memory.episodes || []).map((ep, idx) => (
              <div key={idx} className="p-3 border-b border-[#dbdbdb] last:border-0">
                <div className="text-xs text-gray-500 mb-1">
                  {ep.created ? format(new Date(ep.created), 'yyyy-MM-dd HH:mm') : '-'}
                </div>
                <div className="text-sm text-[#262626]">{ep.summary}</div>
              </div>
            ))}
            {(!memory.episodes || memory.episodes.length === 0) && (
              <div className="p-4 text-center text-gray-400 text-sm">No episodes recorded</div>
            )}
          </div>
        </div>

        {/* Memo Items */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#262626]">Memo Items</label>
          <div className="bg-gray-50 border border-[#dbdbdb] rounded-[4px] max-h-64 overflow-auto">
            {(memory.memo_items || []).map((item, idx) => (
              <div key={idx} className="p-3 border-b border-[#dbdbdb] last:border-0">
                <div className="text-xs text-gray-500 mb-1">
                  {item.timestamp ? format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm') : '-'}
                </div>
                <div className="text-sm text-[#262626]">{item.content}</div>
              </div>
            ))}
            {(!memory.memo_items || memory.memo_items.length === 0) && (
              <div className="p-4 text-center text-gray-400 text-sm">No memo items</div>
            )}
          </div>
        </div>

        {/* Monologues */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#262626]">Monologues</label>
          <div className="bg-gray-50 border border-[#dbdbdb] rounded-[4px] max-h-64 overflow-auto">
            {(memory.monologues || []).map((item, idx) => (
              <div key={idx} className="p-3 border-b border-[#dbdbdb] last:border-0">
                <div className="text-xs text-gray-500 mb-1">
                  {item.timestamp ? format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm') : '-'}
                </div>
                <div className="text-sm text-[#262626] italic">"{item.content}"</div>
              </div>
            ))}
            {(!memory.monologues || memory.monologues.length === 0) && (
              <div className="p-4 text-center text-gray-400 text-sm">No monologues</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
