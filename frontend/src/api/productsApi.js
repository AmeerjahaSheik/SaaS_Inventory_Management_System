import axiosClient from './axiosClient';

export const productsApi = {
  getProducts: async (params = {}) => {
    return await axiosClient.get('/products', { params });
  },

  getProductById: async (id) => {
    return await axiosClient.get(`/products/${id}`);
  },

  createProduct: async (data) => {
    return await axiosClient.post('/products', data);
  },

  updateProduct: async (id, data) => {
    return await axiosClient.put(`/products/${id}`, data);
  },

  deleteProduct: async (id) => {
    return await axiosClient.delete(`/products/${id}`);
  },

  getCategories: async () => {
    return await axiosClient.get('/products/categories');
  },
};

