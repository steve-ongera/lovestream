import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../App";
import PersonCard from "../components/PersonCard";

const SKIN_OPTIONS = [
  { value: "",       label: "Any Skin Tone" },
  { value: "fair",   label: "Fair" },
  { value: "light",  label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "olive",  label: "Olive" },
  { value: "brown",  label: "Brown" },
  { value: "dark",   label: "Dark" },
];

const GOAL_OPTIONS = [
  { value: "",         label: "Any Goal" },
  { value: "date",     label: "Dating" },
  { value: "match",    label: "Match / Friendship" },
  { value: "marriage", label: "Marriage" },
  { value: "casual",   label: "Casual" },
];

export default function DatingPage() {
  const { user }                      = useAuth();
  const navigate                      = useNavigate();
  const [people, setPeople]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [filterOpen, setFilterOpen]   = useState(false);

  const [filters, setFilters] = useState({
    skin_texture:       "",
    relationship_goal:  "",
    min_height:         "",
    max_height:         "",
  });

  const fetchPeople = useCallback((reset = false) => {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    const params = { page: currentPage, page_size: 12, ...filters };
    // Remove empty params
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });

    api.getDatingSuggestions(params)
      .then((d) => {
        const results = d.results || d;
        setPeople((prev) => reset ? results : [...prev, ...results]);
        setHasMore(!!d.next);
        if (reset) setPage(1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filters]);

  useEffect(() => { fetchPeople(true); }, [filters]);

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setFilterOpen(false);
  };

  if (!user) {
    return (
      <div className="ls-empty" style={{ padding: "80px 20px" }}>
        <i className="bi bi-heart-arrow" />
        <h3>Find Your Match</h3>
        <p>Sign in to see people who match your preferences.</p>
        <Link to="/login" className="ls-btn ls-btn--primary" style={{ marginTop: 16 }}>
          <i className="bi bi-heart" /> Sign In to Start Dating
        </Link>
      </div>
    );
  }

  return (
    <div className="ls-dating-page">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="ls-dating-hero">
        <h1><em>Your perfect match</em> is waiting</h1>
        <p>
          Filtered by age ({user.min_age_preference}–{user.max_age_preference}),
          location, skin texture, height &amp; more.
        </p>
        <button
          className="ls-btn ls-btn--outline"
          onClick={() => setFilterOpen(true)}
        >
          <i className="bi bi-sliders" /> Adjust Filters
        </button>
      </div>

      {/* ── Active filters display ───────────────────────────── */}
      {Object.values(filters).some(Boolean) && (
        <div className="ls-active-filters">
          {filters.skin_texture && (
            <span className="ls-pill">
              Skin: {filters.skin_texture}
              <button onClick={() => setFilters((f) => ({ ...f, skin_texture: "" }))}>
                <i className="bi bi-x" />
              </button>
            </span>
          )}
          {filters.relationship_goal && (
            <span className="ls-pill">
              Goal: {filters.relationship_goal}
              <button onClick={() => setFilters((f) => ({ ...f, relationship_goal: "" }))}>
                <i className="bi bi-x" />
              </button>
            </span>
          )}
          {(filters.min_height || filters.max_height) && (
            <span className="ls-pill">
              Height: {filters.min_height || "any"}–{filters.max_height || "any"} cm
              <button onClick={() => setFilters((f) => ({ ...f, min_height: "", max_height: "" }))}>
                <i className="bi bi-x" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────────────── */}
      {loading && people.length === 0 ? (
        <SkeletonGrid />
      ) : people.length === 0 ? (
        <div className="ls-empty" style={{ padding: "80px 20px" }}>
          <i className="bi bi-person-heart" />
          <p>No matches found with your current filters. Try broadening your search!</p>
          <button
            className="ls-btn ls-btn--outline"
            style={{ marginTop: 16 }}
            onClick={() => setFilters({ skin_texture: "", relationship_goal: "", min_height: "", max_height: "" })}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="ls-people-grid">
            {people.map((u) => (
              <PersonCard
                key={u.id}
                user={u}
                onMatch={async () => {
                  try { await api.sendMatch(u.id); } catch (_) {}
                }}
              />
            ))}
          </div>
          {hasMore && (
            <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
              <button
                className="ls-btn ls-btn--outline"
                disabled={loading}
                onClick={() => { setPage((p) => p + 1); fetchPeople(); }}
              >
                {loading ? <i className="bi bi-hourglass-split" /> : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── My matches sidebar tab ───────────────────────────── */}
      <MatchesPanel />

      {/* ── Filter modal ─────────────────────────────────────── */}
      {filterOpen && (
        <FilterModal
          initial={filters}
          onApply={applyFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </div>
  );
}

function MatchesPanel() {
  const [matches, setMatches]   = useState([]);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    if (!open) return;
    api.getMatches()
      .then((d) => setMatches(d.results || d))
      .catch(() => {});
  }, [open]);

  return (
    <>
      <button
        className="ls-matches-fab"
        onClick={() => setOpen(true)}
        title="My Matches"
      >
        <i className="bi bi-hearts" />
        <span>Matches</span>
      </button>

      {open && (
        <div className="ls-modal-overlay" onClick={() => setOpen(false)}>
          <div className="ls-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3><i className="bi bi-hearts" /> My Matches</h3>
              <button onClick={() => setOpen(false)}><i className="bi bi-x-lg" /></button>
            </div>
            {matches.length === 0 ? (
              <div className="ls-empty">
                <i className="bi bi-heart" />
                <p>No matches yet. Start sending hearts!</p>
              </div>
            ) : (
              <div className="ls-matches-list">
                {matches.map((m) => {
                  const other = m.sender?.id === undefined ? m.receiver : m.sender;
                  return (
                    <div key={m.id} className="ls-match-row">
                      <div className="ls-card__avatar" style={{ width: 44, height: 44, fontSize: 30 }}>
                        {other?.profile_photo
                          ? <img src={other.profile_photo} alt="" />
                          : <i className="bi bi-person-circle" />}
                      </div>
                      <div className="ls-match-row__info">
                        <strong>{other?.first_name || other?.username}</strong>
                        <span className={`ls-match-status ls-match-status--${m.status}`}>
                          {m.status}
                        </span>
                      </div>
                      <Link to={`/messages`} className="ls-btn ls-btn--primary ls-btn--sm">
                        <i className="bi bi-chat-heart" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function FilterModal({ initial, onApply, onClose }) {
  const [f, setF] = useState(initial);

  return (
    <div className="ls-modal-overlay" onClick={onClose}>
      <div className="ls-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3><i className="bi bi-sliders" /> Match Filters</h3>
          <button onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>

        <div className="ls-form">
          <div className="ls-form-group">
            <label>Skin Tone</label>
            <select className="ls-input ls-select" value={f.skin_texture}
              onChange={(e) => setF((p) => ({ ...p, skin_texture: e.target.value }))}>
              {SKIN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="ls-form-group">
            <label>Relationship Goal</label>
            <select className="ls-input ls-select" value={f.relationship_goal}
              onChange={(e) => setF((p) => ({ ...p, relationship_goal: e.target.value }))}>
              {GOAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="ls-form-group">
              <label>Min Height (cm)</label>
              <input type="number" className="ls-input" placeholder="e.g. 155"
                value={f.min_height}
                onChange={(e) => setF((p) => ({ ...p, min_height: e.target.value }))} />
            </div>
            <div className="ls-form-group">
              <label>Max Height (cm)</label>
              <input type="number" className="ls-input" placeholder="e.g. 190"
                value={f.max_height}
                onChange={(e) => setF((p) => ({ ...p, max_height: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="ls-btn ls-btn--ghost ls-btn--full"
              onClick={() => setF({ skin_texture: "", relationship_goal: "", min_height: "", max_height: "" })}>
              Reset
            </button>
            <button className="ls-btn ls-btn--primary ls-btn--full" onClick={() => onApply(f)}>
              <i className="bi bi-check-lg" /> Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="ls-people-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="ls-skeleton-card ls-skeleton-card--person">
          <div className="ls-skeleton" style={{ height: 80 }} />
          <div className="ls-skeleton ls-skeleton--circle" style={{ margin: "-30px auto 0" }} />
          <div style={{ padding: 12 }}>
            <div className="ls-skeleton ls-skeleton--line" style={{ width: "60%", margin: "0 auto 8px" }} />
            <div className="ls-skeleton ls-skeleton--line" style={{ width: "40%", margin: "0 auto" }} />
          </div>
        </div>
      ))}
    </div>
  );
}