import React from 'react';

export const AppIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
    {/* Handle */}
    <path d="M 35 25 L 35 12 C 35 10 37 8 40 8 L 60 8 C 63 8 65 10 65 12 L 65 25" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="30" y="6" width="40" height="6" rx="3" fill="#1e293b" />
    
    {/* Wheels */}
    <circle cx="30" cy="85" r="6" fill="#1e293b" />
    <circle cx="70" cy="85" r="6" fill="#1e293b" />
    
    {/* Suitcase Body */}
    <rect x="20" y="25" width="60" height="60" rx="6" fill="#6b8eb3" stroke="#1e293b" strokeWidth="6" strokeLinejoin="round" />
    
    {/* Vertical Lines */}
    <line x1="32" y1="35" x2="32" y2="75" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
    <line x1="44" y1="35" x2="44" y2="75" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
    <line x1="56" y1="35" x2="56" y2="75" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
    <line x1="68" y1="35" x2="68" y2="75" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
    
    {/* Coin Background */}
    <circle cx="75" cy="75" r="22" fill="#ffffff" />
    
    {/* Coin */}
    <circle cx="75" cy="75" r="20" fill="#fde68a" stroke="#1e293b" strokeWidth="5" />
    <circle cx="75" cy="75" r="14" fill="#fcd34d" stroke="#1e293b" strokeWidth="2" />
    
    {/* Dollar Sign */}
    <text x="75" y="85" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold" fill="#1e293b" textAnchor="middle">$</text>
  </svg>
);
