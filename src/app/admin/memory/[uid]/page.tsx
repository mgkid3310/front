'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/lib/adminApi';
import type { Memory } from '@/types/api';
import { useParams, useRouter } from 'next/navigation';

export default function MemoryDetailPage() {
  const { uid } = useParams();
  const router = useRouter();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [shortTerm, setShortTerm] = useState('');
  const [memoItemsJson, setMemoItemsJson] = useState('[]');
  const [monologuesJson, setMonologuesJson] = useState('[]');

  const loadMemory = useCallback(
    async (id: string) => {
      try {
        const data = await adminAPI.getMemory(id);
        setMemory(data);
        setShortTerm(data.short_term || '');
        setMemoItemsJson(JSON.stringify(data.memo_items || [], null, 2));
        setMonologuesJson(JSON.stringify(data.monologues || [], null, 2));
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
      let parsedMemoItems;
      let parsedMonologues;

      try {
        parsedMemoItems = JSON.parse(memoItemsJson);
      } catch {
        alert('Invalid JSON in Memo Items');
        return;
      }

      try {
        parsedMonologues = JSON.parse(monologuesJson);
      } catch {
        alert('Invalid JSON in Monologues');
        return;
      }

      await adminAPI.updateMemory(memory.uid, {
        short_term: shortTerm,
        memo_items: parsedMemoItems,
        monologues: parsedMonologues,
      });
      alert('Memory updated successfully');
      loadMemory(memory.uid);
    } catch (e) {
      console.error(e);
      alert('Failed to update memory');
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

      <div className="space-y-6 max-w-4xl mx-auto w-full">
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
        </div>

        {/* Memo Items (JSON) */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#262626]">
            Memo Items (JSON List)
          </label>
          <div className="text-xs text-[#8e8e8e] mb-2">Edit as JSON array of objects.</div>
          <textarea
            className="w-full p-3 bg-gray-50 border border-[#dbdbdb] rounded-[4px] h-64 font-mono text-sm focus:border-[#a8a8a8] focus:outline-none"
            value={memoItemsJson}
            onChange={(e) => setMemoItemsJson(e.target.value)}
          />
        </div>

        {/* Monologues (JSON) */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-[#262626]">
            Monologues (JSON List)
          </label>
          <div className="text-xs text-[#8e8e8e] mb-2">Edit as JSON array of objects.</div>
          <textarea
            className="w-full p-3 bg-gray-50 border border-[#dbdbdb] rounded-[4px] h-64 font-mono text-sm focus:border-[#a8a8a8] focus:outline-none"
            value={monologuesJson}
            onChange={(e) => setMonologuesJson(e.target.value)}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-[#dbdbdb]">
          <button
            onClick={handleSave}
            className="bg-[#ed4956] text-white px-6 py-2.5 rounded-[4px] font-semibold hover:opacity-90 transition-opacity"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
