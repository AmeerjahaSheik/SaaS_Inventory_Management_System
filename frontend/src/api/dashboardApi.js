import axiosClient from './axiosClient';

export const dashboardApi = {
  getSummary: async () => {
    return await axiosClient.get('/dashboard/summary');
  },
};

