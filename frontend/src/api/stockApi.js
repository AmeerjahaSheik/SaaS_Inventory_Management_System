import axiosClient from './axiosClient';

export const stockApi = {
  adjustStock: async (productId, data) => {
    return await axiosClient.post(`/stock/products/${productId}/adjust`, data);
  },

  getStockLogs: async (productId, limit = 50) => {
    return await axiosClient.get(`/stock/products/${productId}/logs`, {
      params: { limit },
    });
  },
};

