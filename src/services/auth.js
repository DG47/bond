// src/services/AuthService.js
import axios from 'axios';

const API_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, '') || // strip any trailing slash
  'http://localhost:8000/api';

export const login = async (username, password) => {
  const response = await axios.post(
    // ensure there's exactly one slash between base and path
    `${API_URL}/login/`,
    { username, password }
  );

  // Django Simple JWT returns { access, refresh, user: { … } }
  if (response.data.access) {
    // store entire auth payload (so you've got refresh too)
    localStorage.setItem('user', JSON.stringify(response.data));
  }

  return response.data;
};

export const logout = () => {
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

const AuthService = {
  login,
  logout,
  getCurrentUser,
};

export default AuthService;