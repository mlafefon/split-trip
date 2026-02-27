import { 
  Utensils, Car, ShoppingBag, Bed, Ticket, Zap, Coffee, Beer, Plane, Bus, Train, 
  Fuel, Home, Music, Camera, Gift, Heart, Star, MapPin, Smile, Sun, Moon, Cloud, 
  Umbrella, Anchor, Bike, Briefcase, Calculator, Calendar, Check, Clock, Compass, 
  CreditCard, DollarSign, Eye, FileText, Flag, Globe, Headphones, Image, Key, 
  Link, Lock, Mail, Map, MessageCircle, Mic, Monitor, Moon as MoonIcon, MoreHorizontal, 
  MousePointer, Music as MusicIcon, Navigation, Package, Paperclip, Phone, PieChart, 
  Play, Plus, Power, Printer, Radio, RefreshCw, Save, Search, Send, Settings, Share, 
  Shield, ShoppingCart, Shuffle, Smartphone, Speaker, Square, Star as StarIcon, 
  Tablet, Tag, Target, Terminal, ThumbsUp, ToggleLeft, Wrench, Trash, Trash2, Truck, 
  Tv, Type, Upload, User, Users, Video, Voicemail, Volume, Volume1, Volume2, VolumeX, 
  Watch, Wifi, Wind, X, ZoomIn, ZoomOut 
} from 'lucide-react';
import { Category } from '../types';

export const ICON_MAP: Record<string, any> = {
  Utensils, Car, ShoppingBag, Bed, Ticket, Zap, Coffee, Beer, Plane, Bus, Train, 
  Fuel, Home, Music, Camera, Gift, Heart, Star, MapPin, Smile, Sun, Moon, Cloud, 
  Umbrella, Anchor, Bike, Briefcase, Calculator, Calendar, Check, Clock, Compass, 
  CreditCard, DollarSign, Eye, FileText, Flag, Globe, Headphones, Image, Key, 
  Link, Lock, Mail, Map, MessageCircle, Mic, Monitor, MoonIcon, MoreHorizontal, 
  MousePointer, MusicIcon, Navigation, Package, Paperclip, Phone, PieChart, 
  Play, Plus, Power, Printer, Radio, RefreshCw, Save, Search, Send, Settings, Share, 
  Shield, ShoppingCart, Shuffle, Smartphone, Speaker, Square, StarIcon, 
  Tablet, Tag, Target, Terminal, ThumbsUp, ToggleLeft, Wrench, Trash, Trash2, Truck, 
  Tv, Type, Upload, User, Users, Video, Voicemail, Volume, Volume1, Volume2, VolumeX, 
  Watch, Wifi, Wind, X, ZoomIn, ZoomOut
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'אוכל', icon: 'Utensils', color: '#F59E0B' }, // Amber
  { id: 'transport', name: 'תחבורה', icon: 'Car', color: '#3B82F6' }, // Blue
  { id: 'shopping', name: 'קניות', icon: 'ShoppingBag', color: '#EC4899' }, // Pink
  { id: 'accommodation', name: 'לינה', icon: 'Bed', color: '#8B5CF6' }, // Violet
  { id: 'attractions', name: 'אטרקציות', icon: 'Ticket', color: '#10B981' }, // Emerald
  { id: 'general', name: 'כללי', icon: 'Zap', color: '#6B7280' }, // Gray
];

export const getCategoryIcon = (iconName: string) => {
  return ICON_MAP[iconName] || Zap;
};
