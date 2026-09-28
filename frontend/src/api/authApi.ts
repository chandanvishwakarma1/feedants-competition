import { apiRequest } from "./client";

export const login = (email, password) =>
  apiRequest("/auth/login", { method: "POST", body: { email, password }, auth: false });

export const register = (name, email, password) =>
  apiRequest("/auth/register", { method: "POST", body: { name, email, password }, auth: false });