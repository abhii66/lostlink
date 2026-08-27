import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur">
      <Link to="/" className="text-lg font-bold text-brand-700">
        LostLink
      </Link>
      {user && (
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-slate-600 hover:text-brand-600">Dashboard</Link>
          <Link to="/search" className="text-slate-600 hover:text-brand-600">Search</Link>
          <Link to="/my-items" className="text-slate-600 hover:text-brand-600">My Items</Link>
          <span className="text-slate-300">|</span>
          <span className="text-slate-700">{user.name}</span>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700 transition hover:bg-slate-200"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}