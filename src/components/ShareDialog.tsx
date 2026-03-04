import React from 'react';
import { X, Copy, Check, Eye, Pencil } from 'lucide-react';
import { useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
  editCode?: string;
  canEdit: boolean;
};

export const ShareDialog = ({ isOpen, onClose, tripId, tripName, editCode, canEdit }: Props) => {
  const [copiedEdit, setCopiedEdit] = useState(false);
  const [copiedView, setCopiedView] = useState(false);

  if (!isOpen) return null;

  const baseUrl = window.location.origin + window.location.pathname;
  const viewUrl = `${baseUrl}?trip=${tripId}`;
  const editUrl = editCode ? `${baseUrl}?trip=${tripId}&token=${editCode}` : viewUrl;

  const copyToClipboard = async (text: string, isEdit: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isEdit) {
        setCopiedEdit(true);
        setTimeout(() => setCopiedEdit(false), 2000);
      } else {
        setCopiedView(true);
        setTimeout(() => setCopiedView(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">שיתוף טיול: {tripName}</h3>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Edit Link Section - Only show if user has edit permissions */}
          {canEdit && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-medium">
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                  <Pencil className="w-4 h-4" />
                </div>
                <span>קישור לעריכה</span>
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full mr-auto">לשותפים מלאים</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-500 truncate font-mono" dir="ltr">
                  {editUrl}
                </div>
                <button
                  onClick={() => copyToClipboard(editUrl, true)}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    copiedEdit 
                      ? 'bg-green-50 text-green-600 border border-green-200' 
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  {copiedEdit ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copiedEdit ? 'הועתק' : 'העתק'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400">
                * כל מי שיקבל קישור זה יוכל לערוך, להוסיף ולמחוק הוצאות.
              </p>
            </div>
          )}

          {canEdit && <hr className="border-slate-100" />}

          {/* View Link Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <Eye className="w-4 h-4" />
              </div>
              <span>קישור לצפייה בלבד</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full mr-auto">לאורחים</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-500 truncate font-mono" dir="ltr">
                {viewUrl}
              </div>
              <button
                onClick={() => copyToClipboard(viewUrl, false)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  copiedView 
                    ? 'bg-green-50 text-green-600 border border-green-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {copiedView ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copiedView ? 'הועתק' : 'העתק'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              * קישור זה מאפשר צפייה בנתונים בלבד, ללא אפשרות לביצוע שינויים.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
