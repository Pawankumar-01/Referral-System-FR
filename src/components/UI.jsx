// Spinner
export function Spinner() {
  return <span className="spinner" aria-label="Loading" />;
}

// Loader full-page
export function PageLoader() {
  return (
    <div className="loader-wrap">
      <div className="spinner" />
      <p>Loading…</p>
    </div>
  );
}

// Alert
export function Alert({ type = 'error', children }) {
  const icons = { error: '✕', success: '✓', info: 'ℹ' };
  return (
    <div className={`alert alert-${type}`} role="alert">
      <span>{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

// Badge
export function Badge({ children, color = 'blue' }) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}

// Copy-to-clipboard button
export function CopyBtn({ text }) {
  const copy = () => { navigator.clipboard.writeText(text).catch(() => {}); };
  return (
    <button onClick={copy} className="btn btn-secondary btn-sm" title="Copy">
      Copy
    </button>
  );
}

// Info row for patient detail
export function InfoRow({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div className="info-row">
      <span className="info-row__label">{label}</span>
      <span className="info-row__value">{String(value)}</span>
    </div>
  );
}

// Format ISO date strings
export function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
