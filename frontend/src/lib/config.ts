import brand from "../../../config/brand.json";

export const config = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "",
  userPoolId: (import.meta.env.VITE_USER_POOL_ID as string | undefined) ?? "",
  userPoolClientId: (import.meta.env.VITE_USER_POOL_CLIENT_ID as string | undefined) ?? "",
  region: (import.meta.env.VITE_REGION as string | undefined) ?? "ap-south-1",
};

export { brand };

export const isConfigured = () => Boolean(config.apiUrl && config.userPoolId && config.userPoolClientId);
