const TABS = [
  { id: 'mealplan', label: 'Meal Plan' },
  { id: 'lists',    label: 'Shopping Lists' },
  { id: 'recipes',  label: 'Recipes' },
];

export default function NavTabs({ currentView, onChangeView, user, onProfileClick }) {
  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
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

      <button
        onClick={onProfileClick}
        aria-label="Profile"
        style={{
          marginLeft: 'auto',
          marginRight: '0.75rem',
          alignSelf: 'center',
          width: '2rem',
          height: '2rem',
          borderRadius: '50%',
          background: '#1a2744',
          color: '#f2ead8',
          border: 'none',
          fontSize: '0.8125rem',
          fontWeight: '700',
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {initial}
      </button>
    </div>
  );
}
