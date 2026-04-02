import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../App";
import VideoCard from "../components/VideoCard";

export default function ProfilePage() {
  const { slug }              = useParams();
  const { user: me }          = useAuth();
  const navigate              = useNavigate();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("videos");
  const [matching, setMatching] = useState(false);

  const isOwn = me?.slug === slug || slug === "me";

  useEffect(() => {
    const targetSlug = slug === "me" ? me?.slug : slug;
    if (!targetSlug) { navigate("/login"); return; }

    setLoading(true);
    Promise.all([
      api.getPublicProfile(targetSlug),
      api.getVideos({ uploader__slug: targetSlug, page_size: 12 }).catch(() => ({ results: [] })),
    ])
      .then(([p, v]) => { setProfile(p); setVideos(v.results || v); })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [slug, me, navigate]);

  const handleDM = async () => {
    if (!me) { navigate("/login"); return; }
    const conv = await api.startConversation(profile.id);
    navigate(`/messages?conversation=${conv.id}`);
  };

  const handleMatch = async () => {
    if (!me) { navigate("/login"); return; }
    setMatching(true);
    try { await api.sendMatch(profile.id); }
    catch (_) {}
    finally { setMatching(false); }
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile) return null;

  return (
    <div className="ls-main">

      {/* ── Profile header (uses design-system classes) ───────────── */}
      <div className="ls-profile-header">

        {/* Cover photo */}
        <div className="ls-profile-cover">
          {profile.cover_photo && (
            <img src={profile.cover_photo} alt="Cover" />
          )}
          {isOwn && (
            <div className="ls-profile-cover__edit">
              <Link to="/settings" className="ls-btn ls-btn--sm ls-btn--soft">
                <i className="bi bi-camera-fill" /> Edit Cover
              </Link>
            </div>
          )}
        </div>

        {/* Info row */}
        <div className="ls-profile-info">
          {/* Avatar */}
          <div className="ls-profile-photo">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt={profile.username} />
            ) : (
              <i className="bi bi-person-fill" />
            )}
          </div>

          {/* Text info */}
          <div className="ls-profile-name-wrap">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", flexWrap: "wrap" }}>
              <h1 className="ls-profile-name">
                {profile.first_name && profile.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile.username}
              </h1>
              {profile.is_premium && (
                <span className="ls-badge ls-badge--gold">
                  <i className="bi bi-gem" /> Premium
                </span>
              )}
              {profile.is_online && (
                <span className="ls-badge ls-badge--red-soft">
                  <span className="ls-live-dot" style={{ width: 6, height: 6 }} /> Online
                </span>
              )}
            </div>

            <p className="ls-profile-handle">@{profile.username}</p>

            {/* Quick attributes */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--sp-3)",
                marginTop: "var(--sp-2)",
                fontSize: "var(--text-sm)",
                color: "var(--stone-500)",
              }}
            >
              {profile.city && (
                <span>
                  <i className="bi bi-geo-alt-fill" style={{ color: "var(--red-400)" }} />{" "}
                  {profile.city}{profile.country && `, ${profile.country}`}
                </span>
              )}
              {profile.age && (
                <span><i className="bi bi-calendar-heart" /> {profile.age} years old</span>
              )}
              {profile.height_cm && (
                <span><i className="bi bi-arrows-vertical" /> {profile.height_cm} cm</span>
              )}
              {profile.relationship_goal && (
                <span><i className="bi bi-heart-arrow" /> {profile.relationship_goal}</span>
              )}
            </div>

            {profile.bio && (
              <p className="ls-profile-bio">{profile.bio}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="ls-profile-actions">
            {!isOwn && me ? (
              <>
                <button className="ls-btn ls-btn--primary" onClick={handleDM}>
                  <i className="bi bi-chat-heart-fill" /> Message
                </button>
                <button
                  className="ls-btn ls-btn--outline"
                  onClick={handleMatch}
                  disabled={matching}
                >
                  <i className="bi bi-heart-arrow" />
                  {matching ? "Sending…" : "Match"}
                </button>
              </>
            ) : isOwn ? (
              <Link to="/settings" className="ls-btn ls-btn--outline">
                <i className="bi bi-pencil-fill" /> Edit Profile
              </Link>
            ) : null}
          </div>
        </div>

        {/* Stats bar */}
        <div className="ls-profile-stats">
          <div className="ls-profile-stat">
            <strong>{videos.length}</strong>
            <span>Videos</span>
          </div>
          <div className="ls-profile-stat">
            <strong>{(profile.likes_count || 0).toLocaleString()}</strong>
            <span>Likes</span>
          </div>
          <div className="ls-profile-stat">
            <strong
              style={{ color: profile.is_online ? "var(--success-fg)" : "var(--stone-400)" }}
            >
              {profile.is_online ? "Online" : "Offline"}
            </strong>
            <span>Status</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="ls-container">
        <div className="ls-tabs" style={{ marginBottom: "var(--sp-5)" }}>
          {[
            { id: "videos", icon: "bi-play-btn-fill",     label: `Videos (${videos.length})` },
            { id: "photos", icon: "bi-images",             label: "Photos"                    },
            { id: "about",  icon: "bi-person-lines-fill",  label: "About"                     },
          ].map((t) => (
            <button
              key={t.id}
              className={`ls-tab${tab === t.id ? " ls-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <i className={`bi ${t.icon}`} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── Videos tab ────────────────────────────────────────── */}
        {tab === "videos" && (
          videos.length === 0 ? (
            <div className="ls-empty" style={{ padding: "var(--sp-16) 0" }}>
              <i className="bi bi-camera-video ls-empty__icon" />
              <h3>No videos yet</h3>
              <p>
                {isOwn
                  ? "You haven't uploaded any videos yet."
                  : `${profile.username} hasn't uploaded any videos.`}
              </p>
              {isOwn && (
                <Link
                  to="/videos/create"
                  className="ls-btn ls-btn--primary"
                  style={{ marginTop: "var(--sp-4)" }}
                >
                  <i className="bi bi-camera-video-fill" /> Upload Video
                </Link>
              )}
            </div>
          ) : (
            <div className="ls-video-grid" style={{ paddingInline: 0 }}>
              {videos.map((v) => <VideoCard key={v.id} video={v} />)}
            </div>
          )
        )}

        {/* ── Photos tab ────────────────────────────────────────── */}
        {tab === "photos" && (
          (profile.photos || []).length === 0 ? (
            <div className="ls-empty" style={{ padding: "var(--sp-16) 0" }}>
              <i className="bi bi-images ls-empty__icon" />
              <h3>No photos yet</h3>
              <p>No photos have been shared.</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
                gap: "var(--sp-3)",
                paddingBottom: "var(--sp-8)",
              }}
            >
              {profile.photos.map((p) => (
                <div
                  key={p.id}
                  style={{
                    borderRadius: "var(--r-lg)",
                    overflow: "hidden",
                    background: "var(--stone-100)",
                    border: "1px solid var(--stone-200)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <img
                    src={p.image}
                    alt={p.caption || "Photo"}
                    style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
                  />
                  {p.caption && (
                    <p
                      style={{
                        padding: "var(--sp-2) var(--sp-3)",
                        fontSize: "var(--text-xs)",
                        color: "var(--stone-500)",
                      }}
                    >
                      {p.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* ── About tab ─────────────────────────────────────────── */}
        {tab === "about" && (
          <div
            style={{
              maxWidth: 540,
              paddingBottom: "var(--sp-10)",
            }}
          >
            <div
              style={{
                background: "var(--white)",
                border: "1px solid var(--stone-200)",
                borderRadius: "var(--r-lg)",
                overflow: "hidden",
              }}
            >
              {[
                { icon: "bi-geo-alt-fill",    label: "Location",      value: [profile.city, profile.country].filter(Boolean).join(", ") || "—" },
                { icon: "bi-calendar-heart",  label: "Age",           value: profile.age ? `${profile.age} years` : "—" },
                { icon: "bi-gender-ambiguous",label: "Gender",        value: profile.gender === "M" ? "Male" : profile.gender === "F" ? "Female" : profile.gender || "—" },
                { icon: "bi-arrows-vertical", label: "Height",        value: profile.height_cm ? `${profile.height_cm} cm` : "—" },
                { icon: "bi-person-fill",     label: "Skin Tone",     value: profile.skin_texture || "—" },
                { icon: "bi-heart-arrow",     label: "Looking For",   value: profile.relationship_goal || "—" },
                { icon: "bi-people-fill",     label: "Interested In", value: profile.interested_in === "M" ? "Men" : profile.interested_in === "F" ? "Women" : "Everyone" },
              ].map(({ icon, label, value }, idx, arr) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--sp-4)",
                    padding: "var(--sp-4) var(--sp-5)",
                    borderBottom: idx < arr.length - 1 ? "1px solid var(--stone-100)" : "none",
                  }}
                >
                  <i
                    className={`bi ${icon}`}
                    style={{ color: "var(--red-400)", fontSize: 16, width: 20, textAlign: "center", flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--stone-500)",
                      width: 110,
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--weight-medium)",
                      color: "var(--stone-800)",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Profile skeleton ─────────────────────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div>
      {/* Cover */}
      <div className="ls-skeleton" style={{ height: 220 }} />

      <div className="ls-container">
        {/* Avatar */}
        <div
          className="ls-skeleton"
          style={{
            width: 108,
            height: 108,
            borderRadius: "9999px",
            marginTop: -54,
            marginBottom: "var(--sp-4)",
            border: "4px solid var(--white)",
          }}
        />
        {/* Name */}
        <div className="ls-skeleton" style={{ width: "30%", height: 28, marginBottom: "var(--sp-3)" }} />
        <div className="ls-skeleton" style={{ width: "20%", height: 14, marginBottom: "var(--sp-6)" }} />
        {/* Stats */}
        <div style={{ display: "flex", gap: "var(--sp-6)", marginBottom: "var(--sp-6)" }}>
          {[80, 60, 70].map((w, i) => (
            <div key={i}>
              <div className="ls-skeleton" style={{ width: w, height: 20, marginBottom: 6 }} />
              <div className="ls-skeleton" style={{ width: 50, height: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}