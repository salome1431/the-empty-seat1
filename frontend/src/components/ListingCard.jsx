import { Link } from "react-router-dom";
import { Calendar, MapPin, Armchair, BadgeCheck } from "lucide-react";
import { catInfo, fmtDate, inr } from "../utils/helpers";
import { fileUrl } from "../services/api";
import { StatusBadge, UserAvatar } from "./ui";

export default function ListingCard({ listing: l }) {
  const cat = catInfo(l.category);
  return (
    <Link to={`/listings/${l._id}`} className="card listing">
      <div className="thumb" style={l.eventImage ? { backgroundImage: `url(${fileUrl(l.eventImage)})` } : { background: `linear-gradient(135deg, ${cat.color}, ${cat.color}99)` }}>
        {!l.eventImage && <span className="thumb-icon">{cat.icon}</span>}
        <span className="tag">{cat.icon} {cat.label}</span>
      </div>
      <div className="listing-body">
        <h3>{l.title}</h3>
        <p className="meta"><Calendar size={14} /> {fmtDate(l.eventDate)}</p>
        <p className="meta"><MapPin size={14} /> {l.venue}, {l.location}</p>
        <p className="meta"><Armchair size={14} /> {l.seatType}{l.seatNumber && l.seatNumber !== "-" ? ` · ${l.seatNumber}` : ""}</p>
        <div className="listing-foot">
          <div><span className="price">{inr(l.price)}</span>{l.originalPrice > l.price && <s className="muted"> {inr(l.originalPrice)}</s>}</div>
          {l.status === "reserved" ? <StatusBadge status="reserved" /> : <span className="muted small">{l.availableSeats} left</span>}
        </div>
        {l.owner && <div className="by"><UserAvatar user={l.owner} size={22} /> {l.owner.name}{l.verificationStatus === "verified" && <BadgeCheck size={15} className="ok" title="Verified" />}</div>}
      </div>
    </Link>
  );
}
