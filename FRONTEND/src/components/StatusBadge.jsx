const STYLES = {
  LOST: "bg-status-lost/10 text-status-lost",
  FOUND: "bg-status-found/10 text-status-found",
  OPEN: "bg-slate-100 text-slate-600",
  MATCH_FOUND: "bg-brand-100 text-brand-700",
  CLAIM_PENDING: "bg-status-pending/10 text-status-pending",
  VERIFIED: "bg-status-verified/10 text-status-verified",
  RETURNED: "bg-slate-200 text-slate-600",
};

const LABELS = {
  MATCH_FOUND: "Match Found",
  CLAIM_PENDING: "Claim Pending",
};

export default function StatusBadge({ value, compact }) {
  const style = STYLES[value] || "bg-slate-100 text-slate-600";
  const label = LABELS[value] || value?.charAt(0) + value?.slice(1).toLowerCase();
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 font-medium ${compact ? "text-[10px]" : "text-xs"} ${style}`}>
      {label}
    </span>
  );
}