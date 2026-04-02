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

  if (!user) {
    navigate("/login");
    return null;
  }

  // Load conversations
  useEffect(() => {
    api.getConversations()
      .then((d) => {
        const list = d.results || d;
        setConversations(list);
        // Auto-select from URL param
        const convId = searchParams.get("conversation");
        if (convId) {
          const found = list.find((c) => c.id === convId);
          if (found) setActiveConv(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  // Load messages for active conversation
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
    // Poll every 5 seconds for new messages
    clearInterval(pollRef.current);
    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [loadMessages]);

  // Scroll to bottom when messages change
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

  // Get the other participant's info
  const getOther = (conv) =>
    conv.participants?.find((p) => p.id !== user.id) || conv.participants?.[0];

  return (
    <div className="ls-messages-page">
      {/* ── Conversation list ────────────────────────────────── */}
      <aside className={`ls-conv-list${activeConv ? " ls-conv-list--hidden-mobile" : ""}`}>
        <div className="ls-conv-list__header">
          <h2><i className="bi bi-chat-heart-fill" /> Messages</h2>
        </div>

        {loadingConvs ? (
          <div className="ls-conv-skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ls-conv-skeleton__item">
                <div className="ls-skeleton ls-skeleton--circle" style={{ width: 44, height: 44 }} />
                <div style={{ flex: 1 }}>
                  <div className="ls-skeleton ls-skeleton--line" style={{ width: "60%", marginBottom: 8 }} />
                  <div className="ls-skeleton ls-skeleton--line" style={{ width: "80%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="ls-empty" style={{ padding: "60px 20px" }}>
            <i className="bi bi-chat-heart" />
            <p>No conversations yet. Find someone and say hi!</p>
            <Link to="/dating" className="ls-btn ls-btn--primary" style={{ marginTop: 16 }}>
              <i className="bi bi-heart-arrow" /> Find People
            </Link>
          </div>
        ) : (
          <div className="ls-conv-list__items">
            {conversations.map((conv) => {
              const other    = getOther(conv);
              const lastMsg  = conv.latest_message;
              const unread   = conv.unread_count;
              const isActive = activeConv?.id === conv.id;

              return (
                <button
                  key={conv.id}
                  className={`ls-conv-item${isActive ? " ls-conv-item--active" : ""}`}
                  onClick={() => setActiveConv(conv)}
                >
                  <div className="ls-conv-item__avatar">
                    {other?.profile_photo
                      ? <img src={other.profile_photo} alt="" />
                      : <i className="bi bi-person-circle" />}
                    {other?.is_online && <span className="ls-online-dot ls-online-dot--sm" />}
                  </div>
                  <div className="ls-conv-item__info">
                    <div className="ls-conv-item__name-row">
                      <strong>{other?.first_name || other?.username || "Unknown"}</strong>
                      {lastMsg && <span className="ls-conv-item__time">{timeAgo(lastMsg.created_at)}</span>}
                    </div>
                    <div className="ls-conv-item__preview">
                      {lastMsg?.photo && <i className="bi bi-image" style={{ marginRight: 4 }} />}
                      <span>{lastMsg?.body || (lastMsg?.photo ? "Photo" : "Start chatting…")}</span>
                      {unread > 0 && <span className="ls-conv-item__badge">{unread}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      {/* ── Chat window ─────────────────────────────────────── */}
      <main className={`ls-chat${activeConv ? " ls-chat--active" : ""}`}>
        {!activeConv ? (
          <div className="ls-chat__empty">
            <i className="bi bi-chat-heart-fill" />
            <h3>Select a conversation</h3>
            <p>Choose someone to chat with, or find new people in Dating.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="ls-chat__header">
              <button
                className="ls-chat__back"
                onClick={() => setActiveConv(null)}
              >
                <i className="bi bi-arrow-left" />
              </button>
              {(() => {
                const other = getOther(activeConv);
                return (
                  <Link to={`/profile/${other?.slug}`} className="ls-chat__user">
                    <div className="ls-conv-item__avatar" style={{ width: 40, height: 40, fontSize: 26 }}>
                      {other?.profile_photo
                        ? <img src={other.profile_photo} alt="" />
                        : <i className="bi bi-person-circle" />}
                      {other?.is_online && <span className="ls-online-dot ls-online-dot--sm" />}
                    </div>
                    <div>
                      <strong>{other?.first_name || other?.username}</strong>
                      <small>{other?.is_online ? "Online" : other?.city || ""}</small>
                    </div>
                  </Link>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="ls-chat__messages">
              {loadingMsgs && messages.length === 0 ? (
                <div className="ls-chat__loading">
                  <i className="bi bi-hourglass-split" />
                </div>
              ) : messages.length === 0 ? (
                <div className="ls-chat__empty-messages">
                  <i className="bi bi-heart" />
                  <p>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender?.id === user.id;
                  return (
                    <div key={msg.id} className={`ls-msg${isMe ? " ls-msg--me" : ""}`}>
                      {!isMe && (
                        <div className="ls-msg__avatar">
                          {msg.sender?.profile_photo
                            ? <img src={msg.sender.profile_photo} alt="" />
                            : <i className="bi bi-person-circle" />}
                        </div>
                      )}
                      <div className="ls-msg__bubble">
                        {msg.photo && (
                          <img
                            src={msg.photo}
                            alt="Shared photo"
                            className="ls-msg__photo"
                            onClick={() => window.open(msg.photo, "_blank")}
                          />
                        )}
                        {msg.body && <p>{msg.body}</p>}
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
              <div className="ls-chat__photo-preview">
                <img src={URL.createObjectURL(photoFile)} alt="Preview" />
                <button onClick={() => setPhotoFile(null)}>
                  <i className="bi bi-x-circle-fill" />
                </button>
              </div>
            )}

            {/* Input */}
            <form className="ls-chat__input-row" onSubmit={handleSend}>
              <button
                type="button"
                className="ls-chat__icon-btn"
                onClick={() => photoInputRef.current.click()}
                title="Share photo"
              >
                <i className="bi bi-image-fill" />
              </button>
              <input
                type="file"
                accept="image/*"
                ref={photoInputRef}
                style={{ display: "none" }}
                onChange={(e) => setPhotoFile(e.target.files[0] || null)}
              />
              <input
                className="ls-input"
                style={{ flex: 1 }}
                placeholder="Type a message…"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
              />
              <button
                type="submit"
                className="ls-btn ls-btn--primary"
                disabled={sending || (!msgInput.trim() && !photoFile)}
              >
                {sending
                  ? <i className="bi bi-hourglass-split" />
                  : <><i className="bi bi-send-fill" /> Send</>}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}