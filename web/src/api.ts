import axios from 'axios';
import type {
  User,
  Node,
  Tag,
  Zone,
  Module,
  ModuleNodesResponse,
  CreateNodeInput,
  UpdateNodeInput,
  MoveNodeInput,
  ReorderNodeInput,
  CreateZoneInput,
  UpdateZoneInput,
  BatchReorderZonesInput,
  CreateModuleInput,
  UpdateModuleInput,
  MoveModuleInput,
  UpdateLayoutInput,
  LoginInput,
  RegisterInput,
  AuthResponse,
} from './types';

const baseURL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: { Accept: 'application/json' },
  withCredentials: true, // Important for cookies
});

// Auth API
export const authApi = {
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (data: LoginInput): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  me: async (): Promise<AuthResponse> => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  refresh: async (): Promise<void> => {
    await api.post('/auth/refresh');
  },
};

// Nodes API
export const nodesApi = {
  list: async (): Promise<Node[]> => {
    const res = await api.get('/nodes');
    return res.data.data || res.data; // Handle paginated response
  },

  get: async (id: string): Promise<Node> => {
    const res = await api.get(`/nodes/${id}`);
    return res.data;
  },

  create: async (data: CreateNodeInput): Promise<Node> => {
    const res = await api.post('/nodes', data);
    return res.data;
  },

  update: async (id: string, data: UpdateNodeInput): Promise<Node> => {
    const res = await api.patch(`/nodes/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/nodes/${id}`);
  },

  getChildren: async (id: string): Promise<Node[]> => {
    const res = await api.get(`/nodes/${id}/children`);
    return res.data;
  },

  getDescendants: async (id: string): Promise<Node[]> => {
    const res = await api.get(`/nodes/${id}/descendants`);
    return res.data;
  },

  getReferences: async (id: string): Promise<any[]> => {
    const res = await api.get(`/nodes/${id}/references`);
    return res.data;
  },

  move: async (id: string, data: MoveNodeInput): Promise<Node> => {
    const res = await api.post(`/nodes/${id}/move`, data);
    return res.data;
  },

  reorder: async (id: string, data: ReorderNodeInput): Promise<Node> => {
    const res = await api.post(`/nodes/${id}/reorder`, data);
    return res.data;
  },

  search: async (query: string, type?: string): Promise<Node[]> => {
    const res = await api.get('/nodes/search', { params: { q: query, type } });
    return res.data;
  },

  uploadFile: async (file: File, name: string, type: 'image' | 'file', parentId?: string | null, color?: string, metadata?: Record<string, any>): Promise<Node> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('type', type);
    if (parentId) formData.append('parentId', parentId);
    if (color) formData.append('color', color);
    if (metadata) formData.append('metadata', JSON.stringify(metadata));

    const res = await api.post('/nodes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

// Tags API
export const tagsApi = {
  list: async (): Promise<Tag[]> => {
    const res = await api.get('/tags');
    return res.data;
  },

  get: async (id: string): Promise<Tag> => {
    const res = await api.get(`/tags/${id}`);
    return res.data;
  },

  create: async (data: { name: string; color?: string }): Promise<Tag> => {
    const res = await api.post('/tags', data);
    return res.data;
  },

  update: async (id: string, data: { name?: string; color?: string }): Promise<Tag> => {
    const res = await api.patch(`/tags/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tags/${id}`);
  },

  addToNode: async (nodeId: string, tagId: string): Promise<void> => {
    await api.post(`/tags/nodes/${nodeId}/tags/${tagId}`);
  },

  removeFromNode: async (nodeId: string, tagId: string): Promise<void> => {
    await api.delete(`/tags/nodes/${nodeId}/tags/${tagId}`);
  },
};

// Zones API
export const zonesApi = {
  list: async (): Promise<Zone[]> => {
    const res = await api.get('/zones');
    return res.data;
  },

  get: async (id: string): Promise<Zone> => {
    const res = await api.get(`/zones/${id}`);
    return res.data;
  },

  getNodes: async (id: string): Promise<Node[]> => {
    const res = await api.get(`/zones/${id}/nodes`);
    return res.data;
  },

  create: async (data: CreateZoneInput): Promise<Zone> => {
    const res = await api.post('/zones', data);
    return res.data;
  },

  update: async (id: string, data: UpdateZoneInput): Promise<Zone> => {
    const res = await api.patch(`/zones/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/zones/${id}`);
  },

  reorder: async (data: BatchReorderZonesInput): Promise<Zone[]> => {
    const res = await api.post('/zones/reorder', data);
    return res.data;
  },
};

// Modules API
export const modulesApi = {
  list: async (zoneId?: string): Promise<Module[]> => {
    const params = zoneId ? { zone_id: zoneId } : {};
    const res = await api.get('/modules', { params });
    return res.data;
  },

  get: async (id: string): Promise<Module> => {
    const res = await api.get(`/modules/${id}`);
    return res.data;
  },

  getNodes: async (id: string): Promise<ModuleNodesResponse> => {
    const res = await api.get(`/modules/${id}/nodes`);
    return res.data;
  },

  create: async (data: CreateModuleInput): Promise<Module> => {
    const res = await api.post('/modules', data);
    return res.data;
  },

  update: async (id: string, data: UpdateModuleInput): Promise<Module> => {
    const res = await api.patch(`/modules/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/modules/${id}`);
  },

  move: async (id: string, data: MoveModuleInput): Promise<Module> => {
    const res = await api.post(`/modules/${id}/move`, data);
    return res.data;
  },

  updateLayout: async (zoneId: string, data: UpdateLayoutInput): Promise<void> => {
    // Transform React Grid Layout format to backend format
    const modules = data.layouts.map(layout => ({
      id: layout.i,
      positionX: layout.x,
      positionY: layout.y,
      width: layout.w,
      height: layout.h,
    }));
    await api.post('/modules/layout', { modules });
  },
};

// Legacy modules API (keep for now)
export async function fetchModules() {
  const res = await api.get('/modules');
  return res.data;
}

export async function createModule(formData: FormData) {
  const res = await api.post('/modules', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
