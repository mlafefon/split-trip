import { useState, useCallback, useEffect, useRef } from 'react';
import { TripList } from './components/TripList';
import { TripView } from './components/TripView';
import { TripForm } from './components/TripForm';
import { useFirebaseTrips } from './hooks/useFirebaseTrips';
import { ChevronRight, Loader2, Share2, Pencil, WifiOff, MoreVertical, Archive, Trash2, Tags } from 'lucide-react';
import { ShareDialog } from './components/ShareDialog';
import { InstallPrompt } from './components/InstallPrompt';
import { ConfirmDialog } from './components/ConfirmDialog';
import { CategoryEditor } from './components/CategoryEditor';
import metadata from '../metadata.json';

import { ExportReport } from './components/ExportReport';

export default function App() {
  // Check for trip ID in URL query params
  const [urlTripId, setUrlTripId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isExportView, setIsExportView] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVibeModal, setShowVibeModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('trip');
    const view = params.get('view');
    
    if (id) {
      setUrlTripId(id);
      if (view === 'readonly') {
        setIsReadOnly(true);
      }
      if (view === 'export') {
        setIsExportView(true);
      }
    }
  }, []);

  const { 
    trips, 
    archivedTrips,
    currentTrip: firebaseTrip, 
    createTrip, 
    updateTrip, 
    deleteTrip,
    archiveTrip,
    unarchiveTrip,
    loadArchivedTrips,
    loading,
    loadingArchived,
    canEdit
  } = useFirebaseTrips(urlTripId || undefined, isReadOnly);

  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [backHandler, setBackHandler] = useState<(() => boolean) | null>(null);

  // If we have a URL trip ID, that's our current trip
  const activeTrip = urlTripId ? firebaseTrip : trips.find(t => t.id === currentTripId);

  // Calculate canEdit for the active trip (whether from URL or local list)
  const activeTripCanEdit = (() => {
    if (!activeTrip) return false;
    if (isReadOnly) return false;
    
    // If it came from URL, use the hook's result
    if (urlTripId) return canEdit;
    
    // Otherwise check local storage tokens
    const localTokens = JSON.parse(localStorage.getItem('tripTokens') || '{}');
    const localToken = localTokens[activeTrip.id];
    
    // Allow edit if:
    // 1. Token matches
    // OR
    // 2. No token exists on trip yet (backward compatibility)
    return (activeTrip.editCode && localToken === activeTrip.editCode) || !activeTrip.editCode;
  })();

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTrip?.id, isCreating]);

  // Ref to track if we pushed a modal state
  const modalHistoryPushed = useRef(false);

  // Handle Back Handler (Modals) with History
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If we have a back handler, it means we have an open modal/view
      if (backHandler) {
        // Attempt to handle the back action internally
        const handled = backHandler();
        if (handled) {
          // If handled, we successfully closed the modal.
          // Since this was triggered by popstate, the browser history is already updated.
          // We mark that we consumed the history entry.
          modalHistoryPushed.current = false;
          return;
        }
      }

      // If not handled by backHandler (or no backHandler), handle navigation
      const params = new URLSearchParams(window.location.search);
      const id = params.get('trip');
      
      if (!id) {
        // Back to list
        setUrlTripId(null);
        setCurrentTripId(null);
        setIsCreating(false);
        // Clear any back handler
        if (backHandler) setBackHandler(null);
      } else {
        // Navigated to a trip (e.g. forward button)
        setUrlTripId(id);
        setCurrentTripId(id);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [backHandler]); // Re-bind when backHandler changes

  // Push history when entering modal state
  useEffect(() => {
    if (backHandler && !modalHistoryPushed.current) {
      // Push a new state for the modal
      window.history.pushState({ modal: true }, '');
      modalHistoryPushed.current = true;
    } else if (!backHandler && modalHistoryPushed.current) {
      // Modal closed programmatically (not by back button)
      // We should revert the history push to avoid "forward" button enabling
      // But calling history.back() here might trigger popstate and cause loops or issues
      // if not careful. 
      // Safe approach: just leave the history entry. User will have to press back twice to exit trip?
      // Or better: use history.back() but ignore the next popstate?
      
      // Let's try simply: if we are here, it means state changed without popstate.
      // We can try to go back.
      window.history.back();
      modalHistoryPushed.current = false;
    }
  }, [backHandler]);

  const handleSelectTrip = (id: string) => {
    setCurrentTripId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('trip', id);
    window.history.pushState({ tripId: id }, '', url.toString());
  };

  const handleBack = () => {
    if (isCreating) {
      setIsCreating(false);
      return;
    }
    
    // If we have a backHandler (modal open), let history.back() trigger popstate to close it
    if (backHandler) {
      window.history.back();
      return;
    }

    // If we are viewing a trip, we want to go back to the list.
    // If the user opened the app via a direct link to a trip, window.history.length might be small (e.g., 1 or 2).
    // Using history.back() in that case would exit the app.
    // To prevent exiting the app, we can just clear the URL state manually and push the root URL.
    modalHistoryPushed.current = false;
    window.history.pushState({}, '', window.location.pathname);
    setUrlTripId(null);
    setCurrentTripId(null);
  };

  const handleSetBackHandler = useCallback((handler: (() => boolean) | null) => {
    setBackHandler(() => handler);
  }, []);

  const handleShare = () => {
    if (!activeTrip) return;
    setShowShareDialog(true);
  };

  if (loading && urlTripId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">טוען נתוני טיול...</p>
        </div>
      </div>
    );
  }

  if (isExportView && activeTrip) {
    return <ExportReport trip={activeTrip} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24" dir="rtl">
      <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-20">
        {isOffline && (
          <div className="absolute top-full left-0 right-0 bg-yellow-500 text-yellow-950 text-xs font-medium py-1 px-4 text-center flex items-center justify-center gap-2 shadow-sm z-10">
            <WifiOff className="w-3 h-3" />
            מצב לא מקוון - הנתונים יסונכרנו כשהחיבור יחזור
          </div>
        )}
        <div className="max-w-xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {(activeTrip || isCreating) && (
              <button 
                onClick={handleBack}
                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0"
                title="חזור"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            <h1 
              className={`text-xl font-bold flex items-center gap-2 min-w-0 ${activeTrip || isCreating ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={() => {
                if (activeTrip || isCreating) {
                  // Force full reset to home
                  if (backHandler) setBackHandler(null);
                  modalHistoryPushed.current = false;
                  window.history.pushState({}, '', window.location.pathname);
                  setUrlTripId(null);
                  setCurrentTripId(null);
                  setIsCreating(false);
                }
              }}
            >
              {activeTrip && <span className="shrink-0">{activeTrip.icon || '✈️'}</span>}
              <span className="truncate">
                {activeTrip ? activeTrip.destination : isCreating ? 'טיול חדש' : 'ניהול תקציב טיולים'}
              </span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {!activeTrip && !isCreating && (
              <span 
                className="text-[10px] text-white/50 font-mono cursor-pointer select-none" 
                dir="ltr"
                onDoubleClick={() => setShowVibeModal(true)}
              >
                v{metadata.version}
              </span>
            )}
            {activeTrip && !isCreating && (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  title="תפריט"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {isMenuOpen && (
                  <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 text-slate-800">
                    <button 
                      onClick={() => { setIsMenuOpen(false); handleShare(); }}
                      className="w-full text-right px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm"
                    >
                      <Share2 className="w-4 h-4 text-slate-500" />
                      שיתוף טיול
                    </button>
                    
                    {activeTripCanEdit && !isEditingTrip && (
                      <>
                        <button 
                          onClick={() => { setIsMenuOpen(false); setIsEditingTrip(true); }}
                          className="w-full text-right px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm"
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                          עריכת טיול
                        </button>
                        <button 
                          onClick={() => { setIsMenuOpen(false); setIsEditingCategories(true); }}
                          className="w-full text-right px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm"
                        >
                          <Tags className="w-4 h-4 text-slate-500" />
                          עריכת קטגוריות
                        </button>
                      </>
                    )}
                    
                    <button 
                      onClick={() => { 
                        setIsMenuOpen(false); 
                        archiveTrip(activeTrip.id);
                        if (backHandler) setBackHandler(null);
                        modalHistoryPushed.current = false;
                        window.history.pushState({}, '', window.location.pathname);
                        setUrlTripId(null);
                        setCurrentTripId(null);
                      }}
                      className="w-full text-right px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm"
                    >
                      <Archive className="w-4 h-4 text-slate-500" />
                      העבר לארכיון
                    </button>

                    {activeTripCanEdit && (
                      <button 
                        onClick={() => { setIsMenuOpen(false); setShowDeleteConfirm(true); }}
                        className="w-full text-right px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-sm text-red-600 border-t border-slate-100"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                        מחיקת טיול
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 max-w-xl mx-auto mt-2">
        <ConfirmDialog 
          isOpen={showVibeModal}
          title="אודות"
          message="vibe by Amir Galanti"
          onConfirm={() => setShowVibeModal(false)}
          onCancel={() => setShowVibeModal(false)}
        />
        <ConfirmDialog 
          isOpen={showDeleteConfirm}
          title="מחיקת טיול"
          message="האם אתה בטוח שברצונך למחוק טיול זה? הפעולה תסיר אותו מהרשימה שלך."
          onConfirm={() => {
            if (activeTrip) {
              deleteTrip(activeTrip.id);
              setShowDeleteConfirm(false);
              if (backHandler) setBackHandler(null);
              modalHistoryPushed.current = false;
              window.history.pushState({}, '', window.location.pathname);
              setUrlTripId(null);
              setCurrentTripId(null);
            }
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        {isCreating ? (
          <TripForm 
            onSave={(trip) => {
              // Fire and forget the createTrip call so the UI doesn't block if offline
              createTrip(trip).catch(error => {
                console.error("Failed to create trip in Firebase:", error);
              });
              
              setIsCreating(false);
              // Navigate to the new trip immediately
              handleSelectTrip(trip.id);
            }} 
            onCancel={() => setIsCreating(false)} 
          />
        ) : activeTrip && isEditingCategories ? (
          <CategoryEditor
            categories={activeTrip.categories}
            onSave={async (newCategories) => {
              await updateTrip({ ...activeTrip, categories: newCategories });
              setIsEditingCategories(false);
            }}
            onClose={() => setIsEditingCategories(false)}
          />
        ) : activeTrip ? (
          <>
            <TripView 
              trip={activeTrip} 
              updateTrip={updateTrip} 
              setBackHandler={handleSetBackHandler}
              isReadOnly={!activeTripCanEdit}
              isEditing={isEditingTrip}
              onEditChange={setIsEditingTrip}
            />
            <ShareDialog 
              isOpen={showShareDialog}
              onClose={() => setShowShareDialog(false)}
              tripId={activeTrip.id}
              tripName={activeTrip.destination}
              editCode={activeTrip.editCode}
              canEdit={activeTripCanEdit}
            />
          </>
        ) : (
          <TripList 
            trips={trips} 
            archivedTrips={archivedTrips}
            loadingArchived={loadingArchived}
            onSelect={handleSelectTrip} 
            onCreateNew={() => setIsCreating(true)} 
            onDelete={deleteTrip} 
            onLoadArchived={loadArchivedTrips}
            onUnarchive={unarchiveTrip}
          />
        )}
      </main>
      
      <InstallPrompt />
    </div>
  );
}
