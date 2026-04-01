import React, { useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../App";

const LINKS = [
  { to: "/",            label: "Home",        icon: "bi-house-heart-fill" },
  { to: "/videos",      label: "Videos",      icon: "bi-play-btn-fill" },
  { to: "/live",        label: "Live Camera", icon: "bi-broadcast-pin" },
  { to: "/dating",      label: "Dating",      icon: "bi-heart-arrow" },
  { to: "/profile/me",  label: "My Profile",  icon: "bi-person-badge-fill" },
  { to: "/messages",    label: "Messages",    icon: "bi-chat-heart-fill" },
  { to: "/premium",     label: "Premium",     icon: "bi-gem" },
  { to: "/settings",    label: "Settings",    icon: "bi-gear-fill" },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  // Prevent body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`ls-sidebar__overlay${open ? " ls-sidebar__overlay--visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className={`ls-sidebar${open ? " ls-sidebar--open" : ""}`} aria-label="Mobile navigation">
        <div className="ls-sidebar__header">
          <Link to="/" className="ls-navbar__logo" onClick={onClose}>
            <i className="bi bi-heart-fill ls-logo-heart" />
            <span>Love<strong>Stream</strong></span>
          </Link>
          <button className="ls-sidebar__close" onClick={onClose} aria-label="Close menu">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* User info if logged in */}
        {user && (
          <div className="ls-sidebar__user">
            <div className="ls-sidebar__avatar">
              {user.profile_photo
                ? <img src={user.profile_photo} alt={user.username} />
                : <i className="bi bi-person-circle" />}
            </div>
            <div>
              <strong>{user.first_name || user.username}</strong>
              <small>{user.city || "No location set"}</small>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="ls-sidebar__nav">
          {LINKS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `ls-sidebar__link${isActive ? " ls-sidebar__link--active" : ""}`
              }
              onClick={onClose}
            >
              <i className={`bi ${icon}`} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ls-sidebar__footer">
          {user ? (
            <button className="ls-btn ls-btn--outline ls-btn--full" onClick={() => { logout(); onClose(); }}>
              <i className="bi bi-box-arrow-right" /> Sign Out
            </button>
          ) : (
            <Link to="/login" className="ls-btn ls-btn--primary ls-btn--full" onClick={onClose}>
              <i className="bi bi-heart" /> Sign In
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}