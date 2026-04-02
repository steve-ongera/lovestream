import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../App";

// ── Login ─────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { login }             = useAuth();
  const navigate              = useNavigate();
  const [form, setForm]       = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokens  = await api.login(form.username, form.password);
      const profile = await api.getProfile();
      login(tokens.access, tokens.refresh, profile);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        typeof err === "object" && err?.detail
          ? err.detail
          : "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ls-auth">
      <div className="ls-auth__box">

        {/* Logo mark */}
        <div className="ls-auth__logo">
          <div className="ls-auth__logo-mark">
            <i className="bi bi-heart-fill ls-logo-heart" />
            Love<strong>Stream</strong>
          </div>
          <p>Welcome back — your match is waiting.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="ls-alert ls-alert--error" style={{ marginBottom: "var(--sp-5)" }}>
            <i className="bi bi-exclamation-circle-fill" />
            {error}
          </div>
        )}

        {/* Form */}
        <form className="ls-form" onSubmit={handleSubmit}>
          <div className="ls-form-group">
            <label className="ls-label ls-label--required" htmlFor="username">
              Username
            </label>
            <div className="ls-input-wrap">
              <i className="bi bi-person-fill ls-input-wrap__icon" />
              <input
                id="username"
                type="text"
                className="ls-input ls-input--icon-left"
                placeholder="Enter your username"
                value={form.username}
                onChange={set("username")}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="ls-form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="ls-label ls-label--required" htmlFor="login-password">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="ls-text-sm"
                style={{ color: "var(--red-500)", fontWeight: "var(--weight-medium)" }}
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              value={form.password}
              onChange={set("password")}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={`ls-btn ls-btn--primary ls-btn--full ls-btn--lg${loading ? " ls-btn--loading" : ""}`}
            disabled={loading}
          >
            {!loading && <><i className="bi bi-heart-fill" /> Sign In</>}
          </button>
        </form>

        {/* Divider */}
        <div className="ls-auth__divider"><span>or continue with</span></div>

        {/* Social */}
        <div className="ls-social-login">
          <button className="ls-social-btn">
            <i className="bi bi-google" style={{ color: "#EA4335" }} />
            Google
          </button>
          <button className="ls-social-btn">
            <i className="bi bi-facebook" style={{ color: "#1877F2" }} />
            Facebook
          </button>
        </div>

        {/* Footer */}
        <div className="ls-auth__footer">
          New to LoveStream?{" "}
          <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
}

// ── Register ──────────────────────────────────────────────────────────────
export function RegisterPage() {
  const { login }             = useAuth();
  const navigate              = useNavigate();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [form, setForm] = useState({
    username: "", email: "", password: "", password2: "",
    gender: "", date_of_birth: "", city: "", country: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleNext = (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.register(form);
      const tokens  = await api.login(form.username, form.password);
      const profile = await api.getProfile();
      login(tokens.access, tokens.refresh, profile);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = typeof err === "object"
        ? Object.values(err).flat().join(" ")
        : "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ls-auth">
      <div className="ls-auth__box">

        {/* Logo mark */}
        <div className="ls-auth__logo">
          <div className="ls-auth__logo-mark">
            <i className="bi bi-heart-fill ls-logo-heart" />
            Love<strong>Stream</strong>
          </div>
          <p>Create your free account in seconds.</p>
        </div>

        {/* Step progress */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
          marginBottom: "var(--sp-6)",
        }}>
          {[
            { n: 1, label: "Account" },
            { n: 2, label: "Profile" },
          ].map(({ n, label }, idx) => (
            <React.Fragment key={n}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flex: 1 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--weight-bold)",
                  flexShrink: 0,
                  background: step >= n ? "var(--red-500)" : "var(--stone-100)",
                  color: step >= n ? "var(--white)" : "var(--stone-400)",
                  transition: "background var(--dur-base), color var(--dur-base)",
                }}>
                  {step > n ? <i className="bi bi-check" /> : n}
                </div>
                <span style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-medium)",
                  color: step >= n ? "var(--stone-700)" : "var(--stone-400)",
                  transition: "color var(--dur-base)",
                }}>
                  {label}
                </span>
              </div>
              {idx === 0 && (
                <div style={{
                  flex: 2,
                  height: 2,
                  borderRadius: "var(--r-full)",
                  background: step >= 2 ? "var(--red-400)" : "var(--stone-200)",
                  transition: "background var(--dur-slow)",
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="ls-alert ls-alert--error" style={{ marginBottom: "var(--sp-5)" }}>
            <i className="bi bi-exclamation-circle-fill" />
            {error}
          </div>
        )}

        {/* ── Step 1: Account ── */}
        {step === 1 && (
          <form className="ls-form" onSubmit={handleNext}>
            <div className="ls-form-group">
              <label className="ls-label ls-label--required">Username</label>
              <div className="ls-input-wrap">
                <i className="bi bi-at ls-input-wrap__icon" />
                <input
                  type="text"
                  className="ls-input ls-input--icon-left"
                  placeholder="Choose a username"
                  value={form.username}
                  onChange={set("username")}
                  required
                  minLength={3}
                  autoComplete="username"
                />
              </div>
              <span className="ls-form-hint">At least 3 characters, no spaces.</span>
            </div>

            <div className="ls-form-group">
              <label className="ls-label ls-label--required">Email</label>
              <div className="ls-input-wrap">
                <i className="bi bi-envelope-fill ls-input-wrap__icon" />
                <input
                  type="email"
                  className="ls-input ls-input--icon-left"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={set("email")}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="ls-form-group">
              <label className="ls-label ls-label--required">Password</label>
              <PasswordInput
                value={form.password}
                onChange={set("password")}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div className="ls-form-group">
              <label className="ls-label ls-label--required">Confirm Password</label>
              <PasswordInput
                value={form.password2}
                onChange={set("password2")}
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="ls-btn ls-btn--primary ls-btn--full ls-btn--lg"
            >
              Continue <i className="bi bi-arrow-right" />
            </button>
          </form>
        )}

        {/* ── Step 2: Profile ── */}
        {step === 2 && (
          <form className="ls-form" onSubmit={handleSubmit}>
            <div className="ls-form-group">
              <label className="ls-label">I am a…</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--sp-2)" }}>
                {[
                  { v: "M", label: "Man",        icon: "bi-gender-male" },
                  { v: "F", label: "Woman",      icon: "bi-gender-female" },
                  { v: "O", label: "Non-binary", icon: "bi-gender-ambiguous" },
                ].map(({ v, label, icon }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, gender: v }))}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "var(--sp-1)",
                      padding: "var(--sp-4) var(--sp-2)",
                      borderRadius: "var(--r-lg)",
                      border: `2px solid ${form.gender === v ? "var(--red-500)" : "var(--stone-200)"}`,
                      background: form.gender === v ? "var(--red-50)" : "var(--white)",
                      color: form.gender === v ? "var(--red-600)" : "var(--stone-500)",
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--weight-semi)",
                      cursor: "pointer",
                      transition: "all var(--dur-base)",
                    }}
                  >
                    <i className={`bi ${icon}`} style={{ fontSize: 22 }} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ls-form-group">
              <label className="ls-label ls-label--required">Date of Birth</label>
              <div className="ls-input-wrap">
                <i className="bi bi-calendar-heart ls-input-wrap__icon" />
                <input
                  type="date"
                  className="ls-input ls-input--icon-left"
                  value={form.date_of_birth}
                  onChange={set("date_of_birth")}
                  required
                  max={new Date(Date.now() - 18 * 365.25 * 24 * 3600000).toISOString().split("T")[0]}
                />
              </div>
              <span className="ls-form-hint">You must be 18 or older.</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div className="ls-form-group">
                <label className="ls-label">City</label>
                <div className="ls-input-wrap">
                  <i className="bi bi-geo-alt-fill ls-input-wrap__icon" />
                  <input
                    type="text"
                    className="ls-input ls-input--icon-left"
                    placeholder="Nairobi"
                    value={form.city}
                    onChange={set("city")}
                  />
                </div>
              </div>
              <div className="ls-form-group">
                <label className="ls-label">Country</label>
                <div className="ls-input-wrap">
                  <i className="bi bi-flag-fill ls-input-wrap__icon" />
                  <input
                    type="text"
                    className="ls-input ls-input--icon-left"
                    placeholder="Kenya"
                    value={form.country}
                    onChange={set("country")}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-2)" }}>
              <button
                type="button"
                className="ls-btn ls-btn--outline"
                onClick={() => setStep(1)}
              >
                <i className="bi bi-arrow-left" /> Back
              </button>
              <button
                type="submit"
                className={`ls-btn ls-btn--primary ls-btn--lg${loading ? " ls-btn--loading" : ""}`}
                style={{ flex: 1 }}
                disabled={loading}
              >
                {!loading && <><i className="bi bi-heart-fill" /> Join Now</>}
              </button>
            </div>
          </form>
        )}

        {/* Switch link */}
        <div className="ls-auth__footer" style={{ marginTop: "var(--sp-5)" }}>
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </div>

        {/* Terms */}
        <p style={{
          textAlign: "center",
          marginTop: "var(--sp-3)",
          fontSize: "var(--text-xs)",
          color: "var(--stone-400)",
          lineHeight: "var(--leading-loose)",
        }}>
          By joining you agree to our{" "}
          <Link to="/terms" style={{ color: "var(--red-400)" }}>Terms</Link>
          {" "}&amp;{" "}
          <Link to="/privacy" style={{ color: "var(--red-400)" }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

// ── Reusable password input ────────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, id, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="ls-input-wrap">
      <i className="bi bi-lock-fill ls-input-wrap__icon" />
      <input
        id={id}
        type={show ? "text" : "password"}
        className="ls-input ls-input--icon-left ls-input--icon-right"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        minLength={8}
        autoComplete={autoComplete || "new-password"}
      />
      <button
        type="button"
        className="ls-input-wrap__icon ls-input-wrap__icon--right"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        style={{
          pointerEvents: "all",
          cursor: "pointer",
          background: "none",
          border: "none",
          color: "var(--stone-400)",
          padding: 0,
          display: "flex",
          alignItems: "center",
        }}
        title={show ? "Hide password" : "Show password"}
      >
        <i className={`bi bi-eye${show ? "-slash" : ""}-fill`} />
      </button>
    </div>
  );
}

export default LoginPage;