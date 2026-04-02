import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import VideoCard from "../components/VideoCard";

const SORT_OPTIONS = [
  { value: "-created_at",  label: "Newest"      },
  { value: "-views_count", label: "Most Viewed"  },
  { value: "-likes_count", label: "Most Liked"   },
  { value: "price",        label: "Price ↑"      },
];

export default function VideosPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [videos, setVideos]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const page       = Number(searchParams.get("page")        || 1);
  const search     = searchParams.get("search")      || "";
  const category   = searchParams.get("category")    || "";
  const accessType = searchParams.get("access_type") || "";
  const featured   = searchParams.get("featured")    || "";
  const ordering   = searchParams.get("ordering")    || "-created_at";

  useEffect(() => {
    api.getCategories()
      .then((d) => setCategories(d.results || d))
      .catch(() => {});
  }, []);

  const fetchVideos = useCallback(() => {
    setLoading(true);
    const params = { page, ordering, page_size: 12 };
    if (search)     params.search      = search;
    if (category)   params.category    = category;
    if (accessType) params.access_type = accessType;
    if (featured)   params.featured    = featured;

    api.getVideos(params)
      .then((d) => {
        setVideos(d.results || d);
        setTotalCount(d.count || (d.results || d).length);
        setTotalPages(Math.ceil((d.count || (d.results || d).length) / 12) || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, category, accessType, featured, ordering]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const update = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", p);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="ls-main">

      {/* ── Filter bar ────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--white)",
          borderBottom: "1px solid var(--stone-200)",
          padding: "var(--sp-3) var(--content-pad)",
          position: "sticky",
          top: "calc(var(--navbar-h) + var(--subnav-h))",
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "var(--max-w)",
            marginInline: "auto",
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-3)",
            flexWrap: "wrap",
          }}
        >
          {/* Access type toggle group */}
          <div
            style={{
              display: "flex",
              gap: 2,
              background: "var(--stone-100)",
              borderRadius: "var(--r-full)",
              padding: 3,
            }}
          >
            {[
              { val: "",     icon: "bi-grid",         label: "All"     },
              { val: "free", icon: "bi-unlock-fill",  label: "Free"    },
              { val: "paid", icon: "bi-gem",          label: "Premium" },
            ].map(({ val, icon, label }) => (
              <button
                key={val}
                onClick={() => update("access_type", val)}
                className={accessType === val ? "ls-btn ls-btn--primary ls-btn--sm" : "ls-btn ls-btn--ghost ls-btn--sm"}
                style={{ borderRadius: "var(--r-full)" }}
              >
                <i className={`bi ${icon}`} /> {label}
              </button>
            ))}
          </div>

          {/* Category select */}
          <div className="ls-input-wrap" style={{ minWidth: 160 }}>
            <i className="bi bi-grid-fill ls-input-wrap__icon" style={{ fontSize: 13 }} />
            <select
              className="ls-input ls-select ls-input--icon-left"
              style={{ paddingBlock: 8, height: "auto" }}
              value={category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sort select */}
          <div className="ls-input-wrap" style={{ minWidth: 150 }}>
            <i className="bi bi-sort-down ls-input-wrap__icon" style={{ fontSize: 13 }} />
            <select
              className="ls-input ls-select ls-input--icon-left"
              style={{ paddingBlock: 8, height: "auto" }}
              value={ordering}
              onChange={(e) => update("ordering", e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Results count */}
          {!loading && (
            <span
              className="ls-badge ls-badge--dark"
              style={{ marginLeft: "auto" }}
            >
              {totalCount.toLocaleString()} video{totalCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Active search label ───────────────────────────────────── */}
      {search && (
        <div
          className="ls-container"
          style={{ paddingTop: "var(--sp-5)" }}
        >
          <div
            className="ls-alert ls-alert--info"
            style={{ display: "inline-flex", gap: "var(--sp-3)", alignItems: "center" }}
          >
            <i className="bi bi-search" />
            Results for <strong>"{search}"</strong>
            <button
              className="ls-btn ls-btn--ghost ls-btn--xs ls-btn--icon"
              onClick={() => update("search", "")}
              aria-label="Clear search"
            >
              <i className="bi bi-x-circle-fill" />
            </button>
          </div>
        </div>
      )}

      {/* ── Grid ──────────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonGrid />
      ) : videos.length === 0 ? (
        <div className="ls-empty" style={{ padding: "var(--sp-20) var(--sp-5)" }}>
          <i className="bi bi-film ls-empty__icon" />
          <h3>No videos found</h3>
          <p>Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="ls-video-grid">
          {videos.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <Pagination current={page} total={totalPages} onChange={setPage} />
      )}
    </div>
  );
}

/* ── Pagination ───────────────────────────────────────────────────────────── */
function Pagination({ current, total, onChange }) {
  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="ls-pagination">
      <button
        className="ls-page-btn"
        disabled={current === 1}
        onClick={() => onChange(current - 1)}
        aria-label="Previous page"
      >
        <i className="bi bi-chevron-left" />
      </button>

      {pages[0] > 1 && (
        <>
          <button className="ls-page-btn" onClick={() => onChange(1)}>1</button>
          {pages[0] > 2 && <span className="ls-page-btn ls-page-btn--dots">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          className={`ls-page-btn${p === current ? " ls-page-btn--active" : ""}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < total && (
        <>
          {pages[pages.length - 1] < total - 1 && (
            <span className="ls-page-btn ls-page-btn--dots">…</span>
          )}
          <button className="ls-page-btn" onClick={() => onChange(total)}>{total}</button>
        </>
      )}

      <button
        className="ls-page-btn"
        disabled={current === total}
        onClick={() => onChange(current + 1)}
        aria-label="Next page"
      >
        <i className="bi bi-chevron-right" />
      </button>
    </div>
  );
}

/* ── Skeleton grid ────────────────────────────────────────────────────────── */
function SkeletonGrid() {
  return (
    <div className="ls-video-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
            background: "var(--white)",
            border: "1px solid var(--stone-100)",
          }}
        >
          <div
            className="ls-skeleton"
            style={{ aspectRatio: "16/9", width: "100%" }}
          />
          <div style={{ padding: "var(--sp-3) var(--sp-4)" }}>
            <div className="ls-skeleton" style={{ height: 14, width: "80%", marginBottom: "var(--sp-2)" }} />
            <div className="ls-skeleton" style={{ height: 12, width: "55%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}