import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import ImageAnalysis from "./pages/ImageAnalysis";

export default function App() {
  const { user } = useAuth();

  const getDashboard = () => {
    if (!user) return <Navigate to="/" replace />;
    if (user.role === "doctor") return <DoctorDashboard />;
    if (user.role === "patient") return <PatientDashboard />;
    return <Navigate to="/" replace />;
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          {getDashboard()}
        </ProtectedRoute>
      } />

      <Route path="/analysis" element={
        <ProtectedRoute>
          <ImageAnalysis />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}