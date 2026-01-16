
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ViewState, Team, Match, Player, Standing, BlogPost, TeamCategory, SportType, Comment, Pool } from './types';
import { api } from './services/api';
import { MatchCard } from './components/MatchCard';
import { PlayerCard } from './components/PlayerCard';
import { AdminPanel } from './components/AdminPanel';
import { RuleAssistant } from './components/RuleAssistant';
import { FOOTBALL_RULES, VOLLEYBALL_RULES, GENERAL_RULES } from './constants';
import { ArrowRight, MessageSquare, AlertCircle, WifiOff, ChevronDown, Users, RefreshCw, X, Send, Clock, User as UserIcon, Loader2 } from 'lucide-react';

function App() {
  const [view, setView] = useState<ViewState>('HOME');
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [pools, setPools] = useState<Pool[]>([]); 
  const [dynamicRules, setDynamicRules] = useState<{general: string[], football: string[], volleyball: string[]} | null>(null);

  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);

  // Filters
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [standingsCategory, setStandingsCategory] = useState<string>('');

  // Blog Modal State
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Defined outside useEffect to be callable
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // First get tournaments to know which pools to fetch
      const tourneys = await api.getTournaments();
      
      const [t, m, p, s, b, r] = await Promise.all([
          api.getTeams(),
          api.getMatches(),
          api.getPlayers(),
          api.getStandings(),
          api.getBlogPosts(),
          api.getRules()
      ]);
      
      setTeams(t);
      setMatches(m);
      setPlayers(p);
      setStandings(s);
      setBlogs(b);
      setDynamicRules(r);
      
      // Fetch pools for all tournaments concurrently
      if (tourneys && tourneys.length > 0) {
          const poolPromises = tourneys.map(tour => api.getPoolsByTournament(tour.id));
          const allPoolsArrays = await Promise.all(poolPromises);
          // Flatten the array of arrays
          const allPools = allPoolsArrays.reduce((acc, curr) => acc.concat(curr), []);
          setPools(allPools);
      } else {
          setPools([]);
      }
      
      const uniqueCategories = Array.from(new Set(s.map(item => item.category)));
      
      setStandingsCategory(prev => {
          if (uniqueCategories.length > 0) {
              if (!prev || !uniqueCategories.includes(prev)) {
                  return uniqueCategories[0];
              }
              return prev;
          }
          return '';
      });

    } catch (e) {
      console.error("Critical Data Load Error", e);
      setBackendError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (view !== 'ADMIN') {
        loadData();
    }
  }, [view]);

  // Load comments when a post is selected
  useEffect(() => {
    if (selectedPost) {
      setPostComments([]);
      api.getComments(selectedPost.id).then(setPostComments);
    }
  }, [selectedPost]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !commentName.trim() || !commentText.trim()) return;

    setCommentLoading(true);
    const res = await api.addComment(selectedPost.id, commentName, commentText);
    if (res.success) {
      setCommentText('');
      // Refresh comments
      const updatedComments = await api.getComments(selectedPost.id);
      setPostComments(updatedComments);
    }
    setCommentLoading(false);
  };

  const getTeam = (id: string) => teams.find(t => t.id === id);
  
  const getPoolName = (poolId?: string) => {
      if (!poolId) return '';
      const p = pools.find(pl => pl.id === poolId);
      return p ? p.name : '';
  };

  const renderHome = () => (
    <div className="space-y-12 animate-fade-in">
      {/* Hero */}
      <section className="relative h-[60vh] md:h-[500px] rounded-2xl overflow-hidden flex items-center justify-center text-center bg-neutral-900 border border-neutral-800 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 via-black/60 to-orange-900/80 z-10 mix-blend-multiply" />
        <div className="absolute inset-0 bg-black/40 z-10" />
        
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-110" 
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1556056504-5c7696c4c28d?q=80&w=1920&auto=format&fit=crop")' }}
        />
        
        <div className="relative z-20 px-4 max-w-3xl">
          <div className="flex justify-center items-center gap-3 mb-4">
             <div className="h-1 w-12 bg-brand-green rounded-full shadow-[0_0_10px_#4ADE80]"></div>
             <span className="text-gray-200 font-bold tracking-[0.2em] text-xs md:text-sm uppercase">Official Tournament</span>
             <div className="h-1 w-12 bg-brand-red rounded-full shadow-[0_0_10px_#DC2626]"></div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight drop-shadow-xl">
            MOTBUNG VENG <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-white to-brand-red">
              TOURNAMENT
            </span>
          </h1>
          <p className="text-gray-200 text-lg mb-8 max-w-xl mx-auto drop-shadow-md font-bold tracking-wide">
            KICK DRUGS, SAY YES TO SPORTS
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => setView('MATCHES')} className="bg-brand-red text-white px-8 py-3 rounded-md font-bold uppercase tracking-wider hover:bg-red-700 transition transform hover:-translate-y-1 shadow-lg shadow-red-900/50">
                View Schedule
            </button>
            <button onClick={() => setView('STANDINGS')} className="bg-transparent border border-white/30 text-white px-8 py-3 rounded-md font-bold uppercase tracking-wider hover:bg-white/10 transition transform hover:-translate-y-1 backdrop-blur-sm">
                Standings
            </button>
          </div>
        </div>
      </section>

      {/* Featured Match */}
      <section>
        <div className="flex justify-between items-end mb-6">
            <h2 className="text-3xl font-display font-bold text-white border-l-4 border-brand-red pl-4">Featured Match</h2>
            <button onClick={() => setView('MATCHES')} className="text-brand-red text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">See All <ArrowRight size={14}/></button>
        </div>
        {matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matches.slice(0, 2).map(match => (
                    <MatchCard 
                        key={match.id} 
                        match={match} 
                        homeTeam={getTeam(match.teamA.id)} 
                        awayTeam={getTeam(match.teamB.id)} 
                        poolName={getPoolName(match.poolId)}
                    />
                ))}
            </div>
        ) : (
            <div className="bg-brand-gray border border-neutral-800 rounded-lg p-8 text-center text-gray-500">
                <AlertCircle className="mx-auto mb-2 text-neutral-600" size={32} />
                <p>No featured matches available at the moment.</p>
            </div>
        )}
      </section>

      {/* Latest News */}
      <section>
        <h2 className="text-3xl font-display font-bold text-white mb-6 border-l-4 border-white pl-4">Latest Updates</h2>
        {blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {blogs.map(blog => (
                    <div key={blog.id} onClick={() => setSelectedPost(blog)} className="group cursor-pointer">
                        <div className="h-48 rounded-lg overflow-hidden mb-4 border border-neutral-800 relative">
                             <div className="absolute inset-0 bg-brand-red/10 group-hover:bg-transparent transition-colors z-10" />
                            <img 
                                src={blog.image} 
                                alt={blog.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                referrerPolicy="no-referrer"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <span>{new Date(blog.date).toLocaleDateString()}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-500"/>
                            <span>{blog.author}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-brand-green transition-colors mb-2">{blog.title}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{blog.content}</p>
                        <span className="text-brand-red text-xs font-bold uppercase mt-2 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Read More <ArrowRight size={12}/></span>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-gray-500 italic">No news updates posted yet.</div>
        )}
      </section>
    </div>
  );

  const renderMatches = () => (
    <div className="space-y-6 animate-fade-in">
        <h2 className="text-3xl font-display font-bold text-white border-l-4 border-brand-red pl-4">Match Schedule</h2>
        {matches.length > 0 ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {matches.map(match => (
                    <MatchCard 
                        key={match.id} 
                        match={match} 
                        homeTeam={getTeam(match.teamA.id)} 
                        awayTeam={getTeam(match.teamB.id)} 
                        poolName={getPoolName(match.poolId)}
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-12 bg-brand-gray rounded-lg border border-neutral-800">
                <p className="text-gray-400">No matches scheduled.</p>
            </div>
        )}
    </div>
  );

  const renderPlayers = () => {
    const selectedTeamData = teamFilter !== 'ALL' ? getTeam(teamFilter) : null;
    const filteredPlayers = players.filter(p => teamFilter === 'ALL' || p.teamId === teamFilter);

    return (
        <div className="space-y-12 animate-fade-in min-h-[60vh]">
            <div className="text-center space-y-6 py-8">
                <div>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-wider mb-2">Know Your Players</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">Select a team from the dropdown below to view their official squad roster, player profiles, and photos.</p>
                </div>
                
                <div className="relative max-w-md mx-auto group">
                    <select 
                        value={teamFilter} 
                        onChange={(e) => setTeamFilter(e.target.value)}
                        className="w-full bg-neutral-900 text-white border-2 border-brand-green/30 group-hover:border-brand-green rounded-lg pl-6 pr-12 py-4 text-lg font-bold outline-none focus:border-brand-green appearance-none cursor-pointer transition-colors shadow-xl shadow-brand-green/5"
                    >
                        <option value="ALL">All Teams</option>
                        {teams.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name} ({t.categoryName || t.category})
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-green pointer-events-none">
                        <ChevronDown size={24} />
                    </div>
                </div>
            </div>
            
            {selectedTeamData && (
                 <div className="bg-brand-gray border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 animate-fade-in mx-auto max-w-4xl">
                    <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center border-2 border-neutral-700 shadow-xl">
                        <span className="text-4xl font-display font-bold text-white">{selectedTeamData.name.substring(0, 1)}</span>
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h3 className="text-3xl font-display font-bold text-white mb-2">{selectedTeamData.name}</h3>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                             <span className="text-brand-green font-bold text-xs uppercase tracking-wider bg-brand-green/10 px-3 py-1 rounded-full border border-brand-green/20">
                                {selectedTeamData.categoryName || selectedTeamData.category}
                             </span>
                             <span className="text-gray-400 text-xs uppercase tracking-wider bg-neutral-900 px-3 py-1 rounded-full border border-neutral-700">
                                {selectedTeamData.sport || 'Sports Team'}
                             </span>
                             <span className="text-gray-400 text-xs uppercase tracking-wider bg-neutral-900 px-3 py-1 rounded-full border border-neutral-700 flex items-center gap-1">
                                <Users size={12}/> {filteredPlayers.length} Players
                             </span>
                        </div>
                    </div>
                 </div>
            )}

            {players.length > 0 ? (
                <div>
                     {teamFilter === 'ALL' && <h3 className="text-xl font-bold text-gray-500 mb-6 border-b border-neutral-800 pb-2">All Registered Players</h3>}
                     
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredPlayers.map(player => (
                            <PlayerCard key={player.id} player={player} team={getTeam(player.teamId)} />
                        ))}
                    </div>
                    
                    {filteredPlayers.length === 0 && (
                         <div className="text-center py-12 bg-brand-gray rounded-lg border border-neutral-800 border-dashed">
                            <Users className="mx-auto text-gray-600 mb-2" size={48} />
                            <p className="text-gray-400 font-bold">No players found for this team yet.</p>
                        </div>
                    )}
                </div>
            ) : (
                 <div className="text-center py-12 bg-brand-gray rounded-lg border border-neutral-800">
                    <p className="text-gray-400">No player data available in the system.</p>
                </div>
            )}
        </div>
    );
  };

  const renderStandings = () => {
    const availableCategories = Array.from(new Set(standings.map(s => s.category)));
    const activeStandings = standings.filter(s => s.category === standingsCategory);
    
    // Group standings by pool
    const groupedStandings: { [key: string]: Standing[] } = {};
    activeStandings.forEach(s => {
        const pKey = s.poolId || 'general'; // 'general' means no pool assigned
        if (!groupedStandings[pKey]) groupedStandings[pKey] = [];
        groupedStandings[pKey].push(s);
    });

    // Get sorted pool keys (general last)
    const poolKeys = Object.keys(groupedStandings).sort((a, b) => {
        if (a === 'general') return 1;
        if (b === 'general') return -1;
        return getPoolName(a).localeCompare(getPoolName(b));
    });

    let lastUpdatedText = "";
    if (activeStandings.length > 0 && activeStandings[0].lastUpdated) {
        try {
            const d = new Date(activeStandings[0].lastUpdated);
            if (!isNaN(d.getTime())) {
                lastUpdatedText = "Updated: " + d.toLocaleString();
            }
        } catch(e) {}
    }

    return (
    <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h2 className="text-3xl font-display font-bold text-white border-l-4 border-brand-red pl-4">League Table</h2>
                {lastUpdatedText && <p className="text-xs text-gray-500 mt-1 pl-5">{lastUpdatedText}</p>}
            </div>
            
            <button onClick={() => loadData(false)} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors bg-neutral-900 px-3 py-1 rounded border border-neutral-800">
                <RefreshCw size={12}/> Refresh
            </button>
        </div>
        
        {/* Tabs - Dynamically generated based on data */}
        <div className="flex flex-wrap gap-2">
            {availableCategories.length > 0 ? availableCategories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setStandingsCategory(cat)}
                    className={`px-4 py-2 rounded text-sm font-bold uppercase tracking-wider transition-colors ${
                        standingsCategory === cat 
                        ? 'bg-brand-red text-white' 
                        : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
                    }`}
                >
                    {cat}
                </button>
            )) : (
                <p className="text-gray-500 text-sm italic">No standings data available yet.</p>
            )}
        </div>

        {/* Standings Tables (Grouped by Pool) */}
        {activeStandings.length > 0 ? (
            <div className="space-y-8">
                {poolKeys.map(poolKey => (
                    <div key={poolKey} className="overflow-hidden rounded-lg border border-neutral-800">
                        {poolKey !== 'general' && (
                            <div className="bg-neutral-800 px-6 py-2 border-b border-neutral-700">
                                <h3 className="text-white font-bold uppercase tracking-wider text-sm">{getPoolName(poolKey)}</h3>
                            </div>
                        )}
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-neutral-900 text-gray-200 uppercase font-display tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Pos</th>
                                    <th className="px-6 py-4">Team</th>
                                    <th className="px-6 py-4 text-center">P</th>
                                    <th className="px-6 py-4 text-center">W</th>
                                    <th className="px-6 py-4 text-center">D</th>
                                    <th className="px-6 py-4 text-center">L</th>
                                    <th className="px-6 py-4 text-center">GF</th>
                                    <th className="px-6 py-4 text-center">GA</th>
                                    <th className="px-6 py-4 text-center">GD</th>
                                    <th className="px-6 py-4 text-center text-white font-bold">Pts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800 bg-brand-gray">
                                {groupedStandings[poolKey]
                                    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
                                    .map((standing, index) => (
                                    <tr key={index} className="hover:bg-white/5 transition">
                                        <td className="px-6 py-4 font-bold">{index + 1}</td>
                                        <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                            {standing.teamName || getTeam(standing.teamId)?.name || 'Unknown Team'}
                                        </td>
                                        <td className="px-6 py-4 text-center">{standing.played}</td>
                                        <td className="px-6 py-4 text-center text-green-400">{standing.won}</td>
                                        <td className="px-6 py-4 text-center">{standing.drawn}</td>
                                        <td className="px-6 py-4 text-center text-red-400">{standing.lost}</td>
                                        <td className="px-6 py-4 text-center">{standing.goalsFor}</td>
                                        <td className="px-6 py-4 text-center">{standing.goalsAgainst}</td>
                                        <td className="px-6 py-4 text-center">{standing.goalDifference}</td>
                                        <td className="px-6 py-4 text-center font-bold text-white text-base">{standing.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-8 text-gray-500 italic">Select a category to view standings.</div>
        )}
    </div>
  )};

  const rulesData = dynamicRules || { 
      general: GENERAL_RULES, 
      football: FOOTBALL_RULES, 
      volleyball: VOLLEYBALL_RULES 
  };

  const renderRulesView = () => (
    <div className="animate-fade-in max-w-5xl mx-auto">
        <h2 className="text-3xl font-display font-bold text-white mb-8 border-l-4 border-white pl-4">Tournament Rules & Regulations</h2>
        
        {/* General Rules Section */}
        <div className="bg-brand-gray p-6 rounded-lg border border-neutral-800 mb-8">
            <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wider border-b border-neutral-700 pb-2">General Rules</h3>
            <ul className="space-y-3 list-none text-gray-300">
                {rulesData.general.map((r, i) => (
                    <li key={i} className="pl-2">{r}</li>
                ))}
            </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-brand-gray p-6 rounded-lg border border-neutral-800">
                <h3 className="text-xl font-bold text-brand-red mb-4 uppercase tracking-wider">Football</h3>
                <ul className="space-y-3 list-none text-gray-300">
                    {rulesData.football.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
                <RuleAssistant sport="Football" />
            </div>

            <div className="bg-brand-gray p-6 rounded-lg border border-neutral-800">
                <h3 className="text-xl font-bold text-brand-green mb-4 uppercase tracking-wider">Volleyball</h3>
                <ul className="space-y-3 list-disc pl-5 text-gray-300">
                    {rulesData.volleyball.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
                <RuleAssistant sport="Volleyball" />
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-brand-red selection:text-white pb-20 relative">
      <Navbar currentView={view} setView={setView} />
      
      {backendError && (
        <div className="bg-red-900/50 border-b border-red-500/50 text-white text-center py-2 text-xs font-bold flex justify-center items-center gap-2">
            <WifiOff size={14} />
            Unable to connect to live database. Showing offline/cached data.
        </div>
      )}

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {loading ? (
            <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
            </div>
        ) : (
            <>
                {view === 'HOME' && renderHome()}
                {view === 'MATCHES' && renderMatches()}
                {view === 'PLAYERS' && renderPlayers()}
                {view === 'STANDINGS' && renderStandings()}
                {view === 'RULES' && renderRulesView()}
                {view === 'ADMIN' && <AdminPanel />}
            </>
        )}
      </main>

      {/* Blog Details Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedPost(null)}>
          <div className="bg-neutral-900 w-full max-w-3xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl border border-neutral-800 flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="relative h-48 md:h-64 shrink-0">
                <img 
                    src={selectedPost.image} 
                    className="w-full h-full object-cover" 
                    alt={selectedPost.title} 
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent"></div>
                <button onClick={() => setSelectedPost(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-red-600 transition-colors">
                    <X size={20} />
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl md:text-4xl font-display font-bold text-white mb-2 leading-tight">{selectedPost.title}</h2>
                    <div className="flex items-center gap-4 text-xs text-gray-300">
                        <span className="flex items-center gap-1"><UserIcon size={12}/> {selectedPost.author}</span>
                        <span className="flex items-center gap-1"><Clock size={12}/> {new Date(selectedPost.date).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="prose prose-invert max-w-none text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                    {selectedPost.content}
                </div>

                {/* Comments Section */}
                <div className="mt-10 border-t border-neutral-800 pt-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <MessageSquare className="text-brand-green" size={20} />
                        Comments ({postComments.length})
                    </h3>

                    {/* Comment List */}
                    <div className="space-y-4 mb-8">
                        {postComments.length > 0 ? postComments.map((comment) => (
                            <div key={comment.id} className="bg-black/30 p-4 rounded-lg border border-neutral-800 flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center shrink-0 font-bold text-brand-green">
                                    {comment.user.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-sm text-white">{comment.user}</span>
                                        <span className="text-[10px] text-gray-500">{new Date(comment.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-400">{comment.text}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm italic">No comments yet. Be the first to share your thoughts!</p>
                        )}
                    </div>

                    {/* Comment Form */}
                    <form onSubmit={handlePostComment} className="bg-neutral-800/30 p-4 rounded-lg border border-neutral-800">
                        <h4 className="text-sm font-bold text-gray-300 mb-3">Leave a comment</h4>
                        <input 
                            type="text" 
                            placeholder="Your Name" 
                            value={commentName}
                            onChange={(e) => setCommentName(e.target.value)}
                            className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white focus:border-brand-green outline-none mb-3"
                            required
                        />
                        <textarea 
                            placeholder="Write your comment..." 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white focus:border-brand-green outline-none h-20 mb-3 resize-none"
                            required
                        />
                        <div className="flex justify-end">
                            <button type="submit" disabled={commentLoading} className="bg-brand-red text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50">
                                {commentLoading ? <Loader2 className="animate-spin" size={16}/> : <Send size={16} />}
                                Post Comment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer / Comment Section Teaser */}
      <footer className="mt-20 border-t border-neutral-900 bg-brand-gray py-12">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
            <div>
                <span className="font-display text-2xl font-bold text-white">
                  MOTBUNG<span className="text-brand-green">VENG</span>
                </span>
                <p className="mt-4 text-sm text-gray-500">
                    Celebrating local talent and sportsmanship. Join us for the ultimate showdown.
                </p>
            </div>
            
            <div>
                <h4 className="font-bold text-white mb-4">Quick Links</h4>
                 <ul className="space-y-2 text-sm text-gray-400">
                    <li className="hover:text-brand-green cursor-pointer">Privacy Policy</li>
                    <li className="hover:text-brand-green cursor-pointer">Contact Organizers</li>
                    <li className="hover:text-brand-green cursor-pointer">Sponsorship</li>
                    <li>
                        <a 
                            href="https://gouyoutube.netlify.app" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-brand-green cursor-pointer"
                        >
                            GouYouTube
                        </a>
                    </li>
                    <li>
                        <a 
                            href="https://matchscheduler.lovable.app" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-brand-green cursor-pointer"
                        >
                            MatchScheduler
                        </a>
                    </li>
                 </ul>
            </div>

            <div>
                 <h4 className="font-bold text-white mb-4">Community</h4>
                 <p className="text-xs text-gray-500 mb-2">Join the conversation on our news posts!</p>
                 <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-brand-red"><MessageSquare size={16}/></div>
                    <div className="text-sm text-gray-400">Read latest updates and share your thoughts with the community.</div>
                 </div>
            </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
