import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fmtDate, fmtShort, inr } from "../utils/helpers";
import { Spinner, ErrorState, EmptyState, StatusBadge, UserAvatar, StarRating, Modal, Field } from "../components/ui";
import ListingCard from "../components/ListingCard";

const TABS = ["Overview", "My Listings", "My Requests", "Received", "Bookings", "Saved"];

export default function Dashboard() {
  const { user, refreshUnread } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("Overview");
  const [d, setD] = useState(null);
  const [error, setError] = useState("");
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    try {
      const [a, b, c, e, s] = await Promise.all([api.get("/listings/mine"), api.get("/requests/my"), api.get("/requests/received"), api.get("/requests/bookings"), api.get("/users/saved")]);
      setD({ listings: a.data.data, my: b.data.data, received: c.data.data, bookings: e.data.data, saved: s.data.data });
      setError("");
    } catch (e) { setError(errMsg(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // run an action, show a toast, refresh everything
  const act = async (fn, msg) => { try { await fn(); toast(msg); load(); refreshUnread(); } catch (e) { toast(errMsg(e), "error"); } };
  const put = (url) => api.put(url);
  const setStatus = (id, status) => act(() => api.put(`/listings/${id}/status`, { status }), `Listing marked ${status}`);
  const submitReview = async () => {
    await act(() => api.post("/reviews", { requestId: review._id, rating, comment }), "Review submitted");
    setReview(null); setComment(""); setRating(5);
  };

  if (error) return <div className="container section"><ErrorState message={error} onRetry={load} /></div>;
  if (!d) return <Spinner />;

  const stats = [
    ["My Listings", d.listings.length],
    ["Pending Requests", d.received.filter((r) => r.status === "pending").length],
    ["Accepted Requests", d.my.filter((r) => r.status === "accepted").length],
    ["Available Seats", d.listings.filter((l) => ["active", "requested"].includes(l.status)).reduce((s, l) => s + l.availableSeats, 0)],
    ["Completed Joins", d.bookings.filter((b) => b.status === "completed").length],
  ];
  const pending = d.received.filter((r) => r.status === "pending");

  const RequestRow = ({ r, mine }) => {
    const other = mine ? r.owner : r.requester;
    return (
      <div className="card row-card">
        <UserAvatar user={other} />
        <div className="grow">
          <b>{r.listing?.title}</b> <StatusBadge status={r.status} />
          <p className="muted small">{mine ? "Owner" : "Requested by"}: {other?.name}{r.message && ` · “${r.message}”`}</p>
          {["accepted", "completed"].includes(r.status) && other?.phone && <p className="small ok">📞 {other.phone} · ✉️ {other.email}</p>}
          <p className="muted small">{r.listing && fmtDate(r.listing.eventDate)}</p>
        </div>
        <div className="actions">
          {!mine && r.status === "pending" && <><button className="btn primary sm" onClick={() => act(() => put(`/requests/${r._id}/accept`), "Request accepted")}>Accept</button><button className="btn danger sm" onClick={() => act(() => put(`/requests/${r._id}/reject`), "Request rejected")}>Reject</button></>}
          {mine && ["pending", "accepted"].includes(r.status) && <button className="btn danger sm" onClick={() => act(() => put(`/requests/${r._id}/cancel`), "Request cancelled")}>Cancel</button>}
        </div>
      </div>
    );
  };

  return (
    <div className="container section">
      <h1>Hello, {user.name.split(" ")[0]} 👋</h1>
      <div className="tabs">{TABS.map((t) => <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}{t === "Received" && pending.length > 0 && <b className="dot">{pending.length}</b>}</button>)}</div>

      {tab === "Overview" && (
        <>
          <div className="stats">{stats.map(([k, v]) => <div className="card stat" key={k}><span className="muted">{k}</span><b>{v}</b></div>)}</div>
          <h3>Requests waiting for your reply</h3>
          {pending.length ? pending.map((r) => <RequestRow key={r._id} r={r} />) : <EmptyState title="No pending requests" text="New requests for your seats will appear here." />}
        </>
      )}

      {tab === "My Listings" && (d.listings.length ? d.listings.map((l) => (
        <div className="card row-card" key={l._id}>
          <div className="grow"><Link to={`/listings/${l._id}`}><b>{l.title}</b></Link> <StatusBadge status={l.status} />
            <p className="muted small">{fmtDate(l.eventDate)} · {inr(l.price)} · {l.availableSeats}/{l.totalSeats} seats left · Proof: {l.verificationStatus}</p></div>
          <div className="actions">
            {["active", "requested", "unavailable"].includes(l.status) && <Link className="btn sm" to={`/listings/${l._id}/edit`}>Edit</Link>}
            {["active", "requested"].includes(l.status) && <button className="btn sm" onClick={() => setStatus(l._id, "unavailable")}>Mark unavailable</button>}
            {l.status === "unavailable" && <button className="btn sm" onClick={() => setStatus(l._id, "active")}>Re-open</button>}
            {l.availableSeats < l.totalSeats && !["completed", "cancelled"].includes(l.status) && <button className="btn primary sm" onClick={() => setStatus(l._id, "completed")}>Mark completed</button>}
            {!["completed", "cancelled"].includes(l.status) && <button className="btn danger sm" onClick={() => window.confirm("Cancel this listing? All requests will be cancelled.") && setStatus(l._id, "cancelled")}>Cancel</button>}
            {["active", "requested", "unavailable", "cancelled"].includes(l.status) && <button className="btn sm" onClick={() => window.confirm("Delete permanently?") && act(() => api.delete(`/listings/${l._id}`), "Listing deleted")}>Delete</button>}
          </div>
        </div>
      )) : <EmptyState title="You haven't posted any seats" action={<Link to="/post" className="btn primary">Post a seat</Link>} />)}

      {tab === "My Requests" && (d.my.length ? d.my.map((r) => <RequestRow key={r._id} r={r} mine />) : <EmptyState title="No requests sent" text="Find a seat you like and send a request." action={<Link to="/explore" className="btn primary">Explore</Link>} />)}

      {tab === "Received" && (d.received.length ? d.received.map((r) => <RequestRow key={r._id} r={r} />) : <EmptyState title="No requests received yet" />)}

      {tab === "Bookings" && (d.bookings.length ? d.bookings.map((b) => {
        const other = b.requester._id === user._id ? b.owner : b.requester;
        return (
          <div className="card row-card" key={b._id}>
            <UserAvatar user={other} />
            <div className="grow"><b>{b.listing?.title}</b> <StatusBadge status={b.status} />
              <p className="muted small">{b.listing && fmtShort(b.listing.eventDate)} · With {other.name} · 📞 {other.phone} · ✉️ {other.email}</p></div>
            <div className="actions">{b.status === "completed" && (b.hasReviewed ? <span className="muted small">Reviewed ✓</span> : <button className="btn primary sm" onClick={() => setReview(b)}>Leave a review</button>)}</div>
          </div>
        );
      }) : <EmptyState title="No bookings yet" text="Accepted requests show up here." />)}

      {tab === "Saved" && (d.saved.length ? <div className="grid">{d.saved.map((l) => <ListingCard key={l._id} listing={l} />)}</div> : <EmptyState title="No saved listings" />)}

      {review && (
        <Modal title="Leave a review" onClose={() => setReview(null)}>
          <Field label="Rating"><StarRating value={rating} onChange={setRating} size={28} /></Field>
          <Field label="Comment"><textarea rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
          <button className="btn primary" onClick={submitReview}>Submit review</button>
        </Modal>
      )}
    </div>
  );
}
