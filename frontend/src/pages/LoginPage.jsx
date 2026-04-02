import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../App";

// ── Login ─────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { login }               = useAuth();
  const navigate                = useNavigate();
  const [form, setForm]         = useState({ username: "", password: "" });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokens = await api.login(form.username, form.password);
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
        <div className="ls-auth__logo">
          <h1>
            <i className="bi bi-heart-fill" style={{ color: "var(--ls-red)" }} />
            LoveStream
          </h1>
          <p>Welcome back — your match is waiting.</p>
        </div>

        {error && <div className="ls-alert ls-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

        <form className="ls-form" onSubmit={handleSubmit}>
          <div className="ls-form-group">
            <label htmlFor="username">Username</label>
            <div className="ls-input-icon-wrap">
              <i className="bi bi-person-fill" />
              <input
                id="username"
                type="text"
                className="ls-input ls-input--icon"
                placeholder="Enter your username"
                value={form.username}
                onChange={set("username")}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="ls-form-group">
            <label htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              value={form.password}
              onChange={set("password")}
              placeholder="Enter your password"
            />
          </div>

          <div className="ls-auth__forgot">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="ls-btn ls-btn--primary ls-btn--full ls-btn--lg"
            disabled={loading}
          >
            {loading
              ? <><i className="bi bi-hourglass-split" /> Signing in…</>
              : <><i className="bi bi-heart-fill" /> Sign In</>}
          </button>
        </form>

        <div className="ls-auth__divider"><span>or</span></div>

        <p className="ls-auth__switch">
          New to LoveStream?{" "}
          <Link to="/register"><strong>Create account</strong></Link>
        </p>
      </div>
    </div>
  );
}

// ── Register ──────────────────────────────────────────────────────────────
export function RegisterPage() {
  const { login }               = useAuth();
  const navigate                = useNavigate();
  const [step, setStep]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const [form, setForm] = useState({
    username: "", email: "", password: "", password2: "",
    gender: "", date_of_birth: "", city: "", country: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setError("Passwords do not match.");
      return;
    }
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
        <div className="ls-auth__logo">
          <h1>
            <i className="bi bi-heart-fill" style={{ color: "var(--ls-red)" }} />
            Join LoveStream
          </h1>
          <p>Create your free account in seconds.</p>
        </div>

        {/* Step indicator */}
        <div className="ls-steps">
          {[1, 2].map((s) => (
            <div key={s} className={`ls-step${step >= s ? " ls-step--done" : ""}`}>
              <span>{s}</span>
              <small>{s === 1 ? "Account" : "Profile"}</small>
            </div>
          ))}
        </div>

        {error && <div className="ls-alert ls-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

        <form className="ls-form" onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit}>
          {step === 1 && (
            <>
              <div className="ls-form-group">
                <label>Username</label>
                <div className="ls-input-icon-wrap">
                  <i className="bi bi-at" />
                  <input type="text" className="ls-input ls-input--icon" placeholder="Choose a username"
                    value={form.username} onChange={set("username")} required minLength={3} />
                </div>
              </div>

              <div className="ls-form-group">
                <label>Email</label>
                <div className="ls-input-icon-wrap">
                  <i className="bi bi-envelope-fill" />
                  <input type="email" className="ls-input ls-input--icon" placeholder="your@email.com"
                    value={form.email} onChange={set("email")} required />
                </div>
              </div>

              <div className="ls-form-group">
                <label>Password</label>
                <PasswordInput value={form.password} onChange={set("password")} placeholder="Min 8 characters" />
              </div>

              <div className="ls-form-group">
                <label>Confirm Password</label>
                <PasswordInput value={form.password2} onChange={set("password2")} placeholder="Repeat password" />
              </div>

              <button type="submit" className="ls-btn ls-btn--primary ls-btn--full ls-btn--lg">
                Next <i className="bi bi-arrow-right" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="ls-form-group">
                <label>I am a…</label>
                <div className="ls-gender-pick">
                  {[{ v: "M", label: "Man", icon: "bi-gender-male" },
                    { v: "F", label: "Woman", icon: "bi-gender-female" },
                    { v: "O", label: "Non-binary", icon: "bi-gender-ambiguous" }].map(({ v, label, icon }) => (
                    <button
                      key={v}
                      type="button"
                      className={`ls-gender-option${form.gender === v ? " ls-gender-option--active" : ""}`}
                      onClick={() => setForm((f) => ({ ...f, gender: v }))}
                    >
                      <i className={`bi ${icon}`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ls-form-group">
                <label>Date of Birth</label>
                <input type="date" className="ls-input"
                  value={form.date_of_birth} onChange={set("date_of_birth")} required
                  max={new Date(Date.now() - 18 * 365.25 * 24 * 3600000).toISOString().split("T")[0]} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ls-form-group">
                  <label>City</label>
                  <input type="text" className="ls-input" placeholder="Nairobi"
                    value={form.city} onChange={set("city")} />
                </div>
                <div className="ls-form-group">
                  <label>Country</label>
                  <input type="text" className="ls-input" placeholder="Kenya"
                    value={form.country} onChange={set("country")} />
                </div>
              </div>

              <div className="ls-auth__step2-actions">
                <button type="button" className="ls-btn ls-btn--ghost" onClick={() => setStep(1)}>
                  <i className="bi bi-arrow-left" /> Back
                </button>
                <button type="submit" className="ls-btn ls-btn--primary ls-btn--lg" disabled={loading}>
                  {loading
                    ? <><i className="bi bi-hourglass-split" /> Creating…</>
                    : <><i className="bi bi-heart-fill" /> Join Now</>}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="ls-auth__switch" style={{ marginTop: 20 }}>
          Already have an account?{" "}
          <Link to="/login"><strong>Sign in</strong></Link>
        </p>

        <p className="ls-auth__terms">
          By joining, you agree to our <Link to="/terms">Terms</Link> &amp; <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

// ── Password input with show/hide ─────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, id }) {
  const [show, setShow] = useState(false);
  return (
    <div className="ls-input-icon-wrap">
      <i className="bi bi-lock-fill" />
      <input
        id={id}
        type={show ? "text" : "password"}
        className="ls-input ls-input--icon ls-input--icon-right"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        minLength={8}
        autoComplete="new-password"
      />
      <button
        type="button"
        className="ls-input-toggle"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
      >
        <i className={`bi bi-eye${show ? "-slash" : ""}-fill`} />
      </button>
    </div>
  );
}

// Default exports for routing
export default LoginPage;