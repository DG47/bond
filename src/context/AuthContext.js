// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import AuthService from "../services/auth";

export const AuthContext = createContext({
  user: null,
  login: () => Promise.resolve(),
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: pull from localStorage and set axios header if found
  useEffect(() => {
    const stored = AuthService.getCurrentUser();
    if (stored && stored.access) {
      setUserData(stored);
      axios.defaults.headers.common["Authorization"] = `Bearer ${stored.access}`;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // AuthService.login returns { access, refresh, user: {...} }
    const data = await AuthService.login(username, password);
    // store and set default header
    setUserData(data);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.access}`;
    return data;
  };

  const logout = () => {
    AuthService.logout();
    setUserData(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  // Expose only the `user` object (without tokens) or null
  const contextValue = {
    user: userData ? userData.user : null,
    login,
    logout,
  };

  if (loading) {
    // you can return a spinner here instead
    return null;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};