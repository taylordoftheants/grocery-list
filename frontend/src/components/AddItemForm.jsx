import { useState } from 'react';
import { colors, fonts, fontSizes, fontWeights, radii, input, btnPrimary } from '../theme';

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
        style={{ ...input, flex: 1, width: 'auto' }}
      />
      <input
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Qty"
        style={{ ...input, width: '5rem' }}
      />
      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          ...btnPrimary,
          background: canSubmit ? colors.blue : colors.borderMid,
          cursor: canSubmit ? 'pointer' : 'default',
          flexShrink: 0,
        }}
      >
        Add
      </button>
    </form>
  );
}
