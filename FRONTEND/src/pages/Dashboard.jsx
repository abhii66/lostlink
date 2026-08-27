import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../store/axios.js";
import ItemCard from "../components/ItemCard.jsx";

export default function Dashboard() {
  const [recentItems, setRecentItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [itemsRes, matchesRes, claimsRes] = await Promise.all([
          api.get("/items"),
          api.get("/matches/mine"),
          api.get("/claims/pending"),
        ]);
        setRecentItems(itemsRes.data.items.slice(0, 5));
        setMatches(matchesRes.data.matches.slice(0, 5));
        setPendingClaims(claimsRes.data.claims);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/report/lost"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-center transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white">+</div>
          <p className="font-semibold text-red-700">Report Lost Item</p>
        </Link>
        <Link
          to="/report/found"
          className="rounded-xl border border-green-200 bg-green-50 p-6 text-center transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">+</div>
          <p className="font-semibold text-green-700">Report Found Item</p>
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading dashboard...</p>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Potential Matches</h2>
              <Link to="/my-items" className="text-sm text-brand-600 hover:underline">View all</Link>
            </div>
            {matches.length === 0 ? (
              <p className="text-sm text-slate-500">No potential matches yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {matches.map((m) => (
                  <Link
                    key={m._id}
                    to={`/items/${m.lostItemId._id}`}
                    className="rounded-lg border border-brand-200 bg-brand-50 p-4 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <p className="font-medium text-slate-800">
                      {m.lostItemId.name} ↔ {m.foundItemId.name}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-brand-700">{m.score}% Match</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-semibold text-slate-800">Pending Claims</h2>
            {pendingClaims.length === 0 ? (
              <p className="text-sm text-slate-500">No pending claims on your found items.</p>
            ) : (
              <div className="space-y-2">
                {pendingClaims.map((c) => (
                  <Link
                    key={c._id}
                    to={`/finder/claims/${c.itemId._id}`}
                    className="block rounded-lg border border-amber-200 bg-amber-50 p-4 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <p className="font-medium text-slate-800">{c.itemId.name}</p>
                    <p className="text-sm text-slate-500">Claimed by {c.claimantId.name}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Recently Reported Items</h2>
              <Link to="/search" className="text-sm text-brand-600 hover:underline">View all</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {recentItems.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}