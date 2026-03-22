const TABS = [
  { id: 'lists',    label: 'Shopping Lists' },
  { id: 'mealplan', label: 'Meal Plan' },
  { id: 'recipes',  label: 'Recipes' },
];

export default function NavTabs({ currentView, onChangeView }) {
  return (
    <div style={{
      display: 'flex',
      borderBottom: '2px solid #e5e7eb',
      background: '#fff',
      flexShrink: 0,
    }}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChangeView(tab.id)}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            borderBottom: currentView === tab.id ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-2px',
            background: 'transparent',
            color: currentView === tab.id ? '#2563eb' : '#6b7280',
            fontWeight: currentView === tab.id ? '600' : 'normal',
            fontSize: '0.875rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
