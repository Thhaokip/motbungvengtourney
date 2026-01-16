
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Admin, Match, Player, Standing, BlogPost, Team, TeamCategory, Tournament, Pool } from '../types';
import { Loader2, Lock, Mail, User, Shield, Users, Trash2, Plus, LogOut, Edit2, Save, FileText, BarChart2, BookOpen, Trophy, Flag, Upload, Image as ImageIcon, AlertTriangle, RefreshCw, Hash } from 'lucide-react';

type Tab = 'MATCHES' | 'PLAYERS' | 'STANDINGS' | 'BLOGS' | 'RULES' | 'ADMINS' | 'SECURITY' | 'TOURNAMENTS' | 'TEAMS' | 'POOLS';

export const AdminPanel: React.FC = () => {
  // Auth State
  const [auth, setAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, mustChangePassword: boolean} | null>(null);
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Dashboard State
  const [activeTab, setActiveTab] = useState<Tab>('MATCHES');
  const [actionStatus, setActionStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data States
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [rules, setRules] = useState<{general: string[], football: string[], volleyball: string[]}>({ general: [], football: [], volleyball: [] });
  const [pools, setPools] = useState<Pool[]>([]);

  // Editing States
  const [editingMatch, setEditingMatch] = useState<Partial<Match> | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Partial<Player> | null>(null);
  const [editingBlog, setEditingBlog] = useState<Partial<BlogPost> | null>(null);
  const [editingTournament, setEditingTournament] = useState<Partial<Tournament> | null>(null);
  const [editingTeam, setEditingTeam] = useState<Partial<Team> & {categoryName?: string, categoryId?: string, sport?: string} | null>(null);
  const [editingPool, setEditingPool] = useState<Partial<Pool> | null>(null);
  
  // Standings View State
  const [standingsCategoryFilter, setStandingsCategoryFilter] = useState<string>('');

  // Admin Management Forms
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  
  // Security Forms
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Filter states
  const [selectedTournamentForPools, setSelectedTournamentForPools] = useState<string>('all');
  const [selectedTournamentForMatches, setSelectedTournamentForMatches] = useState<string>('all');

  // Initial Data Load
  useEffect(() => {
    if (auth) {
        loadAllData();
    }
  }, [auth]);

  // Auto-select first standings category
  useEffect(() => {
    if (standings.length > 0 && !standingsCategoryFilter) {
        // Find the most popular category or just the first one
        const firstCat = standings[0].category;
        setStandingsCategoryFilter(firstCat);
    }
  }, [standings]);

  const loadAllData = async () => {
    setDataLoading(true);
    try {
        const [t, tourneys, m, p, s, b, r, a] = await Promise.all([
            api.getTeams(),
            api.getTournaments(),
            api.getMatches(),
            api.getPlayers(),
            api.getStandings(),
            api.getBlogPosts(),
            api.getRules(),
            api.getAdmins()
        ]);
        setTeams(t);
        setTournaments(tourneys);
        setMatches(m);
        setPlayers(p);
        setStandings(s);
        setBlogs(b);
        setRules(r);
        setAdmins(a);
        
        // Load pools for all tournaments
        const allPools: Pool[] = [];
        for (const tournament of tourneys) {
          try {
            const tournamentPools = await api.getPoolsByTournament(tournament.id);
            allPools.push(...tournamentPools.map(pool => ({
              ...pool,
              tournamentName: tournament.name
            })));
          } catch (error) {
            console.error(`Failed to load pools for tournament ${tournament.id}:`, error);
          }
        }
        setPools(allPools);
    } catch (e) {
        console.error("Failed to load data", e);
        setActionStatus("Error loading data from server");
    }
    setDataLoading(false);
  };

  // --- UTILS ---
  const processImage = (file: File | undefined, callback: (base64: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_SIZE = 300; 
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }
            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
            callback(dataUrl);
        };
    };
    reader.readAsDataURL(file);
  };
  
  const to12HourTime = (timeStr: string | undefined) => {
      if (!timeStr) return '';
      if (timeStr.toUpperCase().includes('M')) return timeStr;

      let cleanTime = timeStr;
      // Handle ISO string from backend (e.g. 1899-12-30T15:30:00.000Z)
      if (timeStr.includes('T')) {
          const split = timeStr.split('T');
          if (split.length > 1) {
              cleanTime = split[1].substring(0, 5); // Extract HH:MM
          }
      }

      try {
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

  // --- AUTH HANDLERS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginStatus('Verifying credentials...');
    
    const result = await api.authenticateAdmin(loginEmail, loginPassword);
    
    if (result.success) {
        setAuth(true);
        setCurrentUser({
          name: result.name || 'Admin',
          email: loginEmail,
          mustChangePassword: result.mustChangePassword || false
        });
        if (result.mustChangePassword) {
          setActiveTab('SECURITY');
        }
        setLoginStatus('');
    } else {
        setLoginStatus('Invalid Credentials or Server Error');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
      await api.logoutAdmin();
      setAuth(false);
      setCurrentUser(null);
      setLoginEmail('');
      setLoginPassword('');
  };

  // --- CRUD HANDLERS ---
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTournament) return;
    setLoading(true);
    const res = await api.createTournament(
        editingTournament.name || '',
        editingTournament.sport || 'Football',
        editingTournament.categoryId || 'cat_1', 
        editingTournament.categoryName || 'General'
    );
    if (res.success) {
        setEditingTournament(null);
        loadAllData();
        setActionStatus('Tournament created');
    }
    setLoading(false);
    setTimeout(() => setActionStatus(''), 3000);
  };

  const handleDeleteTournament = async (id: string) => {
    if (!window.confirm('Delete this tournament?')) return;
    setLoading(true);
    await api.deleteTournament(id);
    loadAllData();
    setLoading(false);
  };

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPool || !editingPool.tournamentId || !editingPool.name) return;
    setLoading(true);
    const res = await api.createPool(editingPool.tournamentId, editingPool.name);
    if (res.success) {
        setEditingPool(null);
        loadAllData();
        setActionStatus('Pool created');
    }
    setLoading(false);
    setTimeout(() => setActionStatus(''), 3000);
  };

  const handleDeletePool = async (id: string) => {
    if (!window.confirm('Delete this pool? All matches and team assignments in this pool will be affected.')) return;
    setLoading(true);
    await api.deletePool(id);
    loadAllData();
    setLoading(false);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTeam) return;
      setLoading(true);

      const selectedTournament = tournaments.find(t => t.id === editingTeam.tournamentId);
      let success = false;

      if (editingTeam.id) {
          // Update
           const res = await api.updateTeam(
              editingTeam.id,
              editingTeam.name || '',
              editingTeam.tournamentId || '',
              selectedTournament?.name || '',
              selectedTournament?.sport || 'Football',
              selectedTournament?.categoryId || 'cat_1',
              selectedTournament?.categoryName || 'General',
              editingTeam.poolId || ''
          );
          if (res.success) {
              setEditingTeam(null);
              setActionStatus('Team updated');
              success = true;
          }
      } else {
          // Create
          const res = await api.createTeam(
              editingTeam.name || '',
              editingTeam.tournamentId || '',
              selectedTournament?.name || '',
              selectedTournament?.sport || 'Football',
              selectedTournament?.categoryId || 'cat_1',
              selectedTournament?.categoryName || 'General',
              editingTeam.poolId || ''
          );
          if (res.success) {
              setEditingTeam(null);
              setActionStatus('Team created');
              success = true;
          }
      }
      
      if (success) {
          // Trigger recalculation to ensure standings reflect new pool assignments
          await api.recalculateStandings();
          await loadAllData();
      } else {
          loadAllData();
      }

      setLoading(false);
      setTimeout(() => setActionStatus(''), 3000);
  };

  const handleDeleteTeam = async (id: string) => {
      if (!window.confirm('Delete this team?')) return;
      setLoading(true);
      await api.deleteTeam(id);
      loadAllData();
      setLoading(false);
  };
  
  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch || loading) return;
    setLoading(true);

    let matchPayload = {...editingMatch} as Match;
    
    // VALIDATION: Basic Fields
    if (!matchPayload.date) {
        setActionStatus("Error: Match Date is required");
        setLoading(false);
        setTimeout(() => setActionStatus(''), 3000);
        return;
    }

    // Logic for NEW Matches
    if (!matchPayload.id) {
         const tourn = tournaments.find(t => t.id === matchPayload.tournamentId);
         // Explicitly look up teams to ensure names are populated correctly
         const teamA = teams.find(t => t.id === matchPayload.teamA?.id);
         const teamB = teams.find(t => t.id === matchPayload.teamB?.id);
         
         if (!tourn) {
             setActionStatus("Error: Please select a Tournament");
             setLoading(false);
             setTimeout(() => setActionStatus(''), 3000);
             return;
         }
         
         if (!teamA || !teamB) {
             setActionStatus("Error: Please select both Home and Away teams");
             setLoading(false);
             setTimeout(() => setActionStatus(''), 3000);
             return;
         }

         if (teamA.id === teamB.id) {
             setActionStatus("Error: Teams cannot play against themselves");
             setLoading(false);
             setTimeout(() => setActionStatus(''), 3000);
             return;
         }

         // Check if both teams are in the same pool (if pool is selected)
         const teamAPool = teamA.poolId || '';
         const teamBPool = teamB.poolId || '';
         const matchPool = matchPayload.poolId || '';
         
         if (matchPool && teamAPool && teamBPool) {
           if (teamAPool !== teamBPool) {
             setActionStatus("Error: Teams are in different pools. Please select teams from the same pool.");
             setLoading(false);
             setTimeout(() => setActionStatus(''), 3000);
             return;
           }
           if (teamAPool !== matchPool) {
             setActionStatus("Warning: Selected pool doesn't match teams' pool. Adjusting pool to match teams.");
           }
         }

         matchPayload = {
             ...matchPayload,
             tournamentName: tourn.name,
             sport: tourn.sport,
             categoryId: tourn.categoryId,
             categoryName: tourn.categoryName,
             teamA: { id: teamA.id, name: teamA.name },
             teamB: { id: teamB.id, name: teamB.name },
             poolId: teamAPool || matchPayload.poolId || ''
         };
    } else {
        // For existing matches, ensure names are correct if teams changed
         if (matchPayload.teamA?.id) {
             const teamA = teams.find(t => t.id === matchPayload.teamA.id);
             if (teamA) {
               matchPayload.teamA.name = teamA.name;
               // Update pool if team changed
               if (teamA.poolId && !matchPayload.poolId) {
                 matchPayload.poolId = teamA.poolId;
               }
             }
         }
         if (matchPayload.teamB?.id) {
             const teamB = teams.find(t => t.id === matchPayload.teamB.id);
             if (teamB) {
               matchPayload.teamB.name = teamB.name;
               // Update pool if team changed
               if (teamB.poolId && !matchPayload.poolId) {
                 matchPayload.poolId = teamB.poolId;
               }
             }
         }
    }

    try {
        const res = await api.upsertMatch(matchPayload);
        
        if (res.success) {
            setEditingMatch(null);
            await loadAllData(); // Refresh list to show new match
            setActionStatus('Match saved successfully');
        } else {
            setActionStatus('Failed to save: ' + res.message);
        }
    } catch (err: any) {
        console.error("Match save error", err);
        setActionStatus('Network error: ' + (err.message || 'Unknown error'));
    }
    
    setLoading(false);
    setTimeout(() => setActionStatus(''), 4000);
  };

  const handleDeleteMatch = async (id: string) => {
    if (!window.confirm('Delete this match?')) return;
    setLoading(true);
    await api.deleteMatch(id);
    loadAllData();
    setLoading(false);
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    
    if (!editingPlayer.teamId) {
        setActionStatus('Please select a team');
        return;
    }

    setLoading(true);
    const playerToSave = {
        ...editingPlayer,
        id: editingPlayer.id || `P${Date.now()}`,
        jerseyNumber: Number(editingPlayer.jerseyNumber),
        fatherName: editingPlayer.fatherName
    } as Player;
    
    const selectedTeam = teams.find(t => t.id === playerToSave.teamId);

    if (!selectedTeam) {
        setLoading(false);
        setActionStatus('Error: Selected team details not found.');
        return;
    }

    const res = await api.upsertPlayer(playerToSave, selectedTeam);
    
    if (res.success) {
        setEditingPlayer(null);
        loadAllData();
        setActionStatus('Player saved successfully');
    } else {
        if (res.message && (res.message.includes('Authorization') || res.message.includes('permission'))) {
            alert("GOOGLE PERMISSION ERROR: Please re-authorize the script in Google Editor and Deploy New Version.");
        }
        setActionStatus('Failed: ' + (res.message || 'Error'));
    }
    setLoading(false);
    setTimeout(() => setActionStatus(''), 3000);
  };

  const handleDeletePlayer = async (id: string) => {
    if (!window.confirm('Delete this player?')) return;
    setLoading(true);
    await api.deletePlayer(id);
    loadAllData();
    setLoading(false);
  };

  const handleRecalculateStandings = async () => {
    setLoading(true);
    const res = await api.recalculateStandings();
    if (res.success) {
        loadAllData();
        setActionStatus('Standings updated from completed matches');
    }
    setLoading(false);
    setTimeout(() => setActionStatus(''), 3000);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;
    setLoading(true);
    const blogToSave = {
        ...editingBlog,
        id: editingBlog.id || `B${Date.now()}`, // Temporary ID for frontend
        date: editingBlog.date || new Date().toISOString()
    } as BlogPost;

    const res = await api.upsertBlogPost(blogToSave);
    if (res.success) {
        setEditingBlog(null);
        loadAllData();
        setActionStatus('Post saved');
    }
    setLoading(false);
    setTimeout(() => setActionStatus(''), 3000);
  };

  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm('Delete this post?')) return;
    setLoading(true);
    await api.deleteBlogPost(id);
    loadAllData();
    setLoading(false);
  };

  const handleSaveRules = async () => {
    setLoading(true);
    const res = await api.saveRules(rules.general, rules.football, rules.volleyball);
    if (res.success) setActionStatus('Rules updated');
    setLoading(false);
    setTimeout(() => setActionStatus(''), 3000);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await api.createAdmin(newAdminName, newAdminEmail, newAdminPassword);
    if (res.success) {
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        loadAllData();
        setActionStatus(res.message);
    }
    setLoading(false);
    setTimeout(() => setActionStatus(''), 3000);
  };

  const handleDeleteAdmin = async (email: string) => {
      if(!window.confirm(`Delete admin ${email}?`)) return;
      setLoading(true);
      await api.deleteAdmin(email);
      loadAllData();
      setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
          setActionStatus('Passwords do not match');
          return;
      }
      if (!currentUser) return;
      setLoading(true);
      const res = await api.changePassword(currentUser.email, oldPassword, newPassword);
      setLoading(false);
      setActionStatus(res.message);
      if (res.success) {
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setCurrentUser({...currentUser, mustChangePassword: false});
      }
  };

  // Filtered data
  const filteredPools = selectedTournamentForPools === 'all' 
    ? pools 
    : pools.filter(pool => pool.tournamentId === selectedTournamentForPools);

  const filteredMatches = selectedTournamentForMatches === 'all'
    ? matches
    : matches.filter(match => match.tournamentId === selectedTournamentForMatches);

  // --- RENDER HELPERS ---
  
  if (!auth) {
    // LOGIN UI (Same as before)
    return (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="bg-brand-gray p-8 rounded-lg border border-neutral-800 max-w-sm w-full shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red to-brand-green"></div>
                <h2 className="text-2xl font-display font-bold mb-2 text-center text-white">Admin Portal</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-gray-500" size={16} />
                            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-black border border-neutral-700 rounded p-3 pl-10 text-white focus:border-brand-red outline-none text-sm" placeholder="admin@example.com" disabled={loading} required />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-black border border-neutral-700 rounded p-3 pl-10 text-white focus:border-brand-red outline-none text-sm" placeholder="••••••••" disabled={loading} required />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-brand-red text-white py-3 rounded font-bold hover:bg-red-700 transition flex justify-center items-center gap-2 disabled:opacity-50 mt-4">
                        {loading && <Loader2 className="animate-spin" size={18} />} {loading ? 'VERIFYING...' : 'LOGIN'}
                    </button>
                </form>
                {loginStatus && <p className="mt-4 text-xs text-brand-green text-center">{loginStatus}</p>}
            </div>
        </div>
    );
  }

  return (
    <div className="py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-neutral-800 pb-4 gap-4">
            <div>
                <h2 className="text-3xl font-display font-bold text-white border-l-4 border-brand-green pl-4">Admin Dashboard</h2>
                <p className="text-sm text-gray-400 mt-1 pl-5 flex items-center gap-2">
                    <User size={14} /> {currentUser?.name}
                </p>
            </div>
            <div className="flex gap-2">
                 {loading || dataLoading ? <div className="flex items-center gap-2 text-brand-green text-xs animate-pulse"><Loader2 size={14} className="animate-spin"/> Syncing...</div> : null}
                 <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-400 font-bold uppercase border border-red-500/30 px-3 py-2 rounded hover:bg-red-500/10 transition flex items-center gap-2">
                    <LogOut size={14} /> Logout
                </button>
            </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
            {[
                { id: 'TOURNAMENTS', icon: Trophy, label: 'Tournaments' },
                { id: 'POOLS', icon: Flag, label: 'Pools' },
                { id: 'TEAMS', icon: Users, label: 'Teams' },
                { id: 'MATCHES', icon: Shield, label: 'Matches' },
                { id: 'PLAYERS', icon: Users, label: 'Players' },
                { id: 'STANDINGS', icon: BarChart2, label: 'Standings' },
                { id: 'BLOGS', icon: FileText, label: 'News' },
                { id: 'RULES', icon: BookOpen, label: 'Rules' },
                { id: 'ADMINS', icon: User, label: 'Admins' },
                { id: 'SECURITY', icon: Lock, label: 'Security' }
            ].map((tab) => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded font-bold uppercase tracking-wider text-xs transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-brand-green text-black' : 'bg-neutral-900 text-gray-400 hover:text-white'}`}
                >
                    <tab.icon size={14} /> {tab.label}
                </button>
            ))}
        </div>

        <div className="bg-brand-gray border border-neutral-800 rounded-lg p-6 min-h-[400px]">
            {/* TOURNAMENTS */}
            {activeTab === 'TOURNAMENTS' && (
                <div>
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Tournaments</h3>
                        <button onClick={() => setEditingTournament({} as Tournament)} className="bg-brand-green text-black px-3 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-green-400"><Plus size={16}/> New Tournament</button>
                    </div>

                    {editingTournament && (
                        <div className="bg-neutral-900 p-6 rounded mb-6 border border-neutral-700 animate-fade-in">
                            <h4 className="font-bold text-gray-300 mb-4">{editingTournament.id ? 'Edit Tournament' : 'New Tournament'}</h4>
                            <form onSubmit={handleCreateTournament} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Tournament Name" value={editingTournament.name || ''} onChange={e => setEditingTournament({...editingTournament, name: e.target.value})} className="bg-black border border-neutral-700 text-white p-2 rounded text-sm" required/>
                                <select value={editingTournament.sport || 'Football'} onChange={e => setEditingTournament({...editingTournament, sport: e.target.value})} className="bg-black border border-neutral-700 text-white p-2 rounded text-sm">
                                    <option value="Football">Football</option>
                                    <option value="Volleyball">Volleyball</option>
                                </select>
                                <input type="text" placeholder="Category Name (e.g. Football A)" value={editingTournament.categoryName || ''} onChange={e => setEditingTournament({...editingTournament, categoryName: e.target.value})} className="bg-black border border-neutral-700 text-white p-2 rounded text-sm" />
                                <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                                    <button type="button" onClick={() => setEditingTournament(null)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                                    <button type="submit" className="bg-brand-red text-white px-4 py-2 rounded font-bold text-sm">Create Tournament</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                             <thead className="bg-neutral-900 text-xs uppercase font-bold text-gray-300">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Sport</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Pools</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {tournaments.map(t => (
                                    <tr key={t.id} className="hover:bg-neutral-800/50">
                                        <td className="px-4 py-3 font-bold text-white">{t.name}</td>
                                        <td className="px-4 py-3">{t.sport}</td>
                                        <td className="px-4 py-3">{t.categoryName}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs bg-neutral-800 px-2 py-1 rounded">
                                                {pools.filter(p => p.tournamentId === t.id).length} pools
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                                            <button onClick={() => handleDeleteTournament(t.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* POOLS */}
            {activeTab === 'POOLS' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Pool Management</h3>
                        <button onClick={() => setEditingPool({} as Pool)} className="bg-brand-green text-black px-3 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-green-400"><Plus size={16}/> Create Pool</button>
                    </div>

                    {/* Filter */}
                    <div className="mb-6">
                        <label className="text-sm text-gray-400 mr-2">Filter by Tournament:</label>
                        <select 
                            value={selectedTournamentForPools} 
                            onChange={e => setSelectedTournamentForPools(e.target.value)}
                            className="bg-black border border-neutral-700 text-white p-2 rounded text-sm"
                        >
                            <option value="all">All Tournaments</option>
                            {tournaments.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {editingPool && (
                        <div className="bg-neutral-900 p-6 rounded mb-6 border border-neutral-700 animate-fade-in">
                            <h4 className="font-bold text-gray-300 mb-4">New Pool</h4>
                            <form onSubmit={handleCreatePool} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Tournament</label>
                                    <select 
                                        value={editingPool.tournamentId || ''} 
                                        onChange={e => setEditingPool({...editingPool, tournamentId: e.target.value})}
                                        className="w-full bg-black border border-neutral-700 text-white p-2 rounded text-sm"
                                        required
                                    >
                                        <option value="">Select Tournament</option>
                                        {tournaments.map(t => (
                                            <option key={t.id} value={t.id}>{t.name} ({t.sport})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Pool Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., Pool A, Group 1, Division X" 
                                        value={editingPool.name || ''} 
                                        onChange={e => setEditingPool({...editingPool, name: e.target.value})}
                                        className="w-full bg-black border border-neutral-700 text-white p-2 rounded text-sm"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-2">
                                    <button type="button" onClick={() => setEditingPool(null)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                                    <button type="submit" className="bg-brand-red text-white px-4 py-2 rounded font-bold text-sm">Create Pool</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-neutral-900 text-xs uppercase font-bold text-gray-300">
                                <tr>
                                    <th className="px-4 py-3">Pool Name</th>
                                    <th className="px-4 py-3">Tournament</th>
                                    <th className="px-4 py-3">Teams</th>
                                    <th className="px-4 py-3">Matches</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {filteredPools.map(pool => {
                                    const poolTeams = teams.filter(t => t.poolId === pool.id);
                                    const poolMatches = matches.filter(m => m.poolId === pool.id);
                                    
                                    return (
                                        <tr key={pool.id} className="hover:bg-neutral-800/50">
                                            <td className="px-4 py-3 font-bold text-white">{pool.name}</td>
                                            <td className="px-4 py-3">
                                                {tournaments.find(t => t.id === pool.tournamentId)?.name || 'Unknown'}
                                                <div className="text-xs text-gray-500">{pool.tournamentName || ''}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${poolTeams.length > 0 ? 'bg-green-900 text-green-300' : 'bg-neutral-800 text-gray-400'}`}>
                                                    {poolTeams.length} teams
                                                </span>
                                                {poolTeams.length > 0 && (
                                                    <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                                                        {poolTeams.slice(0, 2).map(t => t.name).join(', ')}
                                                        {poolTeams.length > 2 && ` +${poolTeams.length - 2} more`}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded text-xs bg-blue-900 text-blue-300">
                                                    {poolMatches.length} matches
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <button onClick={() => handleDeletePool(pool.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredPools.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No pools found. Create your first pool!
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* TEAMS */}
            {activeTab === 'TEAMS' && (
                <div>
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Registered Teams</h3>
                        <button onClick={() => setEditingTeam({} as Team)} className="bg-brand-green text-black px-3 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-green-400"><Plus size={16}/> Register Team</button>
                    </div>

                    {editingTeam && (
                        <div className="bg-neutral-900 p-6 rounded mb-6 border border-neutral-700 animate-fade-in">
                            <h4 className="font-bold text-gray-300 mb-4">{editingTeam.id ? 'Edit Team' : 'New Team'}</h4>
                            <form onSubmit={handleSaveTeam} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Team Name" value={editingTeam.name || ''} onChange={e => setEditingTeam({...editingTeam, name: e.target.value})} className="bg-black border border-neutral-700 text-white p-2 rounded text-sm" required/>
                                
                                <select value={editingTeam.tournamentId || ''} onChange={e => {
                                    const tournamentId = e.target.value;
                                    setEditingTeam({...editingTeam, tournamentId, poolId: ''});
                                }} className="bg-black border border-neutral-700 text-white p-2 rounded text-sm" required>
                                    <option value="">Select Tournament</option>
                                    {tournaments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.categoryName})</option>)}
                                </select>
                                
                                <select value={editingTeam.poolId || ''} onChange={e => setEditingTeam({...editingTeam, poolId: e.target.value})} className="bg-black border border-neutral-700 text-white p-2 rounded text-sm">
                                    <option value="">No Pool (General)</option>
                                    {pools
                                        .filter(p => p.tournamentId === editingTeam.tournamentId)
                                        .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                
                                <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                                    <button type="button" onClick={() => setEditingTeam(null)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                                    <button type="submit" className="bg-brand-red text-white px-4 py-2 rounded font-bold text-sm">
                                        {editingTeam.id ? 'Update Team' : 'Create Team'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                         <table className="w-full text-left text-sm text-gray-400">
                             <thead className="bg-neutral-900 text-xs uppercase font-bold text-gray-300">
                                <tr>
                                    <th className="px-4 py-3">Team Name</th>
                                    <th className="px-4 py-3">Tournament</th>
                                    <th className="px-4 py-3">Pool</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {teams.map(t => {
                                    const teamPool = pools.find(p => p.id === t.poolId);
                                    return (
                                        <tr key={t.id} className="hover:bg-neutral-800/50">
                                            <td className="px-4 py-3 font-bold text-white">{t.name}</td>
                                            <td className="px-4 py-3">{tournaments.find(trn => trn.id === t.tournamentId)?.name || '-'}</td>
                                            <td className="px-4 py-3">
                                                {teamPool ? (
                                                    <span className="px-2 py-1 text-xs bg-blue-900 text-blue-300 rounded">
                                                        {teamPool.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">{t.category}</td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <button onClick={() => setEditingTeam(t)} className="text-blue-400 hover:text-blue-300" title="Edit Team"><Edit2 size={16}/></button>
                                                <button onClick={() => handleDeleteTeam(t.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
// ... rest of the file remains unchanged
