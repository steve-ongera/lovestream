import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../App";
import PaymentModal from "../components/PaymentModal";
import VideoCard from "../components/VideoCard";

function formatDuration(secs) {
  if (!secs) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function VideoDetail() {
  const { slug }   = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [video, setVideo]                   = useState(null);
  const [loading, setLoading]               = useState(true);
  const [comments, setComments]             = useState([]);
  const [commentsPage, setCommentsPage]     = useState(1);
  const [commentsTotal, setCommentsTotal]   = useState(0);
  const [relatedVideos, setRelated]         = useState([]);
  const [liked, setLiked]                   = useState(false);
  const [showPayment, setShowPayment]       = useState(false);
  const [commentInput, setCommentInput]     = useState("");
  const [submittingComment, setSubmitting]  = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getVideo(slug)
      .then((v) => { setVideo(v); setLiked(v.is_liked); })
      .catch(() => navigate("/videos", { replace: true }))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  useEffect(() => {
    if (!slug) return;
    api.getComments(slug, { page: commentsPage })
      .then((d) => {
        setComments((prev) =>
          commentsPage === 1 ? (d.results || d) : [...prev, ...(d.results || d)]
        );
        setCommentsTotal(d.count || (d.results || d).length);
      })
      .catch(() => {});
  }, [slug, commentsPage]);

  useEffect(() => {
    if (!video?.category) return;
    api.getVideos({ category: video.category.slug, page_size: 6 })
      .then((d) => setRelated((d.results || d).filter((v) => v.id !== video.id).slice(0, 5)))
      .catch(() => {});
  }, [video]);

  const handleLike = async () => {
    if (!user) { navigate("/login"); return; }
    try {
      const res = await api.toggleLike(slug);
      setLiked(res.liked);
      setVideo((v) => ({ ...v, likes_count: v.likes_count + (res.liked ? 1 : -1) }));
    } catch (_) {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (!commentInput.trim()) return;
    setSubmitting(true);
    try {
      const comment = await api.addComment(slug, commentInput.trim());
      setComments((prev) => [comment, ...prev]);
      setCommentInput("");
      setVideo((v) => ({ ...v, comments_count: v.comments_count + 1 }));
    } catch (_) {}
    finally { setSubmitting(false); }
  };

  const handleDM = async () => {
    if (!user) { navigate("/login"); return; }
    try {
      const conv = await api.startConversation(video.uploader.id);
      navigate(`/messages?conversation=${conv.id}`);
    } catch (_) {}
  };

  /* ── Loading skeleton ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="ls-container" style={{ paddingTop: "var(--sp-6)" }}>
        <div
          className="ls-skeleton"
          style={{ width: "100%", aspectRatio: "16/9", borderRadius: "var(--r-lg)", marginBottom: "var(--sp-5)" }}
        />
        <div className="ls-skeleton" style={{ width: "70%", height: 28, marginBottom: "var(--sp-3)" }} />
        <div className="ls-skeleton" style={{ width: "40%", height: 14 }} />
      </div>
    );
  }

  if (!video) return null;

  const canWatch = video.access_type === "free" || video.has_access;

  return (
    <div className="ls-main" style={{ paddingBottom: "var(--sp-16)" }}>
      <div
        className="ls-container"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "var(--sp-8)",
          paddingTop: "var(--sp-6)",
          alignItems: "start",
        }}
      >
        {/* ════════════════════════════════════════════════════
            Main column
        ════════════════════════════════════════════════════ */}
        <div style={{ minWidth: 0 }}>

          {/* ── Player ──────────────────────────────────────── */}
          <div
            style={{
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
              background: "var(--stone-900)",
              boxShadow: "var(--shadow-lg)",
              marginBottom: "var(--sp-5)",
              aspectRatio: "16/9",
              position: "relative",
            }}
          >
            {canWatch ? (
              (video.video_url || video.video_file) ? (
                <video
                  style={{ width: "100%", height: "100%", display: "block" }}
                  src={video.video_url || video.video_file}
                  controls
                  poster={video.thumbnail}
                />
              ) : (
                <div
                  className="ls-flex-col ls-flex-center"
                  style={{ height: "100%", color: "var(--stone-400)", gap: "var(--sp-3)" }}
                >
                  <i className="bi bi-play-circle" style={{ fontSize: 48 }} />
                  <p style={{ fontSize: "var(--text-sm)" }}>No video source available.</p>
                </div>
              )
            ) : (
              /* Locked state */
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  backgroundImage: video.thumbnail ? `url(${video.thumbnail})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div
                  className="ls-flex-col ls-flex-center"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(16,10,8,.72)",
                    backdropFilter: "blur(4px)",
                    gap: "var(--sp-4)",
                    color: "var(--white)",
                    textAlign: "center",
                    padding: "var(--sp-6)",
                  }}
                >
                  <i className="bi bi-lock-fill" style={{ fontSize: 40, color: "var(--red-400)" }} />
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontStyle: "italic" }}>
                    Premium Content
                  </h3>
                  <p style={{ color: "rgba(255,255,255,.7)", fontSize: "var(--text-sm)" }}>
                    Unlock this video for KES {Number(video.price).toLocaleString()}
                  </p>
                  <button
                    className="ls-btn ls-btn--premium ls-btn--lg"
                    onClick={() => user ? setShowPayment(true) : navigate("/login")}
                  >
                    <i className="bi bi-gem" /> Unlock Now
                  </button>
                  <div style={{ display: "flex", gap: "var(--sp-5)", fontSize: "var(--text-sm)", opacity: .7 }}>
                    <span><i className="bi bi-phone-fill" /> M-Pesa</span>
                    <span><i className="bi bi-paypal" /> PayPal</span>
                    <span><i className="bi bi-credit-card-fill" /> Card</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Title & meta ────────────────────────────────── */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-2xl)",
              fontStyle: "italic",
              color: "var(--stone-900)",
              marginBottom: "var(--sp-3)",
              lineHeight: "var(--leading-snug)",
            }}
          >
            {video.title}
          </h1>

          {/* Meta pills row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "var(--sp-3)",
              marginBottom: "var(--sp-4)",
              fontSize: "var(--text-sm)",
              color: "var(--stone-400)",
            }}
          >
            <span><i className="bi bi-eye-fill" /> {video.views_count.toLocaleString()} views</span>
            <span><i className="bi bi-heart-fill" style={{ color: "var(--red-400)" }} /> {video.likes_count.toLocaleString()} likes</span>
            <span><i className="bi bi-chat-fill" /> {video.comments_count.toLocaleString()} comments</span>
            <span><i className="bi bi-clock" /> {formatDuration(video.duration_seconds)}</span>
            {video.category && (
              <Link to={`/videos?category=${video.category.slug}`} className="ls-pill">
                {video.category.icon && <i className={`bi ${video.category.icon}`} />}
                {video.category.name}
              </Link>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap", marginBottom: "var(--sp-5)" }}>
            <button
              className={`ls-btn${liked ? " ls-btn--primary" : " ls-btn--outline"}`}
              onClick={handleLike}
            >
              <i className={`bi bi-heart${liked ? "-fill" : ""}`} />
              {liked ? "Liked" : "Like"}
            </button>
            <button className="ls-btn ls-btn--outline" onClick={handleDM}>
              <i className="bi bi-chat-dots-fill" /> Message
            </button>
            <button
              className="ls-btn ls-btn--ghost"
              onClick={() => {
                navigator.share?.({ title: video.title, url: window.location.href })
                  || navigator.clipboard.writeText(window.location.href);
              }}
            >
              <i className="bi bi-share-fill" /> Share
            </button>
          </div>

          {/* ── Uploader card ───────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--sp-4)",
              padding: "var(--sp-4) var(--sp-5)",
              background: "var(--stone-50)",
              border: "1px solid var(--stone-200)",
              borderRadius: "var(--r-lg)",
              marginBottom: "var(--sp-5)",
            }}
          >
            <Link
              to={`/profile/${video.uploader.slug}`}
              style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", flex: 1, minWidth: 0 }}
            >
              <div
                className={`ls-avatar ls-avatar--lg${video.uploader.is_online ? " ls-avatar--online" : ""}`}
              >
                {video.uploader.profile_photo ? (
                  <img src={video.uploader.profile_photo} alt={video.uploader.username} />
                ) : (
                  <i className="bi bi-person-fill" />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: "block", color: "var(--stone-900)", fontSize: "var(--text-md)" }}>
                  {video.uploader.first_name || video.uploader.username}
                </strong>
                <small style={{ color: "var(--stone-400)", fontSize: "var(--text-xs)" }}>
                  {[video.uploader.city, video.uploader.age && `${video.uploader.age} yrs`]
                    .filter(Boolean).join(" · ")}
                </small>
                {video.uploader.is_premium && (
                  <div style={{ marginTop: 4 }}>
                    <span className="ls-badge ls-badge--gold">
                      <i className="bi bi-gem" /> Premium
                    </span>
                  </div>
                )}
              </div>
            </Link>
            <button className="ls-btn ls-btn--primary ls-btn--sm" onClick={handleDM}>
              <i className="bi bi-chat-heart-fill" /> DM
            </button>
          </div>

          {/* ── Description ─────────────────────────────────── */}
          {video.description && (
            <div
              style={{
                background: "var(--white)",
                border: "1px solid var(--stone-200)",
                borderRadius: "var(--r-lg)",
                padding: "var(--sp-5)",
                marginBottom: "var(--sp-5)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-lg)",
                  fontStyle: "italic",
                  marginBottom: "var(--sp-3)",
                  color: "var(--stone-900)",
                }}
              >
                About this video
              </h3>
              <p style={{ color: "var(--stone-600)", lineHeight: "var(--leading-loose)", fontSize: "var(--text-base)" }}>
                {video.description}
              </p>
            </div>
          )}

          {/* ── Tags ────────────────────────────────────────── */}
          {video.tags?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-2)", marginBottom: "var(--sp-6)" }}>
              {video.tags.map((t) => (
                <Link key={t.slug} to={`/videos?search=${t.name}`} className="ls-pill">
                  #{t.name}
                </Link>
              ))}
            </div>
          )}

          {/* ── Comments ────────────────────────────────────── */}
          <section>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-xl)",
                fontStyle: "italic",
                color: "var(--stone-900)",
                marginBottom: "var(--sp-4)",
              }}
            >
              <i className="bi bi-chat-heart-fill" style={{ color: "var(--red-400)" }} />{" "}
              Comments ({video.comments_count})
            </h3>

            {/* Comment input form */}
            <form
              onSubmit={handleComment}
              style={{
                display: "flex",
                gap: "var(--sp-3)",
                alignItems: "flex-start",
                marginBottom: "var(--sp-5)",
                padding: "var(--sp-4)",
                background: "var(--stone-50)",
                border: "1px solid var(--stone-200)",
                borderRadius: "var(--r-lg)",
              }}
            >
              <div className={`ls-avatar ls-avatar--sm${user?.is_online ? " ls-avatar--online" : ""}`}>
                {user?.profile_photo ? (
                  <img src={user.profile_photo} alt={user.username} />
                ) : (
                  <i className="bi bi-person-fill" />
                )}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
                <textarea
                  className="ls-input ls-textarea"
                  placeholder={user ? "Write a comment…" : "Sign in to comment"}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  rows={2}
                  disabled={!user}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="submit"
                    className={`ls-btn ls-btn--primary ls-btn--sm${submittingComment ? " ls-btn--loading" : ""}`}
                    disabled={!user || submittingComment || !commentInput.trim()}
                  >
                    {submittingComment ? null : <><i className="bi bi-send-fill" /> Post</>}
                  </button>
                </div>
              </div>
            </form>

            {/* Comment list */}
            <div>
              {comments.length === 0 ? (
                <div className="ls-empty" style={{ padding: "var(--sp-10) 0" }}>
                  <i className="bi bi-chat ls-empty__icon" />
                  <p>No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map((c) => <CommentItem key={c.id} comment={c} />)
              )}

              {comments.length < commentsTotal && (
                <button
                  className="ls-btn ls-btn--ghost ls-btn--full"
                  style={{ marginTop: "var(--sp-4)" }}
                  onClick={() => setCommentsPage((p) => p + 1)}
                >
                  Load more comments
                </button>
              )}
            </div>
          </section>
        </div>

        {/* ════════════════════════════════════════════════════
            Sidebar — related videos
        ════════════════════════════════════════════════════ */}
        <aside style={{ position: "sticky", top: "calc(var(--navbar-h) + var(--subnav-h) + var(--sp-4))" }}>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-lg)",
              fontStyle: "italic",
              color: "var(--stone-900)",
              marginBottom: "var(--sp-4)",
            }}
          >
            Related Videos
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
            {relatedVideos.length === 0 && (
              <p style={{ color: "var(--stone-400)", fontSize: "var(--text-sm)" }}>
                No related videos found.
              </p>
            )}
            {relatedVideos.map((v) => (
              <Link
                key={v.id}
                to={`/videos/${v.slug}`}
                style={{
                  display: "flex",
                  gap: "var(--sp-3)",
                  alignItems: "flex-start",
                  padding: "var(--sp-2)",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--stone-100)",
                  background: "var(--white)",
                  transition: "box-shadow var(--dur-base), border-color var(--dur-base)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  e.currentTarget.style.borderColor = "var(--stone-200)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "var(--stone-100)";
                }}
              >
                {/* Thumb */}
                <div
                  style={{
                    width: 100,
                    aspectRatio: "16/9",
                    borderRadius: "var(--r-sm)",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "var(--stone-100)",
                    position: "relative",
                  }}
                >
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt={v.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div className="ls-flex-center" style={{ height: "100%", color: "var(--stone-400)" }}>
                      <i className="bi bi-play-circle" />
                    </div>
                  )}
                  {v.access_type === "paid" && !v.has_access && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(16,10,8,.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="bi bi-lock-fill" style={{ color: "var(--white)", fontSize: 14 }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    className="ls-truncate-2"
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--weight-medium)",
                      color: "var(--stone-800)",
                      lineHeight: "var(--leading-snug)",
                      marginBottom: "var(--sp-1)",
                    }}
                  >
                    {v.title}
                  </p>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--stone-400)" }}>
                    <i className="bi bi-eye-fill" /> {v.views_count.toLocaleString()} views
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal
          title={video.title}
          amount={video.price}
          videoId={video.id}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            setVideo((v) => ({ ...v, has_access: true }));
          }}
        />
      )}
    </div>
  );
}

/* ── Comment item ─────────────────────────────────────────────────────────── */
function CommentItem({ comment }) {
  return (
    <div className="ls-comment">
      {/* Avatar */}
      <div className="ls-avatar ls-avatar--sm">
        {comment.author?.profile_photo ? (
          <img src={comment.author.profile_photo} alt={comment.author.username} />
        ) : (
          <i className="bi bi-person-fill" />
        )}
      </div>

      <div className="ls-comment__body">
        <div className="ls-comment__header">
          <Link to={`/profile/${comment.author?.slug}`} className="ls-comment__author">
            {comment.author?.first_name || comment.author?.username}
          </Link>
          <span className="ls-comment__time">{timeAgo(comment.created_at)}</span>
        </div>

        <p className="ls-comment__text">{comment.body}</p>

        <div className="ls-comment__actions">
          <span className="ls-comment__action">
            <i className="bi bi-heart" /> {comment.likes_count || 0}
          </span>
          <button className="ls-comment__action">
            <i className="bi bi-reply" /> Reply
          </button>
        </div>

        {/* Replies */}
        {comment.replies?.map((r) => (
          <div key={r.id} className="ls-comment ls-comment--reply" style={{ marginTop: "var(--sp-2)" }}>
            <div className="ls-avatar ls-avatar--xs">
              {r.author?.profile_photo ? (
                <img src={r.author.profile_photo} alt={r.author.username} />
              ) : (
                <i className="bi bi-person-fill" />
              )}
            </div>
            <div className="ls-comment__body">
              <div className="ls-comment__header">
                <Link to={`/profile/${r.author?.slug}`} className="ls-comment__author">
                  {r.author?.first_name || r.author?.username}
                </Link>
                <span className="ls-comment__time">{timeAgo(r.created_at)}</span>
              </div>
              <p className="ls-comment__text">{r.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}