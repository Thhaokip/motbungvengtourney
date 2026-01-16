import React, { useState } from 'react';
import { Player, Team } from '../types';
import { User, AlertCircle } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  team?: Team;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, team }) => {
  const [imageError, setImageError] = useState(false);
  
  // Helper to convert brittle Drive URLs to the robust lh3 format
  const getOptimizedImageUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('Error')) return url;
    
    // If it's already an lh3 link or base64, return as is
    if (url.includes('lh3.googleusercontent.com') || url.startsWith('data:')) {
        return url;
    }

    // Attempt to extract File ID from various Drive URL formats
    let id = '';
    try {
        if (url.includes('id=')) {
            // matches id=XYZ
            const match = url.match(/id=([^&]+)/);
            if (match) id = match[1];
        } else if (url.includes('/file/d/')) {
            // matches /file/d/XYZ/
            const match = url.match(/\/file\/d\/([^/]+)/);
            if (match) id = match[1];
        } else if (url.includes('/d/')) {
             // matches /d/XYZ
            const match = url.match(/\/d\/([^/]+)/);
            if (match) id = match[1];
        }
    } catch(e) {
        console.warn("Error parsing image URL", url);
    }

    if (id) {
        return `https://lh3.googleusercontent.com/d/${id}`;
    }
    
    return url;
  };

  const displayUrl = getOptimizedImageUrl(player.image);
  const hasValidImage = displayUrl && displayUrl.startsWith('http') && !displayUrl.includes('Error');

  return (
    <div className="bg-brand-gray rounded-lg overflow-hidden border border-neutral-800 hover:shadow-[0_0_15px_rgba(74,222,128,0.15)] transition-all duration-300 group">
      <div className="relative h-48 w-full bg-neutral-900 overflow-hidden flex items-center justify-center">
        {hasValidImage && !imageError ? (
            <img 
              src={displayUrl} 
              alt={player.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
            />
        ) : (
            <div className="flex flex-col items-center justify-center text-neutral-700">
                {imageError ? (
                    <div className="flex flex-col items-center gap-1">
                        <AlertCircle size={32} className="text-neutral-600"/>
                        <span className="text-xs text-neutral-600 font-bold">Image Unavailable</span>
                    </div>
                ) : (
                    <User size={64} className="text-neutral-800" />
                )}
            </div>
        )}
        <div className="absolute top-2 right-2 bg-brand-dark/90 text-brand-green font-display font-bold text-lg px-2 py-1 rounded border border-brand-green/30">
          #{player.jerseyNumber}
        </div>
      </div>
      <div className="p-4 relative">
        <div className="absolute -top-6 left-4 w-10 h-10 bg-brand-red rounded flex items-center justify-center shadow-lg border border-red-500">
            <span className="text-white font-bold text-xs">{team?.name?.substring(0, 2).toUpperCase() || '??'}</span>
        </div>
        <h3 className="mt-2 text-xl font-display font-semibold text-white tracking-wide">{player.name}</h3>
        <p className="text-sm text-gray-400 mb-1">{team?.name}</p>
        <span className="inline-block bg-neutral-800 text-xs text-brand-green px-2 py-0.5 rounded uppercase tracking-wider font-bold">
            S/o {player.fatherName}
        </span>
      </div>
    </div>
  );
};