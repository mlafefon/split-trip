import { useState } from 'react';
import { Category } from '../types';
import { ICON_MAP } from '../utils/categories';
import { X, Check, Trash2, Plus, Pencil } from 'lucide-react';

type Props = {
  categories: Category[];
  onSave: (categories: Category[]) => void;
  onClose: () => void;
};

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', 
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', 
  '#64748B', '#000000'
];

const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export const CategoryEditor = ({ categories, onSave, onClose }: Props) => {
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Edit State
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditIcon(category.icon);
    setEditColor(category.color);
  };

  const startNew = () => {
    const newId = crypto.randomUUID();
    setEditingId(newId);
    setEditName('');
    setEditIcon('Zap');
    setEditColor(COLORS[0]);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;

    if (localCategories.find(c => c.id === editingId)) {
      setLocalCategories(localCategories.map(c => 
        c.id === editingId 
          ? { ...c, name: editName, icon: editIcon, color: editColor }
          : c
      ));
    } else {
      setLocalCategories([...localCategories, {
        id: editingId!,
        name: editName,
        icon: editIcon,
        color: editColor
      }]);
    }
    setEditingId(null);
  };

  const deleteCategory = (id: string) => {
    if (confirm('האם למחוק קטגוריה זו?')) {
      setLocalCategories(localCategories.filter(c => c.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const handleSaveAll = () => {
    onSave(localCategories);
    onClose();
  };

  const IconComponent = (name: string) => {
    const Icon = ICON_MAP[name];
    return Icon ? <Icon className="w-6 h-6" /> : null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-10 duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <h2 className="text-xl font-bold text-slate-800">ניהול קטגוריות</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
          <X className="w-6 h-6 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {editingId ? (
          <div className="space-y-6 max-w-md mx-auto">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">שם הקטגוריה</label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="לדוגמה: אוכל"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">צבע</label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setEditColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${editColor === color ? 'border-indigo-600 scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">אייקון</label>
              <div className="grid grid-cols-6 gap-3 max-h-60 overflow-y-auto p-2 border border-slate-100 rounded-xl">
                {AVAILABLE_ICONS.map(iconName => {
                  const Icon = ICON_MAP[iconName];
                  return (
                    <button
                      key={iconName}
                      onClick={() => setEditIcon(iconName)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all ${editIcon === iconName ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500' : 'hover:bg-slate-50 text-slate-500'}`}
                    >
                      <Icon className="w-6 h-6" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={saveEdit}
                className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-medium hover:bg-indigo-700"
              >
                שמור שינויים
              </button>
              <button 
                onClick={() => setEditingId(null)}
                className="flex-1 bg-slate-100 text-slate-700 p-3 rounded-xl font-medium hover:bg-slate-200"
              >
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {localCategories.map(category => {
              const Icon = ICON_MAP[category.icon];
              return (
                <div key={category.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: category.color }}
                    >
                      {Icon && <Icon className="w-6 h-6" />}
                    </div>
                    <span className="font-bold text-slate-800">{category.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => startEditing(category)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => deleteCategory(category.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
            
            <button 
              onClick={startNew}
              className="mt-4 w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-medium hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              הוסף קטגוריה חדשה
            </button>
          </div>
        )}
      </div>

      {!editingId && (
        <div className="p-4 border-t border-slate-100 bg-white">
          <button 
            onClick={handleSaveAll}
            className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
          >
            סיום ושמירה
          </button>
        </div>
      )}
    </div>
  );
};
