import metadataApi from './metadataApi';

const BASE_URL = "/sites";

export const getSites = async () => {
    const res = await metadataApi.get(BASE_URL);
    return res.data;
};
export const getSiteById = async (id) => {
    const res = await metadataApi.get(`${BASE_URL}/${id}`);
    return res.data;
};

export const createSite = async (data) => {
    const res = await metadataApi.post(BASE_URL, data);
    return res.data;
};

export const updateSite = async (id, data) => {
    const res = await metadataApi.put(`${BASE_URL}/${id}`, data);
    return res.data;
};

export const deleteSite = async (id) => {
    await metadataApi.delete(`${BASE_URL}/${id}`);
};