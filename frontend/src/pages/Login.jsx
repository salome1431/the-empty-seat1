import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { errMsg } from "../services/api";
import { Field } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const from = useLocation().state?.from || "/dashboard";
  const [f, setF] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await login(f.email, f.password); toast("Welcome back!"); navigate(from, { replace: true }); }
    catch (err) { toast(errMsg(err), "error"); } finally { setBusy(false); }
  };
  return (
    <div className="container narrow">
      <form className="card form" onSubmit={submit}>
        <h2>Log in</h2>
        <Field label="Email"><input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password"><input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <button className="btn primary" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
        <p className="muted small">New here? <Link to="/register">Create an account</Link></p>
        <p className="muted small">Demo: alex@example.com / User@123 · admin@emptyseat.com / Admin@123</p>
      </form>
    </div>
  );
}
