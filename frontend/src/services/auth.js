// frontend/src/services/auth.js
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const authService = {
    async login(username, password) {
        try {
            const response = await axios.post(`${API_URL}/api/auth/token`, 
                new URLSearchParams({
                    'username': username,
                    'password': password
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
            console.log('Login response:', response.data); // Debug log
            
            if (response.data.access_token) {
                localStorage.setItem('user', JSON.stringify(response.data));
                return response.data;
            }
            throw new Error('No access token received');
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            throw error;
        }
    },

    async register(userData) {
        try {
            const response = await axios.post(`${API_URL}/api/auth/register`, userData);
            console.log('Register response:', response.data); // Debug log
            return response.data;
        } catch (error) {
            console.error('Register error:', error.response?.data || error.message);
            throw error;
        }
    },

    logout() {
        localStorage.removeItem('user');
    },

    getCurrentUser() {
        const user = localStorage.getItem('user');
        console.log('Getting user from localStorage:', user); // Debug log
        return user ? JSON.parse(user) : null;
    },

    getToken() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.access_token;
    }
};

export default authService;