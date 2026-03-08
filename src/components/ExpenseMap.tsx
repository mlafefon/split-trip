import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Trip } from '../types';
import { formatAmount } from '../utils/currency';
import { ICON_MAP } from '../utils/categories';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type Props = {
  trip: Trip;
};

export const ExpenseMap = ({ trip }: Props) => {
  const expensesWithLocation = trip.expenses.filter(e => e.location && e.tag !== 'העברה');

  if (expensesWithLocation.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>אין הוצאות עם מיקום שמור להצגה על המפה.</p>
        <p className="text-sm mt-2">הוצאות חדשות שיוספו יקבלו מיקום אוטומטית (אם תאשר גישה למיקום).</p>
      </div>
    );
  }

  // Calculate center based on average of all locations
  const avgLat = expensesWithLocation.reduce((sum, e) => sum + (e.location?.lat || 0), 0) / expensesWithLocation.length;
  const avgLng = expensesWithLocation.reduce((sum, e) => sum + (e.location?.lng || 0), 0) / expensesWithLocation.length;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 h-[500px] w-full relative z-0">
      <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">מפת הוצאות</h3>
      <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-200">
        <MapContainer 
          center={[avgLat, avgLng]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {expensesWithLocation.map(expense => {
            const category = trip.categories.find(c => c.name === expense.tag);
            const IconComponent = category ? ICON_MAP[category.icon] : null;
            
            // Create a custom divIcon with the category color
            const customIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: ${category?.color || '#3b82f6'}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                      <div style="width: 12px; height: 12px; background-color: white; border-radius: 50%;"></div>
                     </div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
              popupAnchor: [0, -12]
            });

            return (
              <Marker 
                key={expense.id} 
                position={[expense.location!.lat, expense.location!.lng]}
                icon={customIcon}
              >
                <Popup>
                  <div className="text-right" dir="rtl">
                    <div className="font-bold text-slate-800">{expense.description}</div>
                    <div className="text-sm text-slate-500 mb-1">{expense.tag}</div>
                    <div className="font-medium text-indigo-600" dir="ltr">
                      {formatAmount(expense.amount)} {trip.tripCurrency}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(expense.date).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
