import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/authStore.js";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ReportItem from "./pages/ReportItem.jsx";
import SearchBrowse from "./pages/SearchBrowse.jsx";
import ItemDetails from "./pages/ItemDetails.jsx";
import ClaimVerification from "./pages/ClaimVerification.jsx";
import FinderClaims from "./pages/FinderClaims.jsx";
import MyItems from "./pages/MyItems.jsx";

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/report/:type" element={<ProtectedRoute><ReportItem /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchBrowse /></ProtectedRoute>} />
        <Route path="/my-items" element={<ProtectedRoute><MyItems /></ProtectedRoute>} />
        <Route path="/items/:id" element={<ProtectedRoute><ItemDetails /></ProtectedRoute>} />
        <Route path="/claim/:itemId" element={<ProtectedRoute><ClaimVerification /></ProtectedRoute>} />
        <Route path="/finder/claims/:itemId" element={<ProtectedRoute><FinderClaims /></ProtectedRoute>} />
      </Routes>
    </>
  );
}
