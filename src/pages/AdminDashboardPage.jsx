import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminDashboard,
  markConsultationCompleteByPhone,
  markMedicineCompleteByPhone,
  getPatientsOverview,
  getAllCommissions,
  approveCommission,
  
} from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { PageLoader, Alert, Spinner } from '../components/UI';

export default function AdminDashboardPage() {
  const { isAdminAuthed } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [patientPhone, setPatientPhone] = useState('');
  const [consultationAmount, setConsultationAmount] = useState(2000);
  const [medicineAmount, setMedicineAmount] = useState('');
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [actionType, setActionType] = useState('consultation');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState(null);
  const [actionError, setActionError] = useState('');

  const [commissions, setCommissions] = useState([]);
  const [approving, setApproving] = useState(null);

  const [claimPatientId, setClaimPatientId] = useState('')
  const [claimAmount, setClaimAmount] = useState('')
  const [claimLoading, setClaimLoading] = useState(false)
  const [claimPhone, setClaimPhone] = useState('');


  useEffect(() => {
    if (!isAdminAuthed) {
      navigate('/admin/login');
      return;
    }
    fetchStats();
    fetchPatients();
    fetchCommissions();
  }, [isAdminAuthed]);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError('');
    getAdminDashboard()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const fetchPatients = useCallback(() => {
    getPatientsOverview()
      .then(setPatients)
      .catch((err) => setError(err.message));
  }, []);

  const fetchCommissions = useCallback(() => {
    getAllCommissions()
      .then(setCommissions)
      .catch((err) => setError(err.message));
  }, []);

  const handleAction = async (e) => {
    e.preventDefault();
    if (!patientPhone.trim()) return;

    setActionLoading(true);
    setActionResult(null);
    setActionError('');

    try {
      let res;

      if (actionType === 'consultation') {
        res = await markConsultationCompleteByPhone({
          phone: patientPhone.trim()
        });
      } else {
        res = await markMedicineCompleteByPhone({
          phone: patientPhone.trim(),
          consultation_amount: Number(consultationAmount),
          medicine_amount: Number(medicineAmount)
        });
      }

      setActionResult(res);
      fetchStats();
      fetchPatients();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (commissionId) => {
    setApproving(commissionId);

    try {
      await approveCommission(commissionId);

      // refresh dashboard data
      fetchCommissions();
      fetchStats();

    } catch (err) {
      alert(err.message);
    } finally {
      setApproving(null);
    }
  };

  const handleWalletClaim = async () => {

    if (!claimPhone || !claimAmount) {
      alert("Enter phone and amount");
      return;
    }

    setClaimLoading(true);

    try {

      await adminApi.post("/admin/claim-wallet", {
        phone: claimPhone,
        amount: Number(claimAmount)
      });

      alert("Wallet claim successful");

      setClaimPhone('');
      setClaimAmount('');

    } catch (err) {
      alert(err.message);
    }

    setClaimLoading(false);
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  if (!isAdminAuthed) return null;
  if (loading || !stats) return <PageLoader />;

  return (
    <div className="page-wrap page-wrap--wide" style={{ marginTop: '2rem' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage MLM referral completions and monitor system health.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => {
          fetchStats();
          fetchPatients();
          fetchCommissions();
        }}>
          ↻ Refresh
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* STATS */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <StatCard label="Total Patients" value={stats.total_patients} icon="👤" />
          <StatCard label="Total Referrals" value={stats.total_referrals} icon="🔗" />
          <StatCard label="Consultations Done" value={stats.consultations_completed} icon="🩺" />
          <StatCard label="Medicines Done" value={stats.medicines_completed} icon="💊" />
          <StatCard label="Pending Approvals" value={stats.pending_commissions} icon="⏳" />
          <StatCard label="Approved Commissions" value={stats.approved_commissions} icon="✅" />
        </div>
      )}

      {/* PATIENT TABLE */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Patient Overview</h3>

        <div style={{ margin: '1rem 0' }}>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '.6rem .9rem',
              border: '1.5px solid var(--slate-200)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '.9rem'
            }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: 'black' }}>
                <th>Name</th>
                <th>Phone</th>
                <th>Referred By</th>
                <th>Consultation</th>
                <th>Medicine</th>
                <th>Commission</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/patient/${p.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600, color: 'var(--blue-700)' }}>
                    {p.name}
                  </td>
                  <td>{p.phone}</td>
                  <td>{p.referred_by || '-'}</td>
                  <td>{p.consultation_completed ? '✅' : '❌'}</td>
                  <td>{p.medicine_completed ? '✅' : '❌'}</td>
                  <td>{p.commission_processed ? '💰' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMMISSION APPROVAL SECTION */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>
        Pending Commission Approvals
        ({commissions.filter(c => c.status === "credited").length})
        </h3>

        {commissions.filter(c => c.status === "credited").length === 0 && (
          <div style={{ color: 'var(--slate-400)' }}>
            No pending commissions.
          </div>
        )}

        {commissions
          .filter(c => c.status === "credited")
          .map(c => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                border: '1px solid var(--slate-200)',
                borderRadius: '8px',
                marginBottom: '.75rem'
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>
                  ₹{c.commission_amount.toFixed(2)}
                </div>

                <div style={{ fontSize: '.75rem', color: 'var(--slate-400)' }}>
                  Status: {c.status}
                </div>
                <div style={{ fontSize: '.8rem', color: 'var(--slate-400)' }}>
                  Level {c.level} • Bill ₹{c.bill_amount}
                </div>
              </div>

              <button
                className="btn btn-primary btn-sm"
                disabled={approving === c.id}
                onClick={() => handleApprove(c.id)}
              >
                {approving === c.id ? <Spinner /> : "Approve"}
              </button>
            </div>
          ))}
      </div>

      <div className="card" style={{ marginBottom: "2rem" }}>
        <h3>Claim Wallet Amount</h3>

        <div className="form-group">
          <label>Patient Phone</label>
          <input
            value={claimPhone}
            onChange={(e)=>setClaimPhone(e.target.value)}
            placeholder="Enter patient phone"
          />
        </div>

        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            value={claimAmount}
            onChange={(e)=>setClaimAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <button
          className="btn btn-primary"
          disabled={claimLoading}
          onClick={handleWalletClaim}
        >
          {claimLoading ? <Spinner/> : "Claim"}
        </button>
      </div>

      {/* ACTION PANEL */}
      <div className="card">
        <h3>Mark Completion</h3>

        {actionResult && <Alert type="success">{actionResult.message}</Alert>}
        {actionError && <Alert type="error">{actionError}</Alert>}

        <form onSubmit={handleAction}>
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
                <label>Consultation Amount</label>
                <input
                  type="number"
                  value={consultationAmount}
                  onChange={(e) => setConsultationAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Medicine Bill Amount</label>
                <input
                  type="number"
                  value={medicineAmount}
                  onChange={(e) => setMedicineAmount(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Action Type</label>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <label>
                <input
                  type="radio"
                  checked={actionType === 'consultation'}
                  onChange={() => setActionType('consultation')}
                />
                🩺 Consultation
              </label>
              <label>
                <input
                  type="radio"
                  checked={actionType === 'medicine'}
                  onChange={() => setActionType('medicine')}
                />
                💊 Medicine
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              actionLoading ||
              !patientPhone.trim() ||
              (actionType === 'medicine' && !medicineAmount)
            }
          >
            {actionLoading ? <Spinner /> : 'Mark Complete'}
          </button>
        </form>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div>{icon}</div>
      <div>{value ?? '—'}</div>
      <div>{label}</div>
    </div>
  );
}