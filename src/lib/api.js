export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function apiFetch(url, options = {}) {
  const normalizedUrl = url.startsWith("http") ? url : `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;

  const getCookie = (name) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const token = getCookie("hrToken");
  
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    return await fetch(normalizedUrl, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error.name === "TypeError" && (error.message === "Failed to fetch" || error.message.includes("fetch"))) {
      throw new Error(`Unable to connect to backend server (${API_URL}). Please ensure the NestJS backend is running.`);
    }
    throw error;
  }
}

export async function getErrorMessage(res, defaultMsg = "An error occurred") {
  try {
    const clone = res.clone();
    const data = await clone.json();
    if (data && data.message) {
      if (Array.isArray(data.message)) {
        return data.message.join(", ");
      }
      return data.message;
    }
  } catch (e) {
    try {
      const clone = res.clone();
      const text = await clone.text();
      if (text) return text;
    } catch (e2) {}
  }
  return defaultMsg;
}
