import api from '../services/axios';

// Place an order using the logged-in student's cart
export const placeOrder = async () => {
  const response = await api.post('/orders');
  return response.data;
};

// Get the student's order history
export const getMyOrders = async (params = {}) => {
  const response = await api.get('/orders', { params });
  return response.data;
};

// Get details of one order
export const getOrderDetails = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

// Cancel an eligible order
export const cancelOrder = async (orderId) => {
  const response = await api.patch(`/orders/${orderId}/cancel`);
  return response.data;
};