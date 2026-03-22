export default function AddToListModal({ lists, onConfirm, onClose, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: '0.75rem',
        padding: '1.5rem', width: '100%', maxWidth: '360px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.25rem', color: '#111827' }}>
          Add to Grocery List
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
          Which list should the ingredients go to?
        </p>

        {lists.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
            You have no grocery lists. Create one in the Grocery Lists tab first.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', marginBottom: '1rem' }}>
            {lists.map(list => (
              <li key={list.id}>
                <button
                  disabled={loading}
                  onClick={() => onConfirm(list.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '0.625rem 0.75rem',
                    border: '1px solid #e5e7eb', borderRadius: '0.375rem',
                    background: '#fff', cursor: loading ? 'default' : 'pointer',
                    fontSize: '0.9375rem', color: '#374151',
                    marginBottom: '0.375rem',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {list.name}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '0.5rem',
            background: 'transparent', border: '1px solid #d1d5db',
            borderRadius: '0.375rem', fontSize: '0.9375rem',
            cursor: 'pointer', color: '#6b7280',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
