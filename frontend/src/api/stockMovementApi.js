import axiosClient from './axiosClient';

export const stockMovementApi = {
  createMovement: async (data) => {
    return await axiosClient.post('/stock-movements', data);
  },

  getMovements: async (params = {}) => {
    return await axiosClient.get('/stock-movements', { params });
  },

  getMovementById: async (id) => {
    return await axiosClient.get(`/stock-movements/${id}`);
  },

  getProductMovements: async (productId, params = {}) => {
    return await axiosClient.get(`/stock-movements/product/${productId}`, { params });
  },
};

