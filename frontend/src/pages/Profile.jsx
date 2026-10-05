import { useEffect, useState } from "react";
import api, { errMsg } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fmtShort } from "../utils/helpers";
import { Spinner, UserAvatar, StarRating, Field } from "../components/ui";

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [p, setP] = useState(null);
  const [f, setF] = useState({ name: "", phone: "", bio: "", location: "" });
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/users/profile").then((r) => { setP(r.data.data); setF({ name: r.data.data.name, phone: r.data.data.phone, bio: r.data.data.bio || "", location: r.data.data.location || "" }); });
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append("profileImage", photo);
      const r = await api.put("/users/profile", fd);
      setUser({ ...user, ...r.data.data }); toast("Profile updated"); setPhoto(null); load();
    } catch (err) { toast(errMsg(err), "error"); } finally { setBusy(false); }
  };

  if (!p) return <Spinner />;
  return (
    <div className="container narrow wide section">
      <div className="card profile-head">
        <UserAvatar user={p} size={84} />
        <div><h2>{p.name}</h2><p className="muted">{p.email} · {p.phone}</p><p className="muted small">Joined {fmtShort(p.createdAt)}</p>
          <StarRating value={p.ratingAverage} /> <span className="muted small">{p.ratingCount ? `${p.ratingAverage} (${p.ratingCount} reviews)` : "No reviews yet"}</span></div>
      </div>
      <div className="stats"><div className="card stat"><span className="muted">Listings</span><b>{p.listingsCount}</b></div><div className="card stat"><span className="muted">Successful joins</span><b>{p.successfulJoins}</b></div></div>
      <form className="card form" onSubmit={save}>
        <h3>Edit profile</h3>
        <Field label="Profile photo"><input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} /></Field>
        <Field label="Name"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Phone"><input required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Location"><input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
        <Field label="Bio"><textarea rows={3} maxLength={300} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field>
        <button className="btn primary" disabled={busy}>{busy ? "Saving..." : "Save profile"}</button>
      </form>
    </div>
  );
}
