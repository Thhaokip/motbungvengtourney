
import React from 'react';
import { Match, Team } from '../types';
import { Calendar, MapPin, Clock } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  homeTeam?: Team; 
  awayTeam?: Team;
  poolName?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, poolName }) => {
  const isFinished = match.status === 'Completed';
  const isLive = match.status === 'Live';
  const isPostponed = match.status === 'Postponed';
  
  // Robust Date Handling
  let formattedDate = 'TBA';
  let formattedTime = '';

  // Helper for 12-hour time format
  const to12HourTime = (timeStr: string) => {
      if (!timeStr) return '';
      // If it already contains AM/PM, assume it's pre-formatted and return properly
      if (timeStr.toUpperCase().includes('M')) return timeStr;

      let cleanTime = timeStr;
      // Handle ISO string from backend (e.g. 1899-12-30T15:30:00.000Z)
      // This happens when Google Sheets returns a Date object for a Time cell
      if (timeStr.includes('T')) {
          const split = timeStr.split('T');
          if (split.length > 1) {
              cleanTime = split[1].substring(0, 5); // Extract HH:MM
          }
      }

      try {
          // Handle "HH:MM" or "HH:MM:SS"
          const [h, m] = cleanTime.split(':');
          const hour = parseInt(h, 10);
          if (isNaN(hour)) return timeStr;
          
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const hour12 = hour % 12 || 12;
          const min = m ? m.substring(0, 2) : '00';
          return `${hour12}:${min} ${ampm}`;
      } catch (e) {
          return timeStr;
      }
  };
  
  if (match.time) {
      formattedTime = to12HourTime(match.time);
  }
  
  if (match.date) {
    try {
        const dateObj = new Date(match.date);
        if (!isNaN(dateObj.getTime())) {
             // Format: DD-MM-YYYY
             const day = String(dateObj.getDate()).padStart(2, '0');
             const month = String(dateObj.getMonth() + 1).padStart(2, '0');
             const year = dateObj.getFullYear();
             formattedDate = `${day}-${month}-${year}`;
        }
    } catch (e) {
        // Fallback to TBA
    }
  }

  // Determine pool name to display - prioritize prop (from App.tsx calculation) over match object property
  // Normalize string to check for "General Group" case-insensitively if needed, or just display whatever comes
  const rawPoolName = poolName || match.poolName || '';
  const displayPoolName = rawPoolName; 
  const shouldShowPool = displayPoolName && displayPoolName.trim() !== '' && displayPoolName !== 'General Group';

  return (
    <div className="bg-brand-gray border border-neutral-800 rounded-lg p-5 hover:border-brand-red/50 transition-all duration-300 group relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 left-0 w-1 h-full bg-brand-red opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between items-center mb-4 text-xs text-gray-400 font-medium tracking-wide">
        <div className="flex items-center gap-2 flex-wrap">
            {match.matchNumber ? (
                <span className="text-brand-green font-bold">Match #{match.matchNumber}</span>
            ) : null}
            <span className="bg-neutral-900 px-2 py-1 rounded border border-neutral-700">{match.categoryName}</span>
            {shouldShowPool && (
                <span className="bg-blue-900/40 text-blue-200 px-2 py-1 rounded border border-blue-800 font-bold tracking-wide">
                    {displayPoolName}
                </span>
            )}
        </div>
        <div className="flex items-center gap-1">
            {isLive && <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />}
            <span className={isLive ? "text-red-500 font-bold uppercase" : isPostponed ? "text-yellow-500 font-bold uppercase" : "uppercase"}>{match.status}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        {/* Home Team */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center mb-2 border border-neutral-600">
             <span className="text-xl font-display font-bold text-white">{match.teamA?.name?.substring(0, 1) || '?'}</span>
          </div>
          <span className="text-center font-semibold text-sm leading-tight">{match.teamA?.name || 'Unknown'}</span>
        </div>

        {/* Score/VS */}
        <div className="px-4 text-center">
          {isFinished || isLive ? (
            <div className="text-3xl font-display font-bold text-white tracking-widest">
              {match.teamA?.score || 0} - {match.teamB?.score || 0}
            </div>
          ) : (
            <div className="text-2xl font-display font-bold text-neutral-500">VS</div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center mb-2 border border-neutral-600">
             <span className="text-xl font-display font-bold text-white">{match.teamB?.name?.substring(0, 1) || '?'}</span>
          </div>
          <span className="text-center font-semibold text-sm leading-tight">{match.teamB?.name || 'Unknown'}</span>
        </div>
      </div>

      <div className="border-t border-neutral-800 pt-3 flex flex-col gap-2 text-sm text-gray-400">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2" title="Match Date">
                <Calendar size={14} className="text-brand-green"/>
                <span className="font-mono text-white">{formattedDate}</span>
            </div>
            {formattedTime && (
                <div className="flex items-center gap-2 bg-neutral-900 px-2 py-1 rounded border border-neutral-800" title="Kick-off Time">
                    <Clock size={14} className="text-brand-red" />
                    <span className="font-bold text-gray-200 text-xs uppercase tracking-wide">Kick-off: {formattedTime}</span>
                </div>
            )}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
            <MapPin size={14} className="text-gray-500"/>
            <span className="truncate max-w-[250px] text-xs">{match.venue || 'Venue TBA'}</span>
        </div>
      </div>
    </div>
  );
};
