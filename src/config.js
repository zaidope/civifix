// src/config.js

// By using window.location.hostname, any device (mobile or desktop) 
// accessing the React app over the network (e.g. 192.168.x.x:3000) 
// will automatically direct its API requests to the exact same IP (e.g. 192.168.x.x:8000)
// This is critical for mobile connectivity.

const HOST = window.location.hostname;
export const API_URL = `http://${HOST}:8000`;
