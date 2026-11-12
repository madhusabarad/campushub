import api from '../services/axios';

// Get admin dashboard statistics
export const getAdminStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

// Get all users
export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

// Get all shops
export const getAllShops = async () => {
  const response = await api.get('/admin/shops');
  return response.data;
};

// Get all orders
export const getAllOrders = async () => {
  const response = await api.get('/admin/orders');
  return response.data;
};

// Assign a shopkeeper to a shop
export const assignShopkeeper = async (shopId, shopkeeperId) => {
  const response = await api.patch(
    `/admin/shops/${shopId}/assign-shopkeeper`,
    { shopkeeperId }
  );
  return response.data;
};