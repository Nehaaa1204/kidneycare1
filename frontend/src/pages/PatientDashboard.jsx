import Header from "../components/Header";
import { useEffect, useState } from "react";
import { getNotes } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (user) getNotes(user.username).then((res) => setNotes(res.data));
  }, [user]);

  return (
    <div className="container">
      <Header />
      <h2>My Health Dashboard</h2>
      {notes.map((n, i) => (
        <div key={i} className="card">
          <h4>{n.diagnosis}</h4>
          <p>{n.treatment}</p>
        </div>
      ))}
    </div>
  );
}
