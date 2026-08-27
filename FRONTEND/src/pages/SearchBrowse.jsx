import { useEffect, useState } from "react";
import api from "../store/axios.js";
import ItemCard from "../components/ItemCard.jsx";

const CATEGORIES = ["Electronics", "Bags", "Documents", "Keys", "Accessories", "Stationery", "Other"];
const STATUSES = ["OPEN", "MATCH_FOUND", "CLAIM_PENDING", "VERIFIED", "RETURNED"];

export default function SearchBrowse() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (type) params.type = type;
      if (category) params.category = category;
      if (location) params.location = location;
      if (status) params.status = status;

      const res = await api.get("/items", { params });
      setItems(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-4 text-xl font-bold text-slate-800">Search & Browse</h1>

      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, description..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <div className="flex flex-wrap gap-2">
          {["", "LOST", "FOUND"].map((t) => (
            <button
              key={t || "all"}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                type === t ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {t === "" ? "All" : t === "LOST" ? "Lost" : "Found"}
            </button>
          ))}

          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">Category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />

          <button type="submit" className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-900">
            Apply
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-slate-500">No items match your filters.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <ItemCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}