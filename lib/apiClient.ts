import axios, { AxiosInstance } from 'axios';

// Create axios instance with base configuration
// Use relative path to go through Next.js proxy for proper cookie handling in production
// On server side (SSR), we must use absolute URL to backend
const baseURL = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001')
  : '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for cross-site requests
  timeout: 120000, // 2 minutes timeout for AI operations
});

// Request interceptor removed as cookies are handled by browser automatically

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response?.status === 401) {
      // Token is invalid/expired (handled by cookie), redirect to login
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
         window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
