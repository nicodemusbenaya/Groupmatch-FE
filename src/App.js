import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { RoomProvider } from "./contexts/RoomContext";
import { Toaster } from "./components/ui/sonner";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Room from "./pages/Room";
import OAuthCallback from "./pages/OAuthCallback"; // <--- 1. IMPORT INI

// ... (kode ProtectedRoute dan PublicRoute tetap sama, tidak perlu diubah) ...
const ProtectedRoute = ({ children, requireProfile = true }) => {
  // ... existing code ...
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>; // Simplified for brevity
  if (!user) return <Navigate to="/login" replace />;
  if (requireProfile && !user.profileComplete) return <Navigate to="/profile-setup" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  // ... existing code ...
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (user && user.profileComplete) return <Navigate to="/dashboard" replace />;
  if (user && !user.profileComplete) return <Navigate to="/profile-setup" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* --- 2. TAMBAHKAN ROUTE INI --- */}
            {/* Route ini menangup redirect dari Google/Backend */}
            <Route path="/auth/callback" element={<OAuthCallback />} />
            {/* ------------------------------- */}

            {/* Profile Setup */}
            <Route
              path="/profile-setup"
              element={
                <ProtectedRoute requireProfile={false}>
                  <ProfileSetup />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room"
              element={
                <ProtectedRoute>
                  <Room />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </RoomProvider>
    </AuthProvider>
  );
}

export default App;