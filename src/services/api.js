// src/services/ApiService.js
import axios from "axios";
import AuthService from "./auth";

// Grab from env; fallback to local
let base = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
base = base.replace(/\/+$/, "");           // remove trailing slash
if (!base.endsWith("/api")) base += "/api"; // ensure "/api" present

const api = axios.create({
  baseURL: base,
});

api.interceptors.request.use(
  (config) => {
    const user = AuthService.getCurrentUser();
    if (user && user.access) {
      config.headers.Authorization = `Bearer ${user.access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fetch all organizations
const getOrganizations = () => api.get("/organizations/");

// Fetch one organization by id
const getOrganization = (id) => api.get(`/organizations/${id}/`);

// Fetch ACOs, optionally filtered by organization
const getACOs = (organizationId = null) => {
  const params = organizationId ? { params: { organization: organizationId } } : {};
  return api.get("/acos/", params);
};

const ApiService = {
  getOrganizations,
  getOrganization,
  getACOs,
};

export default ApiService;