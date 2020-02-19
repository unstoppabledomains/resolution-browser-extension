import('./env');

const dev = process.env.DEV || "false";

export const baseurl = dev === "true" ? 'http://localhost:8080/api/v1/' : 'https://unstoppabledomains.com/api/v1/';