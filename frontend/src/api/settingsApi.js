import axiosClient from './axiosClient';

export const settingsApi = {
  getSettings: async () => {
    return await axiosClient.get('/settings/organization');
  },

  updateSettings: async (data) => {
    return await axiosClient.put('/settings/organization', data);
  },
};

