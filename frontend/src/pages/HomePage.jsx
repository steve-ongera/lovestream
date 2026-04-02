import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import VideoCard from "../components/VideoCard";
import PersonCard from "../components/PersonCard";
import LiveStreamCard from "../components/LiveStreamCard";

export default function HomePage() {
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [liveStreams, setLiveStreams]         = useState([]);
  const [suggestions, setSuggestions]        = useState([]);
  const [loadingVideos, setLoadingVideos]    = useState(true);
  const [loadingLive, setLoadingLive]        = useState(true);
  const [loadingPeople, setLoadingPeople]    = useState(true);

  useEffect(() => {
    api.getVideos({ featured: "true", page_size: 6 })
      .then((d) => setFeaturedVideos(d.results || d))
      .catch(() => {})
      .finally(() => setLoadingVideos(false));

    api.getStreams({ status: "live" })
      .then((d) => setLiveStreams((d.results || d).slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoadingLive(false));

    api.getDatingSuggestions({ page_size: 6 })
      .then((d) => setSuggestions(d.results || d))
      .catch(() => {})
      .finally(() => setLoadingPeople(false));
  }, []);

  return (
    <main className="ls-main ls-home">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="ls-hero">
        <div className="ls-hero__tag">
          <span className="ls-live-dot" /> Live people near you
        </div>

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
            { icon: "bi-people-fill",      value: "2.4M+", label: "Members"      },
            { icon: "bi-camera-video-fill", value: "180K+", label: "Videos"       },
            { icon: "bi-broadcast-pin",     value: "3.2K",  label: "Live Now"     },
            { icon: "bi-heart-fill",        value: "94K+",  label: "Matches Made" },
          ].map((s) => (
            <div key={s.label} className="ls-hero__stat">
              <i className={`bi ${s.icon}`} style={{ color: "var(--red-400)", fontSize: 20 }} />
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Streams ──────────────────────────────────────────── */}
      <section>
        <div className="ls-section-head">
          <h2>
            <i className="bi bi-broadcast-pin" style={{ color: "var(--red-500)" }} />{" "}
            <strong>Live</strong> Right Now
          </h2>
          <Link to="/live">See all <i className="bi bi-arrow-right" /></Link>
        </div>

        <hr className="ls-section-divider" />

        {loadingLive ? (
          <SkeletonRow count={4} />
        ) : liveStreams.length === 0 ? (
          <EmptyState
            icon="bi-camera-video"
            message="No live streams right now. Check back soon!"
          />
        ) : (
          <div className="ls-video-grid">
            {liveStreams.map((s) => (
              <LiveStreamCard key={s.id} stream={s} />
            ))}
          </div>
        )}
      </section>

      {/* ── Featured Videos ───────────────────────────────────────── */}
      <section>
        <div className="ls-section-head">
          <h2>
            <i className="bi bi-fire" style={{ color: "var(--red-500)" }} />{" "}
            <strong>Featured</strong> Videos
          </h2>
          <Link to="/videos?featured=true">See all <i className="bi bi-arrow-right" /></Link>
        </div>

        <hr className="ls-section-divider" />

        {loadingVideos ? (
          <SkeletonRow count={6} />
        ) : featuredVideos.length === 0 ? (
          <EmptyState icon="bi-play-btn" message="No featured videos yet." />
        ) : (
          <div className="ls-video-grid">
            {featuredVideos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        )}
      </section>

      {/* ── Dating Suggestions ────────────────────────────────────── */}
      <section>
        <div className="ls-section-head">
          <h2>
            <i className="bi bi-heart-arrow" style={{ color: "var(--red-500)" }} />{" "}
            People <strong>Near You</strong>
          </h2>
          <Link to="/dating">Explore <i className="bi bi-arrow-right" /></Link>
        </div>

        <hr className="ls-section-divider" />

        {loadingPeople ? (
          <SkeletonPeople count={6} />
        ) : suggestions.length === 0 ? (
          <EmptyState
            icon="bi-person-heart"
            message="Complete your profile to see matches near you."
          />
        ) : (
          <div
            className="ls-persons-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
              gap: "var(--sp-5)",
              padding: "0 var(--content-pad) var(--sp-6)",
              maxWidth: "var(--max-w)",
              marginInline: "auto",
            }}
          >
            {suggestions.map((u) => (
              <PersonCard key={u.id} user={u} />
            ))}
          </div>
        )}
      </section>

      {/* ── Premium Banner ────────────────────────────────────────── */}
      <section style={{ padding: "0 var(--content-pad) var(--sp-16)", maxWidth: "var(--max-w)", marginInline: "auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-6)",
            flexWrap: "wrap",
            background: "linear-gradient(135deg, var(--gold-100) 0%, var(--gold-300) 100%)",
            border: "1px solid var(--gold-300)",
            borderRadius: "var(--r-xl)",
            padding: "var(--sp-8)",
            boxShadow: "0 8px 32px rgba(212,168,83,.20)",
          }}
        >
          <i
            className="bi bi-gem"
            style={{ fontSize: 48, color: "var(--gold-400)", flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-xl)",
                color: "var(--stone-900)",
                marginBottom: "var(--sp-1)",
              }}
            >
              Unlock Premium Access
            </h3>
            <p style={{ color: "var(--stone-600)", fontSize: "var(--text-sm)" }}>
              Watch all videos, send unlimited matches, go live, and remove ads —
              just KES 499/month.
            </p>
          </div>
          <Link to="/premium" className="ls-btn ls-btn--premium ls-btn--lg">
            <i className="bi bi-gem" /> Go Premium
          </Link>
        </div>
      </section>
    </main>
  );
}

/* ── Skeleton loaders ─────────────────────────────────────────────────────── */
function SkeletonRow({ count }) {
  return (
    <div className="ls-video-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ borderRadius: "var(--r-lg)", overflow: "hidden", background: "var(--white)", border: "1px solid var(--stone-100)" }}>
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

function SkeletonPeople({ count }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
        gap: "var(--sp-5)",
        padding: "0 var(--content-pad) var(--sp-6)",
        maxWidth: "var(--max-w)",
        marginInline: "auto",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ borderRadius: "var(--r-xl)", overflow: "hidden", background: "var(--white)", border: "1px solid var(--stone-100)" }}>
          <div className="ls-skeleton" style={{ height: 88 }} />
          <div style={{ display: "flex", justifyContent: "center", marginTop: -38, paddingBottom: "var(--sp-3)" }}>
            <div className="ls-skeleton" style={{ width: 76, height: 76, borderRadius: "9999px" }} />
          </div>
          <div style={{ padding: "0 var(--sp-4) var(--sp-4)", textAlign: "center" }}>
            <div className="ls-skeleton" style={{ height: 14, width: "60%", margin: "0 auto var(--sp-2)" }} />
            <div className="ls-skeleton" style={{ height: 12, width: "40%", margin: "0 auto" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div className="ls-empty">
      <i className={`bi ${icon} ls-empty__icon`} />
      <p>{message}</p>
    </div>
  );
}