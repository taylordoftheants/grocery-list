import { useState } from 'react';

export default function AddItemForm({ onAdd }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setLoading(true);
    try {
      await onAdd(name.trim(), amount.trim());
      setName('');
      setAmount('');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = name.trim().length > 0 && !loading;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Add item..."
        style={{
          flex: 1,
          padding: '0.625rem 0.75rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          fontSize: '1rem',
        }}
      />
      <input
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Qty"
        style={{
          width: '5rem',
          padding: '0.625rem 0.75rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          fontSize: '1rem',
        }}
      />
      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          padding: '0.625rem 1.25rem',
          background: canSubmit ? '#2563eb' : '#d1d5db',
          color: '#fff',
          border: 'none',
          borderRadius: '0.375rem',
          fontSize: '1rem',
          cursor: canSubmit ? 'pointer' : 'default',
          transition: 'background 0.15s',
        }}
      >
        Add
      </button>
    </form>
  );
}
