import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import api, { errMsg } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../utils/helpers";
import { Spinner, ErrorState, EmptyState } from "../components/ui";

export default function Notifications() {
  const { refreshUnread } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.get("/notifications").then((r) => { setItems(r.data.data.notifications); refreshUnread(); }).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  const open = async (n) => {
    if (!n.isRead) { await api.put(`/notifications/${n._id}/read`).catch(() => {}); refreshUnread(); }
    if (n.relatedListing) navigate(`/listings/${n.relatedListing}`); else load();
  };
  const readAll = async () => { await api.put("/notifications/read-all"); load(); };

  if (error) return <div className="container section"><ErrorState message={error} onRetry={load} /></div>;
  if (!items) return <Spinner />;
  return (
    <div className="container narrow wide section">
      <div className="between"><h1>Notifications</h1>{items.some((n) => !n.isRead) && <button className="btn sm" onClick={readAll}>Mark all as read</button>}</div>
      {!items.length ? <EmptyState title="You're all caught up" text="Notifications about your requests and listings will show here." /> :
        items.map((n) => (
          <div key={n._id} className={`card notif ${n.isRead ? "" : "unread"}`} onClick={() => open(n)}>
            <Bell size={18} /><div className="grow"><p>{n.message}</p><span className="muted small">{timeAgo(n.createdAt)}</span></div>{!n.isRead && <b className="dot">new</b>}
          </div>
        ))}
    </div>
  );
}
