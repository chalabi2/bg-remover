// API Configuration
export const config = {
  api: {
    baseUrl: process.env.NODE_ENV === 'production' 
      ? 'http://asus-3.duckdns.org:5000'  // Production: DuckDNS domain (HTTP)
      : 'http://localhost:5000',           // Development: localhost
    
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