import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MobileCanvas from "./components/layout/MobileCanvas";
import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <MobileCanvas>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </MobileCanvas>
    </Router>
  );
}
