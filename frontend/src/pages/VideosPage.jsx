import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import VideoCard from "../components/VideoCard";

const SORT_OPTIONS = [
  { value: "-created_at",  label: "Newest" },
  { value: "-views_count", label: "Most Viewed" },
  { value: "-likes_count", label: "Most Liked" },
  { value: "price",        label: "Price ↑" },
];

export default function VideosPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [videos, setVideos]           = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);

  const page        = Number(searchParams.get("page")        || 1);
  const search      = searchParams.get("search")      || "";
  const category    = searchParams.get("category")    || "";
  const accessType  = searchParams.get("access_type") || "";
  const featured    = searchParams.get("featured")    || "";
  const ordering    = searchParams.get("ordering")    || "-created_at";

  // Load categories once
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
    <div className="ls-videos-page">
      {/* ── Filter Bar ──────────────────────────────────────── */}
      <div className="ls-filter-bar">
        <div className="ls-filter-bar__inner">

          {/* Access type */}
          <div className="ls-filter-group">
            {["", "free", "paid"].map((val) => (
              <button
                key={val}
                className={`ls-filter-btn${accessType === val ? " ls-filter-btn--active" : ""}`}
                onClick={() => update("access_type", val)}
              >
                {val === ""     && <><i className="bi bi-grid" /> All</>}
                {val === "free" && <><i className="bi bi-unlock-fill" /> Free</>}
                {val === "paid" && <><i className="bi bi-gem" /> Premium</>}
              </button>
            ))}
          </div>

          {/* Category select */}
          <select
            className="ls-select"
            value={category}
            onChange={(e) => update("category", e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            className="ls-select"
            value={ordering}
            onChange={(e) => update("ordering", e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Results count */}
          {!loading && (
            <span className="ls-filter-count">
              {totalCount.toLocaleString()} video{totalCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Active search label ──────────────────────────────── */}
      {search && (
        <div className="ls-container" style={{ paddingTop: 20 }}>
          <div className="ls-search-label">
            <i className="bi bi-search" />
            Results for <strong>"{search}"</strong>
            <button onClick={() => update("search", "")} className="ls-search-label__clear">
              <i className="bi bi-x-circle-fill" />
            </button>
          </div>
        </div>
      )}

      {/* ── Grid ────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonGrid />
      ) : videos.length === 0 ? (
        <div className="ls-empty" style={{ padding: "80px 20px" }}>
          <i className="bi bi-film" />
          <p>No videos found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="ls-video-grid">
          {videos.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <Pagination current={page} total={totalPages} onChange={setPage} />
      )}
    </div>
  );
}

function Pagination({ current, total, onChange }) {
  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
    pages.push(i);
  }
  return (
    <div className="ls-pagination">
      <button className="ls-page-btn" disabled={current === 1} onClick={() => onChange(current - 1)}>
        <i className="bi bi-chevron-left" />
      </button>
      {pages[0] > 1 && (
        <>
          <button className="ls-page-btn" onClick={() => onChange(1)}>1</button>
          {pages[0] > 2 && <span className="ls-page-ellipsis">…</span>}
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
          {pages[pages.length - 1] < total - 1 && <span className="ls-page-ellipsis">…</span>}
          <button className="ls-page-btn" onClick={() => onChange(total)}>{total}</button>
        </>
      )}
      <button className="ls-page-btn" disabled={current === total} onClick={() => onChange(current + 1)}>
        <i className="bi bi-chevron-right" />
      </button>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="ls-video-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="ls-skeleton-card">
          <div className="ls-skeleton ls-skeleton--thumb" />
          <div style={{ padding: "12px" }}>
            <div className="ls-skeleton ls-skeleton--line" style={{ width: "80%", marginBottom: 8 }} />
            <div className="ls-skeleton ls-skeleton--line" style={{ width: "55%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}