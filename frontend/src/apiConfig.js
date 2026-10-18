// Centralized API configuration for NOIR
// Uses local proxy in dev, direct Modal GPU server in production to avoid Vercel 60s proxy timeouts
export const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "" : "https://siegven--noir-engine-fastapi-app.us-east.modal.run");

