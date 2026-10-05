import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import api, { errMsg } from "../services/api";
import { CATEGORIES, useDebounce } from "../utils/helpers";
import ListingCard from "../components/ListingCard";
import { Spinner, EmptyState, ErrorState, Pagination } from "../components/ui";

const EMPTY = { q: "", category: "", location: "", date: "", minPrice: "", maxPrice: "", seatType: "", available: "", sort: "newest" };

export default function Explore() {
  const [sp] = useSearchParams();
  const [f, setF] = useState({ ...EMPTY, q: sp.get("q") || "", category: sp.get("category") || "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const dq = useDebounce(f);

  const load = () => {
    setLoading(true); setError("");
    const params = { ...dq, page, limit: 9 };
    Object.keys(params).forEach((k) => params[k] === "" && delete params[k]);
    api.get("/listings", { params }).then((r) => setData(r.data.data)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  };
  useEffect(load, [dq, page]);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };

  return (
    <div className="container section">
      <h1>Explore empty seats</h1>
      <div className="search wide"><Search size={18} /><input value={f.q} onChange={set("q")} placeholder="Search by event, location or category…" />
        <button className="btn sm only-mobile" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={16} /> Filters</button></div>
      <div className="explore">
        <aside className={`card filters ${showFilters ? "show" : ""}`}>
          <h3>Filters</h3>
          <label className="field"><span>Category</span><select value={f.category} onChange={set("category")}><option value="">All</option>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
          <label className="field"><span>Location</span><input value={f.location} onChange={set("location")} placeholder="e.g. Chennai" /></label>
          <label className="field"><span>Date</span><input type="date" value={f.date} onChange={set("date")} /></label>
          <div className="two"><label className="field"><span>Min ₹</span><input type="number" min="0" value={f.minPrice} onChange={set("minPrice")} /></label><label className="field"><span>Max ₹</span><input type="number" min="0" value={f.maxPrice} onChange={set("maxPrice")} /></label></div>
          <label className="field"><span>Seat type</span><input value={f.seatType} onChange={set("seatType")} placeholder="e.g. Recliner" /></label>
          <label className="check"><input type="checkbox" checked={f.available === "true"} onChange={(e) => { setF({ ...f, available: e.target.checked ? "true" : "" }); setPage(1); }} /> Only available seats</label>
          <button className="btn" onClick={() => { setF(EMPTY); setPage(1); }}>Clear filters</button>
        </aside>
        <div>
          <div className="between"><span className="muted">{data ? `${data.total} seat${data.total === 1 ? "" : "s"} found` : ""}</span>
            <select value={f.sort} onChange={set("sort")} className="sort"><option value="newest">Newest</option><option value="priceAsc">Lowest price</option><option value="priceDesc">Highest price</option><option value="date">Event date</option></select></div>
          {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : !data.listings.length ? <EmptyState title="No empty seats found." text="Try changing your filters." /> :
            <><div className="grid">{data.listings.map((l) => <ListingCard key={l._id} listing={l} />)}</div><Pagination page={data.page} pages={data.pages} onChange={setPage} /></>}
        </div>
      </div>
    </div>
  );
}
