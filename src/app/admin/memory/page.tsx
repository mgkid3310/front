'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MemorySearchPage() {
  const [uid, setUid] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (uid) {
      router.push(`/admin/memory/${uid}`);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <form
        onSubmit={handleSearch}
        className="bg-white p-8 rounded-lg border border-[#dbdbdb] shadow-sm w-96"
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🧠</div>
          <h2 className="text-xl font-bold text-[#262626]">Memory Debugger</h2>
          <p className="text-sm text-gray-500 mt-1">Enter a Memory UID to inspect</p>
        </div>
        <input
          type="text"
          placeholder="Memory UID"
          className="w-full px-4 py-3 bg-gray-50 border border-[#dbdbdb] rounded-[4px] text-sm font-mono text-center focus:border-[#a8a8a8] focus:outline-none mb-4"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-[#0095f6] text-white py-2.5 rounded-[4px] text-sm font-semibold hover:bg-[#1877f2] active:opacity-70 transition-all"
        >
          Open Memory
        </button>
      </form>
    </div>
  );
}
