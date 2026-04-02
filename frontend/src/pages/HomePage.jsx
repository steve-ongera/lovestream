import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import VideoCard from "../components/VideoCard";
import PersonCard from "../components/PersonCard";
import LiveStreamCard from "../components/LiveStreamCard";

export default function HomePage() {
  const [featuredVideos, setFeaturedVideos]     = useState([]);
  const [liveStreams, setLiveStreams]             = useState([]);
  const [suggestions, setSuggestions]            = useState([]);
  const [loadingVideos, setLoadingVideos]        = useState(true);
  const [loadingLive, setLoadingLive]            = useState(true);
  const [loadingPeople, setLoadingPeople]        = useState(true);

  useEffect(() => {
    // Featured videos
    api.getVideos({ featured: "true", page_size: 6 })
      .then((d) => setFeaturedVideos(d.results || d))
      .catch(() => {})
      .finally(() => setLoadingVideos(false));

    // Live streams
    api.getStreams({ status: "live" })
      .then((d) => setLiveStreams((d.results || d).slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoadingLive(false));

    // Dating suggestions
    api.getDatingSuggestions({ page_size: 6 })
      .then((d) => setSuggestions(d.results || d))
      .catch(() => {})
      .finally(() => setLoadingPeople(false));
  }, []);

  return (
    <div className="ls-home">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="ls-hero">
        <p className="ls-hero__eyebrow">
          <span className="ls-live-dot" /> Live people near you
        </p>
        <h1>
          Find Love, <em>Connect</em> &amp; Watch Together
        </h1>
        <p>
          Meet real people around you, enjoy exclusive videos, go live,
          and find someone who truly matches your vibe.
        </p>
        <div className="ls-hero__cta">
          <Link to="/dating" className="ls-btn ls-btn--primary ls-btn--lg">
            <i className="bi bi-heart-arrow" /> Start Dating
          </Link>
          <Link to="/videos" className="ls-btn ls-btn--outline ls-btn--lg">
            <i className="bi bi-play-circle-fill" /> Browse Videos
          </Link>
        </div>

        {/* Stats strip */}
        <div className="ls-hero__stats">
          {[
            { icon: "bi-people-fill",     value: "2.4M+",  label: "Members" },
            { icon: "bi-camera-video-fill",value: "180K+",  label: "Videos" },
            { icon: "bi-broadcast-pin",    value: "3.2K",   label: "Live Now" },
            { icon: "bi-heart-fill",       value: "94K+",   label: "Matches Made" },
          ].map((s) => (
            <div key={s.label} className="ls-hero__stat">
              <i className={`bi ${s.icon}`} />
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Streams ──────────────────────────────────────────── */}
      <section>
        <div className="ls-section-head">
          <h2><i className="bi bi-broadcast-pin" style={{ color: "var(--ls-red)" }} /> Live Right Now</h2>
          <Link to="/live">See all →</Link>
        </div>
        {loadingLive ? (
          <SkeletonRow count={4} />
        ) : liveStreams.length === 0 ? (
          <EmptyState icon="bi-camera-video" message="No live streams right now. Check back soon!" />
        ) : (
          <div className="ls-video-grid">
            {liveStreams.map((s) => <LiveStreamCard key={s.id} stream={s} />)}
          </div>
        )}
      </section>

      {/* ── Featured Videos ───────────────────────────────────────── */}
      <section>
        <div className="ls-section-head">
          <h2><i className="bi bi-fire" style={{ color: "var(--ls-red)" }} /> Featured Videos</h2>
          <Link to="/videos?featured=true">See all →</Link>
        </div>
        {loadingVideos ? (
          <SkeletonRow count={6} />
        ) : featuredVideos.length === 0 ? (
          <EmptyState icon="bi-play-btn" message="No featured videos yet." />
        ) : (
          <div className="ls-video-grid">
            {featuredVideos.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
        )}
      </section>

      {/* ── Dating Suggestions ────────────────────────────────────── */}
      <section>
        <div className="ls-section-head">
          <h2><i className="bi bi-heart-arrow" style={{ color: "var(--ls-red)" }} /> People Near You</h2>
          <Link to="/dating">Explore →</Link>
        </div>
        {loadingPeople ? (
          <SkeletonPeople count={6} />
        ) : suggestions.length === 0 ? (
          <EmptyState icon="bi-person-heart" message="Complete your profile to see matches near you." />
        ) : (
          <div className="ls-people-grid">
            {suggestions.map((u) => <PersonCard key={u.id} user={u} />)}
          </div>
        )}
      </section>

      {/* ── Premium Banner ────────────────────────────────────────── */}
      <section className="ls-premium-banner">
        <div className="ls-premium-banner__inner">
          <i className="bi bi-gem ls-premium-banner__icon" />
          <div>
            <h3>Unlock Premium Access</h3>
            <p>Watch all videos, send unlimited matches, go live, and remove ads — just KES 499/month.</p>
          </div>
          <Link to="/premium" className="ls-btn ls-btn--primary">
            <i className="bi bi-gem" /> Go Premium
          </Link>
        </div>
      </section>
    </div>
  );
}

// ── Skeleton loaders ───────────────────────────────────────────────────────
function SkeletonRow({ count }) {
  return (
    <div className="ls-video-grid">
      {Array.from({ length: count }).map((_, i) => (
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

function SkeletonPeople({ count }) {
  return (
    <div className="ls-people-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ls-skeleton-card ls-skeleton-card--person">
          <div className="ls-skeleton" style={{ height: 80 }} />
          <div className="ls-skeleton ls-skeleton--circle" />
          <div style={{ padding: "12px" }}>
            <div className="ls-skeleton ls-skeleton--line" style={{ width: "60%", margin: "0 auto 8px" }} />
            <div className="ls-skeleton ls-skeleton--line" style={{ width: "40%", margin: "0 auto" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div className="ls-empty">
      <i className={`bi ${icon}`} />
      <p>{message}</p>
    </div>
  );
}