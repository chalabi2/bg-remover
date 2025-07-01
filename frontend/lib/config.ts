// Use NEXT_PUBLIC_API_BASE_URL for runtime config in Next.js
// Get API base URL from NEXT_PUBLIC_API_BASE_URL if set, otherwise use default
const prodBaseUrl = typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_API_BASE_URL
  ? (window as any).NEXT_PUBLIC_API_BASE_URL
  : 'https://backend.rmbg.jchalabi.xyz';

// API Configuration
export const config = {
  api: {
    baseUrl: prodBaseUrl,
    
    endpoints: {
      removeBackground: '/remove-background',
      health: '/health'
    }
  },
  
  // Domain configuration for CORS
  allowedDomain: 'rmbg.jchalabi.xyz'
}

// Helper function to get full API URL
export const getApiUrl = (endpoint: string) => {
  return `${config.api.baseUrl}${endpoint}`
} 