import { config } from "dotenv";

config({ path: ".env" });

export const PORT = process.env.PORT || 5001;

export const FRONTEND_URLS = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(",").map((url) => url.trim())
  : [];
