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

  return fetch(normalizedUrl, {
    ...options,
    headers,
  });
}
