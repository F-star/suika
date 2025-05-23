import './api-config';

import axios from 'axios';

import { FileItem, TeamItem } from '../type';

type ResStruct<T> = {
  code: number;
  status: number;
  message: string;
  error: boolean;
  data: T;
};

interface LoginRes {
  accessToken: string;
}

interface UserProfileRes {
  username: string;
  id: number;
}

export const ApiService = {
  // -------- login
  login: async (username: string, password: string) => {
    const res = await axios.post<ResStruct<LoginRes>>('auth/login', {
      username,
      password,
    });
    return res.data;
  },
  register: async (username: string, password: string) => {
    const res = await axios.post<ResStruct<LoginRes>>('auth/register', {
      username,
      password,
    });
    return res.data;
  },

  // ---- file
  getFileList: async () => {
    const res = await axios.get<ResStruct<FileItem[]>>('files');
    return res.data;
  },
  getFile: async (id: number) => {
    const res = await axios.get<ResStruct<FileItem[]>>(`files/${id}`);
    return res.data;
  },
  createFile: async (title: string) => {
    const res = await axios.post<ResStruct<FileItem>>('files/create', {
      title,
    });
    return res.data;
  },
  deleteFiles: async (ids: number[]) => {
    const res = await axios.delete<ResStruct<FileItem[]>>('files', {
      params: {
        ids,
      },
    });
    return res.data;
  },
  updateFile: async (id: number, data: Partial<FileItem>) => {
    const res = await axios.patch<ResStruct<FileItem[]>>(`files/${id}`, {
      data,
    });
    return res.data;
  },
  getUserInfo: async () => {
    const res = await axios.get<ResStruct<UserProfileRes>>(
      'users/self/profile',
    );
    return res.data;
  },

  // -------- team
  createTeam: async (name: string) => {
    const res = await axios.post<ResStruct<TeamItem>>('teams', {
      name,
    });
    return res.data;
  },
  getTeams: async () => {
    const res = await axios.get<ResStruct<TeamItem[]>>('teams');
    return res.data;
  },
};
