import axiosClient from './axiosClient';

export const purchaseOrderApi = {
  getPurchaseOrders: async (params = {}) => {
    return await axiosClient.get('/purchase-orders', { params });
  },

  getPurchaseOrderById: async (id) => {
    return await axiosClient.get(`/purchase-orders/${id}`);
  },

  createPurchaseOrder: async (data) => {
    return await axiosClient.post('/purchase-orders', data);
  },

  receivePurchaseOrder: async (id) => {
    return await axiosClient.put(`/purchase-orders/${id}/receive`);
  },
};
