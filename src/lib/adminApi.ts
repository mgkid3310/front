import axios from 'axios';
import type {
  Universe,
  UniverseCreate,
  World,
  WorldCreate,
  Character,
  CharacterCreate,
  Life,
  LifeDeployRequest,
  User,
  Profile,
  Relationship,
  Memory,
  MemoryUpdate,
  MessageHistoryResponse,
} from '@/types/api';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

export const adminAPI = {
  // Universe
  getUniverses: async () => {
    const { data } = await api.get<Universe[]>('/admin/universe');
    return data;
  },
  createUniverse: async (data: UniverseCreate) => {
    const { data: res } = await api.post<Universe>('/admin/universe', data);
    return res;
  },

  // World
  getWorlds: async (universeUid?: string) => {
    const params = universeUid ? { universe_uid: universeUid } : {};
    const { data } = await api.get<World[]>('/admin/world', { params });
    return data;
  },
  createWorld: async (data: WorldCreate) => {
    const { data: res } = await api.post<World>('/admin/world', data);
    return res;
  },
  deleteWorld: async (uid: string) => {
    await api.delete(`/admin/world/${uid}`);
  },

  // Character
  getCharacters: async () => {
    const { data } = await api.get<Character[]>('/admin/character');
    return data;
  },
  createCharacter: async (data: CharacterCreate) => {
    const { data: res } = await api.post<Character>('/admin/character', data);
    return res;
  },
  updateCharacter: async (uid: string, data: Partial<CharacterCreate>) => {
    const { data: res } = await api.patch<Character>(`/admin/character/${uid}`, data);
    return res;
  },
  deleteCharacter: async (uid: string) => {
    await api.delete(`/admin/character/${uid}`);
  },

  // Life
  getLives: async (worldUid?: string) => {
    const params = worldUid ? { world_uid: worldUid } : {};
    const { data } = await api.get<Life[]>('/admin/life', { params });
    return data;
  },
  deployLife: async (data: LifeDeployRequest) => {
    const { data: res } = await api.post<Life>('/admin/life/deploy', data);
    return res;
  },
  deleteLife: async (uid: string) => {
    await api.delete(`/admin/life/${uid}`);
  },
  getLifeDetail: async (uid: string) => {
    const { data } = await api.get<Life>(`/admin/life/${uid}`);
    return data;
  },

  // User & Relationship
  getUsers: async () => {
    const { data } = await api.get<User[]>('/admin/user');
    return data;
  },
  getUserProfiles: async (userUid: string) => {
    const { data } = await api.get<Profile[]>(`/admin/user/${userUid}/profiles`);
    return data;
  },
  getRelationships: async (sourceUid?: string, targetUid?: string) => {
    const params: any = {};
    if (sourceUid) params.source_uid = sourceUid;
    if (targetUid) params.target_uid = targetUid;
    const { data } = await api.get<Relationship[]>('/admin/relationship', { params });
    return data;
  },
  deleteRelationship: async (sourceUid: string, targetUid: string) => {
    await api.delete(`/admin/relationship/${sourceUid}/${targetUid}`);
  },

  // Memory
  getMemory: async (uid: string) => {
    const { data } = await api.get<Memory>(`/admin/memory/${uid}`);
    return data;
  },
  updateMemory: async (uid: string, data: MemoryUpdate) => {
    const { data: res } = await api.patch<Memory>(`/admin/memory/${uid}`, data);
    return res;
  },

  // Message Debugger
  getMessages: async (
    sourceUid: string,
    targetUid: string,
    beforeUid?: string,
    limit: number = 50
  ) => {
    const params: any = {
      source_uid: sourceUid,
      target_uid: targetUid,
      limit,
    };
    if (beforeUid) params.before_uid = beforeUid;
    const { data } = await api.get<MessageHistoryResponse>('/dm/messages', { params });
    return data;
  },
};
