import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../store/axios.js";
import { useAuthStore } from "../store/authStore.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function ItemDetails() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [itemRes, matchesRes] = await Promise.all([
          api.get(`/items/${id}`),
          api.get(`/matches/for-item/${id}`),
        ]);
        setItem(itemRes.data.item);
        setMatches(matchesRes.data.matches);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p className="px-6 py-8 text-slate-500">Loading...</p>;
  if (!item) return <p className="px-6 py-8 text-slate-500">Item not found.</p>;

  const isOwner = user && String(item.userId) === String(user.id);
  const canClaim = item.type === "FOUND" && !isOwner && item.status !== "RETURNED";

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link to="/search" className="mb-4 inline-block text-sm text-slate-500 hover:underline">← Back</Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold text-slate-800">{item.name}</h1>
          <div className="flex gap-1.5">
            <StatusBadge value={item.type} />
            <StatusBadge value={item.status} />
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {item.category} · {item.location} · {item.date} {item.time}
        </p>

        {item.image && (
          <img src={item.image} alt={item.name} className="mt-4 max-h-64 rounded-lg object-cover" />
        )}

        <p className="mt-4 text-slate-700">{item.description}</p>

        {canClaim && (
          <Link
            to={`/claim/${item._id}`}
            className="mt-6 inline-block rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Claim Item
          </Link>
        )}

        {isOwner && item.type === "FOUND" && (
          <Link
            to={`/finder/claims/${item._id}`}
            className="mt-6 inline-block rounded-md bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
          >
            Manage Claims
          </Link>
        )}
      </div>

      {matches.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="font-semibold text-slate-800">Potential Matches</h2>
          {matches.map((m) => {
            const other = String(m.lostItemId._id) === String(item._id) ? m.foundItemId : m.lostItemId;
            return (
              <div key={m._id} className="rounded-xl border border-brand-200 bg-brand-50 p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800">Potential Match — {m.score}%</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Matched with <strong>{other.name}</strong> ({other.type === "LOST" ? "Lost" : "Found"})
                </p>
                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {m.matchingReasons.map((reason, i) => (
                    <li key={i}>✓ {reason}</li>
                  ))}
                </ul>
                <Link
                  to={`/items/${other._id}`}
                  className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
                >
                  View matched item →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
