import { useState, useEffect } from 'react';
import { api } from './api';
import ListSidebar from './components/ListSidebar';
import ItemList from './components/ItemList';

export default function App() {
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getLists()
      .then(data => {
        setLists(data);
        if (data.length > 0) setSelected(data[0].id);
      })
      .catch(e => setError(e.message));
  }, []);

  const handleCreateList = async (name) => {
    const list = await api.createList(name);
    setLists(prev => [...prev, list]);
    setSelected(list.id);
  };

  const handleDeleteList = async (listId) => {
    await api.deleteList(listId);
    setLists(prev => {
      const next = prev.filter(l => l.id !== listId);
      if (selectedListId === listId) {
        setSelected(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const selectedList = lists.find(l => l.id === selectedListId);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {error && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem',
          zIndex: 100,
        }}>
          {error} <button onClick={() => setError(null)} style={{ marginLeft: '1rem' }}>Dismiss</button>
        </div>
      )}
      <ListSidebar
        lists={lists}
        selectedListId={selectedListId}
        onSelect={setSelected}
        onCreate={handleCreateList}
        onDelete={handleDeleteList}
      />
      {selectedList
        ? <ItemList list={selectedList} />
        : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            <p>Create or select a list to get started.</p>
          </div>
        )
      }
    </div>
  );
}
