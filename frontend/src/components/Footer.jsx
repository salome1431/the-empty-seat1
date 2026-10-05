import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container foot-in">
        <div><div className="logo">💺 The Empty <span>Seat</span></div><p className="muted">Don't let a seat go empty.</p></div>
        <div className="foot-links"><Link to="/explore">Explore</Link><Link to="/post">Post a Seat</Link><Link to="/dashboard">Dashboard</Link></div>
        <p className="muted small">© {new Date().getFullYear()} The Empty Seat · College project</p>
      </div>
    </footer>
  );
}
