'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/adminApi';
import type { Life, World, Character, Universe } from '@/types/api';

export default function LifePage() {
  const [lives, setLives] = useState<Life[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [universes, setUniverses] = useState<Universe[]>([]);

  const [selectedWorldUid, setSelectedWorldUid] = useState<string>('');
  const [selectedCharUid, setSelectedCharUid] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  // Deploy form
  const [deployCharUid, setDeployCharUid] = useState('');
  const [deployWorldUid, setDeployWorldUid] = useState('');

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadLives(selectedWorldUid, selectedCharUid);
    if (selectedWorldUid) setDeployWorldUid(selectedWorldUid);
  }, [selectedWorldUid, selectedCharUid]);

  const loadMetadata = async () => {
    try {
      const [uData, cData] = await Promise.all([adminAPI.getUniverses(), adminAPI.getCharacters()]);
      setUniverses(uData);
      setCharacters(cData);

      // Load all worlds from all universes
      // This is a bit inefficient if there are many universes, but fine for admin
      const allWorlds: World[] = [];
      for (const u of uData) {
        const wData = await adminAPI.getWorlds(u.uid);
        allWorlds.push(...wData);
      }
      setWorlds(allWorlds);

      if (allWorlds.length > 0) {
        setSelectedWorldUid(allWorlds[0].uid);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to load metadata');
    }
  };

  const loadLives = async (worldUid?: string, charUid?: string) => {
    try {
      const data = await adminAPI.getLives(worldUid, charUid);
      setLives(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployCharUid || !deployWorldUid) return;

    setIsDeploying(true);
    try {
      await adminAPI.deployLife({
        character_uid: deployCharUid,
        world_uid: deployWorldUid,
      });
      setShowDeployModal(false);
      loadLives(selectedWorldUid, selectedCharUid);
      alert('Life deployed successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to deploy life');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (
      !confirm(
        'WARNING: This will delete the Life, Profile, Memories, and Relationships.\nAre you sure?'
      )
    )
      return;
    try {
      await adminAPI.deleteLife(uid);
      loadLives(selectedWorldUid, selectedCharUid);
    } catch (e) {
      console.error(e);
      alert('Failed to delete life');
    }
  };

  const getCharacterName = (uid: string) => characters.find((c) => c.uid === uid)?.name || uid;
  const getWorldName = (uid: string) => {
    const w = worlds.find((w) => w.uid === uid);
    if (!w) return uid;
    const u = universes.find((u) => u.uid === w.universe_uid);
    return `${u?.name || 'Unknown'} / ${w.uid.slice(0, 6)}...`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg border border-[#dbdbdb] shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-[#262626]">Life Deployment</h2>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <select
            className="px-3 py-1.5 border border-[#dbdbdb] rounded-[4px] bg-gray-50 text-sm focus:outline-none focus:border-[#a8a8a8]"
            value={selectedWorldUid}
            onChange={(e) => setSelectedWorldUid(e.target.value)}
          >
            <option value="">All Worlds</option>
            {worlds.map((w) => {
              const u = universes.find((u) => u.uid === w.universe_uid);
              return (
                <option key={w.uid} value={w.uid}>
                  {u?.name} - {w.uid} ({w.timezone})
                </option>
              );
            })}
          </select>
          <select
            className="px-3 py-1.5 border border-[#dbdbdb] rounded-[4px] bg-gray-50 text-sm focus:outline-none focus:border-[#a8a8a8]"
            value={selectedCharUid}
            onChange={(e) => setSelectedCharUid(e.target.value)}
          >
            <option value="">All Characters</option>
            {characters.map((c) => (
              <option key={c.uid} value={c.uid}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowDeployModal(true)}
          className="bg-[#0095f6] text-white px-4 py-1.5 rounded-[4px] text-sm font-semibold hover:bg-[#1877f2] active:opacity-70 transition-all shadow-sm"
        >
          + Deploy Life
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
        {lives.map((life) => (
          <div
            key={life.uid}
            className="bg-white p-5 rounded-lg border border-[#dbdbdb] hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border border-green-100">
                Active
              </span>
              <button
                onClick={() => handleDelete(life.uid)}
                className="text-gray-300 hover:text-[#ed4956] text-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                Delete
              </button>
            </div>

            <h3 className="font-bold text-lg text-[#262626] mb-1">
              {getCharacterName(life.character_uid)}
            </h3>
            <div className="text-sm text-gray-500 mb-4 flex items-center gap-1">
              <span>📍</span> {getWorldName(life.world_uid)}
            </div>

            <div className="space-y-1.5 text-[10px] text-gray-400 font-mono bg-gray-50 p-3 rounded border border-gray-100">
              <div className="flex justify-between">
                <span>Life</span> <span>{life.uid}</span>
              </div>
              <div className="flex justify-between">
                <span>Profile</span> <span>{life.profile_uid}</span>
              </div>
              <div className="flex justify-between">
                <span>Memory</span> <span>{life.memory_uid}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deploy Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-[480px] border border-[#dbdbdb]">
            <h3 className="text-xl font-bold mb-6 text-[#262626]">Deploy New Life</h3>
            <form onSubmit={handleDeploy} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">
                  Character
                </label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-[#dbdbdb] rounded-[4px] text-sm focus:border-[#a8a8a8] focus:outline-none"
                  value={deployCharUid}
                  onChange={(e) => setDeployCharUid(e.target.value)}
                  required
                >
                  <option value="">Select Character...</option>
                  {characters.map((c) => (
                    <option key={c.uid} value={c.uid}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">
                  Target World
                </label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-[#dbdbdb] rounded-[4px] text-sm focus:border-[#a8a8a8] focus:outline-none"
                  value={deployWorldUid}
                  onChange={(e) => setDeployWorldUid(e.target.value)}
                  required
                >
                  <option value="">Select World...</option>
                  {worlds.map((w) => {
                    const u = universes.find((u) => u.uid === w.universe_uid);
                    return (
                      <option key={w.uid} value={w.uid}>
                        {u?.name} - {w.uid}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-5 py-2 text-gray-600 hover:text-[#262626] font-medium text-sm"
                  disabled={isDeploying}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0095f6] text-white rounded-[4px] font-semibold text-sm hover:bg-[#1877f2] disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  disabled={isDeploying}
                >
                  {isDeploying && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isDeploying ? 'Deploying...' : 'Deploy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
