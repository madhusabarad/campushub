import api from '../services/axios';

// Get Xerox requests for the shopkeeper
export const getShopkeeperXeroxRequests = async () => {
  const response = await api.get('/xerox/shop/requests');
  return response.data;
};

// Update Xerox request status
export const updateXeroxStatus = async (requestId, status) => {
  const response = await api.patch(
    `/xerox/${requestId}/status`,
    { status }
  );
  return response.data;
};

// Mark Xerox payment as paid
export const markXeroxPaymentPaid = async (requestId) => {
  const response = await api.patch(
    `/xerox/${requestId}/payment`
  );
  return response.data;
};