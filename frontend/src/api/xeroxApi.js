import api from '../services/axios';

export const getXeroxPricing = async () => {
  const response = await api.get('/xerox/pricing');
  return response.data;
};

export const createXeroxRequest = async (formData) => {
  const response = await api.post('/xerox', formData);
  return response.data;
};

export const getMyXeroxRequests = async () => {
  const response = await api.get('/xerox/my-requests');
  return response.data;
};

export const downloadXeroxDocument = async (requestId) => {
  const response = await api.get(
    `/xerox/${requestId}/document`,
    { responseType: 'blob' }
  );
  return response.data;
};