"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  AudioLines,
  ShieldCheck,
  Globe2,
  Sparkles,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { languages } from "@/constants/constants";
import { ErrorNotice, Logo, Spinner, Wave } from "@/components/ui";
import { login, loginDemo, register as registerAccount, message } from "@/lib/api";
function LoginForm() {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  async function tryDemo() {
    if (busy) return;
    setBusy(true);
    setDemoBusy(true);
    setError("");
    try {
      await loginDemo();
      router.replace("/clinic");
      router.refresh();
    } catch (e) {
      setError(message(e));
      setBusy(false);
      setDemoBusy(false);
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const credentials = {
        email: String(form.get("email") || ""),
        password: String(form.get("password") || ""),
      };
      if (register) {
        await registerAccount({
          ...credentials,
          name: String(form.get("name") || ""),
        });
      } else {
        await login(credentials);
      }
      router.replace("/clinic");
      router.refresh();
    } catch (e) {
      setError(message(e));
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>
      <section className="login-story">
        <Logo />
        <div className="login-story-main">
          <div className="pill light">
            <Sparkles size={13} /> Voice operations, connected.
          </div>
          <h1>
            Every conversation.
            <br />
            <span className="login-accent">A clear next step.</span>
          </h1>
          <p>
            Manage voice agents, coordinate meetings, and run customer outreach
            from one workspace.
          </p>
          <div className="login-wave">
            <div className="conversation-label"><span><AudioLines size={15} /> The Audiva experience</span><span className="sample-label">PREVIEW</span></div>
            <Wave />
            <div className="conversation-message">“How can I help you today?”</div>
            <div className="conversation-outcome"><span><Check size={13} /> A helpful answer.</span><span>A clear next step. <ArrowRight size={13} /></span></div>
          </div>
          <div className="login-features">
            <span>
              <Globe2 size={17} /> {languages.length} languages for voice agents
            </span>
            <span>
              <AudioLines size={17} /> Real-time voice
            </span>
          </div>
        </div>
        <small>VOICE AGENTS · MEETINGS · OUTREACH</small>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <span className="eyebrow">WELCOME TO AUDIVA</span>
          <h2>
            {register ? "Create your account" : "Sign in to Audiva"}
          </h2>
          <p>
            {register
              ? "Create an account and your first workspace."
              : "Access your agents, meetings, and campaigns."}
          </p>
          {search.get("expired") && (
            <div className="notice">
              Your session expired. Please sign in again.
            </div>
          )}
          <div className="auth-demo">
            <button
              type="button"
              className="button secondary full"
              disabled={busy}
              onClick={tryDemo}
            >
              {demoBusy ? <Spinner /> : <Sparkles size={17} />}
              {demoBusy ? "Opening Audiva…" : "Explore Audiva"}
              <ArrowRight size={17} />
            </button>
            <p>No signup required.</p>
          </div>
          <form onSubmit={submit}>
            {register && (
              <label className="field">
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  placeholder="Alex Morgan"
                />
              </label>
            )}
            <label className="field">
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={320}
                placeholder="you@company.com"
              />
            </label>
            <div className="field">
              <label htmlFor="password">Password</label>
              <span className="password-control">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={10}
                maxLength={128}
                placeholder={
                  register ? "At least 10 characters" : "Enter your password"
                }
              />
              <button type="button" className="icon-button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              </span>
            </div>
            <ErrorNotice text={error} />
            <button className="button primary full" disabled={busy}>
              {busy && !demoBusy ? <Spinner /> : null}
              {register ? "Create account" : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <div className="auth-switch">
            {register ? "Already have an account?" : "New to Audiva?"}{" "}
            <button
              disabled={busy}
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Sign in" : "Create an account"}
            </button>
          </div>
          <div className="auth-note">
            <ShieldCheck size={16} /> Sign in to access your workspace.
          </div>
        </div>
        <small className="login-footer">
          Audiva · Voice operations for your business
        </small>
      </section>
    </div>
  );
}
export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
