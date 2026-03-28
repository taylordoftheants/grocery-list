import { useState, useEffect } from 'react';
import { api } from './api';
import { colors, fonts, fontSizes, fontWeights, radii, shadows } from './theme';
import ListSidebar from './components/ListSidebar';
import ItemList from './components/ItemList';
import LandingPage from './components/LandingPage';
import NavTabs from './components/NavTabs';
import RecipesView from './components/RecipesView';
import MealPlan from './components/MealPlan';
import ProfileMenu from './components/ProfileMenu';
import AdminView from './components/AdminView';
import HowItWorks from './components/HowItWorks';
import ItemMemoryView from './components/ItemMemoryView';
import KrogerSelectionModal from './components/KrogerSelectionModal';
import KrogerModal from './components/KrogerModal';
import {
  DndContext, DragOverlay, MouseSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentView, setCurrentView] = useState('mealplan');
  const [showProfile, setShowProfile] = useState(false);
  const [showKrogerSelectionModal, setShowKrogerSelectionModal] = useState(false);
  const [restoredKrogerSelections, setRestoredKrogerSelections] = useState(null);
  const [pendingKrogerListId, setPendingKrogerListId] = useState(null);
  const [showKrogerConnect, setShowKrogerConnect] = useState(false);
  const [krogerConnectMode, setKrogerConnectMode] = useState('connect');
  const [draggingList, setDraggingList] = useState(null);
  const [itemRefreshKey, setItemRefreshKey] = useState(0);
  const [toast, setToast] = useState(null); // { message, id }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('kroger_success')) {
      window.history.replaceState({}, '', window.location.pathname);
      setCurrentView('lists');
      let pending = null;
      try {
        const raw = sessionStorage.getItem('kroger_pending_selections');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Date.now() - parsed.savedAt < 30 * 60 * 1000) pending = parsed;
          sessionStorage.removeItem('kroger_pending_selections');
        }
      } catch { /* ignore */ }
      try {
        const rawListId = sessionStorage.getItem('kroger_pending_list_id');
        if (rawListId) {
          sessionStorage.removeItem('kroger_pending_list_id');
          const parsed = parseInt(rawListId, 10);
          if (!isNaN(parsed)) setPendingKrogerListId(parsed);
        }
      } catch { /* ignore */ }
      setRestoredKrogerSelections(pending);
      setShowKrogerSelectionModal(true);
    }
    if (params.get('kroger_error')) {
      window.history.replaceState({}, '', window.location.pathname);
      try { sessionStorage.removeItem('kroger_pending_selections'); } catch {}
      try { sessionStorage.removeItem('kroger_pending_list_id'); } catch {}
      setCurrentView('lists');
      setError('Harris Teeter connection failed. Please try again.');
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

  // After OAuth redirect: once lists load, select the list the user was shopping from
  useEffect(() => {
    if (!pendingKrogerListId || lists.length === 0) return;
    const target = lists.find(l => l.id === pendingKrogerListId);
    if (target) setSelected(target.id);
    setPendingKrogerListId(null);
  }, [pendingKrogerListId, lists]);

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

  const handleRenameList = async (listId, name) => {
    const updated = await api.renameList(listId, name);
    setLists(prev => prev.map(l => l.id === listId ? updated : l));
  };

  const handleReorderLists = async (ids) => {
    // Optimistic update
    setLists(prev => {
      const map = new Map(prev.map(l => [l.id, l]));
      return ids.map(id => map.get(id)).filter(Boolean);
    });
    await api.reorderLists(ids);
  };

  const showToast = (message) => {
    const id = Date.now();
    setToast({ message, id });
    setTimeout(() => setToast(t => t?.id === id ? null : t), 3000);
  };

  const handleMoveItem = async (fromListId, itemId, toListId, itemName) => {
    try {
      await api.moveItem(fromListId, itemId, toListId);
      setItemRefreshKey(k => k + 1);
      if (itemName) {
        const toList = lists.find(l => l.id === toListId);
        if (toList) showToast(`${itemName} moved to ${toList.name}`);
      }
    } catch (err) {
      console.error('Failed to move item:', err);
    }
  };

  const handleDragStart = ({ active }) => {
    setDraggingList(lists.find(l => l.id === active.id) ?? null);
  };

  const handleDragEnd = ({ active, over }) => {
    setDraggingList(null);
    if (!over || active.id === over.id) return;
    const oldIndex = lists.findIndex(l => l.id === active.id);
    const newIndex = lists.findIndex(l => l.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      handleReorderLists(arrayMove(lists, oldIndex, newIndex).map(l => l.id));
    }
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
    onRename: handleRenameList,
    onReorderLists: handleReorderLists,
    user,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingList(null)}
    >
      <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', fontFamily: fonts.sans }}>
        {error && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: colors.errorBg, color: colors.errorText, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)', paddingBottom: '0.75rem', paddingLeft: '1rem', paddingRight: '1rem', zIndex: 400, borderBottom: `2px solid ${colors.errorBorder}`, fontFamily: fonts.sans }}>
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
                onNavigateItemMemory={() => { setCurrentView('items'); setShowProfile(false); }}
                onClose={() => setShowProfile(false)}
                onOpenKroger={(mode) => { setKrogerConnectMode(mode); setShowKrogerConnect(true); setShowProfile(false); }}
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

              <div style={{ flex: 1, overflowY: 'auto', paddingBottom: isMobile ? 'calc(56px + env(safe-area-inset-bottom, 0px))' : 0, background: colors.bgPage }}>
                {currentView === 'lists' && (
                  selectedList
                    ? <ItemList list={selectedList} lists={lists} isMobile={isMobile} onMoveItem={handleMoveItem} refreshKey={itemRefreshKey} />
                    : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSubtle }}>
                        <p>Create or select a list to get started.</p>
                      </div>
                    )
                )}
                {currentView === 'recipes' && <RecipesView isMobile={isMobile} />}
                {currentView === 'mealplan' && <MealPlan lists={lists} isMobile={isMobile} onCreateList={handleCreateList} onNavigateToRecipes={() => setCurrentView('recipes')} onNavigateToList={(listId) => { setSelected(listId); setCurrentView('lists'); }} />}
                {currentView === 'admin' && <AdminView />}
                {currentView === 'howitworks' && <HowItWorks isMobile={isMobile} />}
                {currentView === 'items' && <ItemMemoryView />}
              </div>
            </div>
          </div>
        </div>
        {showKrogerSelectionModal && selectedList && (
          <KrogerSelectionModal
            list={selectedList}
            isMobile={isMobile}
            onClose={() => { setShowKrogerSelectionModal(false); setRestoredKrogerSelections(null); }}
            initialSelections={restoredKrogerSelections?.listId === selectedList.id ? restoredKrogerSelections.itemStates : null}
          />
        )}
        {showKrogerConnect && (
          <KrogerModal mode={krogerConnectMode} isMobile={isMobile} onClose={() => setShowKrogerConnect(false)} />
        )}
      </div>

      <DragOverlay>
        {draggingList && (
          <div style={{
            padding: '0.5rem 0.75rem',
            border: `1px solid ${colors.amberBorder}`,
            borderRadius: radii.md,
            background: colors.amberLight,
            fontSize: fontSizes.base,
            fontFamily: fonts.sans,
            color: colors.amberDark,
            fontWeight: '600',
          }}>
            {draggingList.name}
          </div>
        )}
      </DragOverlay>
      {toast && (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            bottom: isMobile ? 'calc(56px + env(safe-area-inset-bottom, 0px) + 12px)' : '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: colors.charcoal,
            color: colors.amberLight,
            padding: '0.625rem 1.125rem',
            borderRadius: radii.full,
            fontSize: fontSizes.base,
            fontFamily: fonts.sans,
            fontWeight: fontWeights.medium,
            boxShadow: shadows.lg,
            zIndex: 1000,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            animation: 'toastSlideUp 0.25s cubic-bezier(0.34,1.1,0.64,1) both',
            border: `1px solid ${colors.charcoalBorder}`,
          }}
        >
          {toast.message}
        </div>
      )}
    </DndContext>
  );
}
