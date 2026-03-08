import { useState, useEffect } from 'react';
import { Trip } from '../types';
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { DEFAULT_CATEGORIES } from '../utils/categories';

export const useFirebaseTrips = (tripId?: string, isReadOnly: boolean = false) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  // Load local trips for the list view (history)
  useEffect(() => {
    const loadLocalTrips = async () => {
      const savedIds = JSON.parse(localStorage.getItem('tripIds') || '[]');
      if (savedIds.length === 0) {
        setTrips([]);
        setLoading(false);
        return;
      }

      try {
        const tripsData: Trip[] = [];
        const validIds: string[] = [];
        
        for (const id of savedIds) {
          const docRef = doc(db, 'trips', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            tripsData.push({ id: docSnap.id, ...docSnap.data() } as Trip);
            validIds.push(id);
          }
        }
        
        // Clean up localStorage if any trips were deleted from the server
        if (validIds.length !== savedIds.length) {
          localStorage.setItem('tripIds', JSON.stringify(validIds));
        }
        
        setTrips(tripsData);
      } catch (err) {
        console.error('Error loading trips:', err);
        setError('Failed to load trips');
      } finally {
        setLoading(false);
      }
    };

    if (!tripId) {
      loadLocalTrips();
    }
  }, [tripId]);

  // Subscribe to a specific trip if ID is provided
  useEffect(() => {
    if (!tripId) return;

    setLoading(true);
    const unsubscribe = onSnapshot(doc(db, 'trips', tripId), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Trip;
        // Ensure categories exist
        if (!data.categories) {
          data.categories = DEFAULT_CATEGORIES;
        }
        setCurrentTrip({ id: doc.id, ...data });
        
        // Check permissions
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        const localTokens = JSON.parse(localStorage.getItem('tripTokens') || '{}');
        const localToken = localTokens[tripId];
        
        // If we have a valid token in URL, save it to local storage
        if (urlToken && data.editCode && urlToken === data.editCode) {
          localTokens[tripId] = urlToken;
          localStorage.setItem('tripTokens', JSON.stringify(localTokens));
        }

        // Allow edit if:
        // 1. Not in readonly mode (explicitly requested)
        // AND
        // 2. (Token matches OR no token exists on trip yet for backward compatibility)
        const hasValidToken = (data.editCode && (urlToken === data.editCode || localToken === data.editCode)) || !data.editCode;
        
        setCanEdit(!isReadOnly && hasValidToken);

        // Save to local history if not already there
        const savedIds = JSON.parse(localStorage.getItem('tripIds') || '[]');
        if (!savedIds.includes(tripId)) {
          localStorage.setItem('tripIds', JSON.stringify([...savedIds, tripId]));
        }
      } else {
        setError('Trip not found');
        setCurrentTrip(null);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching trip:', err);
      setError('Failed to fetch trip');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tripId, isReadOnly]);

  const createTrip = async (trip: Trip) => {
    try {
      // Generate edit code
      const editCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const tripWithCode = { ...trip, editCode };

      // Create main trip document
      await setDoc(doc(db, 'trips', trip.id), tripWithCode);
      
      // Save ID to local storage for history
      const savedIds = JSON.parse(localStorage.getItem('tripIds') || '[]');
      if (!savedIds.includes(trip.id)) {
        localStorage.setItem('tripIds', JSON.stringify([trip.id, ...savedIds]));
      }
      
      // Save token to local storage
      const localTokens = JSON.parse(localStorage.getItem('tripTokens') || '{}');
      localTokens[trip.id] = editCode;
      localStorage.setItem('tripTokens', JSON.stringify(localTokens));

      // Optimistically update local state so we can navigate immediately
      setTrips(prev => [tripWithCode, ...prev]);

      return trip.id;
    } catch (err) {
      console.error('Error creating trip:', err);
      throw err;
    }
  };

  const updateTrip = async (updatedTrip: Trip) => {
    if (isReadOnly) return;
    try {
      // Optimistically update local state
      setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
      if (currentTrip?.id === updatedTrip.id) {
        setCurrentTrip(updatedTrip);
      }

      const tripRef = doc(db, 'trips', updatedTrip.id);
      await updateDoc(tripRef, { ...updatedTrip });
    } catch (err) {
      console.error('Error updating trip:', err);
      // Revert on error (optional, but good practice)
      // For now we just log the error
      throw err;
    }
  };

  const deleteTrip = async (id: string) => {
    // We only remove from local history for now, not from DB to prevent data loss for others
    const savedIds = JSON.parse(localStorage.getItem('tripIds') || '[]');
    const newIds = savedIds.filter((tid: string) => tid !== id);
    localStorage.setItem('tripIds', JSON.stringify(newIds));
    setTrips(prev => prev.filter(t => t.id !== id));
  };

  return {
    trips,
    currentTrip,
    loading,
    error,
    createTrip,
    updateTrip,
    deleteTrip,
    canEdit
  };
};
