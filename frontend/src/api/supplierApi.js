import axiosClient from './axiosClient';

export const supplierApi = {
  getSuppliers: async (params = {}) => {
    return await axiosClient.get('/suppliers', { params });
  },

  getSupplierById: async (id) => {
    return await axiosClient.get(`/suppliers/${id}`);
  },

  createSupplier: async (data) => {
    return await axiosClient.post('/suppliers', data);
  },

  updateSupplier: async (id, data) => {
    return await axiosClient.put(`/suppliers/${id}`, data);
  },

  deleteSupplier: async (id) => {
    return await axiosClient.delete(`/suppliers/${id}`);
  },
};
