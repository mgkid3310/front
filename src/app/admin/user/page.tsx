'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '@/lib/adminApi';
import type { User, Relationship, Profile } from '@/types/api';
import { format } from 'date-fns';

export default function UserPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'relationships'>('users');

  // User Tab State
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userProfiles, setUserProfiles] = useState<Profile[]>([]);

  // Relationship Tab State
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [searchSource, setSearchSource] = useState('');
  const [searchTarget, setSearchTarget] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      const data = await adminAPI.getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadUserProfiles = useCallback(async (uid: string) => {
    try {
      const data = await adminAPI.getUserProfiles(uid);
      setUserProfiles(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadRelationships = useCallback(async () => {
    try {
      const data = await adminAPI.getRelationships(searchSource, searchTarget);
      setRelationships(data);
    } catch (e) {
      console.error(e);
    }
  }, [searchSource, searchTarget]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else {
      loadRelationships();
    }
  }, [activeTab, loadUsers, loadRelationships]);

  useEffect(() => {
    if (selectedUser) {
      loadUserProfiles(selectedUser.uid);
    }
  }, [selectedUser, loadUserProfiles]);

  const handleDeleteRel = async (src: string, tgt: string) => {
    if (!confirm('Delete this relationship?')) return;
    try {
      await adminAPI.deleteRelationship(src, tgt);
      loadRelationships();
    } catch (e) {
      console.error(e);
      alert('Failed to delete relationship');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border border-[#dbdbdb] rounded-lg overflow-hidden">
      <div className="border-b border-[#dbdbdb] flex">
        <button
          className={`px-8 py-4 text-sm font-semibold transition-all ${
            activeTab === 'users'
              ? 'border-b-[2px] border-[#262626] text-[#262626]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`px-8 py-4 text-sm font-semibold transition-all ${
            activeTab === 'relationships'
              ? 'border-b-[2px] border-[#262626] text-[#262626]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          onClick={() => setActiveTab('relationships')}
        >
          Relationships
        </button>
      </div>

      <div className="flex-1 overflow-hidden p-0">
        {activeTab === 'users' ? (
          <div className="flex h-full">
            {/* User List */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      UID
                    </th>
                    <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbdbdb]">
                  {users.map((u) => (
                    <tr
                      key={u.uid}
                      className={`cursor-pointer transition-colors ${
                        selectedUser?.uid === u.uid ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedUser(u)}
                    >
                      <td className="p-4 font-mono text-xs text-gray-600">{u.uid}</td>
                      <td className="p-4 text-sm font-medium text-[#262626]">{u.username}</td>
                      <td className="p-4 text-sm text-gray-600">{u.email}</td>
                      <td className="p-4 text-sm">{u.is_admin ? '✅' : '-'}</td>
                      <td className="p-4 text-xs text-gray-500">
                        {u.created ? format(new Date(u.created), 'yyyy-MM-dd') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* User Detail / Profiles */}
            {selectedUser && (
              <div className="w-[400px] border-l border-[#dbdbdb] bg-gray-50 overflow-y-auto p-6">
                <h3 className="font-bold text-lg mb-6 text-[#262626]">
                  Profiles for {selectedUser.username}
                </h3>
                <div className="space-y-4">
                  {userProfiles.map((p) => (
                    <div
                      key={p.uid}
                      className="bg-white p-5 rounded-lg border border-[#dbdbdb] shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full"></div>
                        <div>
                          <div className="font-bold text-[#262626]">{p.name}</div>
                          <div className="text-xs text-gray-400 font-mono">{p.uid}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {p.bio || 'No bio'}
                      </div>
                    </div>
                  ))}
                  {userProfiles.length === 0 && (
                    <div className="text-gray-500 text-center py-8">No profiles found.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Relationship Filter */}
            <div className="p-4 border-b border-[#dbdbdb] bg-gray-50 flex gap-3">
              <input
                type="text"
                placeholder="Source UID"
                className="flex-1 px-3 py-2 bg-white border border-[#dbdbdb] rounded-[4px] text-sm focus:border-[#a8a8a8] focus:outline-none"
                value={searchSource}
                onChange={(e) => setSearchSource(e.target.value)}
              />
              <input
                type="text"
                placeholder="Target UID"
                className="flex-1 px-3 py-2 bg-white border border-[#dbdbdb] rounded-[4px] text-sm focus:border-[#a8a8a8] focus:outline-none"
                value={searchTarget}
                onChange={(e) => setSearchTarget(e.target.value)}
              />
              <button
                onClick={loadRelationships}
                className="bg-[#0095f6] text-white px-6 py-2 rounded-[4px] text-sm font-semibold hover:bg-[#1877f2] active:opacity-70 transition-all"
              >
                Search
              </button>
            </div>

            {/* Relationship List */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Following
                    </th>
                    <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Memory UID
                    </th>
                    <th className="p-4 border-b border-[#dbdbdb] text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbdbdb]">
                  {relationships.map((r) => (
                    <tr
                      key={`${r.source_uid}-${r.target_uid}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 font-mono text-xs text-gray-600">{r.source_uid}</td>
                      <td className="p-4 font-mono text-xs text-gray-600">{r.target_uid}</td>
                      <td className="p-4 text-sm">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${r.following ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {r.following ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs">
                        <a
                          href={`/admin/memory/${r.memory_uid}`}
                          className="text-[#0095f6] hover:underline"
                        >
                          {r.memory_uid}
                        </a>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteRel(r.source_uid, r.target_uid)}
                          className="text-[#ed4956] hover:text-red-700 text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
