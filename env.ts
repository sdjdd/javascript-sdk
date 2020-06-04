const myAppId = '';
const myAppKey = '';
const myServerURL = '';

export const appId = process.env.LC_APP_ID || myAppId;
export const appKey = process.env.LC_APP_KEY || myAppKey;
export const serverURL = process.env.LC_SERVER_URL || myServerURL;
