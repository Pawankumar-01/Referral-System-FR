import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getNotifications } from '../api/axios';
import { PageLoader, Alert, Badge, fmtDateTime } from '../components/UI';

// NotificationOut fields (exact from backend):
//   id, patient_id, message, notification_type ("sms"|"email"|"in_app"),
//   status ("pending"|"sent"|"failed"), created_at, sent_at

const TYPE_ICONS = { sms: '📱', email: '✉️', in_app: '🔔' };

const STATUS_COLOR = { pending: 'amber', sent: 'green', failed: 'red' };

export default function NotificationsPage() {
  const { patient_id } = useParams();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patient_id) return;
    setLoading(true);
    getNotifications(patient_id)
      .then(setNotifications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [patient_id]);

  if (loading) return <PageLoader />;

  return (
    <div className="page-wrap" style={{ maxWidth: 680, marginTop: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '.25rem' }}>Notifications</h1>
        <p style={{ fontSize: '.9rem' }}>Patient ID: <code style={{ fontSize: '.8rem' }}>{patient_id}</code></p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {!error && notifications.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">🔔</div>
          <p>No notifications yet. You'll receive one when a referral completes consultation.</p>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="card">
          {notifications.map((n) => (
            <div key={n.id} className="notif-item">
              <div className="notif-item__icon">
                {TYPE_ICONS[n.notification_type] || '🔔'}
              </div>
              <div className="notif-item__body">
                <div className="notif-item__message">{n.message}</div>
                <div className="notif-item__meta">
                  <Badge color={STATUS_COLOR[n.status] || 'blue'}>{n.status}</Badge>
                  <span>{n.notification_type}</span>
                  <span>{fmtDateTime(n.created_at)}</span>
                  {n.sent_at && <span>Sent: {fmtDateTime(n.sent_at)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
