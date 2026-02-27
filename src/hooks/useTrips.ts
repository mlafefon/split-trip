import { useState, useEffect } from 'react';
import { Trip } from '../types';
import { DEFAULT_CATEGORIES } from '../utils/categories';

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('trips');
    const parsedTrips = saved ? JSON.parse(saved) : [];
    
    // Ensure categories exist for legacy trips
    return parsedTrips.map((t: Trip) => ({
      ...t,
      categories: t.categories || DEFAULT_CATEGORIES
    }));
  });

  useEffect(() => {
    localStorage.setItem('trips', JSON.stringify(trips));
  }, [trips]);

  const addTrip = (trip: Trip) => setTrips(prev => [trip, ...prev]);
  
  const updateTrip = (updatedTrip: Trip) => {
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
  };

  const deleteTrip = (id: string) => {
    setTrips(prev => prev.filter(t => t.id !== id));
  };

  return { trips, addTrip, updateTrip, deleteTrip };
};
