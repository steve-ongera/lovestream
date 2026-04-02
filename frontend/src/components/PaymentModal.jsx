import React, { useState } from "react";
import { api } from "../services/api";

const METHODS = [
  { id: "mpesa",  label: "M-Pesa",  icon: "bi-phone-fill",        color: "#00A651" },
  { id: "paypal", label: "PayPal",  icon: "bi-paypal",            color: "#003087" },
  { id: "card",   label: "Card",    icon: "bi-credit-card-fill",  color: "#1a1a2e" },
];

export default function PaymentModal({ title, amount, videoId, liveStreamId, onClose, onSuccess }) {
  const [method, setMethod]     = useState("mpesa");
  const [phone, setPhone]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [step, setStep]         = useState("choose"); // choose | confirm | processing | done

  const handlePay = async () => {
    setError("");
    setLoading(true);
    setStep("processing");
    try {
      await api.initiatePayment({
        method,
        amount,
        currency: "KES",
        ...(videoId        && { video_id:        videoId }),
        ...(liveStreamId   && { live_stream_id:  liveStreamId }),
        ...(phone          && { phone_number:    phone }),
      });
      setStep("done");
      setTimeout(() => { onSuccess?.(); }, 1500);
    } catch (err) {
      setError(typeof err === "object" ? JSON.stringify(err) : "Payment failed. Please try again.");
      setStep("choose");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ls-modal-overlay" onClick={onClose}>
      <div className="ls-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="ls-modal__header">
          <div>
            <h3><i className="bi bi-lock-fill" style={{ color: "var(--ls-red)" }} /> Unlock Content</h3>
            <p className="ls-modal__subtitle">{title}</p>
          </div>
          <button className="ls-modal__close" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Amount */}
        <div className="ls-payment-amount">
          <span className="ls-payment-amount__label">Total</span>
          <span className="ls-payment-amount__value">
            KES {Number(amount).toLocaleString()}
          </span>
        </div>

        {step === "processing" && (
          <div className="ls-payment-processing">
            <i className="bi bi-hourglass-split" />
            <p>Processing your payment…</p>
            <small>Please complete the prompt on your {method === "mpesa" ? "phone" : "browser"}.</small>
          </div>
        )}

        {step === "done" && (
          <div className="ls-payment-done">
            <i className="bi bi-check-circle-fill" />
            <p>Payment successful!</p>
            <small>Enjoy your content 🎉</small>
          </div>
        )}

        {step === "choose" && (
          <>
            {error && <div className="ls-alert ls-alert--error" style={{ marginBottom: 16 }}>{error}</div>}

            {/* Method picker */}
            <div className="ls-payment-methods">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  className={`ls-payment-method${method === m.id ? " ls-payment-method--active" : ""}`}
                  onClick={() => setMethod(m.id)}
                  style={method === m.id ? { borderColor: m.color, color: m.color } : {}}
                >
                  <i className={`bi ${m.icon}`} style={{ fontSize: 24, color: method === m.id ? m.color : undefined }} />
                  {m.label}
                </button>
              ))}
            </div>

            {/* Method-specific fields */}
            {method === "mpesa" && (
              <div className="ls-form-group" style={{ marginBottom: 20 }}>
                <label>M-Pesa Phone Number</label>
                <div className="ls-input-icon-wrap">
                  <i className="bi bi-phone-fill" />
                  <input
                    type="tel"
                    className="ls-input ls-input--icon"
                    placeholder="e.g. 0712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <small className="ls-form-hint">
                  <i className="bi bi-info-circle" /> You will receive an STK push on this number.
                </small>
              </div>
            )}

            {method === "paypal" && (
              <div className="ls-payment-info ls-alert" style={{ background: "#f0f4ff", borderColor: "#bed3ff", color: "#003087", marginBottom: 20 }}>
                <i className="bi bi-paypal" /> You will be redirected to PayPal to complete payment securely.
              </div>
            )}

            {method === "card" && (
              <div className="ls-form" style={{ marginBottom: 20 }}>
                <div className="ls-form-group">
                  <label>Card Number</label>
                  <div className="ls-input-icon-wrap">
                    <i className="bi bi-credit-card" />
                    <input type="text" className="ls-input ls-input--icon"
                      placeholder="1234 5678 9012 3456" maxLength={19} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="ls-form-group">
                    <label>Expiry</label>
                    <input type="text" className="ls-input" placeholder="MM/YY" maxLength={5} />
                  </div>
                  <div className="ls-form-group">
                    <label>CVV</label>
                    <input type="password" className="ls-input" placeholder="•••" maxLength={4} />
                  </div>
                </div>
              </div>
            )}

            <button
              className="ls-btn ls-btn--primary ls-btn--full ls-btn--lg"
              onClick={handlePay}
              disabled={loading || (method === "mpesa" && !phone)}
            >
              {loading
                ? <><i className="bi bi-hourglass-split" /> Processing…</>
                : <><i className="bi bi-lock-fill" /> Pay KES {Number(amount).toLocaleString()}</>}
            </button>

            <div className="ls-payment-security">
              <i className="bi bi-shield-lock-fill" />
              <span>Secured by 256-bit SSL encryption</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}