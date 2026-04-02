import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../App";
import VideoCard from "../components/VideoCard";

function StatBox({ value, label }) {
  return (
    <div className="ls-profile__stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { slug }              = useParams();
  const { user: me }          = useAuth();
  const navigate              = useNavigate();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos]   = useState([]);
  const [photos, setPhotos]   = useState([]);
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
      .then(([p, v]) => {
        setProfile(p);
        setVideos(v.results || v);
      })
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
    catch (_) {} finally { setMatching(false); }
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile) return null;

  return (
    <div className="ls-profile-page">
      {/* ── Cover ─────────────────────────────────────────────── */}
      <div
        className="ls-profile__cover"
        style={profile.cover_photo ? { backgroundImage: `url(${profile.cover_photo})` } : {}}
      />

      {/* ── Main card ─────────────────────────────────────────── */}
      <div className="ls-container">
        <div className="ls-profile__card">
          {/* Avatar */}
          <div className="ls-profile__avatar-wrap">
            <div className="ls-profile__avatar">
              {profile.profile_photo
                ? <img src={profile.profile_photo} alt={profile.username} />
                : <i className="bi bi-person-circle" />}
            </div>
            {profile.is_online && <span className="ls-online-dot" title="Online" />}
          </div>

          {/* Info */}
          <div className="ls-profile__info">
            <div className="ls-profile__name-row">
              <h1>
                {profile.first_name && profile.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile.username}
                {profile.is_premium && (
                  <span className="ls-pill" style={{ fontSize: 12, marginLeft: 8 }}>
                    <i className="bi bi-gem" /> Premium
                  </span>
                )}
              </h1>
            </div>

            <p className="ls-profile__handle">@{profile.username}</p>

            <div className="ls-profile__attrs">
              {profile.city    && <span><i className="bi bi-geo-alt-fill" /> {profile.city}{profile.country && `, ${profile.country}`}</span>}
              {profile.age     && <span><i className="bi bi-calendar-heart" /> {profile.age} years old</span>}
              {profile.height_cm && <span><i className="bi bi-arrows-vertical" /> {profile.height_cm} cm</span>}
              {profile.skin_texture && <span><i className="bi bi-person-fill" /> {profile.skin_texture} skin</span>}
              {profile.relationship_goal && <span><i className="bi bi-heart-arrow" /> Looking for: {profile.relationship_goal}</span>}
            </div>

            {profile.bio && <p className="ls-profile__bio">{profile.bio}</p>}

            {/* Stats */}
            <div className="ls-profile__stats">
              <StatBox value={videos.length} label="Videos" />
              <StatBox value={(profile.likes_count || 0).toLocaleString()} label="Likes" />
              <StatBox value={profile.is_online ? "Online" : "Offline"} label="Status" />
            </div>

            {/* Actions */}
            {!isOwn && me && (
              <div className="ls-profile__actions">
                <button className="ls-btn ls-btn--primary" onClick={handleDM}>
                  <i className="bi bi-chat-heart-fill" /> Send Message
                </button>
                <button
                  className="ls-btn ls-btn--outline"
                  onClick={handleMatch}
                  disabled={matching}
                >
                  <i className="bi bi-heart-arrow" /> {matching ? "Sending…" : "Send Match"}
                </button>
              </div>
            )}
            {isOwn && (
              <Link to="/settings" className="ls-btn ls-btn--outline" style={{ marginTop: 12 }}>
                <i className="bi bi-pencil-fill" /> Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────── */}
        <div className="ls-profile__tabs">
          {["videos", "photos", "about"].map((t) => (
            <button
              key={t}
              className={`ls-profile__tab${tab === t ? " ls-profile__tab--active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "videos" && <><i className="bi bi-play-btn-fill" /> Videos ({videos.length})</>}
              {t === "photos" && <><i className="bi bi-images" /> Photos</>}
              {t === "about"  && <><i className="bi bi-person-lines-fill" /> About</>}
            </button>
          ))}
        </div>

        {/* ── Tab content ────────────────────────────────────── */}
        {tab === "videos" && (
          videos.length === 0 ? (
            <div className="ls-empty" style={{ padding: "60px 0" }}>
              <i className="bi bi-camera-video" />
              <p>{isOwn ? "You haven't uploaded any videos yet." : `${profile.username} hasn't uploaded any videos.`}</p>
              {isOwn && (
                <Link to="/videos/create" className="ls-btn ls-btn--primary" style={{ marginTop: 16 }}>
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

        {tab === "photos" && (
          <div className="ls-photos-grid">
            {(profile.photos || []).length === 0 ? (
              <div className="ls-empty" style={{ padding: "60px 0" }}>
                <i className="bi bi-images" />
                <p>No photos shared yet.</p>
              </div>
            ) : (
              profile.photos.map((p) => (
                <div key={p.id} className="ls-photo-item">
                  <img src={p.image} alt={p.caption || "Photo"} />
                  {p.caption && <span>{p.caption}</span>}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "about" && (
          <div className="ls-profile-about">
            <div className="ls-about-grid">
              {[
                { icon: "bi-geo-alt-fill",     label: "Location",      value: [profile.city, profile.country].filter(Boolean).join(", ") || "—" },
                { icon: "bi-calendar-heart",    label: "Age",           value: profile.age ? `${profile.age} years` : "—" },
                { icon: "bi-gender-ambiguous",  label: "Gender",        value: profile.gender === "M" ? "Male" : profile.gender === "F" ? "Female" : profile.gender || "—" },
                { icon: "bi-arrows-vertical",   label: "Height",        value: profile.height_cm ? `${profile.height_cm} cm` : "—" },
                { icon: "bi-person-fill",       label: "Skin Tone",     value: profile.skin_texture || "—" },
                { icon: "bi-heart-arrow",       label: "Looking For",   value: profile.relationship_goal || "—" },
                { icon: "bi-people-fill",       label: "Interested In", value: profile.interested_in === "M" ? "Men" : profile.interested_in === "F" ? "Women" : "Everyone" },
              ].map(({ icon, label, value }) => (
                <div key={label} className="ls-about-row">
                  <i className={`bi ${icon}`} />
                  <span className="ls-about-row__label">{label}</span>
                  <span className="ls-about-row__value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div>
      <div className="ls-skeleton" style={{ height: 200 }} />
      <div className="ls-container">
        <div className="ls-skeleton ls-skeleton--circle" style={{ width: 96, height: 96, margin: "-48px 0 20px" }} />
        <div className="ls-skeleton ls-skeleton--line" style={{ width: "30%", height: 28, marginBottom: 12 }} />
        <div className="ls-skeleton ls-skeleton--line" style={{ width: "20%" }} />
      </div>
    </div>
  );
}