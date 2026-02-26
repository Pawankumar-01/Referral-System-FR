import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReferralInfo, registerViaReferral } from '../api/axios';
import { Alert, Spinner, PageLoader } from '../components/UI';
import PhoneInput from 'react-phone-input-2';

// This page covers both:
//   GET  /ref/{coupon_code}  → fetch referrer info
//   POST /ref/register       → body: { coupon_code, name, phone, email? }
export default function ReferralPage() {
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState('');      // confirmed coupon after lookup
  const [referrerInfo, setReferrerInfo] = useState(null); // { referrer_name, coupon_code, message }
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Registration form — fields match ReferralRegister schema exactly
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [success, setSuccess] = useState(null); // PatientOut

  // Auto-populate from URL query e.g. /ref/scan?code=ABC123
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setCouponInput(code);
      handleLookup(code);
    }
  }, []);

  const handleLookup = async (code) => {
    const c = (code || couponInput).trim().toUpperCase();
    if (!c) return;
    setLookupError('');
    setReferrerInfo(null);
    setLookupLoading(true);
    try {
      const data = await getReferralInfo(c);
      // Response: { referrer_name, coupon_code, message }
      setReferrerInfo(data);
      setCoupon(data.coupon_code);
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!form.name.trim() || !form.phone.trim()) {
      setRegError('Name and phone are required.');
      return;
    }
    setRegLoading(true);
    try {
      // POST /ref/register  body: { coupon_code, name, phone, email? }
      const payload = {
        coupon_code: coupon,
        name: form.name.trim(),
        phone: form.phone.trim(),
        ...(form.email.trim() && { email: form.email.trim() }),
      };
      const patient = await registerViaReferral(payload);
      setSuccess(patient);
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-wrap page-wrap--narrow" style={{ marginTop: '2rem' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3.5rem' }}>🎉</div>
            <h2 style={{ marginTop: '.5rem' }}>Registration Successful!</h2>
            <p style={{ marginTop: '.5rem' }}>You're now part of the referral program.</p>
          </div>
          <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '.5rem' }}>Your Referral QR</h3>

            <img
              src={`${import.meta.env.VITE_API_BASE_URL}/qr/${success.qr_code_path}`}
              alt="Referral QR"

              style={{ width: 220, margin: '1rem auto' }}
            />

            <div className="coupon-code" style={{ marginTop: '.5rem' }}>
              {success.coupon_code}
            </div>

            <a
              href={`${import.meta.env.VITE_API_BASE_URL}/qr/${success.id}.png`}
              download={`referral-${success.coupon_code}.png`}
              className="btn btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              Download QR
            </a>
          </div>
          <div style={{ fontSize: '.88rem', color: 'var(--slate-600)', marginBottom: '1.25rem' }}>
            <div><strong>Name:</strong> {success.name}</div>
            <div><strong>Phone:</strong> {success.phone}</div>
            <div style={{ fontSize: '.78rem', marginTop: '.5rem', wordBreak: 'break-all' }}>
              <strong>Patient ID:</strong> <code>{success.id}</code>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate(`/patient/${success.id}`)}>
              View My Profile
            </button>
            <button className="btn btn-secondary" onClick={() => navigate(`/rewards/${success.id}`)}>
              My Rewards
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap page-wrap--narrow" style={{ marginTop: '2rem' }}>

      {/* Step 1: Enter coupon */}
      {!referrerInfo && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '.5rem' }}>Enter Referral Code</h2>
          <p style={{ marginBottom: '1.5rem', fontSize: '.9rem' }}>
            Scan a QR code or type the referral coupon code you received.
          </p>
          {lookupError && <Alert type="error">{lookupError}</Alert>}
          <div style={{ display: 'flex', gap: '.75rem' }}>
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="e.g. XR4K9MN2A"
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              style={{
                flex: 1, padding: '.75rem 1rem',
                border: '1.5px solid var(--slate-200)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'monospace', fontSize: '1.1rem',
                letterSpacing: '.1em', textTransform: 'uppercase',
                outline: 'none',
              }}
            />
            <button
              className="btn btn-primary"
              onClick={() => handleLookup()}
              disabled={lookupLoading || !couponInput.trim()}
            >
              {lookupLoading ? <Spinner /> : 'Verify'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Referrer confirmed, show registration form */}
      {referrerInfo && (
        <>
          <div className="referrer-banner">
            <div className="referrer-banner__icon">👨‍⚕️</div>
            <div>
              <h3>Referred by {referrerInfo.referrer_name}</h3>
              <p>{referrerInfo.message}</p>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '.5rem' }}>Complete Your Registration</h2>
            <p style={{ marginBottom: '1.5rem', fontSize: '.9rem' }}>
              Fill in your details to join via this referral. You'll receive your own QR code after registration.
            </p>

            {regError && <Alert type="error">{regError}</Alert>}

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <PhoneInput
                country={'in'}
                value={form.phone}
                onChange={(value) => setForm({ ...form, phone: value })}
                placeholder="+91 98765 43210"
                inputProps={{
                  name: 'phone',
                  required: true,
                }}
                containerClass="form-group"
                inputStyle={{
                  width: '100%',
                  height: '42px'
                }}
              />
              </div>
              <div className="form-group">
                <label>Email (optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={regLoading}>
                  {regLoading ? <><Spinner /> Registering…</> : 'Register via Referral'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setReferrerInfo(null)}>
                  Change Code
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
