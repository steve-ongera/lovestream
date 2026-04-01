import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../App";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "sw", label: "Swahili", flag: "🇰🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

const GENDERS = [
  { value: "",  label: "All Genders",    icon: "bi-people-fill" },
  { value: "M", label: "Men",            icon: "bi-gender-male" },
  { value: "F", label: "Women",          icon: "bi-gender-female" },
  { value: "O", label: "Non-binary",     icon: "bi-gender-ambiguous" },
];

function Dropdown({ trigger, children, align = "left" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="ls-dropdown" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className={`ls-dropdown__menu ls-dropdown__menu--${align}`}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ onMenuClick }) {
  const { user, logout }        = useAuth();
  const navigate                = useNavigate();
  const [search, setSearch]     = useState("");
  const [lang, setLang]         = useState(LANGUAGES[0]);
  const [gender, setGender]     = useState(GENDERS[0]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/videos?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="ls-navbar">
      <div className="ls-navbar__inner">

        {/* ── Hamburger (mobile) ────────────────────── */}
        <button className="ls-navbar__hamburger" onClick={onMenuClick} aria-label="Open menu">
          <i className="bi bi-list" />
        </button>

        {/* ── Logo ─────────────────────────────────── */}
        <Link to="/" className="ls-navbar__logo">
          <i className="bi bi-heart-fill ls-logo-heart" />
          <span>Love<strong>Stream</strong></span>
        </Link>

        {/* ── Search ───────────────────────────────── */}
        <form className="ls-navbar__search" onSubmit={handleSearch}>
          <i className="bi bi-search ls-navbar__search-icon" />
          <input
            type="search"
            placeholder="Search people, videos, streams…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="ls-btn ls-btn--sm ls-btn--primary">Go</button>
        </form>

        {/* ── Right controls ───────────────────────── */}
        <div className="ls-navbar__controls">

          {/* Language */}
          <Dropdown
            align="right"
            trigger={
              <button className="ls-navbar__ctrl-btn" title="Language">
                <span>{lang.flag}</span>
                <span className="ls-navbar__ctrl-label">{lang.code.toUpperCase()}</span>
                <i className="bi bi-chevron-down" />
              </button>
            }
          >
            {LANGUAGES.map((l) => (
              <button key={l.code} className="ls-dropdown__item"
                onClick={() => setLang(l)}>
                {l.flag} {l.label}
              </button>
            ))}
          </Dropdown>

          {/* Gender filter */}
          <Dropdown
            align="right"
            trigger={
              <button className="ls-navbar__ctrl-btn" title="Filter by gender">
                <i className={`bi ${gender.icon}`} />
                <span className="ls-navbar__ctrl-label ls-hide-sm">{gender.label}</span>
                <i className="bi bi-chevron-down" />
              </button>
            }
          >
            {GENDERS.map((g) => (
              <button key={g.value} className="ls-dropdown__item"
                onClick={() => setGender(g)}>
                <i className={`bi ${g.icon}`} /> {g.label}
              </button>
            ))}
          </Dropdown>

          {/* Premium badge */}
          <Link to="/premium" className="ls-navbar__premium ls-hide-sm">
            <i className="bi bi-gem" /> Premium
          </Link>

          {/* Settings */}
          <Link to="/settings" className="ls-navbar__ctrl-btn ls-hide-sm" title="Settings">
            <i className="bi bi-gear-fill" />
          </Link>

          {/* Notifications */}
          {user && (
            <button className="ls-navbar__ctrl-btn ls-notif-btn" title="Notifications">
              <i className="bi bi-bell-fill" />
              <span className="ls-notif-badge">3</span>
            </button>
          )}

          {/* Auth */}
          {user ? (
            <Dropdown
              align="right"
              trigger={
                <button className="ls-navbar__avatar" title="My account">
                  {user.profile_photo
                    ? <img src={user.profile_photo} alt={user.username} />
                    : <i className="bi bi-person-circle" />}
                </button>
              }
            >
              <div className="ls-dropdown__header">
                <strong>{user.first_name || user.username}</strong>
                <small>{user.city}</small>
              </div>
              <Link to={`/profile/${user.slug}`} className="ls-dropdown__item">
                <i className="bi bi-person" /> My Profile
              </Link>
              <Link to="/messages" className="ls-dropdown__item">
                <i className="bi bi-chat-dots" /> Messages
              </Link>
              <Link to="/videos/create" className="ls-dropdown__item">
                <i className="bi bi-camera-video-fill" /> Upload Video
              </Link>
              <hr className="ls-dropdown__divider" />
              <button className="ls-dropdown__item ls-dropdown__item--danger" onClick={logout}>
                <i className="bi bi-box-arrow-right" /> Sign Out
              </button>
            </Dropdown>
          ) : (
            <Link to="/login" className="ls-btn ls-btn--primary ls-btn--sm">
              <i className="bi bi-heart" /> Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}