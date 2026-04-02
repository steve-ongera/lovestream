import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../App";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return "now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString();
}

export default function MessagesPage() {
  const { user }                          = useAuth();
  const navigate                          = useNavigate();
  const [searchParams]                    = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv]       = useState(null);
  const [messages, setMessages]           = useState([]);
  const [msgInput, setMsgInput]           = useState("");
  const [sending, setSending]             = useState(false);
  const [photoFile, setPhotoFile]         = useState(null);
  const [loadingConvs, setLoadingConvs]   = useState(true);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const bottomRef                         = useRef();
  const photoInputRef                     = useRef();
  const pollRef                           = useRef();

  if (!user) { navigate("/login"); return null; }

  useEffect(() => {
    api.getConversations()
      .then((d) => {
        const list = d.results || d;
        setConversations(list);
        const convId = searchParams.get("conversation");
        if (convId) {
          const found = list.find((c) => c.id === convId);
          if (found) setActiveConv(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  const loadMessages = useCallback(() => {
    if (!activeConv) return;
    setLoadingMsgs(true);
    api.getMessages(activeConv.id)
      .then((d) => setMessages(d.results || d))
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [activeConv]);

  useEffect(() => {
    loadMessages();
    clearInterval(pollRef.current);
    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeConv || (!msgInput.trim() && !photoFile)) return;
    setSending(true);
    try {
      const msg = await api.sendMessage(activeConv.id, msgInput.trim(), photoFile);
      setMessages((prev) => [...prev, msg]);
      setMsgInput("");
      setPhotoFile(null);
    } catch (_) {} finally { setSending(false); }
  };

  const getOther = (conv) =>
    conv.participants?.find((p) => p.id !== user.id) || conv.participants?.[0];

  return (
    <div className="ls-chat-layout" style={{ height: "calc(100dvh - var(--navbar-h) - var(--subnav-h))" }}>

      {/* ── Conversation List (Sidebar) ─────────────────────── */}
      <aside
        className="ls-chat-sidebar"
        style={{ display: activeConv ? "none" : "flex" }}
      >
        {/* Header */}
        <div className="ls-chat-sidebar__header">
          <h3>
            <i className="bi bi-chat-heart-fill" style={{ color: "var(--red-500)", marginRight: 8 }} />
            Messages
          </h3>
          <button className="ls-btn ls-btn--icon ls-btn--soft ls-btn--sm">
            <i className="bi bi-pencil-square" />
          </button>
        </div>

        {/* Search inside convs */}
        <div style={{ padding: "var(--sp-3) var(--sp-5)" }}>
          <div className="ls-navbar__search" style={{ maxWidth: "none" }}>
            <i className="bi bi-search ls-navbar__search-icon" />
            <input type="text" placeholder="Search conversations…" />
          </div>
        </div>

        {/* Conversations */}
        {loadingConvs ? (
          <div style={{ padding: "var(--sp-3) var(--sp-5)", display: "flex", flexDirection: "column", gap: 16 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="ls-skeleton" style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="ls-skeleton" style={{ height: 13, width: "55%", marginBottom: 8, borderRadius: 6 }} />
                  <div className="ls-skeleton" style={{ height: 11, width: "75%", borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="ls-empty" style={{ padding: "48px 20px" }}>
            <div className="ls-empty__icon">
              <i className="bi bi-chat-heart" />
            </div>
            <h3>No conversations yet</h3>
            <p>Find someone and say hello!</p>
            <Link to="/dating" className="ls-btn ls-btn--primary" style={{ marginTop: "var(--sp-4)" }}>
              <i className="bi bi-heart-arrow" /> Find People
            </Link>
          </div>
        ) : (
          <div className="ls-chat-list">
            {conversations.map((conv) => {
              const other    = getOther(conv);
              const lastMsg  = conv.latest_message;
              const unread   = conv.unread_count;
              const isActive = activeConv?.id === conv.id;

              return (
                <button
                  key={conv.id}
                  className={`ls-chat-item${isActive ? " ls-chat-item--active" : ""}`}
                  onClick={() => setActiveConv(conv)}
                  style={{ width: "100%", background: "none", border: "none" }}
                >
                  {/* Avatar */}
                  <div
                    className={`ls-avatar ls-avatar--md${other?.is_online ? " ls-avatar--online" : ""}`}
                  >
                    {other?.profile_photo
                      ? <img src={other.profile_photo} alt="" />
                      : <i className="bi bi-person-fill" />}
                  </div>

                  {/* Info */}
                  <div className="ls-chat-item__info">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span className="ls-chat-item__name">
                        {other?.first_name || other?.username || "Unknown"}
                      </span>
                      {lastMsg && (
                        <span className="ls-chat-item__time ls-text-muted ls-text-sm">
                          {timeAgo(lastMsg.created_at)}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="ls-chat-item__preview">
                        {lastMsg?.photo && <i className="bi bi-image" style={{ marginRight: 4, fontSize: 11 }} />}
                        {lastMsg?.body || (lastMsg?.photo ? "Photo" : "Start chatting…")}
                      </span>
                      {unread > 0 && (
                        <span className="ls-chat-item__unread">{unread}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      {/* ── Chat Window ─────────────────────────────────────── */}
      <main className="ls-chat-window" style={{ display: "flex" }}>
        {!activeConv ? (
          /* Empty state — desktop */
          <div className="ls-empty" style={{ flex: 1 }}>
            <div className="ls-empty__icon">
              <i className="bi bi-chat-heart-fill" style={{ color: "var(--red-300)" }} />
            </div>
            <h3>Select a conversation</h3>
            <p>Choose someone from the list, or discover new people in Dating.</p>
            <Link to="/dating" className="ls-btn ls-btn--outline" style={{ marginTop: "var(--sp-4)" }}>
              <i className="bi bi-people-fill" /> Browse Profiles
            </Link>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="ls-chat-window__header">
              <button
                className="ls-btn ls-btn--icon ls-btn--ghost ls-btn--sm"
                onClick={() => setActiveConv(null)}
                title="Back"
              >
                <i className="bi bi-arrow-left" />
              </button>

              {(() => {
                const other = getOther(activeConv);
                return (
                  <Link
                    to={`/profile/${other?.slug}`}
                    style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", flex: 1, textDecoration: "none" }}
                  >
                    <div className={`ls-avatar ls-avatar--md${other?.is_online ? " ls-avatar--online" : ""}`}>
                      {other?.profile_photo
                        ? <img src={other.profile_photo} alt="" />
                        : <i className="bi bi-person-fill" />}
                    </div>
                    <div>
                      <div className="ls-chat-window__name">
                        {other?.first_name || other?.username}
                      </div>
                      <div className="ls-chat-window__status">
                        {other?.is_online
                          ? <><span className="ls-live-dot" style={{ width: 7, height: 7 }} /> Online</>
                          : <span style={{ color: "var(--stone-400)" }}>{other?.city || "Offline"}</span>
                        }
                      </div>
                    </div>
                  </Link>
                );
              })()}

              {/* Header actions */}
              <div style={{ display: "flex", gap: "var(--sp-1)" }}>
                <button className="ls-btn ls-btn--icon ls-btn--ghost ls-btn--sm" title="Voice call">
                  <i className="bi bi-telephone-fill" />
                </button>
                <button className="ls-btn ls-btn--icon ls-btn--ghost ls-btn--sm" title="More options">
                  <i className="bi bi-three-dots-vertical" />
                </button>
              </div>
            </div>

            {/* Messages feed */}
            <div className="ls-chat-messages">
              {loadingMsgs && messages.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "var(--sp-10)", color: "var(--stone-400)" }}>
                  <i className="bi bi-hourglass-split" style={{ fontSize: 28, animation: "ls-spin 1s linear infinite" }} />
                </div>
              ) : messages.length === 0 ? (
                <div className="ls-empty" style={{ flex: 1, padding: "var(--sp-10) var(--sp-5)" }}>
                  <div className="ls-empty__icon">
                    <i className="bi bi-heart" style={{ color: "var(--red-300)" }} />
                  </div>
                  <p>No messages yet — say hello!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender?.id === user.id;
                  return (
                    <div key={msg.id} className={`ls-msg${isMe ? " ls-msg--out" : ""}`}>
                      {!isMe && (
                        <div className="ls-avatar ls-avatar--xs" style={{ flexShrink: 0, alignSelf: "flex-end" }}>
                          {msg.sender?.profile_photo
                            ? <img src={msg.sender.profile_photo} alt="" />
                            : <i className="bi bi-person-fill" />}
                        </div>
                      )}
                      <div>
                        <div className="ls-msg__bubble">
                          {msg.photo && (
                            <img
                              src={msg.photo}
                              alt="Shared"
                              style={{
                                maxWidth: 220,
                                borderRadius: "var(--r-md)",
                                marginBottom: msg.body ? "var(--sp-2)" : 0,
                                cursor: "pointer",
                                display: "block",
                              }}
                              onClick={() => window.open(msg.photo, "_blank")}
                            />
                          )}
                          {msg.body && <p style={{ margin: 0 }}>{msg.body}</p>}
                        </div>
                        <span className="ls-msg__time">{timeAgo(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Photo preview */}
            {photoFile && (
              <div style={{
                padding: "var(--sp-3) var(--sp-5)",
                borderTop: "1px solid var(--stone-100)",
                background: "var(--white)",
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-3)",
              }}>
                <img
                  src={URL.createObjectURL(photoFile)}
                  alt="Preview"
                  style={{ width: 56, height: 56, borderRadius: "var(--r-md)", objectFit: "cover" }}
                />
                <span className="ls-text-sm" style={{ color: "var(--stone-500)", flex: 1 }}>
                  {photoFile.name}
                </span>
                <button
                  className="ls-btn ls-btn--icon ls-btn--ghost ls-btn--sm"
                  onClick={() => setPhotoFile(null)}
                  title="Remove photo"
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            )}

            {/* Input row */}
            <form className="ls-chat-input" onSubmit={handleSend}>
              <input
                type="file"
                accept="image/*"
                ref={photoInputRef}
                style={{ display: "none" }}
                onChange={(e) => setPhotoFile(e.target.files[0] || null)}
              />
              <button
                type="button"
                className="ls-btn ls-btn--icon ls-btn--ghost"
                onClick={() => photoInputRef.current.click()}
                title="Share photo"
              >
                <i className="bi bi-image-fill" />
              </button>
              <textarea
                className="ls-chat-input__field"
                placeholder="Type a message…"
                value={msgInput}
                rows={1}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { handleSend(e); }
                }}
              />
              <button
                type="submit"
                className={`ls-btn ls-btn--primary${sending ? " ls-btn--loading" : ""}`}
                disabled={sending || (!msgInput.trim() && !photoFile)}
              >
                {!sending && <><i className="bi bi-send-fill" /> Send</>}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}