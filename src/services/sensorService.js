import metadataApi from './metadataApi';

const BASE_URL = "/sensors";

// ================= SENSORS =================
export const getSensors = async () => {
    const res = await metadataApi.get(BASE_URL);
    return res.data;
};
export const getSensorById = async (id) => {
    const res = await metadataApi.get(`${BASE_URL}/${id}`);
    return res.data;
};

export const createSensor = async (data) => {
    const res = await metadataApi.post(BASE_URL, data);
    return res.data;
};

export const updateSensor = async (id, data) => {
    const res = await metadataApi.put(`${BASE_URL}/${id}`, data);
    return res.data;
};

export const deleteSensor = async (id) => {
    await metadataApi.delete(`${BASE_URL}/${id}`);
};