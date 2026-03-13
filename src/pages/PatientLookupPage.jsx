import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";

export default function PatientLookupPage() {

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSearch = async () => {

    if (!phone) return;

    setLoading(true);
    setError("");

    try {

      const res = await api.get(`/patients/search?phone=${phone}`);

      if (!res.data.length) {
        setError("Patient not found");
        return;
      }

      const patient = res.data[0];

      navigate(`/patient/${patient.id}`);

    } catch (err) {
      setError("Search failed");
    }

    setLoading(false);
  };

  return (
    <div className="page-wrap page-wrap--narrow" style={{ marginTop: "3rem" }}>
      <div className="card">

        <h2 style={{ marginBottom: ".5rem" }}>
          Find Patient
        </h2>

        <p style={{ marginBottom: "1.5rem", fontSize: ".9rem" }}>
          Enter the patient's phone number to view their profile and rewards.
        </p>

        {error && (
          <div style={{ color: "red", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label>Patient Phone</label>

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />

        </div>

        <button
          className="btn btn-primary btn-full"
          disabled={!phone || loading}
          onClick={handleSearch}
        >
          {loading ? "Searching..." : "View Patient Profile"}
        </button>

      </div>
    </div>
  );
}