import axios from 'axios';

const metadataApi = axios.create({
    baseURL: '/metadata-api',
});

export default metadataApi;