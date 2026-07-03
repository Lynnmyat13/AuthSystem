/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type AxiosResponse, AxiosError } from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api/auth",
});

// Token management (access token only)
const TOKEN_KEY = "accessToken";

// Get access token from localStorage
export const getTokens = () => {
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
  };
};

// Set access token in localStorage
export const setTokens = (accessToken: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
};

// Clear tokens from localStorage
export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// Check if token is expired (JWT has 1 minute expiry)
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

// Auto-refresh token function (server-side refresh token lookup)
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const { accessToken } = getTokens();
    if (!accessToken) return null;

    const response = await axios.post(`${API.defaults.baseURL}/refresh-token`, {
      accessToken,
    });

    const { accessToken: newAccessToken } = response.data;
    setTokens(newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    clearTokens();
    return null;
  }
};

// Request interceptor to add token to requests
API.interceptors.request.use(
  (config) => {
    const { accessToken } = getTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
API.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { accessToken } = getTokens();
      if (accessToken && isTokenExpired(accessToken)) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return API(originalRequest);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auto-refresh token every 50 seconds (before 1 minute expiry)
let refreshInterval: ReturnType<typeof setInterval> | null = null;

export const startTokenRefresh = () => {
  if (refreshInterval) return; // Already started

  refreshInterval = setInterval(async () => {
    const { accessToken } = getTokens();
    if (accessToken && isTokenExpired(accessToken)) {
      await refreshAccessToken();
    }
  }, 50000); // 50 seconds
};

export const stopTokenRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

// Auth API functions
export const authAPI = {
  //Login (send OTP)
  login: (email: string, password: string, token: string) =>
    API.post("/login", { email, password, token }),
  // Verify OTP and get access token (single login endpoint)
  verifyOTPAndLogin: (email: string, otp: string) =>
    API.post("/verify-otp-login", { email, otp }),

  // Register
  register: (name: string, email: string, password: string) =>
    API.post("/register", { name, email, password }),

  // Verify OTP (for registration)
  // verifyOTP: (email: string, otp: string) =>
  //     API.post("/verify-otp", { email, otp }),

  // Google OAuth
  googleAuth: () => {
    window.location.href = `${API.defaults.baseURL}/google`;
  },

  // Logout
  logout: () => {
    const { accessToken } = getTokens();
    stopTokenRefresh();
    clearTokens();
    return API.post("/logout", { accessToken });
  },

  // Get user profile
  getProfile: () => API.get("/profile"),

  // Refresh token manually (server-side refresh token lookup)
  refreshToken: () => {
    const { accessToken } = getTokens();
    return API.post("/refresh-token", { accessToken });
  },
};

export default API;
