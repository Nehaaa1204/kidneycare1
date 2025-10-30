import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import ImageAnalysis from "./pages/ImageAnalysis";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {user?.role === "doctor" && (
        <Route path="/dashboard" element={<DoctorDashboard />} />
      )}
      {user?.role === "patient" && (
        <Route path="/dashboard" element={<PatientDashboard />} />
      )}

      <Route path="/analysis" element={<ImageAnalysis />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
