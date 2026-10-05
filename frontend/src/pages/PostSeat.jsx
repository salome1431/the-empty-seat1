import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { errMsg } from "../services/api";
import { useToast } from "../context/ToastContext";
import { CATEGORIES, toLocalInput } from "../utils/helpers";
import { Field, Spinner } from "../components/ui";

const INIT = { category: "movie", title: "", description: "", eventDate: "", venue: "", location: "", seatType: "", seatNumber: "", totalSeats: 1, originalPrice: "", price: "", seatLocation: "", meetingPoint: "", notes: "", contactPreference: "in-app" };

// Used for both "Post a seat" and "Edit listing"
export default function PostSeat() {
  const { id } = useParams();
  const editing = !!id;
  const toast = useToast();
  const navigate = useNavigate();
  const [f, setF] = useState(INIT);
  const [image, setImage] = useState(null);
  const [proof, setProof] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    api.get(`/listings/${id}`).then((r) => {
      const l = r.data.data;
      setF(Object.fromEntries(Object.keys(INIT).map((k) => [k, k === "eventDate" ? toLocalInput(l.eventDate) : l[k] ?? ""])));
    }).catch((e) => toast(errMsg(e), "error")).finally(() => setLoading(false));
  }, [id]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, k === "eventDate" ? new Date(v).toISOString() : v));
      if (image) fd.append("eventImage", image);
      if (proof) fd.append("ticketProof", proof);
      const r = editing ? await api.put(`/listings/${id}`, fd) : await api.post("/listings", fd);
      toast(editing ? "Listing updated" : "Your seat is now live!");
      navigate(`/listings/${r.data.data._id}`);
    } catch (err) { toast(errMsg(err), "error"); } finally { setBusy(false); }
  };

  if (loading) return <Spinner />;
  return (
    <div className="container narrow wide">
      <form className="card form" onSubmit={submit}>
        <h2>{editing ? "Edit your listing" : "Post an empty seat"}</h2>
        <h4>Basic information</h4>
        <Field label="Category"><select value={f.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}</select></Field>
        <Field label="Event / trip name"><input required value={f.title} onChange={set("title")} placeholder="e.g. Avengers: Secret Wars" /></Field>
        <Field label="Description"><textarea rows={3} maxLength={1000} value={f.description} onChange={set("description")} /></Field>
        <div className="two">
          <Field label="Date & time"><input type="datetime-local" required value={f.eventDate} onChange={set("eventDate")} /></Field>
          <Field label="City / location"><input required value={f.location} onChange={set("location")} placeholder="Chennai" /></Field>
        </div>
        <Field label="Venue"><input required value={f.venue} onChange={set("venue")} placeholder="PVR Grand Galada" /></Field>
        <h4>Seat information</h4>
        <div className="two">
          <Field label="Seat type"><input value={f.seatType} onChange={set("seatType")} placeholder="Recliner / Gold / Lower berth" /></Field>
          <Field label="Seat number"><input value={f.seatNumber} onChange={set("seatNumber")} placeholder="C12" /></Field>
        </div>
        <div className="two">
          <Field label="Available seats"><input type="number" min="1" max="10" disabled={editing} value={f.totalSeats} onChange={set("totalSeats")} /></Field>
          <Field label="Seat location (optional)"><input value={f.seatLocation} onChange={set("seatLocation")} placeholder="Middle row, near aisle" /></Field>
        </div>
        <div className="two">
          <Field label="Original ticket price (₹)"><input type="number" min="0" value={f.originalPrice} onChange={set("originalPrice")} /></Field>
          <Field label="Requested price (₹)"><input type="number" min="0" required value={f.price} onChange={set("price")} /></Field>
        </div>
        <h4>Additional information</h4>
        <Field label="Meeting point"><input value={f.meetingPoint} onChange={set("meetingPoint")} placeholder="Main entrance, 30 min before" /></Field>
        <Field label="Notes"><textarea rows={2} maxLength={500} value={f.notes} onChange={set("notes")} /></Field>
        <Field label="Contact preference"><select value={f.contactPreference} onChange={set("contactPreference")}><option value="in-app">In-app</option><option value="phone">Phone</option><option value="email">Email</option></select></Field>
        <Field label="Event image (optional, JPG/PNG/WEBP, max 3MB)"><input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} /></Field>
        <Field label="Ticket proof (private; only you and admins can see it)"><input type="file" accept="image/*" onChange={(e) => setProof(e.target.files[0])} /></Field>
        <button className="btn primary" disabled={busy}>{busy ? "Saving..." : editing ? "Save changes" : "Post seat"}</button>
      </form>
    </div>
  );
}
