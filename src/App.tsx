import { useState } from 'react';
import { TripList } from './components/TripList';
import { TripView } from './components/TripView';
import { TripForm } from './components/TripForm';
import { useTrips } from './hooks/useTrips';
import { ChevronRight } from 'lucide-react';

export default function App() {
  const { trips, addTrip, updateTrip, deleteTrip } = useTrips();
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const currentTrip = trips.find(t => t.id === currentTripId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24" dir="rtl">
      <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center justify-center relative">
          <h1 className="text-xl font-bold">
            {currentTrip ? currentTrip.destination : isCreating ? 'טיול חדש' : 'ניהול תקציב טיולים'}
          </h1>
          {(currentTrip || isCreating) && (
            <button 
              onClick={() => {
                setCurrentTripId(null);
                setIsCreating(false);
              }}
              className="absolute right-0 p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="חזור"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto mt-2">
        {isCreating ? (
          <TripForm 
            onSave={(trip) => {
              addTrip(trip);
              setIsCreating(false);
              setCurrentTripId(trip.id);
            }} 
            onCancel={() => setIsCreating(false)} 
          />
        ) : currentTrip ? (
          <TripView trip={currentTrip} updateTrip={updateTrip} />
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
