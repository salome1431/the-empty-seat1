import { useEffect, useState } from "react";

export const CATEGORIES = [
  { value: "movie", label: "Movie", icon: "🎬", color: "#6d4aff" },
  { value: "concert", label: "Concert", icon: "🎤", color: "#e11d74" },
  { value: "sports", label: "Sports", icon: "🏏", color: "#16a34a" },
  { value: "bus", label: "Bus", icon: "🚌", color: "#ea580c" },
  { value: "train", label: "Train", icon: "🚆", color: "#0891b2" },
  { value: "flight", label: "Flight", icon: "✈️", color: "#2563eb" },
  { value: "college", label: "College Event", icon: "🎓", color: "#9333ea" },
  { value: "other", label: "Other", icon: "✨", color: "#475569" },
];
export const catInfo = (v) => CATEGORIES.find((c) => c.value === v) || CATEGORIES[7];
export const fmtDate = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
export const fmtShort = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
export const toLocalInput = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
export const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export function useDebounce(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}
