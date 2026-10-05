import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShieldCheck, FilePlus2, Send, PartyPopper, Eye, BadgeCheck, MapPinned, Flag } from "lucide-react";
import api from "../services/api";
import { CATEGORIES } from "../utils/helpers";
import ListingCard from "../components/ListingCard";
import { Spinner } from "../components/ui";

const STEPS = [
  [FilePlus2, "Post your spare seat", "Add the event, seat details and your price."],
  [Eye, "Others discover it", "People search and filter by city, date and category."],
  [Send, "Requests come in", "Interested users send you a request with a note."],
  [PartyPopper, "Accept & go together", "Pick someone, meet up and enjoy. Then rate each other."],
];
const SAFETY = [[BadgeCheck, "Verified tickets", "Owners can upload proof that admins verify."], [MapPinned, "Meet in public", "Use the venue entrance or station as the meeting point."], [ShieldCheck, "Private contacts", "Phone and email are shown only after acceptance."], [Flag, "Report anything odd", "One tap report on every listing and profile."]];

export default function Home() {
  const [q, setQ] = useState("");
  const [featured, setFeatured] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { api.get("/listings", { params: { limit: 6, sort: "newest" } }).then((r) => setFeatured(r.data.data.listings)).catch(() => setFeatured([])); }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="pill">💺 Spare ticket? Share the experience</span>
          <h1>The Empty Seat</h1>
          <p className="tagline">Don't let a seat go empty. Find someone to join you.</p>
          <form className="search" onSubmit={(e) => { e.preventDefault(); navigate(`/explore?q=${encodeURIComponent(q)}`); }}>
            <Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search movie, event, city or category…" /><button className="btn primary">Search</button>
          </form>
          <div className="row center">
            <Link to="/explore" className="btn primary">Browse Seats</Link>
            <Link to="/post" className="btn">Post an Empty Seat</Link>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2>Browse by category</h2>
        <div className="cat-grid">
          {CATEGORIES.map((c) => <Link key={c.value} to={`/explore?category=${c.value}`} className="card cat" style={{ "--c": c.color }}><span>{c.icon}</span>{c.label}</Link>)}
        </div>
      </section>

      <section className="container section">
        <div className="between"><h2>Featured empty seats</h2><Link to="/explore">View all →</Link></div>
        {!featured ? <Spinner /> : <div className="grid">{featured.map((l) => <ListingCard key={l._id} listing={l} />)}</div>}
      </section>

      <section className="container section">
        <h2>How it works</h2>
        <div className="grid4">
          {STEPS.map(([Icon, t, d], i) => <div className="card step" key={t}><div className="step-ic"><Icon /></div><small>Step {i + 1}</small><h3>{t}</h3><p className="muted">{d}</p></div>)}
        </div>
      </section>

      <section className="container section">
        <div className="safety">
          <h2>Built for trust & safety</h2>
          <div className="grid4">{SAFETY.map(([Icon, t, d]) => <div key={t}><Icon /><h4>{t}</h4><p>{d}</p></div>)}</div>
        </div>
      </section>
    </>
  );
}
