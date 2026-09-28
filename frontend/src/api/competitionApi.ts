import { apiRequest } from "./client";

export const listCompetitions = () => apiRequest(`/competitions`, { method: "GET" });

export const getCompetition = (id) => apiRequest(`/competitions/${id}`, { method: "GET" });

export const registerForCompetition = (id) =>
  apiRequest(`/competitions/${id}/register`, { method: "POST" });

export const submitEntry = (id, { mediaUrl, caption }) =>
  apiRequest(`/competitions/${id}/submit`, { method: "POST", body: { mediaUrl, caption } });
