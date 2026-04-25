import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8092',
});

export default api;