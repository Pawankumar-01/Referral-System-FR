import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PatientLookupPage() {
  const [id, setId] = useState('');
  const navigate = useNavigate();

  return (
    <div className="page-wrap page-wrap--narrow" style={{ marginTop: '3rem' }}>
      <div className="card">
        <h2 style={{ marginBottom: '.5rem' }}>Find Patient</h2>
        <p style={{ marginBottom: '1.5rem', fontSize: '.9rem' }}>
          Enter the patient's UUID to view their profile, rewards, and notifications.
        </p>
        <div className="form-group">
          <label>Patient UUID</label>
          <input
            value={id}
            onChange={(e) => setId(e.target.value.trim())}
            placeholder="e.g. 550e8400-e29b-41d4-a716-…"
            onKeyDown={(e) => e.key === 'Enter' && id && navigate(`/patient/${id}`)}
          />
        </div>
        <button
          className="btn btn-primary btn-full"
          disabled={!id}
          onClick={() => navigate(`/patient/${id}`)}
        >
          View Patient Profile
        </button>
      </div>
    </div>
  );
}
