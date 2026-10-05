import { useCallback, useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import api, { errMsg } from "../services/api";
import { useToast } from "../context/ToastContext";
import { fmtShort } from "../utils/helpers";
import { Spinner, ErrorState, StatusBadge, EmptyState } from "../components/ui";

const TABS = ["Overview", "Users", "Listings", "Requests", "Reports"];
const COLORS = ["#6d4aff", "#ff7a59", "#16a34a", "#0891b2", "#e11d74", "#ea580c", "#9333ea", "#475569"];

function useAdminData(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(() => api.get(path).then((r) => { setData(r.data.data); setError(""); }).catch((e) => setError(errMsg(e))), [path]);
  useEffect(() => { load(); }, [load]);
  return { data, error, load };
}
const Table = ({ head, children }) => <div className="table-wrap"><table><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;

function Overview() {
  const { data, error, load } = useAdminData("/admin/stats");
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner />;
  const cards = [["Total Users", data.totalUsers], ["Total Listings", data.totalListings], ["Active Listings", data.activeListings], ["Total Requests", data.totalRequests], ["Successful Joins", data.successfulJoins], ["Completed Listings", data.completedListings], ["Open Reports", data.openReports], ["Suspended Users", data.suspendedUsers]];
  return (
    <>
      <div className="stats">{cards.map(([k, v]) => <div className="card stat" key={k}><span className="muted">{k}</span><b>{v}</b></div>)}</div>
      <div className="charts">
        <div className="card"><h4>Listings by category</h4><ResponsiveContainer width="100%" height={240}><BarChart data={data.byCategory}><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#6d4aff" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <div className="card"><h4>Requests by status</h4><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={data.byStatus} dataKey="value" nameKey="name" outerRadius={80} label>{data.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Legend /><Tooltip /></PieChart></ResponsiveContainer></div>
      </div>
    </>
  );
}

function Users() {
  const toast = useToast();
  const { data, error, load } = useAdminData("/admin/users");
  const act = async (fn, msg) => { try { await fn(); toast(msg); load(); } catch (e) { toast(errMsg(e), "error"); } };
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner />;
  return (
    <Table head={["Name", "Email", "Phone", "Role", "Rating", "Joined", "Status", "Action"]}>
      {data.map((u) => (
        <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.phone}</td><td>{u.role}</td><td>{u.ratingAverage || "-"}</td><td>{fmtShort(u.createdAt)}</td>
          <td>{u.isSuspended ? <StatusBadge status="cancelled" /> : <StatusBadge status="active" />}</td>
          <td>{u.role !== "admin" && (u.isSuspended ? <button className="btn sm" onClick={() => act(() => api.put(`/admin/users/${u._id}/unsuspend`), "User unsuspended")}>Unsuspend</button>
            : <button className="btn danger sm" onClick={() => { const reason = window.prompt("Reason for suspension?"); if (reason !== null) act(() => api.put(`/admin/users/${u._id}/suspend`, { reason }), "User suspended"); }}>Suspend</button>)}</td></tr>
      ))}
    </Table>
  );
}

function Listings() {
  const toast = useToast();
  const { data, error, load } = useAdminData("/admin/listings");
  const act = async (fn, msg) => { try { await fn(); toast(msg); load(); } catch (e) { toast(errMsg(e), "error"); } };
  const proof = async (id) => {
    try { const r = await api.get(`/listings/${id}/proof`, { responseType: "blob" }); window.open(URL.createObjectURL(r.data), "_blank"); }
    catch { toast("No proof uploaded for this listing", "error"); }
  };
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner />;
  return (
    <Table head={["Title", "Owner", "Category", "Price", "Status", "Proof", "Actions"]}>
      {data.map((l) => (
        <tr key={l._id}><td>{l.title}</td><td>{l.owner?.name}</td><td>{l.category}</td><td>₹{l.price}</td><td><StatusBadge status={l.status} /></td><td>{l.verificationStatus}</td>
          <td className="actions">
            {l.verificationStatus === "pending" && <><button className="btn sm" onClick={() => proof(l._id)}>View proof</button><button className="btn primary sm" onClick={() => act(() => api.put(`/admin/listings/${l._id}/verify`, { status: "verified" }), "Marked verified")}>Verify</button><button className="btn sm" onClick={() => act(() => api.put(`/admin/listings/${l._id}/verify`, { status: "rejected" }), "Proof rejected")}>Reject</button></>}
            {l.status !== "removed" && <button className="btn danger sm" onClick={() => window.confirm("Remove this listing?") && act(() => api.delete(`/admin/listings/${l._id}`), "Listing removed")}>Remove</button>}
          </td></tr>
      ))}
    </Table>
  );
}

function Requests() {
  const { data, error, load } = useAdminData("/admin/requests");
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner />;
  return (
    <Table head={["Listing", "Requester", "Owner", "Status", "Date"]}>
      {data.map((r) => <tr key={r._id}><td>{r.listing?.title}</td><td>{r.requester?.name}</td><td>{r.owner?.name}</td><td><StatusBadge status={r.status} /></td><td>{fmtShort(r.createdAt)}</td></tr>)}
    </Table>
  );
}

function Reports() {
  const toast = useToast();
  const { data, error, load } = useAdminData("/admin/reports");
  const act = async (fn, msg) => { try { await fn(); toast(msg); load(); } catch (e) { toast(errMsg(e), "error"); } };
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Spinner />;
  if (!data.length) return <EmptyState title="No reports" />;
  return (
    <Table head={["Reason", "Reporter", "Reported user", "Reported listing", "Details", "Status", "Actions"]}>
      {data.map((r) => (
        <tr key={r._id}><td>{r.reason.replace("_", " ")}</td><td>{r.reporter?.name}</td><td>{r.reportedUser?.name || "-"}{r.reportedUser?.isSuspended && " (suspended)"}</td><td>{r.reportedListing?.title || "-"}</td><td>{r.description}</td><td><StatusBadge status={r.status} /></td>
          <td className="actions">
            {r.status === "open" && <>
              <button className="btn primary sm" onClick={() => act(() => api.put(`/admin/reports/${r._id}`, { status: "resolved" }), "Report resolved")}>Resolve</button>
              <button className="btn sm" onClick={() => act(() => api.put(`/admin/reports/${r._id}`, { status: "dismissed" }), "Report dismissed")}>Dismiss</button></>}
            {r.reportedListing && r.reportedListing.status !== "removed" && <button className="btn danger sm" onClick={() => act(() => api.delete(`/admin/listings/${r.reportedListing._id}`), "Listing removed")}>Remove listing</button>}
            {r.reportedUser && !r.reportedUser.isSuspended && <button className="btn danger sm" onClick={() => act(() => api.put(`/admin/users/${r.reportedUser._id}/suspend`, { reason: `Report: ${r.reason}` }), "User suspended")}>Suspend user</button>}
          </td></tr>
      ))}
    </Table>
  );
}

export default function Admin() {
  const [tab, setTab] = useState("Overview");
  const View = { Overview, Users, Listings, Requests, Reports }[tab];
  return (
    <div className="container section">
      <h1>Admin dashboard</h1>
      <div className="tabs">{TABS.map((t) => <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}</div>
      <View />
    </div>
  );
}
