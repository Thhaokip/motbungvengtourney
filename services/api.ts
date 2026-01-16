
import { Match, Player, Team, Standing, BlogPost, Admin, Tournament, TeamCategory, Comment, Pool } from "../types";
import { INITIAL_MATCHES, INITIAL_PLAYERS, INITIAL_TEAMS, INITIAL_STANDINGS, INITIAL_BLOGS, FOOTBALL_RULES, VOLLEYBALL_RULES, GENERAL_RULES } from "../constants";

// IMPORTANT: This must be the 'Web App URL' with 'Who has access' set to 'Anyone'
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxgyZKWs4kyIuY_KBCdPGIVviJ2dN4lrzLLwLIydU2Rf73b_nGyL9xDnjzrype5sr-0/exec'; 

interface AuthResponse {
  success: boolean;
  name?: string;
  mustChangePassword?: boolean;
  message?: string;
}

interface GenericResponse {
  success: boolean;
  message: string;
}

interface AdminListResponse {
  success: boolean;
  admins: Admin[];
}

// Helper to send all requests as POST with retry logic
const postToBackend = async <T>(payload: any, retries = 2): Promise<T> => {
  try {
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      redirect: 'follow', 
      credentials: 'omit', 
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
       throw new Error(`HTTP Error: ${response.status}`);
    }
    
    const text = await response.text();
    try {
        const data = JSON.parse(text);
        return data as T;
    } catch (e) {
        console.error("Failed to parse backend response:", text);
        throw new Error("Backend returned non-JSON response. Check Script Logs.");
    }
  } catch (error) {
    if (retries > 0) {
        console.warn(`Retrying action ${payload.action}... (${retries} attempts left)`);
        await new Promise(res => setTimeout(res, 1000)); // Wait 1s before retry
        return postToBackend(payload, retries - 1);
    }
    console.error(`Post failed for action ${payload.action}:`, error);
    return { success: false, message: 'Network Error: Check API URL and Permissions' } as any;
  }
};

export const api = {
  // --- POOL MANAGEMENT ---
  createPool: (tournamentId: string, poolName: string) => 
    postToBackend<GenericResponse>({ action: 'createPool', tournamentId, poolName }),

  getPoolsByTournament: async (tournamentId: string): Promise<Pool[]> => {
    const result = await postToBackend<{success: boolean, pools: any[]}>({ action: 'getPoolsByTournament', tournamentId });
    if (result.success && Array.isArray(result.pools)) {
      return result.pools.map(p => ({
        id: p.poolId,
        tournamentId: tournamentId,
        name: p.poolName
      }));
    }
    return [];
  },

  deletePool: (poolId: string) => 
    postToBackend<GenericResponse>({ action: 'deletePool', poolId }),

  // --- TEAMS ---
  getTeams: async (): Promise<Team[]> => {
     const result = await postToBackend<{success: boolean, teams: any[]}>({ action: 'getTeams' });
     if (result.success && Array.isArray(result.teams)) {
        return result.teams
          .filter(t => t.teamId !== 'teamId' && t.teamName !== 'teamName') // Safety filter for headers
          .map(t => ({
             id: t.teamId,
             name: t.teamName,
             category: t.categoryName as TeamCategory,
             tournamentId: t.tournamentId,
             sport: t.sport,
             categoryId: t.categoryId,
             categoryName: t.categoryName,
             poolId: t.poolId
          }));
     }
     return INITIAL_TEAMS;
  },

  createTeam: (teamName: string, tournamentId: string, tournamentName: string, sport: string, categoryId: string, categoryName: string, poolId?: string) => 
     postToBackend<GenericResponse>({ action: 'createTeam', teamName, tournamentId, tournamentName, sport, categoryId, categoryName, poolId }),
  
  updateTeam: (teamId: string, teamName: string, tournamentId: string, tournamentName: string, sport: string, categoryId: string, categoryName: string, poolId?: string) => 
     postToBackend<GenericResponse>({ action: 'updateTeam', teamId, teamName, tournamentId, tournamentName, sport, categoryId, categoryName, poolId }),
  
  deleteTeam: (teamId: string) => 
     postToBackend<GenericResponse>({ action: 'deleteTeam', teamId }),

  // --- TOURNAMENTS ---
  getTournaments: async (): Promise<Tournament[]> => {
     const result = await postToBackend<{success: boolean, tournaments: any[]}>({ action: 'getTournaments' });
     if (result.success && Array.isArray(result.tournaments)) {
        return result.tournaments.map(t => ({
           id: t.tournamentId,
           name: t.tournamentName,
           sport: t.sport,
           categoryId: t.categoryId,
           categoryName: t.categoryName
        }));
     }
     return [];
  },

  createTournament: (tournamentName: string, sport: string, categoryId: string, categoryName: string) =>
     postToBackend<GenericResponse>({ action: 'createTournament', tournamentName, sport, categoryId, categoryName }),

  deleteTournament: (tournamentId: string) =>
     postToBackend<GenericResponse>({ action: 'deleteTournament', tournamentId }),

  // --- MATCHES ---
  getMatches: async (): Promise<Match[]> => {
    const result = await postToBackend<{success: boolean, matches: any[]}>({ action: 'getMatches' });
    if (result.success && Array.isArray(result.matches)) {
        return result.matches
            // SAFETY FILTER: Remove rows that look like headers or invalid data
            .filter(m => m.matchId !== 'matchId' && m.matchDate !== 'matchDate' && !m.matchId.includes('matchId'))
            .map(m => ({
                id: m.matchId,
                tournamentId: m.tournamentId,
                tournamentName: m.tournamentName,
                sport: m.sport,
                categoryId: m.categoryId,
                categoryName: m.categoryName,
                poolId: m.poolId,
                teamA: { id: m.teamA.id, name: m.teamA.name, score: m.teamA.score },
                teamB: { id: m.teamB.id, name: m.teamB.name, score: m.teamB.score },
                date: m.matchDate,
                time: m.matchTime,
                venue: m.venue,
                status: m.status,
                matchNumber: m.matchNumber
            })); 
    }
    return INITIAL_MATCHES;
  },

  upsertMatch: (match: Match) => {
    if (!match.id || match.id.startsWith('M')) { // 'M' is client-side temp ID
        return postToBackend<GenericResponse>({
            action: 'createMatch',
            tournamentId: match.tournamentId,
            tournamentName: match.tournamentName,
            sport: match.sport,
            categoryId: match.categoryId,
            categoryName: match.categoryName,
            teamAId: match.teamA?.id || '',
            teamAName: match.teamA?.name || '',
            teamBId: match.teamB?.id || '',
            teamBName: match.teamB?.name || '',
            matchDate: match.date,
            matchTime: match.time,
            venue: match.venue,
            poolId: match.poolId,
            matchNumber: match.matchNumber
        });
    } else {
        return postToBackend<GenericResponse>({
            action: 'updateMatch',
            matchId: match.id,
            matchDate: match.date,
            matchTime: match.time,
            venue: match.venue,
            teamAScore: match.teamA?.score,
            teamBScore: match.teamB?.score,
            status: match.status,
            poolId: match.poolId,
            matchNumber: match.matchNumber
        });
    }
  },
  
  deleteMatch: (id: string) => postToBackend<GenericResponse>({ action: 'deleteMatch', matchId: id }),

  // --- PLAYERS ---
  getPlayers: async (): Promise<Player[]> => {
    const result = await postToBackend<{success: boolean, players: any[]}>({ action: 'getPlayers' });
    if (result.success && Array.isArray(result.players)) {
        return result.players
            .filter(p => p.playerId !== 'playerId' && p.playerName !== 'playerName')
            .map(p => ({
                id: p.playerId,
                name: p.playerName,
                teamId: p.teamId,
                fatherName: p.fatherName,
                jerseyNumber: p.jerseyNo,
                image: p.photoUrl 
            }));
    }
    return INITIAL_PLAYERS;
  },

  upsertPlayer: (player: Player, teamContext?: Partial<Team>) => {
    const isNew = !player.id || player.id.startsWith('P') || !player.id.startsWith('pl_');
    const imagePayload = player.image && player.image.startsWith('data:') ? player.image : undefined;

    if (isNew) {
        return postToBackend<GenericResponse>({
            action: 'createPlayer',
            playerName: player.name,
            fatherName: player.fatherName,
            jerseyNo: player.jerseyNumber,
            teamId: player.teamId,
            teamName: teamContext?.name || '',
            tournamentId: teamContext?.tournamentId || '',
            sport: teamContext?.sport || '',
            categoryId: teamContext?.categoryId || '',
            categoryName: teamContext?.categoryName || '',
            imageBase64: imagePayload
        });
    } else {
        return postToBackend<GenericResponse>({
            action: 'updatePlayer',
            playerId: player.id,
            playerName: player.name,
            fatherName: player.fatherName,
            jerseyNo: player.jerseyNumber,
            imageBase64: imagePayload 
        });
    }
  },

  deletePlayer: (id: string) => postToBackend<GenericResponse>({ action: 'deletePlayer', playerId: id }),

  // --- STANDINGS ---
  getStandings: async (): Promise<Standing[]> => {
    const result = await postToBackend<{success: boolean, standings: any[]}>({ action: 'getStandings' });
    if (result.success && Array.isArray(result.standings)) {
        return result.standings.map(s => ({
            teamId: s.teamId,
            teamName: s.teamName,
            played: s.played,
            won: s.wins, 
            drawn: s.draws,
            lost: s.losses,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
            goalDifference: s.goalDifference,
            points: s.points,
            category: s.categoryName, 
            poolId: s.poolId,
            lastUpdated: s.lastUpdated
        }));
    }
    return INITIAL_STANDINGS;
  },
  
  recalculateStandings: () => postToBackend<GenericResponse>({ action: 'recalculateStandings' }),
  upsertStanding: (standing: Standing) => postToBackend<GenericResponse>({ action: 'recalculateStandings' }),
  deleteStanding: (teamId: string, category: string) => postToBackend<GenericResponse>({ action: 'recalculateStandings' }),

  // --- BLOGS ---
  getBlogPosts: async (): Promise<BlogPost[]> => {
    const result = await postToBackend<{success: boolean, blogs: any[]}>({ action: 'getBlogs' });
    if (result.success && Array.isArray(result.blogs)) {
        return result.blogs.map(b => ({
            id: b.postId,
            title: b.title,
            content: b.content,
            image: b.coverImageUrl,
            author: b.createdBy,
            date: b.createdAt
        }));
    }
    return INITIAL_BLOGS;
  },
  upsertBlogPost: (blog: BlogPost) => {
    if (!blog.id || blog.id.startsWith('B') || !blog.id.startsWith('blog_')) {
        return postToBackend<GenericResponse>({ 
            action: 'createBlog', 
            title: blog.title,
            content: blog.content,
            coverImageUrl: blog.image
        });
    } else {
        return postToBackend<GenericResponse>({ 
            action: 'updateBlog', 
            postId: blog.id,
            title: blog.title,
            content: blog.content,
            coverImageUrl: blog.image
        });
    }
  },
  deleteBlogPost: (id: string) => postToBackend<GenericResponse>({ action: 'deleteBlog', postId: id }),

  // --- COMMENTS ---
  addComment: (blogId: string, name: string, comment: string) => postToBackend<GenericResponse>({ action: 'addComment', blogId, name, comment }),
  
  getComments: async (blogId: string): Promise<Comment[]> => {
    const result = await postToBackend<{success: boolean, comments: any[]}>({ action: 'getComments', blogId });
    if (result.success && Array.isArray(result.comments)) {
      return result.comments.map(c => ({
        id: c.commentId,
        user: c.name,
        text: c.comment,
        timestamp: c.createdAt
      }));
    }
    return [];
  },

  // --- RULES ---
  getRules: async (): Promise<{general: string[], football: string[], volleyball: string[]}> => {
    const result = await postToBackend<{success: boolean, general: string[], football: string[], volleyball: string[]}>({ action: 'getRules' });
    if (result.success) {
        return { 
            general: (result.general && result.general.length > 0) ? result.general : GENERAL_RULES,
            football: (result.football && result.football.length > 0) ? result.football : FOOTBALL_RULES, 
            volleyball: (result.volleyball && result.volleyball.length > 0) ? result.volleyball : VOLLEYBALL_RULES 
        };
    }
    return { general: GENERAL_RULES, football: FOOTBALL_RULES, volleyball: VOLLEYBALL_RULES };
  },
  saveRules: (general: string[], football: string[], volleyball: string[]) => postToBackend<GenericResponse>({ action: 'saveRules', general, football, volleyball }),
  
  // --- ADMIN AUTH & MANAGEMENT ---
  authenticateAdmin: async (email: string, password: string): Promise<AuthResponse> => {
    return postToBackend<AuthResponse>({ action: 'login', email, password });
  },

  logoutAdmin: async (): Promise<GenericResponse> => {
    return postToBackend<GenericResponse>({ action: 'logout' });
  },

  getAdmins: async (): Promise<Admin[]> => {
    const result = await postToBackend<AdminListResponse>({ action: 'getAdmins' });
    return result.success ? result.admins : [];
  },

  createAdmin: async (name: string, email: string, password: string): Promise<GenericResponse> => {
    return postToBackend<GenericResponse>({ action: 'createAdmin', name, email, password });
  },

  deleteAdmin: async (email: string): Promise<GenericResponse> => {
    return postToBackend<GenericResponse>({ action: 'deleteAdmin', email });
  },

  changePassword: async (email: string, oldPassword: string, newPassword: string): Promise<GenericResponse> => {
    return postToBackend<GenericResponse>({ action: 'changePassword', email, oldPassword, newPassword });
  }
};
