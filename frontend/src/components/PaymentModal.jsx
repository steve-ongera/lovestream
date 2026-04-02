import React, { useState } from "react";
import { api } from "../services/api";

const METHODS = [
  { id: "mpesa",  label: "M-Pesa", icon: "bi-phone-fill",       color: "#00A651" },
  { id: "paypal", label: "PayPal", icon: "bi-paypal",           color: "#003087" },
  { id: "card",   label: "Card",   icon: "bi-credit-card-fill", color: "#1a1a2e" },
];

export default function PaymentModal({
  title,
  amount,
  videoId,
  liveStreamId,
  onClose,
  onSuccess,
}) {
  const [method, setMethod]   = useState("mpesa");
  const [phone, setPhone]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [step, setStep]       = useState("choose"); // choose | processing | done

  const handlePay = async () => {
    setError("");
    setLoading(true);
    setStep("processing");
    try {
      await api.initiatePayment({
        method,
        amount,
        currency: "KES",
        ...(videoId      && { video_id:       videoId }),
        ...(liveStreamId && { live_stream_id: liveStreamId }),
        ...(phone        && { phone_number:   phone }),
      });
      setStep("done");
      setTimeout(() => { onSuccess?.(); }, 1500);
    } catch (err) {
      setError(
        typeof err === "object"
          ? JSON.stringify(err)
          : "Payment failed. Please try again."
      );
      setStep("choose");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ls-modal-overlay" onClick={onClose}>
      <div className="ls-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="ls-modal__header">
          <div>
            <h3 className="ls-modal__title">
              <i className="bi bi-lock-fill" style={{ color: "var(--red-500)" }} />{" "}
              Unlock Content
            </h3>
            <p className="ls-text-muted ls-text-sm" style={{ marginTop: 4 }}>
              {title}
            </p>
          </div>
          <button className="ls-modal__close" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* ── Amount summary ─────────────────────────────────────── */}
        <div className="ls-payment-summary">
          <div className="ls-payment-summary__row">
            <span>Content access</span>
            <span>KES {Number(amount).toLocaleString()}</span>
          </div>
          <div className="ls-payment-summary__row">
            <span>Processing fee</span>
            <span>KES 0</span>
          </div>
          <div className="ls-payment-summary__row ls-payment-summary__total">
            <span>Total</span>
            <span>KES {Number(amount).toLocaleString()}</span>
          </div>
        </div>

        {/* ── Processing state ───────────────────────────────────── */}
        {step === "processing" && (
          <div
            className="ls-flex-col ls-flex-center"
            style={{ gap: "var(--sp-3)", padding: "var(--sp-8) 0", textAlign: "center" }}
          >
            <i
              className="bi bi-hourglass-split"
              style={{ fontSize: 40, color: "var(--red-400)", animation: "ls-spin 1.2s linear infinite" }}
            />
            <p style={{ fontWeight: "var(--weight-semi)", color: "var(--stone-800)" }}>
              Processing your payment…
            </p>
            <small className="ls-text-muted">
              Please complete the prompt on your{" "}
              {method === "mpesa" ? "phone" : "browser"}.
            </small>
          </div>
        )}

        {/* ── Done state ─────────────────────────────────────────── */}
        {step === "done" && (
          <div
            className="ls-flex-col ls-flex-center"
            style={{ gap: "var(--sp-3)", padding: "var(--sp-8) 0", textAlign: "center" }}
          >
            <i
              className="bi bi-check-circle-fill"
              style={{ fontSize: 48, color: "var(--success-fg)" }}
            />
            <p style={{ fontWeight: "var(--weight-semi)", color: "var(--stone-900)" }}>
              Payment successful!
            </p>
            <small className="ls-text-muted">Enjoy your content 🎉</small>
          </div>
        )}

        {/* ── Choose state ───────────────────────────────────────── */}
        {step === "choose" && (
          <>
            {/* Error alert */}
            {error && (
              <div className="ls-alert ls-alert--error" style={{ marginBottom: "var(--sp-5)" }}>
                <i className="bi bi-exclamation-circle-fill" />
                {error}
              </div>
            )}

            {/* Payment method picker */}
            <div className="ls-payment-methods">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  className={`ls-payment-method${
                    method === m.id ? " ls-payment-method--active" : ""
                  }`}
                  onClick={() => setMethod(m.id)}
                  style={
                    method === m.id
                      ? { borderColor: m.color, color: m.color }
                      : {}
                  }
                >
                  <i
                    className={`bi ${m.icon}`}
                    style={{ color: method === m.id ? m.color : undefined }}
                  />
                  {m.label}
                </button>
              ))}
            </div>

            {/* M-Pesa phone input */}
            {method === "mpesa" && (
              <div className="ls-form-group" style={{ marginBottom: "var(--sp-5)" }}>
                <label className="ls-label ls-label--required">
                  <i className="bi bi-phone-fill" /> M-Pesa Phone Number
                </label>
                <div className="ls-input-wrap">
                  <i className="bi bi-phone-fill ls-input-wrap__icon" />
                  <input
                    type="tel"
                    className="ls-input ls-input--icon-left"
                    placeholder="e.g. 0712 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <p className="ls-form-hint">
                  <i className="bi bi-info-circle" /> You will receive an STK push on this number.
                </p>
              </div>
            )}

            {/* PayPal info */}
            {method === "paypal" && (
              <div
                className="ls-alert ls-alert--info"
                style={{ marginBottom: "var(--sp-5)" }}
              >
                <i className="bi bi-paypal" />
                You will be redirected to PayPal to complete payment securely.
              </div>
            )}

            {/* Card form */}
            {method === "card" && (
              <div className="ls-form" style={{ marginBottom: "var(--sp-5)" }}>
                <div className="ls-form-group">
                  <label className="ls-label ls-label--required">Card Number</label>
                  <div className="ls-input-wrap">
                    <i className="bi bi-credit-card ls-input-wrap__icon" />
                    <input
                      type="text"
                      className="ls-input ls-input--icon-left"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
                  <div className="ls-form-group">
                    <label className="ls-label ls-label--required">Expiry</label>
                    <input
                      type="text"
                      className="ls-input"
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div className="ls-form-group">
                    <label className="ls-label ls-label--required">CVV</label>
                    <input
                      type="password"
                      className="ls-input"
                      placeholder="•••"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pay CTA */}
            <button
              className={`ls-btn ls-btn--primary ls-btn--full ls-btn--lg${
                loading ? " ls-btn--loading" : ""
              }`}
              onClick={handlePay}
              disabled={loading || (method === "mpesa" && !phone)}
            >
              {loading ? null : (
                <>
                  <i className="bi bi-lock-fill" /> Pay KES{" "}
                  {Number(amount).toLocaleString()}
                </>
              )}
            </button>

            {/* Security note */}
            <div
              className="ls-flex-center ls-text-muted ls-text-sm"
              style={{ gap: "var(--sp-2)", marginTop: "var(--sp-4)" }}
            >
              <i className="bi bi-shield-lock-fill" style={{ color: "var(--success-fg)" }} />
              <span>Secured by 256-bit SSL encryption</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}