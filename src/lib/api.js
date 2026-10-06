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

export async function getErrorMessage(resOrError, defaultMsg = "An error occurred") {
  if (!resOrError) return defaultMsg;

  if (resOrError instanceof Error && resOrError.message) {
    return resOrError.message;
  }

  if (typeof resOrError === "string") {
    return resOrError;
  }

  if (typeof resOrError === "object" && typeof resOrError.clone === "function") {
    try {
      const clone = resOrError.clone();
      const data = await clone.json();
      if (data) {
        if (data.message) {
          if (Array.isArray(data.message)) {
            return data.message.join(", ");
          }
          return data.message;
        }
        if (data.error && typeof data.error === "string") {
          return data.error;
        }
      }
    } catch (e) {
      try {
        const clone = resOrError.clone();
        const text = await clone.text();
        if (text) return text;
      } catch (e2) {}
    }
  }

  if (typeof resOrError === "object") {
    if (resOrError.message) {
      return Array.isArray(resOrError.message) ? resOrError.message.join(", ") : resOrError.message;
    }
    if (resOrError.error && typeof resOrError.error === "string") {
      return resOrError.error;
    }
  }

  return defaultMsg;
}

