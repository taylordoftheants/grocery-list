import { useState, useEffect } from 'react';
import { api } from './api';
import ListSidebar from './components/ListSidebar';
import ItemList from './components/ItemList';
import AuthForm from './components/AuthForm';
import NavTabs from './components/NavTabs';
import RecipesView from './components/RecipesView';
import MealPlan from './components/MealPlan';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentView, setCurrentView] = useState('mealplan');

  useEffect(() => {
    api.getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api.getLists()
      .then(data => {
        setLists(data);
        if (data.length > 0) setSelected(data[0].id);
      })
      .catch(e => setError(e.message));
  }, [user]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAuth = (loggedInUser) => {
    setUser(loggedInUser);
    setLists([]);
    setSelected(null);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setLists([]);
    setSelected(null);
  };

  const handleCreateList = async (name) => {
    const list = await api.createList(name);
    setLists(prev => [...prev, list]);
    setSelected(list.id);
  };

  const handleDeleteList = async (listId) => {
    await api.deleteList(listId);
    setLists(prev => {
      const next = prev.filter(l => l.id !== listId);
      if (selectedListId === listId) setSelected(next[0]?.id ?? null);
      return next;
    });
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <p style={{ color: '#9ca3af' }}>Loading...</p>
      </div>
    );
  }

  if (!user) return <AuthForm onAuth={handleAuth} />;

  const selectedList = lists.find(l => l.id === selectedListId);
  const showSidebar = currentView === 'lists';

  const sidebarProps = {
    lists,
    selectedListId,
    onSelect: setSelected,
    onCreate: handleCreateList,
    onDelete: handleDeleteList,
    onLogout: handleLogout,
    user,
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      {error && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', zIndex: 400 }}>
          {error} <button onClick={() => setError(null)} style={{ marginLeft: '1rem' }}>Dismiss</button>
        </div>
      )}

      {/* Desktop sidebar — static flex sibling */}
      {showSidebar && !isMobile && (
        <ListSidebar {...sidebarProps} isMobile={false} />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <NavTabs currentView={currentView} onChangeView={setCurrentView} />

        {/* Mobile inline list bar — sits below tabs, above content */}
        {showSidebar && isMobile && (
          <ListSidebar {...sidebarProps} isMobile={true} />
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {currentView === 'lists' && (
            selectedList
              ? <ItemList list={selectedList} isMobile={isMobile} />
              : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                  <p>Create or select a list to get started.</p>
                </div>
              )
          )}
          {currentView === 'recipes' && <RecipesView isMobile={isMobile} />}
          {currentView === 'mealplan' && <MealPlan lists={lists} isMobile={isMobile} />}
        </div>
      </div>
    </div>
  );
}
