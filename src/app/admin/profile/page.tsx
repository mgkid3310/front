'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/adminApi';
import type { Profile, Life } from '@/types/api';
import { format } from 'date-fns';

export default function ProfilePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [lives, setLives] = useState<Life[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load character profiles and lives to check for orphans
      const [profilesData, livesData] = await Promise.all([
        adminAPI.getPublicCharacterProfiles(),
        adminAPI.getLives(),
      ]);
      setProfiles(profilesData);
      setLives(livesData);
    } catch (e) {
      console.error(e);
      alert('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.'))
      return;
    try {
      await adminAPI.deleteProfile(uid);
      loadData();
    } catch (e) {
      console.error(e);
      alert('Failed to delete profile');
    }
  };

  const isOrphan = (profile: Profile) => {
    if (profile.owner_type !== 'life') return false;
    return !lives.find((l) => l.uid === profile.owner_uid);
  };

  return (
    <div className="h-full flex flex-col bg-white border border-[#dbdbdb] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#dbdbdb] bg-gray-50 flex justify-between items-center">
        <h2 className="font-semibold text-[#262626]">Character Profiles</h2>
        <button
          onClick={loadData}
          className="text-xs font-semibold text-[#0095f6] hover:text-[#1877f2]"
        >
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Profile Info
                </th>
                <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Owner (Life)
                </th>
                <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dbdbdb]">
              {profiles.map((p) => {
                const orphan = isOrphan(p);
                return (
                  <tr key={p.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[#262626]">{p.name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-1">{p.uid}</div>
                      {p.bio && (
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">{p.bio}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-xs font-mono text-gray-600">{p.owner_uid}</div>
                      {orphan && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded">
                          ORPHANED
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          p.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {p.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {p.created ? format(new Date(p.created), 'yyyy-MM-dd HH:mm') : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(p.uid)}
                        className="text-[#ed4956] hover:text-red-700 text-xs font-bold border border-[#ed4956] px-3 py-1.5 rounded hover:bg-red-50 transition-all"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
