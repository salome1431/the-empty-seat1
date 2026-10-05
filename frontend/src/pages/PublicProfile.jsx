import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Flag } from "lucide-react";
import api, { errMsg } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { fmtShort } from "../utils/helpers";
import { Spinner, ErrorState, UserAvatar, StarRating, EmptyState } from "../components/ui";
import ListingCard from "../components/ListingCard";
import ReportModal from "../components/ReportModal";

export default function PublicProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [error, setError] = useState("");
  const [report, setReport] = useState(false);
  useEffect(() => { api.get(`/users/${id}`).then((r) => setD(r.data.data)).catch((e) => setError(errMsg(e))); }, [id]);

  if (error) return <div className="container section"><ErrorState message={error} /></div>;
  if (!d) return <Spinner />;
  const u = d.user;
  return (
    <div className="container section">
      <div className="card profile-head">
        <UserAvatar user={u} size={84} />
        <div className="grow"><h2>{u.name}</h2><p className="muted">{u.location || "Location not set"} · Joined {fmtShort(u.createdAt)}</p>{u.bio && <p>{u.bio}</p>}
          <StarRating value={u.ratingAverage} /> <span className="muted small">{u.ratingCount ? `${u.ratingAverage} (${u.ratingCount})` : "No reviews yet"}</span>
          <p className="small muted">{d.listingsCount} listings · {d.successfulJoins} successful joins</p></div>
        {user && user._id !== u._id && <button className="link-btn" onClick={() => setReport(true)}><Flag size={14} /> Report</button>}
      </div>
      <h3>Active listings</h3>
      {d.listings.length ? <div className="grid">{d.listings.map((l) => <ListingCard key={l._id} listing={{ ...l, owner: u }} />)}</div> : <EmptyState title="No active listings" />}
      <h3>Reviews</h3>
      {d.reviews.length ? d.reviews.map((r) => <div className="card row-card" key={r._id}><UserAvatar user={r.reviewer} /><div><b>{r.reviewer.name}</b> <StarRating value={r.rating} size={14} /><p>{r.comment}</p></div></div>) : <EmptyState title="No reviews yet" />}
      {report && <ReportModal userId={u._id} onClose={() => setReport(false)} />}
    </div>
  );
}
