import React from 'react';
import { X, Copy, Check, Eye, Pencil, QrCode } from 'lucide-react';
import { useState } from 'react';
import QRCode from "react-qr-code";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

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
  const [showQrEdit, setShowQrEdit] = useState(false);
  const [showQrView, setShowQrView] = useState(false);

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

  const shareViaWhatsApp = (url: string, isEdit: boolean) => {
    const text = isEdit 
      ? `היי! הנה קישור לעריכת הטיול שלנו "${tripName}":\n${url}`
      : `היי! הנה קישור לצפייה בטיול שלנו "${tripName}":\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-20">
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
              <div className="flex flex-col gap-2">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-500 truncate font-mono" dir="ltr">
                  {editUrl}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => shareViaWhatsApp(editUrl, true)}
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    <span className="text-sm">וואטסאפ</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowQrEdit(!showQrEdit);
                      if (!showQrEdit) setShowQrView(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all ${
                      showQrEdit
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                    title="הצג QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="text-sm">QR</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(editUrl, true)}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all ${
                      copiedEdit 
                        ? 'bg-green-50 text-green-600 border border-green-200' 
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    {copiedEdit ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="text-sm">{copiedEdit ? 'הועתק' : 'העתק'}</span>
                  </button>
                </div>
              </div>
              
              {showQrEdit && (
                <div className="flex justify-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                  <QRCode value={editUrl} size={150} />
                </div>
              )}

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
            <div className="flex flex-col gap-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-500 truncate font-mono" dir="ltr">
                {viewUrl}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => shareViaWhatsApp(viewUrl, false)}
                  className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span className="text-sm">וואטסאפ</span>
                </button>
                <button
                  onClick={() => {
                    setShowQrView(!showQrView);
                    if (!showQrView) setShowQrEdit(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all ${
                    showQrView
                      ? 'bg-slate-200 text-slate-800 border border-slate-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                  title="הצג QR Code"
                >
                  <QrCode className="w-4 h-4" />
                  <span className="text-sm">QR</span>
                </button>
                <button
                  onClick={() => copyToClipboard(viewUrl, false)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all ${
                    copiedView 
                      ? 'bg-green-50 text-green-600 border border-green-200' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {copiedView ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span className="text-sm">{copiedView ? 'הועתק' : 'העתק'}</span>
                </button>
              </div>
            </div>

            {showQrView && (
              <div className="flex justify-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <QRCode value={viewUrl} size={150} />
              </div>
            )}

            <p className="text-xs text-slate-400">
              * קישור זה מאפשר צפייה בנתונים בלבד, ללא אפשרות לביצוע שינויים.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
