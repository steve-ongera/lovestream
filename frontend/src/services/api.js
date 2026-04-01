/**
 * services/api.js
 * Centralised API client for LoveStream.
 * All calls go through the `request` helper which automatically:
 *  – attaches the JWT Bearer token
 *  – refreshes on 401
 *  – throws on network / server errors
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const AUTH_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:8000";

// ─── Token helpers ───────────────────────────────────────────────────────────
const getAccess  = () => localStorage.getItem("ls_access");
const getRefresh = () => localStorage.getItem("ls_refresh");

const saveTokens = (access, refresh) => {
  localStorage.setItem("ls_access", access);
  if (refresh) localStorage.setItem("ls_refresh", refresh);
};

async function refreshAccessToken() {
  const refresh = getRefresh();
  if (!refresh) throw new Error("No refresh token");

  const res  = await fetch(`${AUTH_URL}/api/auth/token/refresh/`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ refresh }),
  });

  if (!res.ok) throw new Error("Session expired. Please log in again.");

  const data = await res.json();
  saveTokens(data.access, data.refresh);
  return data.access;
}

// ─── Core request ────────────────────────────────────────────────────────────
async function request(path, options = {}, retry = true) {
  const token   = getAccess();
  const headers = { ...(options.headers || {}) };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Only set Content-Type for JSON (not FormData)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    try {
      const newToken = await refreshAccessToken();
      headers["Authorization"] = `Bearer ${newToken}`;
      const retried = await fetch(`${BASE_URL}${path}`, { ...options, headers });
      if (!retried.ok) throw new Error(await retried.text());
      return retried.json();
    } catch {
      localStorage.removeItem("ls_access");
      localStorage.removeItem("ls_refresh");
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const errText = await res.text();
    let errMsg;
    try { errMsg = JSON.parse(errText); } catch { errMsg = errText; }
    throw errMsg;
  }

  // 204 No Content
  if (res.status === 204) return null;

  return res.json();
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────
const get    = (path, params) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request(`${path}${qs}`);
};
const post   = (path, body)   => request(path, { method: "POST",  body: body instanceof FormData ? body : JSON.stringify(body) });
const patch  = (path, body)   => request(path, { method: "PATCH", body: body instanceof FormData ? body : JSON.stringify(body) });
const del    = (path)         => request(path, { method: "DELETE" });

// ─── Auth ────────────────────────────────────────────────────────────────────
async function login(username, password) {
  const data = await post("/auth/token/", { username, password });   // hits main urls.py
  saveTokens(data.access, data.refresh);
  return data;
}

async function register(payload) {
  return post("/auth/register/", payload);
}

async function getProfile() {
  return get("/auth/profile/");
}

async function updateProfile(payload) {
  return patch("/auth/profile/", payload);
}

async function getPublicProfile(slug) {
  return get(`/users/${slug}/`);
}

async function uploadUserPhoto(formData) {
  return request("/users/photos/", { method: "POST", body: formData });
}

// ─── Categories & Tags ────────────────────────────────────────────────────────
const getCategories = () => get("/categories/");
const getTags       = () => get("/tags/");

// ─── Videos ──────────────────────────────────────────────────────────────────
function getVideos(params = {}) {
  return get("/videos/", params);
}

function getVideo(slug) {
  return get(`/videos/${slug}/`);
}

function createVideo(formData) {
  return request("/videos/create/", { method: "POST", body: formData });
}

function toggleLike(slug) {
  return post(`/videos/${slug}/like/`);
}

// ─── Comments ─────────────────────────────────────────────────────────────────
function getComments(slug, params = {}) {
  return get(`/videos/${slug}/comments/`, params);
}

function addComment(slug, body, parentId = null) {
  return post(`/videos/${slug}/comments/`, { body, parent: parentId });
}

// ─── Live Streams ─────────────────────────────────────────────────────────────
function getStreams(params = {}) {
  return get("/streams/", params);
}

function getStream(slug) {
  return get(`/streams/${slug}/`);
}

function createStream(payload) {
  return post("/streams/create/", payload);
}

function goLive(slug) {
  return post(`/streams/${slug}/go-live/`);
}

function endStream(slug) {
  return post(`/streams/${slug}/end/`);
}

// ─── Dating ───────────────────────────────────────────────────────────────────
function getDatingSuggestions(params = {}) {
  return get("/dating/suggestions/", params);
}

function getMatches() {
  return get("/dating/matches/");
}

function sendMatch(receiverId) {
  return post("/dating/matches/send/", { receiver: receiverId });
}

function respondMatch(matchId, action) {           // action: "accept" | "reject"
  return patch(`/dating/matches/${matchId}/respond/`, { action });
}

// ─── Messages ────────────────────────────────────────────────────────────────
function getConversations() {
  return get("/messages/");
}

function startConversation(participantId) {
  return post("/messages/start/", { participant_id: participantId });
}

function getMessages(conversationId, params = {}) {
  return get(`/messages/${conversationId}/`, params);
}

function sendMessage(conversationId, body, photo = null) {
  if (photo) {
    const fd = new FormData();
    fd.append("body",  body);
    fd.append("photo", photo);
    return request(`/messages/${conversationId}/`, { method: "POST", body: fd });
  }
  return post(`/messages/${conversationId}/`, { body });
}

// ─── Payments ─────────────────────────────────────────────────────────────────
function initiatePayment(payload) {
  return post("/payments/initiate/", payload);
}

function getPaymentHistory() {
  return get("/payments/history/");
}

// ─── Notifications ────────────────────────────────────────────────────────────
function getNotifications(params = {}) {
  return get("/notifications/", params);
}

function markNotificationsRead() {
  return post("/notifications/mark-read/");
}

// ─── Search ───────────────────────────────────────────────────────────────────
function globalSearch(q) {
  return get("/search/", { q });
}

// ─── Named export ─────────────────────────────────────────────────────────────
export const api = {
  // auth
  login, register, getProfile, updateProfile, getPublicProfile, uploadUserPhoto,
  // content meta
  getCategories, getTags,
  // videos
  getVideos, getVideo, createVideo, toggleLike,
  // comments
  getComments, addComment,
  // live
  getStreams, getStream, createStream, goLive, endStream,
  // dating
  getDatingSuggestions, getMatches, sendMatch, respondMatch,
  // messages
  getConversations, startConversation, getMessages, sendMessage,
  // payments
  initiatePayment, getPaymentHistory,
  // notifications
  getNotifications, markNotificationsRead,
  // search
  globalSearch,
};