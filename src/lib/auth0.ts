// lib/auth0.js

import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  logoutStrategy: "auto",
  authorizationParameters: {
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
  }
});