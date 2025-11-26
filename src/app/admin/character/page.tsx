'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/adminApi';
import type { Character } from '@/types/api';

export default function CharacterPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    if (selectedChar && isEditing) {
      setName(selectedChar.name);
      setPersonality(selectedChar.personality);
    } else if (!isEditing) {
      setName('');
      setPersonality('');
    }
  }, [selectedChar, isEditing]);

  const loadCharacters = async () => {
    try {
      const data = await adminAPI.getCharacters();
      setCharacters(data);
    } catch (e) {
      console.error(e);
      alert('Failed to load characters');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && selectedChar) {
        await adminAPI.updateCharacter(selectedChar.uid, { name, personality });
      } else {
        await adminAPI.createCharacter({ name, personality });
      }
      loadCharacters();
      setName('');
      setPersonality('');
      setIsEditing(false);
      setSelectedChar(null);
    } catch (e) {
      console.error(e);
      alert('Failed to save character');
    }
  };

  const handleDelete = async (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure?')) return;
    try {
      await adminAPI.deleteCharacter(uid);
      loadCharacters();
      if (selectedChar?.uid === uid) {
        setSelectedChar(null);
        setIsEditing(false);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete character');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* Left: Character List */}
      <div className="w-1/3 bg-white border border-[#dbdbdb] rounded-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#dbdbdb] bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-[#262626]">Characters</h2>
          <button
            onClick={() => {
              setSelectedChar(null);
              setIsEditing(false);
              setName('');
              setPersonality('');
            }}
            className="text-xs font-semibold text-[#0095f6] hover:text-[#1877f2]"
          >
            + New Character
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {characters.map((c) => (
            <div
              key={c.uid}
              onClick={() => {
                setSelectedChar(c);
                setIsEditing(true);
              }}
              className={`p-4 rounded-lg cursor-pointer border transition-all group ${
                selectedChar?.uid === c.uid
                  ? 'bg-blue-50 border-[#0095f6] shadow-sm'
                  : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="font-semibold text-[#262626]">{c.name}</div>
                <button
                  onClick={(e) => handleDelete(c.uid, e)}
                  className="text-gray-300 hover:text-[#ed4956] opacity-0 group-hover:opacity-100 transition-all"
                >
                  ×
                </button>
              </div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono uppercase tracking-wider">
                {c.uid}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Editor */}
      <div className="flex-1 bg-white border border-[#dbdbdb] rounded-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#dbdbdb] bg-gray-50">
          <h2 className="font-semibold text-[#262626]">
            {isEditing ? 'Edit Character' : 'New Character'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-white border border-[#dbdbdb] rounded-[4px] text-sm focus:border-[#a8a8a8] focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={64}
              placeholder="e.g. Sherlock Holmes"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">
              Personality (System Prompt)
            </label>
            <textarea
              className="flex-1 w-full p-4 bg-gray-50 border border-[#dbdbdb] rounded-[4px] text-sm focus:border-[#a8a8a8] focus:outline-none resize-none font-mono leading-relaxed"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Describe the character's personality, background, and speaking style..."
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-[#dbdbdb]">
            <button
              type="submit"
              className="bg-[#0095f6] text-white px-8 py-2.5 rounded-[4px] text-sm font-semibold hover:bg-[#1877f2] active:opacity-70 transition-all shadow-sm"
            >
              {isEditing ? 'Update Character' : 'Create Character'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
