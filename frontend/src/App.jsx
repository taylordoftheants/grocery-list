import { useState, useEffect } from 'react';
import { api } from './api';
import { colors, fonts, fontSizes } from './theme';
import ListSidebar from './components/ListSidebar';
import ItemList from './components/ItemList';
import LandingPage from './components/LandingPage';
import NavTabs from './components/NavTabs';
import RecipesView from './components/RecipesView';
import MealPlan from './components/MealPlan';
import ProfileMenu from './components/ProfileMenu';
import AdminView from './components/AdminView';
import KrogerCartModal from './components/KrogerCartModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentView, setCurrentView] = useState('mealplan');
  const [showProfile, setShowProfile] = useState(false);
  const [showKrogerCartModal, setShowKrogerCartModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('kroger_success')) {
      window.history.replaceState({}, '', window.location.pathname);
      setCurrentView('lists');
      setShowKrogerCartModal(true);
    }
    if (params.get('kroger_error')) {
      window.history.replaceState({}, '', window.location.pathname);
      setError('Kroger login failed. Please try again.');
    }
  }, []);

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
    setShowProfile(false);
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.charcoal, fontFamily: fonts.sans }}>
        <p style={{ color: colors.amber, fontFamily: fonts.display, letterSpacing: '0.08em', fontSize: fontSizes.base }}>Loading…</p>
      </div>
    );
  }

  if (!user) return <LandingPage onAuth={handleAuth} />;

  const selectedList = lists.find(l => l.id === selectedListId);
  const showSidebar = currentView === 'lists';

  const sidebarProps = {
    lists,
    selectedListId,
    onSelect: setSelected,
    onCreate: handleCreateList,
    onDelete: handleDeleteList,
    user,
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', fontFamily: fonts.sans }}>
      {error && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: colors.errorBg, color: colors.errorText, padding: '0.75rem 1rem', zIndex: 400, borderBottom: `2px solid ${colors.errorBorder}`, fontFamily: fonts.sans }}>
          {error} <button onClick={() => setError(null)} style={{ marginLeft: '1rem', cursor: 'pointer', fontWeight: '600' }}>Dismiss</button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <NavTabs
            currentView={currentView}
            onChangeView={setCurrentView}
            user={user}
            onProfileClick={() => setShowProfile(v => !v)}
            isMobile={isMobile}
          />
          {showProfile && (
            <ProfileMenu
              user={user}
              onLogout={handleLogout}
              onNavigateAdmin={() => setCurrentView('admin')}
              onClose={() => setShowProfile(false)}
            />
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Desktop sidebar — nested below nav bar */}
          {showSidebar && !isMobile && (
            <ListSidebar {...sidebarProps} isMobile={false} />
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Mobile inline list bar — sits below tabs, above content */}
            {showSidebar && isMobile && (
              <ListSidebar {...sidebarProps} isMobile={true} />
            )}

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: isMobile ? 'calc(56px + env(safe-area-inset-bottom, 0px))' : 0 }}>
              {currentView === 'lists' && (
                selectedList
                  ? <ItemList list={selectedList} isMobile={isMobile} />
                  : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSubtle }}>
                      <p>Create or select a list to get started.</p>
                    </div>
                  )
              )}
              {currentView === 'recipes' && <RecipesView isMobile={isMobile} />}
              {currentView === 'mealplan' && <MealPlan lists={lists} isMobile={isMobile} onCreateList={handleCreateList} onNavigateToRecipes={() => setCurrentView('recipes')} />}
              {currentView === 'admin' && <AdminView />}
            </div>
          </div>
        </div>
      </div>
      {showKrogerCartModal && selectedList && (
        <KrogerCartModal list={selectedList} isMobile={isMobile} onClose={() => setShowKrogerCartModal(false)} />
      )}
    </div>
  );
}
