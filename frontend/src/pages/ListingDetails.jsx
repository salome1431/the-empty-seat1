import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Calendar, MapPin, Armchair, BadgeCheck, Heart, Flag, ShieldAlert } from "lucide-react";
import api, { errMsg, fileUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { catInfo, fmtDate, inr } from "../utils/helpers";
import { Spinner, ErrorState, StatusBadge, UserAvatar, StarRating, Modal, Field } from "../components/ui";
import ReportModal from "../components/ReportModal";

export default function ListingDetails() {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [l, setL] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/listings/${id}`).then((r) => setL(r.data.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, [id]);

  if (error) return <div className="container section"><ErrorState message={error} onRetry={load} /></div>;
  if (!l) return <Spinner />;

  const cat = catInfo(l.category);
  const isOwner = user && l.owner._id === user._id;
  const saved = user?.savedListings?.includes(l._id);
  const open = ["active", "requested"].includes(l.status) && l.availableSeats > 0 && new Date(l.eventDate) > new Date();

  const requireLogin = () => { if (!user) { navigate("/login", { state: { from: `/listings/${id}` } }); return false; } return true; };
  const sendRequest = async () => {
    setBusy(true);
    try { await api.post("/requests", { listingId: l._id, message }); toast("Your request has been sent."); setModal(""); setMessage(""); load(); }
    catch (e) { toast(errMsg(e), "error"); } finally { setBusy(false); }
  };
  const toggleSave = async () => {
    if (!requireLogin()) return;
    try { const r = await api.post(`/users/saved/${l._id}`); setUser({ ...user, savedListings: r.data.data.savedListings }); toast(r.data.data.saved ? "Listing saved" : "Removed from saved"); }
    catch (e) { toast(errMsg(e), "error"); }
  };

  return (
    <div className="container section details">
      <div>
        <div className="hero-img" style={l.eventImage ? { backgroundImage: `url(${fileUrl(l.eventImage)})` } : { background: `linear-gradient(135deg, ${cat.color}, ${cat.color}88)` }}>
          {!l.eventImage && <span className="thumb-icon big">{cat.icon}</span>}
        </div>
        <div className="between"><span className="tag static">{cat.icon} {cat.label}</span><StatusBadge status={l.status} /></div>
        <h1>{l.title}</h1>
        <p className="meta"><Calendar size={16} /> {fmtDate(l.eventDate)}</p>
        <p className="meta"><MapPin size={16} /> {l.venue}, {l.location}</p>
        <p className="meta"><Armchair size={16} /> {l.seatType}{l.seatNumber && l.seatNumber !== "-" && ` · Seat ${l.seatNumber}`}{l.seatLocation && ` · ${l.seatLocation}`}</p>
        {l.description && <><h3>About this seat</h3><p>{l.description}</p></>}
        {l.meetingPoint && <><h3>Meeting point</h3><p>{l.meetingPoint}</p></>}
        {l.notes && <><h3>Notes</h3><p>{l.notes}</p></>}
        <div className="card safe-tip"><ShieldAlert /><div><b>Safety tips</b><p className="muted">Meet at the venue entrance, never share OTPs or bank passwords, and report anything suspicious.</p></div></div>
      </div>

      <aside className="card side">
        <div className="price big">{inr(l.price)}{l.originalPrice > l.price && <s className="muted"> {inr(l.originalPrice)}</s>}</div>
        <p className="muted">{l.availableSeats} of {l.totalSeats} seat{l.totalSeats > 1 ? "s" : ""} available</p>
        <p className="small">Verification: {l.verificationStatus === "verified" ? <b className="ok"><BadgeCheck size={14} /> Verified</b> : <span className="muted">{l.verificationStatus === "pending" ? "Pending review" : "Not verified"}</span>}</p>
        {isOwner ? <Link to="/dashboard" className="btn primary">Manage in dashboard</Link> :
          open ? <button className="btn primary" onClick={() => requireLogin() && setModal("request")}>Request to Join</button> : <p className="err-text">This seat is no longer available.</p>}
        {isOwner && ["active", "requested", "unavailable"].includes(l.status) && <Link className="btn" to={`/listings/${l._id}/edit`}>Edit listing</Link>}
        <button className="btn" onClick={toggleSave}><Heart size={16} className={saved ? "fill" : ""} /> {saved ? "Saved" : "Save Listing"}</button>
        <hr />
        <Link to={`/users/${l.owner._id}`} className="owner"><UserAvatar user={l.owner} size={46} /><div><b>{l.owner.name}</b><div><StarRating value={l.owner.ratingAverage} size={14} /> <span className="muted small">{l.owner.ratingCount ? `${l.owner.ratingAverage} (${l.owner.ratingCount})` : "No reviews yet"}</span></div></div></Link>
        {!isOwner && <button className="link-btn" onClick={() => requireLogin() && setModal("report")}><Flag size={14} /> Report this listing</button>}
      </aside>

      {modal === "request" && (
        <Modal title={`Request to join: ${l.title}`} onClose={() => setModal("")}>
          <Field label="Message to the owner (optional)"><textarea rows={3} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Say hi and tell them why you'd like to join" /></Field>
          <button className="btn primary" disabled={busy} onClick={sendRequest}>{busy ? "Sending..." : "Send request"}</button>
        </Modal>
      )}
      {modal === "report" && <ReportModal listingId={l._id} userId={l.owner._id} onClose={() => setModal("")} />}
    </div>
  );
}
