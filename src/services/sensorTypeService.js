import metadataApi from './metadataApi';

const BASE_URL = "/sensor-types";

export const getSensorTypes = async () => {
    const res = await metadataApi.get(BASE_URL);
    return res.data;
};
export const getSensorTypeById = async (id) => {
    const res = await metadataApi.get(`${BASE_URL}/${id}`);
    return res.data;
};

export const createSensorType = async (data) => {
    const res = await metadataApi.post(BASE_URL, data);
    return res.data;
};

export const updateSensorType = async (id, data) => {
    const res = await metadataApi.put(`${BASE_URL}/${id}`, data);
    return res.data;
};

export const deleteSensorType = async (id) => {
    await metadataApi.delete(`${BASE_URL}/${id}`);
};