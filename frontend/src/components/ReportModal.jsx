import { useState } from "react";
import api, { errMsg } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Modal, Field } from "./ui";

const REASONS = [["fake_listing", "Fake listing"], ["suspicious_user", "Suspicious user"], ["incorrect_info", "Incorrect information"], ["inappropriate", "Inappropriate content"], ["scam", "Scam"]];

export default function ReportModal({ listingId, userId, onClose }) {
  const toast = useToast();
  const [reason, setReason] = useState("fake_listing");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post("/reports", { reportedListing: listingId, reportedUser: userId, reason, description });
      toast("Report submitted. Thank you for keeping the community safe.");
      onClose();
    } catch (e) { toast(errMsg(e), "error"); } finally { setBusy(false); }
  };
  return (
    <Modal title="Report" onClose={onClose}>
      <Field label="Reason"><select value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
      <Field label="Details (optional)"><textarea rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <button className="btn danger" disabled={busy} onClick={submit}>{busy ? "Sending..." : "Submit report"}</button>
    </Modal>
  );
}
