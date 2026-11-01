import api from '../services/axios';

// Student login
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

// Student registration
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};