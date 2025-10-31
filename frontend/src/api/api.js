import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

export const loginUser = (data) => API.post("/auth/login", data);
export const signupUser = (data) => API.post("/auth/signup", data);

//export const getPatients = () => axios.get("http://localhost:5000/api/patients");

export const addPatient = (data) => API.post("/patients", data);
export const getPatients = () => API.get("/patients");
export const getSignedUpPatients = () => API.get("/patients/signedup");
export const deletePatient = (id) => API.delete(`/patients/${id}`);

export const addNote = (data) => API.post("/notes", data);
export const getNotes = (patientUsername) =>axios.get(`/api/notes/${patientUsername}`);
export const uploadScan = (id, formData) => API.post(`/scans/${id}`, formData);
export const getScans = (id) => API.get(`/scans/${id}`);
export const analyzeImage = (formData) => API.post("/scans/analyze", formData);
