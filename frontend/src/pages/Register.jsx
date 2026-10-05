import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { errMsg } from "../services/api";
import { Field } from "../components/ui";

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirm) return toast("Passwords do not match", "error");
    setBusy(true);
    try { await register({ name: f.name, email: f.email, phone: f.phone, password: f.password }); toast("Account created!"); navigate("/dashboard"); }
    catch (err) { toast(errMsg(err), "error"); } finally { setBusy(false); }
  };
  return (
    <div className="container narrow">
      <form className="card form" onSubmit={submit}>
        <h2>Create your account</h2>
        <Field label="Full name"><input required value={f.name} onChange={set("name")} /></Field>
        <Field label="Email"><input type="email" required value={f.email} onChange={set("email")} /></Field>
        <Field label="Phone"><input required value={f.phone} onChange={set("phone")} placeholder="10-digit mobile number" /></Field>
        <Field label="Password"><input type="password" required minLength={6} value={f.password} onChange={set("password")} /></Field>
        <Field label="Confirm password"><input type="password" required value={f.confirm} onChange={set("confirm")} /></Field>
        <button className="btn primary" disabled={busy}>{busy ? "Creating..." : "Sign up"}</button>
        <p className="muted small">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
