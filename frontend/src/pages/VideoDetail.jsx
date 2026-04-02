import React, { useEffect, useState, useRef } from "react";
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
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function VideoDetail() {
  const { slug }            = useParams();
  const { user }            = useAuth();
  const navigate            = useNavigate();

  const [video, setVideo]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [comments, setComments]     = useState([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [relatedVideos, setRelated] = useState([]);
  const [liked, setLiked]           = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [submittingComment, setSubmitting] = useState(false);

  // Load video
  useEffect(() => {
    setLoading(true);
    api.getVideo(slug)
      .then((v) => {
        setVideo(v);
        setLiked(v.is_liked);
      })
      .catch(() => navigate("/videos", { replace: true }))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  // Load comments
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

  // Load related
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
    } catch (_) {} finally { setSubmitting(false); }
  };

  const handleDM = async () => {
    if (!user) { navigate("/login"); return; }
    try {
      const conv = await api.startConversation(video.uploader.id);
      navigate(`/messages?conversation=${conv.id}`);
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="ls-video-detail-skeleton">
        <div className="ls-skeleton ls-skeleton--player" />
        <div className="ls-container">
          <div className="ls-skeleton ls-skeleton--line" style={{ width: "70%", height: 28, marginTop: 20 }} />
          <div className="ls-skeleton ls-skeleton--line" style={{ width: "40%", marginTop: 12 }} />
        </div>
      </div>
    );
  }

  if (!video) return null;

  const canWatch = video.access_type === "free" || video.has_access;

  return (
    <div className="ls-video-detail">
      <div className="ls-video-detail__layout">
        {/* ── Main column ─────────────────────────────────────── */}
        <div className="ls-video-detail__main">

          {/* Player */}
          <div className="ls-player-wrap">
            {canWatch ? (
              video.video_url ? (
                <video
                  className="ls-player"
                  src={video.video_url}
                  controls
                  poster={video.thumbnail}
                />
              ) : video.video_file ? (
                <video
                  className="ls-player"
                  src={video.video_file}
                  controls
                  poster={video.thumbnail}
                />
              ) : (
                <div className="ls-player-placeholder">
                  <i className="bi bi-play-circle" />
                  <p>No video source available.</p>
                </div>
              )
            ) : (
              <div
                className="ls-player-locked"
                style={{ backgroundImage: `url(${video.thumbnail})` }}
              >
                <div className="ls-player-locked__overlay">
                  <i className="bi bi-lock-fill" />
                  <h3>Premium Content</h3>
                  <p>Unlock this video for KES {Number(video.price).toLocaleString()}</p>
                  <button
                    className="ls-btn ls-btn--primary ls-btn--lg"
                    onClick={() => user ? setShowPayment(true) : navigate("/login")}
                  >
                    <i className="bi bi-gem" /> Unlock Now
                  </button>
                  <div className="ls-player-locked__methods">
                    <span><i className="bi bi-phone-fill" /> M-Pesa</span>
                    <span><i className="bi bi-paypal" /> PayPal</span>
                    <span><i className="bi bi-credit-card-fill" /> Card</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Title & meta */}
          <div className="ls-video-detail__info">
            <h1 className="ls-video-detail__title">{video.title}</h1>

            <div className="ls-video-detail__meta">
              <span><i className="bi bi-eye-fill" /> {video.views_count.toLocaleString()} views</span>
              <span><i className="bi bi-heart-fill" /> {video.likes_count.toLocaleString()} likes</span>
              <span><i className="bi bi-chat-fill" /> {video.comments_count.toLocaleString()} comments</span>
              <span><i className="bi bi-clock" /> {formatDuration(video.duration_seconds)}</span>
              {video.category && (
                <Link to={`/videos?category=${video.category.slug}`} className="ls-pill">
                  {video.category.name}
                </Link>
              )}
            </div>

            {/* Actions */}
            <div className="ls-video-detail__actions">
              <button
                className={`ls-btn ${liked ? "ls-btn--primary" : "ls-btn--outline"}`}
                onClick={handleLike}
              >
                <i className={`bi bi-heart${liked ? "-fill" : ""}`} />
                {liked ? "Liked" : "Like"}
              </button>
              <button className="ls-btn ls-btn--outline" onClick={handleDM}>
                <i className="bi bi-chat-dots-fill" /> Message
              </button>
              <button className="ls-btn ls-btn--ghost" onClick={() => {
                navigator.share?.({ title: video.title, url: window.location.href })
                  || navigator.clipboard.writeText(window.location.href);
              }}>
                <i className="bi bi-share-fill" /> Share
              </button>
            </div>
          </div>

          {/* Uploader card */}
          <div className="ls-uploader-card">
            <Link to={`/profile/${video.uploader.slug}`} className="ls-uploader-card__left">
              <div className="ls-card__avatar" style={{ width: 52, height: 52, fontSize: 34 }}>
                {video.uploader.profile_photo
                  ? <img src={video.uploader.profile_photo} alt={video.uploader.username} />
                  : <i className="bi bi-person-circle" />}
              </div>
              <div>
                <strong>{video.uploader.first_name || video.uploader.username}</strong>
                <small>
                  {video.uploader.city && `${video.uploader.city} · `}
                  {video.uploader.age && `${video.uploader.age} yrs`}
                </small>
                {video.uploader.is_premium && (
                  <span className="ls-pill" style={{ marginTop: 4, display: "inline-block" }}>
                    <i className="bi bi-gem" /> Premium
                  </span>
                )}
              </div>
            </Link>
            <button className="ls-btn ls-btn--primary ls-btn--sm" onClick={handleDM}>
              <i className="bi bi-chat-heart-fill" /> DM
            </button>
          </div>

          {/* Description */}
          {video.description && (
            <div className="ls-video-detail__description">
              <h3>About this video</h3>
              <p>{video.description}</p>
            </div>
          )}

          {/* Tags */}
          {video.tags?.length > 0 && (
            <div className="ls-video-detail__tags">
              {video.tags.map((t) => (
                <Link key={t.slug} to={`/videos?search=${t.name}`} className="ls-pill">
                  #{t.name}
                </Link>
              ))}
            </div>
          )}

          {/* ── Comments ────────────────────────────────────── */}
          <section className="ls-comments-section">
            <h3><i className="bi bi-chat-heart-fill" /> Comments ({video.comments_count})</h3>

            {/* Comment form */}
            <form className="ls-comment-form" onSubmit={handleComment}>
              <div className="ls-card__avatar">
                {user?.profile_photo
                  ? <img src={user.profile_photo} alt={user.username} />
                  : <i className="bi bi-person-circle" />}
              </div>
              <div className="ls-comment-form__right">
                <textarea
                  className="ls-input ls-comment-form__input"
                  placeholder={user ? "Write a comment…" : "Sign in to comment"}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  rows={2}
                  disabled={!user}
                />
                <button
                  type="submit"
                  className="ls-btn ls-btn--primary ls-btn--sm"
                  disabled={!user || submittingComment || !commentInput.trim()}
                >
                  {submittingComment ? <i className="bi bi-hourglass-split" /> : <><i className="bi bi-send-fill" /> Post</>}
                </button>
              </div>
            </form>

            {/* Comment list */}
            <div className="ls-comments-list">
              {comments.map((c) => (
                <CommentItem key={c.id} comment={c} />
              ))}
              {comments.length < commentsTotal && (
                <button
                  className="ls-btn ls-btn--ghost ls-btn--full"
                  onClick={() => setCommentsPage((p) => p + 1)}
                >
                  Load more comments
                </button>
              )}
              {comments.length === 0 && (
                <div className="ls-empty" style={{ padding: "40px 0" }}>
                  <i className="bi bi-chat" />
                  <p>No comments yet. Be the first!</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Sidebar: related videos ──────────────────────── */}
        <aside className="ls-video-detail__sidebar">
          <h3>Related Videos</h3>
          <div className="ls-related-list">
            {relatedVideos.map((v) => (
              <Link key={v.id} to={`/videos/${v.slug}`} className="ls-related-item">
                <div className="ls-related-item__thumb">
                  {v.thumbnail
                    ? <img src={v.thumbnail} alt={v.title} />
                    : <i className="bi bi-play-circle" />}
                  {v.access_type === "paid" && !v.has_access && (
                    <span className="ls-card__badge ls-card__badge--paid">
                      <i className="bi bi-lock-fill" />
                    </span>
                  )}
                </div>
                <div className="ls-related-item__info">
                  <p className="ls-related-item__title">{v.title}</p>
                  <span>{v.views_count.toLocaleString()} views</span>
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

function CommentItem({ comment }) {
  return (
    <div className="ls-comment">
      <div className="ls-comment__avatar">
        {comment.author?.profile_photo
          ? <img src={comment.author.profile_photo} alt={comment.author.username} />
          : <i className="bi bi-person-circle" />}
      </div>
      <div className="ls-comment__body">
        <div className="ls-comment__author">
          <Link to={`/profile/${comment.author?.slug}`}>
            {comment.author?.first_name || comment.author?.username}
          </Link>
          <span className="ls-comment__time">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="ls-comment__text">{comment.body}</p>
        {comment.replies?.map((r) => (
          <div key={r.id} className="ls-comment ls-comment--reply">
            <div className="ls-comment__avatar" style={{ width: 28, height: 28, fontSize: 18 }}>
              <i className="bi bi-person-circle" />
            </div>
            <div className="ls-comment__body">
              <div className="ls-comment__author">
                <Link to={`/profile/${r.author?.slug}`}>
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