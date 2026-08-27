import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../store/axios.js";

export default function ClaimVerification() {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/items/${itemId}`).then((res) => setItem(res.data.item));
  }, [itemId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/claims", { itemId, answer });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  };

  if (!item) return <p className="px-6 py-8 text-slate-500">Loading...</p>;

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="mb-4 text-4xl">⏳</div>
        <h1 className="mb-2 text-xl font-bold text-slate-800">Answer Submitted</h1>
        <p className="mb-6 text-slate-600">
          The finder will review your answer and verify ownership. Check back on this item for updates.
        </p>
        <Link to={`/items/${itemId}`} className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          Back to Item
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <Link to={`/items/${itemId}`} className="mb-4 inline-block text-sm text-slate-500 hover:underline">← Back</Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="mb-1 text-xl font-bold text-slate-800">Verify Ownership</h1>
        <p className="mb-4 text-sm text-slate-500">{item.name} — found near {item.location}</p>

        {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        <p className="mb-2 text-sm font-medium text-slate-700">
          Answer the verification question set by the finder:
        </p>
        <p className="mb-4 rounded-md bg-slate-50 p-3 text-slate-800">{item.verificationQuestion}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter your answer..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Answer"}
          </button>
        </form>
      </div>
    </div>
  );
}
