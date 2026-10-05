import { Star, X, Loader2, Inbox, AlertCircle } from "lucide-react";
import { fileUrl } from "../services/api";

export function Spinner({ text = "Loading..." }) {
  return <div className="center-box"><Loader2 className="spin" /> <span>{text}</span></div>;
}
export function EmptyState({ title = "Nothing here yet", text, action }) {
  return <div className="center-box col"><Inbox size={36} /><h3>{title}</h3>{text && <p className="muted">{text}</p>}{action}</div>;
}
export function ErrorState({ message = "Something went wrong. Please try again.", onRetry }) {
  return <div className="center-box col err"><AlertCircle size={36} /><p>{message}</p>{onRetry && <button className="btn" onClick={onRetry}>Try again</button>}</div>;
}
export function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{status}</span>;
}
export function UserAvatar({ user, size = 40 }) {
  const style = { width: size, height: size, fontSize: size / 2.4 };
  if (user?.profileImage) return <img className="avatar" style={style} src={fileUrl(user.profileImage)} alt={user.name} />;
  return <div className="avatar fallback" style={style}>{(user?.name || "?")[0].toUpperCase()}</div>;
}
export function StarRating({ value = 0, onChange, size = 18 }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= Math.round(value) ? "on" : ""} onClick={onChange ? () => onChange(n) : undefined} style={onChange ? { cursor: "pointer" } : {}} />
      ))}
    </span>
  );
}
export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={20} /></button></div>
        {children}
      </div>
    </div>
  );
}
export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span>Page {page} of {pages}</span>
      <button className="btn sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
}
export function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}
