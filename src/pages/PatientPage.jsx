import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPatient } from '../api/axios';
import { PageLoader, Alert, InfoRow, Badge, fmtDateTime, CopyBtn } from '../components/UI';

// GET /patients/{patient_id}
// Response: PatientOut { id, name, phone, email, coupon_code, qr_code_path,
//                        referred_by_id, webinar_batch_id, is_active, created_at }
export default function PatientPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPatient(id)
      .then(setPatient)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;

  return (
    <div className="page-wrap" style={{ maxWidth: 700, marginTop: '2rem' }}>
      {error && <Alert type="error">{error}</Alert>}

      {patient && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'var(--blue-800)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: '1.6rem', flexShrink: 0,
            }}>
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', marginBottom: '.2rem' }}>{patient.name}</h1>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                <Badge color={patient.is_active ? 'green' : 'red'}>
                  {patient.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {patient.referred_by_id && <Badge color="teal">Referred Patient</Badge>}
              </div>
            </div>
          </div>

          {/* Coupon code */}
          {patient.coupon_code && (
            <div className="coupon-box" style={{ marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '.72rem', color: 'var(--slate-400)', fontWeight: 700, marginBottom: '.3rem', letterSpacing: '.05em' }}>REFERRAL COUPON CODE</div>
                <div className="coupon-code">{patient.coupon_code}</div>
              </div>
              <CopyBtn text={patient.coupon_code} />
            </div>
          )}

          {/* Details card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--slate-400)', fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'var(--font-body)' }}>Patient Details</h3>
            <div className="info-grid">
              <InfoRow label="Patient ID" value={patient.id} />
              <InfoRow label="Phone" value={patient.phone} />
              <InfoRow label="Email" value={patient.email} />
              <InfoRow label="QR Path" value={patient.qr_code_path} />
              <InfoRow label="Referred By" value={patient.referred_by_id} />
              <InfoRow label="Webinar Batch" value={patient.webinar_batch_id} />
              <InfoRow label="Registered" value={fmtDateTime(patient.created_at)} />
            </div>
          </div>

          {/* Navigation to sub-pages */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Link to={`/rewards/${patient.id}`} className="card" style={{ textDecoration: 'none', textAlign: 'center', padding: '1.5rem', transition: 'box-shadow .18s' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
            >
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🎁</div>
              <div style={{ fontWeight: 600, color: 'var(--blue-700)' }}>Rewards</div>
              <div style={{ fontSize: '.82rem', color: 'var(--slate-400)' }}>View discount rewards</div>
            </Link>
            <Link to={`/notifications/${patient.id}`} className="card" style={{ textDecoration: 'none', textAlign: 'center', padding: '1.5rem', transition: 'box-shadow .18s' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
            >
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🔔</div>
              <div style={{ fontWeight: 600, color: 'var(--blue-700)' }}>Notifications</div>
              <div style={{ fontSize: '.82rem', color: 'var(--slate-400)' }}>View messages</div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
