import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../store/axios.js";

const CATEGORIES = ["Electronics", "Bags", "Documents", "Keys", "Accessories", "Stationery", "Other"];

export default function ReportItem() {
  const { type } = useParams(); // "lost" | "found"
  const isFound = type === "found";
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    location: "",
    date: "",
    time: "",
    verificationQuestion: "",
    verificationAnswer: "",
  });
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const data = new FormData();
      data.append("type", isFound ? "FOUND" : "LOST");
      Object.entries(form).forEach(([k, v]) => {
        if (v) data.append(k, v);
      });
      if (image) data.append("image", image);

      const res = await api.post("/items", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit item");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12 text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h1 className="mb-2 text-xl font-bold text-slate-800">Item Reported!</h1>
        {result.matchesFound > 0 ? (
          <p className="mb-6 text-slate-600">
            We found <strong>{result.matchesFound}</strong> potential match
            {result.matchesFound > 1 ? "es" : ""}. Check the item's page for details.
          </p>
        ) : (
          <p className="mb-6 text-slate-600">No strong matches yet — we'll keep checking as new items come in.</p>
        )}
        <div className="flex justify-center gap-3">
          <Link to={`/items/${result.item._id}`} className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            View Item
          </Link>
          <Link to="/" className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <h1 className="mb-1 text-xl font-bold text-slate-800">
        Report {isFound ? "Found" : "Lost"} Item
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        {isFound
          ? "Set a private verification question only the true owner would know."
          : "Give as much detail as you can to help us find a match."}
      </p>

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Item Name">
          <input required value={form.name} onChange={update("name")} className={inputClass} placeholder="e.g. Black Backpack" />
        </Field>

        <Field label="Category">
          <select required value={form.category} onChange={update("category")} className={inputClass}>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Description">
          <textarea required rows={3} value={form.description} onChange={update("description")} className={inputClass} placeholder="Describe the item..." />
        </Field>

        <Field label="Location">
          <input required value={form.location} onChange={update("location")} className={inputClass} placeholder="Where did you lose/find it?" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input required type="date" value={form.date} onChange={update("date")} className={inputClass} />
          </Field>
          <Field label="Approx. Time">
            <input required type="time" value={form.time} onChange={update("time")} className={inputClass} />
          </Field>
        </div>

        <Field label="Photo (optional)">
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="text-sm" />
        </Field>

        {isFound && (
          <>
            <Field label="Verification Question (for claimant)">
              <input required value={form.verificationQuestion} onChange={update("verificationQuestion")} className={inputClass} placeholder="e.g. What logo is on the backpack?" />
            </Field>
            <Field label="Verification Answer (kept private)">
              <input required value={form.verificationAnswer} onChange={update("verificationAnswer")} className={inputClass} placeholder="e.g. Nike" />
            </Field>
          </>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? "Posting..." : "Post Item"}
        </button>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500";

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
