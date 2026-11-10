import axiosClient from './axiosClient';

export const authApi = {
  signup: async (data) => {
    return await axiosClient.post('/auth/signup', data);
  },

  login: async (data) => {
    return await axiosClient.post('/auth/login', data);
  },

  getMe: async () => {
    return await axiosClient.get('/auth/me');
  },
};

