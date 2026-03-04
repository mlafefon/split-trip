import { useState, useCallback, useEffect } from 'react';
import { TripList } from './components/TripList';
import { TripView } from './components/TripView';
import { TripForm } from './components/TripForm';
import { useFirebaseTrips } from './hooks/useFirebaseTrips';
import { ChevronRight, Loader2, Share2 } from 'lucide-react';
import { ShareDialog } from './components/ShareDialog';

export default function App() {
  // Check for trip ID in URL query params
  const [urlTripId, setUrlTripId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('trip');
    const view = params.get('view');
    
    if (id) {
      setUrlTripId(id);
      if (view === 'readonly') {
        setIsReadOnly(true);
      }
    }
  }, []);

  const { 
    trips, 
    currentTrip: firebaseTrip, 
    createTrip, 
    updateTrip, 
    deleteTrip,
    loading,
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

  const handleBack = () => {
    if (backHandler && backHandler()) {
      return;
    }
    
    // Always clear URL params when going back to list
    window.history.pushState({}, '', window.location.pathname);
    setUrlTripId(null);
    setCurrentTripId(null);
    setIsCreating(false);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24" dir="rtl">
      <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            {(activeTrip || isCreating) && (
              <button 
                onClick={handleBack}
                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="חזור"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            <h1 
              className={`text-xl font-bold truncate max-w-[200px] ${activeTrip || isCreating ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={() => {
                if (activeTrip || isCreating) {
                  // Force full reset to home
                  if (backHandler) setBackHandler(null);
                  window.history.pushState({}, '', window.location.pathname);
                  setUrlTripId(null);
                  setCurrentTripId(null);
                  setIsCreating(false);
                }
              }}
            >
              {activeTrip ? activeTrip.destination : isCreating ? 'טיול חדש' : 'ניהול תקציב טיולים'}
            </h1>
          </div>
          
          {activeTrip && !isCreating && (
            <button 
              onClick={handleShare}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="שתף טיול"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-xl mx-auto mt-2">
        {isCreating ? (
          <TripForm 
            onSave={async (trip) => {
              await createTrip(trip);
              setIsCreating(false);
              // Optionally navigate to the new trip immediately
              setCurrentTripId(trip.id);
            }} 
            onCancel={() => setIsCreating(false)} 
          />
        ) : activeTrip ? (
          <>
            <TripView 
              trip={activeTrip} 
              updateTrip={updateTrip} 
              setBackHandler={handleSetBackHandler}
              isReadOnly={!activeTripCanEdit}
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
            onSelect={setCurrentTripId} 
            onCreateNew={() => setIsCreating(true)} 
            onDelete={deleteTrip} 
          />
        )}
      </main>
    </div>
  );
}
