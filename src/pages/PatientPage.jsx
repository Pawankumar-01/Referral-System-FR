import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getPatient,
  getWallet,
  getCommissionHistory,
  claimCommission
} from '../api/axios';
import {
  PageLoader,
  Alert,
  InfoRow,
  Badge,
  fmtDateTime,
  CopyBtn,
  Spinner
} from '../components/UI';

export default function PatientPage() {
  const { id } = useParams();

  const [patient, setPatient] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [commissions, setCommissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [p, w, c] = await Promise.all([
        getPatient(id),
        getWallet(id),
        getCommissionHistory(id),
      ]);
      setPatient(p);
      setWallet(w);
      setCommissions(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    loadData();
  }, [id]);

  const handleClaim = async (commissionId) => {
    setClaiming(commissionId);
    try {
      await claimCommission(commissionId);
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setClaiming(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="page-wrap" style={{ maxWidth: 900, marginTop: '2rem' }}>
      {error && <Alert type="error">{error}</Alert>}

      {patient && (
        <>
          {/* Header */}
          <h1 style={{ marginBottom: '1rem' }}>{patient.name}</h1>

          {/* Wallet Section */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3>Wallet Balance</h3>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
              ₹{wallet?.balance?.toFixed(2) || "0.00"}
            </div>
            <div style={{ fontSize: '.85rem', color: 'var(--slate-400)' }}>
              Approved credits only
            </div>
          </div>

          {/* Commission History */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Credit History</h3>

            {commissions.length === 0 && (
              <div style={{ color: 'var(--slate-400)' }}>
                No credits yet.
              </div>
            )}

            {commissions.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '1rem',
                  border: '1px solid var(--slate-200)',
                  borderRadius: '8px',
                  marginBottom: '.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    ₹{c.commission_amount.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--slate-400)' }}>
                    Level {c.level} • Bill ₹{c.bill_amount}
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'var(--slate-400)' }}>
                    {fmtDateTime(c.created_at)}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {c.status === "credited" && (
                    <Badge color="yellow">Pending Approval</Badge>
                  )}

                  {c.status === "approved" && (
                    <>
                      <Badge color="green">Approved</Badge>
                      <div style={{ marginTop: '.5rem' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={claiming === c.id}
                          onClick={() => handleClaim(c.id)}
                        >
                          {claiming === c.id ? <Spinner /> : "Claim"}
                        </button>
                      </div>
                    </>
                  )}

                  {c.status === "claimed" && (
                    <Badge color="blue">Claimed</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}