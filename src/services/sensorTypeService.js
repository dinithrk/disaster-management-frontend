const BASE_URL = "http://localhost:8092/sensor-types";

export const getSensorTypes = async () => {
    const res = await fetch(BASE_URL);
    return res.json();
};
export const getSensorTypeById = async (id) => {
    const res = await fetch(`${BASE_URL}/${id}`);
    return res.json();
};

export const createSensorType = async (data) => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const updateSensorType = async (id, data) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const deleteSensorType = async (id) => {
    await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
};