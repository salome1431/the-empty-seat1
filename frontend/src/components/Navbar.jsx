import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserAvatar } from "./ui";

export default function Navbar() {
  const { user, logout, unread } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  return (
    <header className="nav">
      <div className="container nav-in">
        <Link to="/" className="logo" onClick={close}>💺 The Empty <span>Seat</span></Link>
        <button className="icon-btn menu-btn" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        <nav className={`links ${open ? "open" : ""}`} onClick={close}>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/explore">Explore</NavLink>
          <NavLink to="/post">Post a Seat</NavLink>
          {user && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
          {user ? (
            <>
              <NavLink to="/notifications" className="bell"><Bell size={18} />{unread > 0 && <b className="dot">{unread > 9 ? "9+" : unread}</b>}<span className="only-mobile"> Notifications</span></NavLink>
              <NavLink to="/profile" className="me"><UserAvatar user={user} size={28} /> <span>{user.name.split(" ")[0]}</span></NavLink>
              <button className="btn sm" onClick={() => { logout(); navigate("/"); }}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <Link className="btn primary sm" to="/register">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
