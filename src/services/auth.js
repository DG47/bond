import axios from 'axios';

// Use environment variable for the API URL.
const API_URL = process.env.REACT_APP_API_URL;

const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, {
        username: email,
        password: password,
    });

    if (response.data.accessToken) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
};

const logout = () => {
    localStorage.removeItem('user');
};

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

const AuthService = {
    login,
    logout,
    getCurrentUser,
};

export default AuthService;