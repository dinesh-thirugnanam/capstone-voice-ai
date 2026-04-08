export const API = "http://localhost:4000";

export async function apiFetch(path: string, options?: RequestInit) {
    const res = await fetch(`${API}${path}`, {
        headers: {
            "Content-Type": "application/json",
        },
        ...options,
    });

    if (!res.ok) {
        throw new Error("API error");
    }

    return res.json();
}
