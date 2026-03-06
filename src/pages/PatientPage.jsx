
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getPatient, getCommissionHistory, getPortfolio } from '../api/axios';
import { PageLoader, Alert, InfoRow, Badge, fmtDateTime } from '../components/UI';

// Match your FastAPI static mount path
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function qrUrl(qrCodePath) {
  if (!qrCodePath) return null;
  // qrCodePath = "qr_codes/uuid.png" → extract filename → /qr/uuid.png
  const filename = qrCodePath.split('/').pop();
  return `${API_BASE}/qr/${filename}`;
}

export default function PatientPage() {
  const { id } = useParams();

  const [patient, setPatient]         = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [portfolio, setPortfolio]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      // FIX: removed getWallet() — portfolio provides everything needed
      const [p, c, pf] = await Promise.all([
        getPatient(id),
        getCommissionHistory(id),
        getPortfolio(id),
      ]);
      setPatient(p);
      setCommissions(c);
      setPortfolio(pf);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => alert('Copied!'));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="page-wrap" style={{ maxWidth: 1000, marginTop: '2rem' }}>

      {/* Error banner — doesn't crash the page */}
      {error && <Alert type="error">{error}</Alert>}

      {/* Refresh */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={loadData}>
          ↻ Refresh
        </button>
      </div>

      {/* ── PATIENT PROFILE ─────────────────────────────────────────────── */}
      {patient && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ marginBottom: '1rem', color: '#2563eb' }}>
            {patient.name}
          </h1>

          <div className="info-grid">
            {/* Plain string values — InfoRow cannot accept JSX nodes */}
            <InfoRow label="UUID"  value={patient.id} />
            <InfoRow label="Phone" value={patient.phone} />
            <InfoRow label="Email" value={patient.email || '—'} />
            <InfoRow label="Referral Code" value={patient.coupon_code} />
          </div>

          {/* Referral code styled callout — separate from InfoRow */}
          <div style={{
            marginTop: '0.75rem',
            display: 'inline-block',
            background: '#f0fdf4',
            border: '1.5px solid #86efac',
            borderRadius: 8,
            padding: '6px 16px',
          }}>
            <span style={{ fontSize: '.75rem', color: '#64748b', marginRight: 8 }}>
              REFERRAL CODE
            </span>
            <span style={{ fontWeight: 700, color: '#059669', fontSize: '1.15rem', letterSpacing: 2 }}>
              {patient.coupon_code}
            </span>
          </div>

          {/* QR Code — FIX: reconstruct URL from path */}
          {patient.qr_code_path && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <img
                src={qrUrl(patient.qr_code_path)}
                alt="Referral QR Code"
                style={{ width: 160, borderRadius: 8, border: '1px solid #ddd' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div style={{ fontSize: '.75rem', color: '#94a3b8', marginTop: 4 }}>
                Scan to register via referral
              </div>
            </div>
          )}

          {/* Referral link */}
          {portfolio?.referral_link && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
              <input
                value={portfolio.referral_link}
                readOnly
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: '.9rem',
                  background: '#f8fafc',
                }}
              />
              <button
                className="btn btn-primary"
                onClick={() => copy(portfolio.referral_link)}
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── FINANCIAL PORTFOLIO ─────────────────────────────────────────── */}
      {portfolio && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Financial Portfolio</h3>

          <div className="stats-grid">
            {/* FIX: .toFixed(2) on all monetary values */}
            <StatCard
              title="Wallet Balance"
              value={`₹${Number(portfolio.wallet_balance).toFixed(2)}`}
              color="#2563eb"
            />
            <StatCard
              title="Total Generated"
              value={`₹${Number(portfolio.total_generated).toFixed(2)}`}
              color="#059669"
            />
            <StatCard
              title="Total Claimed"
              value={`₹${Number(portfolio.total_claimed).toFixed(2)}`}
              color="#f97316"
            />
            <StatCard
              title="Pending Approval"
              value={`₹${Number(portfolio.pending_amount).toFixed(2)}`}
              color="#eab308"
            />
          </div>

          <div className="info-grid" style={{ marginTop: '1rem' }}>
            <InfoRow label="Total Referrals" value={portfolio.referral_count} />
          </div>

          {/* MLM level breakdown */}
          {portfolio.level_counts && Object.keys(portfolio.level_counts).length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '.5rem', color: '#475569' }}>
                Commission by Level
              </div>
              <div className="info-grid">
                {Object.entries(portfolio.level_counts)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([level, count]) => (
                    <InfoRow
                      key={level}
                      label={level.replace('_', ' ').toUpperCase()}
                      value={`${count} transaction${count !== 1 ? 's' : ''}`}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WALLET BALANCE (quick view) ──────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3>Wallet Balance</h3>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#2563eb' }}>
          {/* FIX: read from portfolio, not a separate wallet call */}
          ₹{Number(portfolio?.wallet_balance ?? 0).toFixed(2)}
        </div>
        <div style={{ fontSize: '.85rem', color: '#64748b', marginTop: '.25rem' }}>
          Total claimed (used): ₹{Number(portfolio?.total_claimed ?? 0).toFixed(2)}
        </div>
      </div>

      {/* ── COMMISSION HISTORY ───────────────────────────────────────────── */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Commission History</h3>

        {commissions.length === 0 ? (
          <div style={{ color: '#94a3b8' }}>No commissions yet.</div>
        ) : (
          commissions.map((c) => (
            <div
              key={c.id}
              style={{
                padding: '1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                marginBottom: '.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                  ₹{Number(c.commission_amount).toFixed(2)}
                </div>
                <div style={{ fontSize: '.8rem', color: '#64748b' }}>
                  Level {c.level} • Bill ₹{Number(c.bill_amount).toFixed(2)}
                </div>
                <div style={{ fontSize: '.75rem', color: '#94a3b8' }}>
                  {fmtDateTime(c.created_at)}
                </div>
                {/* Show approval / claim timestamps when available */}
                {c.approved_at && (
                  <div style={{ fontSize: '.7rem', color: '#059669' }}>
                    Approved: {fmtDateTime(c.approved_at)}
                  </div>
                )}
                {c.claimed_at && (
                  <div style={{ fontSize: '.7rem', color: '#f97316' }}>
                    Claimed: {fmtDateTime(c.claimed_at)}
                  </div>
                )}
              </div>

              {/* FIX: all three status values handled */}
              <div>
                {c.status === 'credited' && (
                  <Badge color="yellow">Pending Approval</Badge>
                )}
                {c.status === 'approved' && (
                  <Badge color="green">Approved</Badge>
                )}
                {c.status === 'claimed' && (
                  <Badge color="blue">Claimed</Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ title, value, color }) {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: 10,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}