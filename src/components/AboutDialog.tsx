import React from 'react';
import { AppIcon } from './AppIcon';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const AboutDialog = ({ isOpen, onClose }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-indigo-50">
            <AppIcon className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">אודות</h3>
          <p className="text-slate-500 mb-6">vibe by Amir Galanti</p>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
};
