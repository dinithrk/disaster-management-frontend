const BASE_URL = "http://localhost:8092/sites";

export const getSites = async () => {
    const res = await fetch(BASE_URL);
    return res.json();
};
export const getSiteById = async (id) => {
    const res = await fetch(`${BASE_URL}/${id}`);
    return res.json();
};

export const createSite = async (data) => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const updateSite = async (id, data) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const deleteSite = async (id) => {
    await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
};