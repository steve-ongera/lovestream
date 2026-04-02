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
  const { user }                    = useAuth();
  const navigate                    = useNavigate();
  const [people, setPeople]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    skin_texture:      "",
    relationship_goal: "",
    min_height:        "",
    max_height:        "",
  });

  const fetchPeople = useCallback((reset = false) => {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    const params = { page: currentPage, page_size: 12, ...filters };
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

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // ── Unauthenticated gate ──────────────────────────────────
  if (!user) {
    return (
      <div className="ls-main">
        <div className="ls-hero">
          <div className="ls-hero__tag">
            <i className="bi bi-heart-arrow" /> Dating
          </div>
          <h1><em>Find Your Perfect</em> Match</h1>
          <p>Sign in to discover people who match your preferences, location, and life goals.</p>
          <div className="ls-hero__cta">
            <Link to="/login" className="ls-btn ls-btn--primary ls-btn--lg">
              <i className="bi bi-heart-fill" /> Sign In to Start
            </Link>
            <Link to="/register" className="ls-btn ls-btn--outline ls-btn--lg">
              Create Free Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ls-main">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="ls-hero" style={{ paddingBlock: "clamp(40px, 6vw, 72px)" }}>
        <div className="ls-hero__tag">
          <i className="bi bi-heart-arrow" /> Dating
        </div>
        <h1>
          <em>Your perfect match</em> is waiting
        </h1>
        <p>
          Filtered by age ({user.min_age_preference}–{user.max_age_preference}),
          location, skin texture, height &amp; more.
        </p>
        <div className="ls-hero__cta">
          <button
            className="ls-btn ls-btn--primary ls-btn--lg"
            onClick={() => setFilterOpen(true)}
          >
            <i className="bi bi-sliders" /> Adjust Filters
            {activeFilterCount > 0 && (
              <span className="ls-badge ls-badge--dark" style={{ marginLeft: 6 }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          <Link to="/messages" className="ls-btn ls-btn--outline ls-btn--lg">
            <i className="bi bi-chat-heart-fill" /> Messages
          </Link>
        </div>
      </div>

      {/* ── Active filter pills ──────────────────────────────── */}
      {activeFilterCount > 0 && (
        <div style={{
          maxWidth: "var(--max-w)",
          margin: "0 auto",
          padding: "0 var(--content-pad) var(--sp-4)",
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--sp-2)",
          alignItems: "center",
        }}>
          <span className="ls-text-sm ls-text-muted" style={{ fontWeight: "var(--weight-medium)" }}>
            Active filters:
          </span>

          {filters.skin_texture && (
            <span className="ls-pill">
              <i className="bi bi-palette-fill" style={{ fontSize: 10 }} />
              Skin: {filters.skin_texture}
              <button
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "inherit", display: "flex" }}
                onClick={() => setFilters((f) => ({ ...f, skin_texture: "" }))}
              >
                <i className="bi bi-x" style={{ fontSize: 12 }} />
              </button>
            </span>
          )}
          {filters.relationship_goal && (
            <span className="ls-pill">
              <i className="bi bi-hearts" style={{ fontSize: 10 }} />
              Goal: {GOAL_OPTIONS.find((o) => o.value === filters.relationship_goal)?.label}
              <button
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "inherit", display: "flex" }}
                onClick={() => setFilters((f) => ({ ...f, relationship_goal: "" }))}
              >
                <i className="bi bi-x" style={{ fontSize: 12 }} />
              </button>
            </span>
          )}
          {(filters.min_height || filters.max_height) && (
            <span className="ls-pill">
              <i className="bi bi-rulers" style={{ fontSize: 10 }} />
              Height: {filters.min_height || "any"}–{filters.max_height || "any"} cm
              <button
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "inherit", display: "flex" }}
                onClick={() => setFilters((f) => ({ ...f, min_height: "", max_height: "" }))}
              >
                <i className="bi bi-x" style={{ fontSize: 12 }} />
              </button>
            </span>
          )}

          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--red-500)",
              fontWeight: "var(--weight-semi)",
              fontSize: "var(--text-sm)",
              padding: 0,
            }}
            onClick={() => setFilters({ skin_texture: "", relationship_goal: "", min_height: "", max_height: "" })}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Section heading ──────────────────────────────────── */}
      {!loading && people.length > 0 && (
        <div className="ls-section-head">
          <h2>
            <em>People</em> <strong>Near You</strong>
          </h2>
          <span className="ls-badge ls-badge--red-soft">
            {people.length}{hasMore ? "+" : ""} profiles
          </span>
        </div>
      )}

      {/* ── People grid ──────────────────────────────────────── */}
      {loading && people.length === 0 ? (
        <SkeletonGrid />
      ) : people.length === 0 ? (
        <div className="ls-empty" style={{ paddingBlock: "var(--sp-20)" }}>
          <div className="ls-empty__icon">
            <i className="bi bi-person-heart" />
          </div>
          <h3>No matches found</h3>
          <p>Try broadening your filters to discover more people.</p>
          <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-5)", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              className="ls-btn ls-btn--outline"
              onClick={() => setFilters({ skin_texture: "", relationship_goal: "", min_height: "", max_height: "" })}
            >
              <i className="bi bi-arrow-counterclockwise" /> Reset Filters
            </button>
            <button
              className="ls-btn ls-btn--ghost"
              onClick={() => setFilterOpen(true)}
            >
              <i className="bi bi-sliders" /> Adjust Filters
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="ls-video-grid ls-persons-grid"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))" }}
          >
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
            <div style={{ textAlign: "center", padding: "var(--sp-6) 0 var(--sp-12)" }}>
              <button
                className={`ls-btn ls-btn--outline ls-btn--lg${loading ? " ls-btn--loading" : ""}`}
                disabled={loading}
                onClick={() => { setPage((p) => p + 1); fetchPeople(); }}
              >
                {!loading && <><i className="bi bi-arrow-down-circle" /> Load More</>}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Matches FAB ──────────────────────────────────────── */}
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

// ── Matches panel ─────────────────────────────────────────────────────────
function MatchesPanel() {
  const [matches, setMatches] = useState([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.getMatches()
      .then((d) => setMatches(d.results || d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setOpen(true)}
        title="My Matches"
        style={{
          position: "fixed",
          bottom: "var(--sp-6)",
          right: "var(--sp-6)",
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
          padding: "12px 20px",
          borderRadius: "var(--r-full)",
          background: "var(--red-500)",
          color: "var(--white)",
          boxShadow: "var(--shadow-red)",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          fontWeight: "var(--weight-semi)",
          zIndex: 400,
          transition: "transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-base)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(224,26,79,.35)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-red)"; }}
      >
        <i className="bi bi-hearts" style={{ fontSize: 18, animation: "ls-heartbeat 2.4s ease-in-out infinite" }} />
        My Matches
        {matches.length > 0 && (
          <span style={{
            background: "var(--white)",
            color: "var(--red-600)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--weight-bold)",
            minWidth: 20,
            height: 20,
            borderRadius: "var(--r-full)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 5px",
          }}>
            {matches.length}
          </span>
        )}
      </button>

      {open && (
        <div className="ls-modal-overlay" onClick={() => setOpen(false)}>
          <div className="ls-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ls-modal__header">
              <h2 className="ls-modal__title">
                <i className="bi bi-hearts" style={{ color: "var(--red-500)", marginRight: 8 }} />
                My Matches
              </h2>
              <button className="ls-modal__close" onClick={() => setOpen(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="ls-skeleton" style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="ls-skeleton" style={{ height: 13, width: "50%", borderRadius: 6, marginBottom: 8 }} />
                      <div className="ls-skeleton" style={{ height: 11, width: "30%", borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="ls-empty" style={{ padding: "var(--sp-10) 0" }}>
                <div className="ls-empty__icon">
                  <i className="bi bi-heart" style={{ color: "var(--red-300)" }} />
                </div>
                <h3>No matches yet</h3>
                <p>Start sending hearts to people you like!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {matches.map((m) => {
                  const other = m.sender?.id === undefined ? m.receiver : m.sender;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--sp-3)",
                        padding: "10px var(--sp-3)",
                        borderRadius: "var(--r-md)",
                        transition: "background var(--dur-fast)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red-50)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <div className="ls-avatar ls-avatar--md">
                        {other?.profile_photo
                          ? <img src={other.profile_photo} alt="" />
                          : <i className="bi bi-person-fill" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: "var(--weight-semi)", color: "var(--stone-900)", fontSize: "var(--text-base)" }}>
                          {other?.first_name || other?.username}
                        </div>
                        <span
                          className={`ls-badge${m.status === "matched" ? " ls-badge--success" : " ls-badge--red-soft"}`}
                          style={{ marginTop: 3 }}
                        >
                          {m.status}
                        </span>
                      </div>
                      <Link
                        to="/messages"
                        className="ls-btn ls-btn--primary ls-btn--icon ls-btn--sm"
                        title="Send message"
                      >
                        <i className="bi bi-chat-heart-fill" />
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

// ── Filter modal ──────────────────────────────────────────────────────────
function FilterModal({ initial, onApply, onClose }) {
  const [f, setF] = useState(initial);

  const resetAll = () =>
    setF({ skin_texture: "", relationship_goal: "", min_height: "", max_height: "" });

  return (
    <div className="ls-modal-overlay" onClick={onClose}>
      <div className="ls-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ls-modal__header">
          <h2 className="ls-modal__title">
            <i className="bi bi-sliders" style={{ color: "var(--red-500)", marginRight: 8 }} />
            Match Filters
          </h2>
          <button className="ls-modal__close" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="ls-form">
          {/* Skin tone */}
          <div className="ls-form-group">
            <label className="ls-label">
              <i className="bi bi-palette-fill" style={{ color: "var(--red-400)", fontSize: 13 }} />
              Skin Tone
            </label>
            <select
              className="ls-input ls-select"
              value={f.skin_texture}
              onChange={(e) => setF((p) => ({ ...p, skin_texture: e.target.value }))}
            >
              {SKIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Relationship goal */}
          <div className="ls-form-group">
            <label className="ls-label">
              <i className="bi bi-hearts" style={{ color: "var(--red-400)", fontSize: 13 }} />
              Relationship Goal
            </label>
            <select
              className="ls-input ls-select"
              value={f.relationship_goal}
              onChange={(e) => setF((p) => ({ ...p, relationship_goal: e.target.value }))}
            >
              {GOAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Height range */}
          <div className="ls-form-group">
            <label className="ls-label">
              <i className="bi bi-rulers" style={{ color: "var(--red-400)", fontSize: 13 }} />
              Height Range (cm)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <input
                type="number"
                className="ls-input"
                placeholder="Min — e.g. 155"
                value={f.min_height}
                min={120}
                max={250}
                onChange={(e) => setF((p) => ({ ...p, min_height: e.target.value }))}
              />
              <input
                type="number"
                className="ls-input"
                placeholder="Max — e.g. 190"
                value={f.max_height}
                min={120}
                max={250}
                onChange={(e) => setF((p) => ({ ...p, max_height: e.target.value }))}
              />
            </div>
            <span className="ls-form-hint">Leave blank to include all heights.</span>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-2)" }}>
            <button
              type="button"
              className="ls-btn ls-btn--ghost"
              onClick={resetAll}
            >
              <i className="bi bi-arrow-counterclockwise" /> Reset
            </button>
            <button
              type="button"
              className="ls-btn ls-btn--primary"
              style={{ flex: 1 }}
              onClick={() => onApply(f)}
            >
              <i className="bi bi-check-lg" /> Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton grid ─────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div
      className="ls-video-grid ls-persons-grid"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
        padding: "var(--sp-6) var(--content-pad)",
        maxWidth: "var(--max-w)",
        margin: "0 auto",
      }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="ls-person-card"
          style={{ animation: `ls-fadeUp var(--dur-enter) var(--ease-out) ${i * 50}ms both` }}
        >
          <div className="ls-skeleton" style={{ height: 88, borderRadius: 0 }} />
          <div style={{ display: "flex", justifyContent: "center", marginTop: -38 }}>
            <div
              className="ls-skeleton"
              style={{ width: 76, height: 76, borderRadius: "50%", border: "4px solid var(--white)" }}
            />
          </div>
          <div style={{
            padding: "var(--sp-3) var(--sp-4) var(--sp-5)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}>
            <div className="ls-skeleton" style={{ height: 14, width: "60%", borderRadius: 6 }} />
            <div className="ls-skeleton" style={{ height: 11, width: "40%", borderRadius: 6 }} />
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <div className="ls-skeleton" style={{ height: 24, width: 56, borderRadius: "var(--r-full)" }} />
              <div className="ls-skeleton" style={{ height: 24, width: 56, borderRadius: "var(--r-full)" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}