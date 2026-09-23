// frontend/src/services/api.js
import axios from 'axios';
import authService from './auth';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

// Add request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        const token = authService.getToken();
        console.log('Token being sent:', token); // Debug log
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.log('401 Unauthorized - redirecting to login');
            authService.logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
