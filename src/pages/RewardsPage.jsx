import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getWallet, getCommissionHistory } from '../api/axios';
import { PageLoader, Alert, Badge, fmtDate } from '../components/UI';

export default function RewardsPage() {
  const { patient_id } = useParams();

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patient_id) return;

    setLoading(true);

    Promise.all([
      getWallet(patient_id),
      getCommissionHistory(patient_id)
    ])
      .then(([walletData, txData]) => {
        setWallet(walletData);
        setTransactions(txData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

  }, [patient_id]);

  if (loading) return <PageLoader />;

  const totalTransactions = transactions.length;

  const level1 = transactions.filter(t => t.level === 1);
  const level2 = transactions.filter(t => t.level === 2);
  const level3 = transactions.filter(t => t.level === 3);

  return (
    <div className="page-wrap" style={{ maxWidth: 720, marginTop: '2rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '.25rem' }}>Wallet & Earnings</h1>
        <p style={{ fontSize: '.9rem' }}>
          Patient ID: <code style={{ fontSize: '.8rem' }}>{patient_id}</code>
        </p>
      </div>

      {/* Summary */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Earnings Overview</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem'
        }}>
          <SummaryBox label="Wallet Balance (₹)" value={wallet?.balance?.toFixed(2) || "0.00"} />
          <SummaryBox label="Total Earned (₹)" value={wallet?.total_earned?.toFixed(2) || "0.00"} />
          <SummaryBox label="Total Transactions" value={wallet?.total_transactions || 0} />
          <SummaryBox label="Level 1 Earnings" value={`₹ ${level1.reduce((s,t)=>s+t.commission_amount,0).toFixed(2)}`} />
          <SummaryBox label="Level 2 Earnings" value={`₹ ${level2.reduce((s,t)=>s+t.commission_amount,0).toFixed(2)}`} />
          <SummaryBox label="Level 3 Earnings" value={`₹ ${level3.reduce((s,t)=>s+t.commission_amount,0).toFixed(2)}`} />
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {transactions.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-state__icon">💰</div>
          <p>No commissions yet. Earnings are credited after a referred patient completes full payment.</p>
        </div>
      )}

      {/* COMMISSION HISTORY */}
      {transactions.length > 0 && (
        <Section title={`Commission History (${totalTransactions})`}>
          {transactions.map((tx) => (
            <CommissionCard key={tx.id} tx={tx} />
          ))}
        </Section>
      )}

    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function SummaryBox({ label, value }) {
  return (
    <div style={{
      background: 'var(--slate-50)',
      padding: '1rem',
      borderRadius: 'var(--radius-sm)',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '.75rem', color: 'var(--slate-400)' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h3 style={{
        marginBottom: '1rem',
        color: 'var(--slate-600)',
        fontWeight: 600
      }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {children}
      </div>
    </section>
  );
}

function CommissionCard({ tx }) {
  return (
    <div className="reward-card">
      <div className="reward-card__left">
        <span className="reward-card__icon">💸</span>
        <div>
          <div className="reward-card__percent">
            ₹ {tx.commission_amount.toFixed(2)}
          </div>

          <div className="reward-card__type">
            Level {tx.level} Commission
          </div>

          <div style={{ fontSize: '.75rem', color: 'var(--slate-400)' }}>
            Bill Amount: ₹ {tx.bill_amount}
          </div>

          <div style={{ fontSize: '.75rem', color: 'var(--slate-400)' }}>
            Date: {fmtDate(tx.created_at)}
          </div>

          <div style={{ fontSize: '.75rem', color: 'var(--slate-400)' }}>
            From Patient: {tx.source_patient_id}
          </div>
        </div>
      </div>

      <Badge color="green">Credited</Badge>
    </div>
  );
}