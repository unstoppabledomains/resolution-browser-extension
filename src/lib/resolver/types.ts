import config from "@unstoppabledomains/config";

export const RESOLUTION_URL = `${config.UNSTOPPABLE_API_URL}/resolve`;
export const RESOLUTION_REDIRECT_URL = `${RESOLUTION_URL}/redirect?url=`;
export const SUPPORTED_DOMAIN_REFRESH_MINUTES = 30;
