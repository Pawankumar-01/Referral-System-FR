import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  getPatient,
  getWallet,
  getCommissionHistory,
  getPortfolio
} from '../api/axios';

import {
  PageLoader,
  Alert,
  InfoRow,
  Badge,
  fmtDateTime
} from '../components/UI';

export default function PatientPage() {

  const { id } = useParams();

  const [patient, setPatient] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [portfolio, setPortfolio] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {

    try {

      const [p, w, c, pf] = await Promise.all([
        getPatient(id),
        getWallet(id),
        getCommissionHistory(id),
        getPortfolio(id)
      ]);

      setPatient(p);
      setWallet(w);
      setCommissions(c);
      setPortfolio(pf);

    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  if (loading) return <PageLoader />;

  return (
    <div className="page-wrap" style={{ maxWidth: 1000, marginTop: '2rem' }}>

      {error && <Alert type="error">{error}</Alert>}

      {/* PATIENT PROFILE */}
      {patient && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>

          <h1 style={{ marginBottom: '1rem', color: '#2563eb' }}>
            {patient.name}
          </h1>

          <div className="info-grid">

            <InfoRow label="UUID" value={patient.id} />
            <InfoRow label="Phone" value={patient.phone} />
            <InfoRow label="Email" value={patient.email || "—"} />

            <InfoRow
              label="Referral Code"
              value={
                <span style={{ fontWeight: 600, color: "#059669" }}>
                  {patient.coupon_code}
                </span>
              }
            />

          </div>

          {/* QR */}
          {patient.qr_code_path && (
            <div style={{ marginTop: '1.5rem', textAlign: "center" }}>

              <img
                src={patient.qr_code_path}
                alt="QR"
                style={{
                  width: 160,
                  borderRadius: 8,
                  border: "1px solid #ddd"
                }}
              />

            </div>
          )}

          {/* Referral link */}
          {portfolio?.referral_link && (

            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                gap: "10px"
              }}
            >

              <input
                value={portfolio.referral_link}
                readOnly
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 6,
                  border: "1px solid #ddd"
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

      {/* FINANCIAL PORTFOLIO */}
      {portfolio && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>

          <h3 style={{ marginBottom: "1rem" }}>Financial Portfolio</h3>

          <div className="stats-grid">

            <StatCard
              title="Wallet Balance"
              value={`₹${portfolio.wallet_balance}`}
              color="#2563eb"
            />

            <StatCard
              title="Total Generated"
              value={`₹${portfolio.total_generated}`}
              color="#059669"
            />

            <StatCard
              title="Total Claimed"
              value={`₹${portfolio.total_claimed}`}
              color="#f97316"
            />

            <StatCard
              title="Pending Amount"
              value={`₹${portfolio.pending_amount}`}
              color="#eab308"
            />

          </div>

          <div className="info-grid" style={{ marginTop: "1rem" }}>
            <InfoRow label="Total Referrals" value={portfolio.referral_count} />
          </div>

          {portfolio.level_counts && (

            <div className="info-grid" style={{ marginTop: "1rem" }}>

              {Object.entries(portfolio.level_counts).map(([level, count]) => (

                <InfoRow
                  key={level}
                  label={level.replace('_', ' ').toUpperCase()}
                  value={count}
                />

              ))}

            </div>

          )}

        </div>
      )}

      {/* WALLET */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>

        <h3>Wallet Balance</h3>

        <div
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: "#2563eb"
          }}
        >
          ₹{wallet?.balance?.toFixed(2) || "0.00"}
        </div>

      </div>

      {/* COMMISSION HISTORY */}
      <div className="card">

        <h3 style={{ marginBottom: '1rem' }}>Commission History</h3>

        {commissions.length === 0 && (
          <div style={{ color: '#94a3b8' }}>
            No credits yet.
          </div>
        )}

        {commissions.map((c) => (

          <div
            key={c.id}
            style={{
              padding: '1rem',
              border: '1px solid #e2e8f0',
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

              <div style={{ fontSize: '.8rem', color: '#64748b' }}>
                Level {c.level} • Bill ₹{c.bill_amount}
              </div>

              <div style={{ fontSize: '.75rem', color: '#94a3b8' }}>
                {fmtDateTime(c.created_at)}
              </div>

            </div>

            <div>

              {c.status === "credited" && (
                <Badge color="yellow">Pending Approval</Badge>
              )}

              {c.status === "approved" && (
                <Badge color="green">Approved</Badge>
              )}

              {c.status === "claimed" && (
                <Badge color="blue">Claimed</Badge>
              )}

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

function StatCard({ title, value, color }) {

  return (

    <div
      style={{
        padding: "16px",
        borderRadius: 10,
        background: "#f8fafc",
        border: "1px solid #e2e8f0"
      }}
    >

      <div style={{ fontSize: 12, color: "#64748b" }}>
        {title}
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color
        }}
      >
        {value}
      </div>

    </div>

  );
}