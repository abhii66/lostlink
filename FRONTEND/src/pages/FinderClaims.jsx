import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../store/axios.js";

export default function FinderClaims() {
  const { itemId } = useParams();
  const [claims, setClaims] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [error, setError] = useState("");
  const [returnedItem, setReturnedItem] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/claims/for-item/${itemId}`);
      setClaims(res.data.claims);
      setQuestion(res.data.verificationQuestion);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const handleVerify = async (claimId) => {
    setActioningId(claimId);
    try {
      await api.patch(`/claims/${claimId}/verify`);
      await load();
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (claimId) => {
    setActioningId(claimId);
    try {
      await api.patch(`/claims/${claimId}/reject`);
      await load();
    } finally {
      setActioningId(null);
    }
  };

  const handleReturn = async (claimId) => {
    setActioningId(claimId);
    try {
      const res = await api.patch(`/claims/${claimId}/return`);
      setReturnedItem(res.data.item);
    } finally {
      setActioningId(null);
    }
  };

  if (returnedItem) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="mb-4 text-5xl">🎉</div>
        <h1 className="mb-2 text-xl font-bold text-slate-800">Item Returned Successfully</h1>
        <p className="mb-6 text-slate-600">
          {returnedItem.name} has been successfully handed over to its owner.
        </p>
        <Link to="/" className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link to={`/items/${itemId}`} className="mb-4 inline-block text-sm text-slate-500 hover:underline">← Back</Link>
      <h1 className="mb-1 text-xl font-bold text-slate-800">Claim Requests</h1>
      {question && <p className="mb-6 text-sm text-slate-500">Your question: "{question}"</p>}

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : claims.length === 0 ? (
        <p className="text-slate-500">No claims yet on this item.</p>
      ) : (
        <div className="space-y-4">
          {claims.map((c) => (
            <div key={c._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-800">Claimant: {c.claimantId.name}</p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    c.status === "PENDING"
                      ? "bg-amber-100 text-amber-700"
                      : c.status === "VERIFIED"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Question: {question}</p>
              <p className="mt-1 text-slate-800">Answer: {c.answer}</p>
              {c.likelyCorrect !== null && (
                <p className={`mt-1 text-xs ${c.likelyCorrect ? "text-green-600" : "text-red-500"}`}>
                  {c.likelyCorrect ? "Matches your stored answer" : "Does not match your stored answer"}
                </p>
              )}

              {c.status === "PENDING" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleReject(c._id)}
                    disabled={actioningId === c._id}
                    className="rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerify(c._id)}
                    disabled={actioningId === c._id}
                    className="rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60"
                  >
                    Verify
                  </button>
                </div>
              )}

              {c.status === "VERIFIED" && (
                <button
                  onClick={() => handleReturn(c._id)}
                  disabled={actioningId === c._id}
                  className="mt-4 rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  Mark as Returned
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
