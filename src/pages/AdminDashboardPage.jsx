/**
 * AdminDashboardPage.jsx  — FIXED
 *
 * Changes:
 *  1. Uses getPendingCommissions() (new endpoint) instead of getAllCommissions()
 *     so that earner names are visible in the approval list.
 *  2. fetchPatients() is called after approveCommission() so the table refreshes.
 *  3. All three refresh calls (fetchStats + fetchPatients + fetchCommissions)
 *     are made after claim-wallet so everything stays in sync.
 *  4. Commission approval card shows earner name.
 *  5. consultationAmount field has no hardcoded default — admin must enter it.
 *  6. Minor: claimAmount/claimPhone cleared after success (was already correct).
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminDashboard,
  markConsultationCompleteByPhone,
  markMedicineCompleteByPhone,
  getPatientsOverview,
  getPendingCommissions,   // ← uses new endpoint with earner_name
  approveCommission,
  claimWallet,
} from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { PageLoader, Alert, Spinner } from '../components/UI';

export default function AdminDashboardPage() {
  const { isAdminAuthed } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [patientPhone, setPatientPhone]             = useState('');
  const [consultationAmount, setConsultationAmount] = useState('');
  const [medicineAmount, setMedicineAmount]         = useState('');
  const [patients, setPatients]                     = useState([]);
  const [searchTerm, setSearchTerm]                 = useState('');

  const [actionType, setActionType]     = useState('consultation');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult]   = useState(null);
  const [actionError, setActionError]     = useState('');

  // Pending commissions use the new /admin/pending-commissions endpoint
  const [pendingCommissions, setPendingCommissions] = useState([]);
  const [approving, setApproving] = useState(null);

  const [claimPhone, setClaimPhone]   = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);

  // ── Data fetchers ──────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const data = await getAdminDashboard();
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const data = await getPatientsOverview();
      setPatients(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchPendingCommissions = useCallback(async () => {
    try {
      const data = await getPendingCommissions();
      setPendingCommissions(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchStats();
    fetchPatients();
    fetchPendingCommissions();
  }, [fetchStats, fetchPatients, fetchPendingCommissions]);

  // ── Bootstrap ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAdminAuthed) {
      navigate('/admin/login');
      return;
    }
    Promise.all([fetchStats(), fetchPatients(), fetchPendingCommissions()])
      .finally(() => setLoading(false));
  }, [isAdminAuthed]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mark Consultation / Medicine ───────────────────────────────────────

  const handleAction = async (e) => {
    e.preventDefault();
    if (!patientPhone.trim()) return;

    setActionLoading(true);
    setActionResult(null);
    setActionError('');

    try {
      let res;
      if (actionType === 'consultation') {
        res = await markConsultationCompleteByPhone({ phone: patientPhone.trim() });
      } else {
        if (!consultationAmount || !medicineAmount) {
          setActionError('Please enter both consultation and medicine amounts.');
          setActionLoading(false);
          return;
        }
        res = await markMedicineCompleteByPhone({
          phone: patientPhone.trim(),
          consultation_amount: Number(consultationAmount),
          medicine_amount: Number(medicineAmount),
        });
      }
      setActionResult(res);
      // After medicine complete, new "credited" commissions may appear
      refreshAll();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Approve Commission ─────────────────────────────────────────────────

  const handleApprove = async (commissionId) => {
    setApproving(commissionId);
    try {
      await approveCommission(commissionId);
      // FIX: refresh all three — patient table, stats, and pending list
      refreshAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setApproving(null);
    }
  };

  // ── Claim Wallet ───────────────────────────────────────────────────────

  const handleWalletClaim = async () => {
    if (!claimPhone.trim() || !claimAmount) {
      alert('Enter patient phone and amount.');
      return;
    }
    setClaimLoading(true);
    try {
      const res = await claimWallet(claimPhone.trim(), Number(claimAmount));
      alert(res.message || 'Wallet claim successful');
      setClaimPhone('');
      setClaimAmount('');
      // FIX: refresh all — commissions are now "claimed", wallet balance changed
      refreshAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setClaimLoading(false);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm)
  );

  if (!isAdminAuthed) return null;
  if (loading || !stats) return <PageLoader />;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="page-wrap page-wrap--wide" style={{ marginTop: '2rem' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage MLM referral completions and monitor system health.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={refreshAll}>
          ↻ Refresh
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* STATS GRID */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <StatCard label="Total Patients"       value={stats.total_patients}       icon="👤" />
        <StatCard label="Total Referrals"      value={stats.total_referrals}      icon="🔗" />
        <StatCard label="Consultations Done"   value={stats.consultations_completed} icon="🩺" />
        <StatCard label="Medicines Done"       value={stats.medicines_completed}  icon="💊" />
        <StatCard label="Pending Approvals"    value={stats.pending_commissions}  icon="⏳" />
        <StatCard label="Approved Commissions" value={stats.approved_commissions} icon="✅" />
      </div>

      {/* PATIENT TABLE */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Patient Overview</h3>
        <div style={{ margin: '1rem 0' }}>
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '.6rem .9rem',
              border: '1.5px solid var(--slate-200)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '.9rem',
            }}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: 'black' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle}>Referred By</th>
                <th style={thStyle}>Consultation</th>
                <th style={thStyle}>Medicine</th>
                <th style={thStyle}>Commission</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr key={p.id}>
                  <td
                    style={{ ...tdStyle('var(--blue-700)', true), cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => navigate(`/patient/${p.id}`)}
                    title="View patient page"
                  >
                    {p.name}
                  </td>
                  <td style={tdStyle()}>{p.phone}</td>
                  <td style={tdStyle()}>{p.referred_by || '—'}</td>
                  <td style={tdStyle()}>{p.consultation_completed ? '✅' : '❌'}</td>
                  <td style={tdStyle()}>{p.medicine_completed ? '✅' : '❌'}</td>
                  <td style={tdStyle()}>{p.commission_processed ? '💰' : '—'}</td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PENDING COMMISSION APPROVALS */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>
          Pending Commission Approvals ({pendingCommissions.length})
        </h3>

        {pendingCommissions.length === 0 ? (
          <div style={{ color: 'var(--slate-400)' }}>No pending commissions.</div>
        ) : (
          pendingCommissions.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                border: '1px solid var(--slate-200)',
                borderRadius: '8px',
                marginBottom: '.75rem',
              }}
            >
              <div>
                {/* FIX: show earner name */}
                <div style={{ fontWeight: 600 }}>
                  {c.earner_name}
                  <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 8, fontSize: '.8rem' }}>
                    Level {c.level}
                  </span>
                </div>
                <div style={{ fontSize: '1.1rem', color: '#2563eb', fontWeight: 700 }}>
                  ₹{c.commission_amount.toFixed(2)}
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--slate-400)' }}>
                  Bill ₹{c.bill_amount.toFixed(2)} • Status: {c.status}
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                disabled={approving === c.id}
                onClick={() => handleApprove(c.id)}
              >
                {approving === c.id ? <Spinner /> : 'Approve'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* CLAIM WALLET */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Claim Wallet Amount</h3>
        <p style={{ fontSize: '.85rem', color: '#64748b', marginBottom: '1rem' }}>
          Deducts from patient wallet and marks linked commissions as "claimed".
        </p>
        <div className="form-group">
          <label>Patient Phone</label>
          <input
            value={claimPhone}
            onChange={(e) => setClaimPhone(e.target.value)}
            placeholder="Enter patient phone"
          />
        </div>
        <div className="form-group">
          <label>Amount (₹)</label>
          <input
            type="number"
            min="1"
            value={claimAmount}
            onChange={(e) => setClaimAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>
        <button
          className="btn btn-primary"
          disabled={claimLoading}
          onClick={handleWalletClaim}
        >
          {claimLoading ? <Spinner /> : 'Claim'}
        </button>
      </div>

      {/* MARK COMPLETION */}
      <div className="card">
        <h3>Mark Completion</h3>

        {actionResult && <Alert type="success">{actionResult.message}</Alert>}
        {actionError  && <Alert type="error">{actionError}</Alert>}

        <form onSubmit={handleAction}>
          {/* Action type toggle — shown FIRST so user picks before filling amounts */}
          <div className="form-group">
            <label>Action Type</label>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <label>
                <input
                  type="radio"
                  checked={actionType === 'consultation'}
                  onChange={() => setActionType('consultation')}
                />
                {' '}🩺 Consultation
              </label>
              <label>
                <input
                  type="radio"
                  checked={actionType === 'medicine'}
                  onChange={() => setActionType('medicine')}
                />
                {' '}💊 Medicine
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Patient Phone</label>
            <input
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="Enter patient's phone number…"
              required
            />
          </div>

          {actionType === 'medicine' && (
            <>
              <div className="form-group">
                <label>Consultation Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={consultationAmount}
                  onChange={(e) => setConsultationAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  required
                />
              </div>
              <div className="form-group">
                <label>Medicine Bill Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={medicineAmount}
                  onChange={(e) => setMedicineAmount(e.target.value)}
                  placeholder="e.g. 3000"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              actionLoading ||
              !patientPhone.trim() ||
              (actionType === 'medicine' && (!consultationAmount || !medicineAmount))
            }
          >
            {actionLoading ? <Spinner /> : 'Mark Complete'}
          </button>
        </form>
      </div>

    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div>{icon}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '.8rem', color: '#64748b' }}>{label}</div>
    </div>
  );
}

// Inline table cell styles
const thStyle = { padding: '.6rem .8rem', textAlign: 'left', fontWeight: 600, fontSize: '.85rem' };
const tdStyle = (color, bold) => ({
  padding: '.6rem .8rem',
  fontSize: '.9rem',
  fontWeight: bold ? 600 : 400,
  color: color || 'inherit',
  borderBottom: '1px solid #f1f5f9',
});