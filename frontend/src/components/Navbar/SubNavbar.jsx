import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../../services/api";

function CategoriesDropdown() {
  const [open, setOpen]             = useState(false);
  const [categories, setCategories] = useState([]);
  const ref                         = useRef();
  const navigate                    = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    if (!open && categories.length === 0) {
      try {
        const data = await api.getCategories();
        setCategories(data.results || data);
      } catch (_) {}
    }
    setOpen(!open);
  };

  return (
    <div className="ls-subnav__dropdown" ref={ref}>
      <button
        className="ls-subnav__link ls-subnav__link--btn"
        onClick={handleOpen}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <i className="bi bi-grid-fill" />
        <span>Categories</span>
        <i className={`bi bi-chevron-${open ? "up" : "down"} ls-subnav__chevron`} />
      </button>

      {open && (
        <div className="ls-subnav__dropdown-menu" role="listbox">
          {categories.length === 0 ? (
            <div className="ls-subnav__dd-empty">
              <i className="bi bi-hourglass-split" />
              <span>Loading…</span>
            </div>
          ) : (
            categories.map((cat) => (
              <button
                key={cat.slug}
                className="ls-subnav__dd-item"
                role="option"
                onClick={() => {
                  navigate(`/videos?category=${cat.slug}`);
                  setOpen(false);
                }}
              >
                {cat.icon && <i className={`bi ${cat.icon}`} />}
                <span>{cat.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const NAV_LINKS = [
  { to: "/",           label: "Best Videos",  icon: "bi-fire",             exact: true },
  { to: "/live",       label: "Live Camera",  icon: "bi-broadcast-pin"                 },
  { to: "/dating",     label: "Dating",       icon: "bi-heart-arrow"                   },
  { to: "/profile/me", label: "My Profile",   icon: "bi-person-badge-fill"             },
];

export default function SubNavbar() {
  return (
    <nav className="ls-subnav" aria-label="Section navigation">
      <div className="ls-subnav__inner">

        {/* Primary nav links */}
        {NAV_LINKS.map(({ to, label, icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `ls-subnav__link${isActive ? " ls-subnav__link--active" : ""}`
            }
          >
            <i className={`bi ${icon}`} />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Red Videos — accent link */}
        <NavLink
          to="/videos?featured=true"
          className={({ isActive }) =>
            `ls-subnav__link ls-subnav__link--red${isActive ? " ls-subnav__link--active" : ""}`
          }
        >
          <i className="bi bi-play-circle-fill" />
          <span>Red Videos</span>
        </NavLink>

        {/* Categories flyout */}
        <CategoriesDropdown />
      </div>
    </nav>
  );
}