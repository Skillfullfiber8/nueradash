/**
 * Centralized API configuration for Nueradash frontend.
 * Provides a single source of truth for the backend API base URL across local and production environments.
 */

const envApiUrl = process.env.REACT_APP_API_URL;

// Derive base URL: use environment variable, or fallback to localhost during local dev, or empty string (relative) for same-origin
export const API_BASE_URL = (
  envApiUrl && envApiUrl.trim() !== ""
    ? envApiUrl.trim()
    : (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? "http://localhost:5000"
        : "")
).replace(/\/+$/, "");

/**
 * Helper to build an absolute endpoint URL safely
 * @param {string} path - e.g. "/api/insights/summary" or "api/auth/login"
 * @returns {string} - full URL
 */
export function getApiUrl(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Helper to get fresh authorization headers from localStorage
 * @returns {object|null}
 */
export function getAuthHeaders() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export default API_BASE_URL;
