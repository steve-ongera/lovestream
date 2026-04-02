import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar        from "./components/Navbar/Navbar";
import SubNavbar     from "./components/Navbar/SubNavbar";
import Sidebar       from "./components/Navbar/Sidebar";

import HomePage      from "./pages/HomePage";
import VideosPage    from "./pages/VideosPage";
import VideoDetail   from "./pages/VideoDetail";
import LivePage      from "./pages/LivePage";
import DatingPage    from "./pages/DatingPage";
import ProfilePage   from "./pages/ProfilePage";
import MessagesPage  from "./pages/MessagesPage";
import LoginPage, { RegisterPage } from "./pages/LoginPage";

// ─── Auth Context ─────────────────────────────────────────────────────────
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem("ls_access"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // TODO: call /api/auth/profile/ to hydrate user
      const saved = localStorage.getItem("ls_user");
      if (saved) setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, [token]);

  const login = (accessToken, refreshToken, userData) => {
    localStorage.setItem("ls_access",  accessToken);
    localStorage.setItem("ls_refresh", refreshToken);
    localStorage.setItem("ls_user",    JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("ls_access");
    localStorage.removeItem("ls_refresh");
    localStorage.removeItem("ls_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Protected Route ──────────────────────────────────────────────────────
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="ls-loader"><i className="bi bi-heart-pulse-fill" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

// ─── App Shell ────────────────────────────────────────────────────────────
function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <SubNavbar />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="ls-main">
        <Routes>
          <Route path="/"              element={<HomePage />} />
          <Route path="/videos"        element={<VideosPage />} />
          <Route path="/videos/:slug"  element={<VideoDetail />} />
          <Route path="/live"          element={<LivePage />} />
          <Route path="/dating"        element={<Protected><DatingPage /></Protected>} />
          <Route path="/profile/:slug" element={<ProfilePage />} />
          <Route path="/messages"      element={<Protected><MessagesPage /></Protected>} />
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/register"      element={<RegisterPage />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}