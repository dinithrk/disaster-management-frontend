const BASE_URL = "http://localhost:8092/sensors";
const SITE_URL = "http://localhost:8092/sites";
const TYPE_URL = "http://localhost:8092/sensor-types";

// ================= SENSORS =================
export const getSensors = async () => {
    const res = await fetch(BASE_URL);
    return res.json();
};
export const getSensorById = async (id) => {
    const res = await fetch(`${BASE_URL}/${id}`);
    return res.json();
};

export const createSensor = async (data) => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const updateSensor = async (id, data) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const deleteSensor = async (id) => {
    await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
};

// ================= SITES (used in Sensors.jsx) =================
export const getSites = async () => {
    const res = await fetch(SITE_URL);
    return res.json();
};

// ================= SENSOR TYPES =================
export const getSensorTypes = async () => {
    const res = await fetch(TYPE_URL);
    return res.json();
};