'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/adminApi';
import type { Universe, World } from '@/types/api';
import { format } from 'date-fns';

export default function UniversePage() {
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
  const [worlds, setWorlds] = useState<World[]>([]);

  // Form states
  const [newUniverseName, setNewUniverseName] = useState('');
  const [newUniverseDesc, setNewUniverseDesc] = useState('');

  const [newWorldTimeScale, setNewWorldTimeScale] = useState(1.0);
  const [newWorldTimezone, setNewWorldTimezone] = useState('Asia/Seoul');

  useEffect(() => {
    loadUniverses();
  }, []);

  useEffect(() => {
    if (selectedUniverse) {
      loadWorlds(selectedUniverse.uid);
    } else {
      setWorlds([]);
    }
  }, [selectedUniverse]);

  const loadUniverses = async () => {
    try {
      const data = await adminAPI.getUniverses();
      setUniverses(data);
    } catch (e) {
      console.error(e);
      alert('Failed to load universes');
    }
  };

  const loadWorlds = async (universeUid: string) => {
    try {
      const data = await adminAPI.getWorlds(universeUid);
      setWorlds(data);
    } catch (e) {
      console.error(e);
      alert('Failed to load worlds');
    }
  };

  const handleCreateUniverse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUniverseName) return;
    try {
      await adminAPI.createUniverse({ name: newUniverseName, description: newUniverseDesc });
      setNewUniverseName('');
      setNewUniverseDesc('');
      loadUniverses();
    } catch (e) {
      console.error(e);
      alert('Failed to create universe');
    }
  };

  const handleCreateWorld = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUniverse) return;
    try {
      await adminAPI.createWorld({
        universe_uid: selectedUniverse.uid,
        time_scale: newWorldTimeScale,
        timezone: newWorldTimezone,
        real_origin: new Date().toISOString(),
        world_origin: new Date().toISOString(),
      });
      loadWorlds(selectedUniverse.uid);
    } catch (e) {
      console.error(e);
      alert('Failed to create world');
    }
  };

  const handleDeleteWorld = async (uid: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await adminAPI.deleteWorld(uid);
      if (selectedUniverse) loadWorlds(selectedUniverse.uid);
    } catch (e) {
      console.error(e);
      alert('Failed to delete world (Check if lives exist)');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* Left: Universe List */}
      <div className="w-1/3 bg-white border border-[#dbdbdb] rounded-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#dbdbdb] bg-gray-50">
          <h2 className="font-semibold text-[#262626]">Universes</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {universes.map((u) => (
            <div
              key={u.uid}
              onClick={() => setSelectedUniverse(u)}
              className={`p-4 rounded-lg cursor-pointer border transition-all ${
                selectedUniverse?.uid === u.uid
                  ? 'bg-blue-50 border-[#0095f6] shadow-sm'
                  : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
              }`}
            >
              <div className="font-semibold text-[#262626]">{u.name}</div>
              <div className="text-sm text-gray-500 truncate mt-1">{u.description}</div>
              <div className="text-[10px] text-gray-400 mt-2 font-mono uppercase tracking-wider">
                {u.uid}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleCreateUniverse}
          className="p-4 border-t border-[#dbdbdb] bg-gray-50 space-y-3"
        >
          <input
            type="text"
            placeholder="New Universe Name"
            className="w-full px-3 py-2 bg-white border border-[#dbdbdb] rounded-[4px] text-sm focus:border-[#a8a8a8] focus:outline-none"
            value={newUniverseName}
            onChange={(e) => setNewUniverseName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Description (Lore)"
            className="w-full px-3 py-2 bg-white border border-[#dbdbdb] rounded-[4px] text-sm focus:border-[#a8a8a8] focus:outline-none"
            value={newUniverseDesc}
            onChange={(e) => setNewUniverseDesc(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-[#0095f6] text-white py-2 rounded-[4px] text-sm font-semibold hover:bg-[#1877f2] active:opacity-70 transition-all"
          >
            Create Universe
          </button>
        </form>
      </div>

      {/* Right: World List */}
      <div className="flex-1 bg-white border border-[#dbdbdb] rounded-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#dbdbdb] bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-[#262626]">
            Worlds{' '}
            {selectedUniverse ? (
              <span className="text-gray-500 font-normal">in {selectedUniverse.name}</span>
            ) : (
              ''
            )}
          </h2>
        </div>

        {!selectedUniverse ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="text-4xl mb-2">🌍</div>
            <p>Select a universe to manage worlds</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="p-3 border-b border-[#dbdbdb]">UID</th>
                    <th className="p-3 border-b border-[#dbdbdb]">Time Scale</th>
                    <th className="p-3 border-b border-[#dbdbdb]">Timezone</th>
                    <th className="p-3 border-b border-[#dbdbdb]">Real Origin</th>
                    <th className="p-3 border-b border-[#dbdbdb] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbdbdb]">
                  {worlds.map((w) => (
                    <tr key={w.uid} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-mono text-xs text-gray-600">{w.uid}</td>
                      <td className="p-3 text-sm font-medium">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                          x{w.time_scale}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">{w.timezone}</td>
                      <td className="p-3 text-xs text-gray-500">
                        {w.real_origin ? format(new Date(w.real_origin), 'yyyy-MM-dd HH:mm') : '-'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteWorld(w.uid)}
                          className="text-[#ed4956] hover:text-red-700 text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {worlds.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 text-sm">
                        No worlds found in this universe.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <form
              onSubmit={handleCreateWorld}
              className="p-4 border-t border-[#dbdbdb] bg-gray-50 flex gap-3 items-end"
            >
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                  Time Scale
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-3 py-2 bg-white border border-[#dbdbdb] rounded-[4px] text-sm focus:border-[#a8a8a8] focus:outline-none"
                  value={newWorldTimeScale}
                  onChange={(e) => setNewWorldTimeScale(parseFloat(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                  Timezone
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-[#dbdbdb] rounded-[4px] text-sm focus:border-[#a8a8a8] focus:outline-none"
                  value={newWorldTimezone}
                  onChange={(e) => setNewWorldTimezone(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="bg-[#0095f6] text-white px-6 py-2 rounded-[4px] text-sm font-semibold hover:bg-[#1877f2] h-[38px] active:opacity-70 transition-all"
              >
                Add World
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
