import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

export default function ProtectedRoute({ children }) {
  const { user, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}