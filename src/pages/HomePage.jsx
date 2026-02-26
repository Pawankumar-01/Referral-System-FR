import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPatient } from '../api/axios';
import { Alert, Spinner } from '../components/UI';
import PhoneInput from 'react-phone-input-2';

export default function HomePage() {
  const navigate = useNavigate();

  // ── New patient form (POST /patients/)
  const [form, setForm] = useState({ name: '', phone: '', email: '', webinar_batch_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null); // PatientOut

  // ── Patient lookup
  const [lookupId, setLookupId] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone are required.');
      return;
    }
    setLoading(true);
    try {
      // Build payload — only send optional fields if non-empty (backend: Optional[str] = None)
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        ...(form.email.trim() && { email: form.email.trim() }),
        ...(form.webinar_batch_id.trim() && { webinar_batch_id: form.webinar_batch_id.trim() }),
      };
      const patient = await createPatient(payload);
      setSuccess(patient);
      setForm({ name: '', phone: '', email: '', webinar_batch_id: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1>Patient Referral System</h1>
          <p style={{ marginTop: '.75rem', fontSize: '1.1rem', maxWidth: 520, margin: '.75rem auto 0' }}>
            Register patients, generate QR referral codes, and track rewards — all in one place.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/ref/scan" className="btn btn-teal">📷 Use Referral QR</Link>
            <Link to="/patient/lookup" className="btn btn-secondary">🔍 Find Patient</Link>
          </div>
        </div>
      </div>

      <div className="page-wrap">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>

          {/* ─ Register New Patient ─ */}
          <div className="card">
            <h2 style={{ marginBottom: '.25rem' }}>Register Patient</h2>
            <p style={{ marginBottom: '1.5rem', fontSize: '.9rem' }}>
              Enroll a new patient (e.g., after a webinar). This generates their unique QR referral code.
            </p>

            {error && <Alert type="error">{error}</Alert>}

            {success ? (
              <div>
                <Alert type="success">Patient registered successfully!</Alert>

                {/* Referral Card */}
                <div
                  style={{
                    border: '1px solid #eee',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: 'white',
                    boxShadow: '0 10px 30px rgba(0,0,0,.05)',
                    marginBottom: '1.5rem'
                  }}
                >
                  <h3 style={{ marginBottom: '.25rem' }}>{success.name}</h3>
                  <p style={{ fontSize: '.85rem', color: 'gray' }}>
                    Referral Program Member
                  </p>

                  {/* QR Image */}
                  {success.qr_code_path && (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}/qr/${success.qr_code_path}`}
                      alt="Referral QR"
                      style={{ width: 200, margin: '1rem auto' }}
                    />
                  )}

                  {/* Coupon */}
                  <div style={{ fontSize: '.75rem', color: 'var(--slate-400)', fontWeight: 600 }}>
                    REFERRAL CODE
                  </div>
                  <div className="coupon-code" style={{ marginTop: '.25rem' }}>
                    {success.coupon_code}
                  </div>

                  {/* Download Button */}
                  {success.qr_code_path && (
                    <a
                      href={`${import.meta.env.VITE_API_BASE_URL}/qr/${success.qr_code_path}`}
                      download={`referral-${success.coupon_code}.png`}
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '1rem', display: 'inline-block' }}
                    >
                      Download QR
                    </a>
                  )}
                </div>

                {/* Patient Info */}
                <div className="info-grid" style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '.88rem', color: 'var(--slate-600)' }}>
                    <strong>ID:</strong> <code style={{ fontSize: '.8rem' }}>{success.id}</code>
                  </div>
                  <div style={{ fontSize: '.88rem', color: 'var(--slate-600)' }}>
                    <strong>Name:</strong> {success.name}
                  </div>
                  <div style={{ fontSize: '.88rem', color: 'var(--slate-600)' }}>
                    <strong>Phone:</strong> {success.phone}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/patient/${success.id}`)}
                  >
                    View Profile →
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSuccess(null)}
                  >
                    Register Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Dr. Priya Sharma" required />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <PhoneInput 
                    name="phone" 
                    value={form.phone} 
                    // Manually create a "fake" event object so handleChange stays happy
                    onChange={(value) => handleChange({ target: { name: 'phone', value } })} 
                    placeholder="98765 43210"   
                    inputStyle={{ width: '100%', height: '42px' }}
                    enableSearch={true} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Email (optional)</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="patient@example.com" />
                </div>
                <div className="form-group">
                  <label>Webinar Batch ID (optional)</label>
                  <input name="webinar_batch_id" value={form.webinar_batch_id} onChange={handleChange} placeholder="UUID of webinar batch" />
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? <><Spinner /> Registering…</> : 'Register Patient'}
                </button>
              </form>
            )}
          </div>

          {/* ─ Quick Links ─ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '.75rem' }}>📋 Patient Lookup</h3>
              <p style={{ fontSize: '.88rem', marginBottom: '1rem' }}>Find any patient by their UUID to view their profile, rewards, and notifications.</p>
              <div className="lookup-form">
                <input
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="Paste patient UUID…"
                  style={{ flex: 1, padding: '.65rem .9rem', border: '1.5px solid var(--slate-200)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '.95rem' }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  disabled={!lookupId.trim()}
                  onClick={() => navigate(`/patient/${lookupId.trim()}`)}
                >
                  Go
                </button>
              </div>
            </div>

            <div className="card" style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '.75rem' }}>🔗 Referral via QR</h3>
              <p style={{ fontSize: '.88rem', marginBottom: '1rem' }}>
                Have a referral coupon code? Register a new patient through the referral link.
              </p>
              <Link to="/ref/scan" className="btn btn-teal btn-full">Enter Coupon Code</Link>
            </div>

            <div className="card" style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '.75rem' }}>⚙️ Admin Panel</h3>
              <p style={{ fontSize: '.88rem', marginBottom: '1rem' }}>
                Mark consultations and medicine completions to trigger reward generation.
              </p>
              <Link to="/admin" className="btn btn-secondary btn-full">Open Admin Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
