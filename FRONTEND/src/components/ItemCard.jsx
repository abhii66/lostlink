import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";

export default function ItemCard({ item, matchScore }) {
  return (
    <Link
      to={`/items/${item._id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-800">{item.name}</h3>
        <div className="flex gap-1.5">
          <StatusBadge value={item.type} />
          <StatusBadge value={item.status} />
        </div>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {item.category} · {item.location} · {item.date} {item.time}
      </p>
      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.description}</p>
      {typeof matchScore === "number" && (
        <p className="mt-2 text-sm font-semibold text-brand-600">Match: {matchScore}%</p>
      )}
    </Link>
  );
}