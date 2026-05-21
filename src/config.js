// src/config.js

// Supporting production environment variables first (e.g., when deployed on Vercel)
// while keeping dynamic hostnames for local network/mobile testing (192.168.x.x)
const HOST = window.location.hostname;

export const API_URL = process.env.REACT_APP_API_URL || `http://${HOST}:8000`;
export const AI_URL = process.env.REACT_APP_AI_URL || `http://${HOST}:9000`;

