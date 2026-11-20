import api from '../services/axios';

// Get incoming food orders
export const getIncomingOrders = async () => {
  const response = await api.get('/orders/shop/incoming', {
    params: {
      page: 1,
      limit: 100,
    },
  });

  return response.data;
};

// Update food order status
export const updateFoodOrderStatus = async (orderId, status) => {
  const response = await api.patch(
    `/orders/${orderId}/status`,
    { status }
  );

  return response.data;
};

// Update order payment status (confirm/reject)
export const updateOrderPayment = async (orderId, action, reason) => {
  const response = await api.patch(
    `/orders/${orderId}/payment`,
    { action, reason }
  );

  return response.data;
};
