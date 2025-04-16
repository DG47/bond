import axios from "axios";
import AuthService from "./auth";

const API_URL = "http://localhost:8000/api/";

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(
    (config) => {
        const user = AuthService.getCurrentUser();

        if(user && user.access){
            config.headers.Authorization = `Bearer ${user.access}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const getOrganizations = () => {
    return api.get("organizations/");
};

const getOrganization = (id) => {
    return api.get(`organizations/${id}/`);
};

const getACOs = (organizationId = null) => {
    let url = "acos/";
    if (organizationId) {
        url += `?organization=${organizationId}`;
    }
    return api.get(url);
};

const ApiService = {
    getOrganizations,
    getOrganization,
    getACOs,
};

export default ApiService;