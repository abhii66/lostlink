import { useEffect, useState } from "react";
import api from "../store/axios.js";
import ItemCard from "../components/ItemCard.jsx";

export default function MyItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/items/mine")
      .then((res) => setItems(res.data.items))
      .finally(() => setLoading(false));
  }, []);

  const lost = items.filter((i) => i.type === "LOST");
  const found = items.filter((i) => i.type === "FOUND");

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-xl font-bold text-slate-800">My Items</h1>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-semibold text-slate-800">My Lost Items ({lost.length})</h2>
            {lost.length === 0 ? (
              <p className="text-sm text-slate-500">You haven't reported any lost items.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {lost.map((item) => <ItemCard key={item._id} item={item} />)}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-semibold text-slate-800">My Found Items ({found.length})</h2>
            {found.length === 0 ? (
              <p className="text-sm text-slate-500">You haven't reported any found items.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {found.map((item) => <ItemCard key={item._id} item={item} />)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}