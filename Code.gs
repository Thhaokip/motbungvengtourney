
var SPREADSHEET_ID = "1RDnDJ5tMaxpcHdIYTlJOs7AbkZEmUlAGYEXeoxvu5dI";

// IMPORTANT: Left empty so the script creates a folder in YOUR Drive named "Motbung_Player_Images" automatically.
var PLAYER_IMAGE_FOLDER_ID = ""; 

var SHEETS = {
  ADMINS: "Admins",
  TOURNAMENTS: "Tournaments",
  TEAMS: "Teams",
  MATCHES: "Matches",
  PLAYERS: "Players",
  STANDINGS: "Standings",
  BLOGS: "Blogs",
  RULES: "Rules",
  COMMENTS: "Comments",
  POOLS: "Pools"
};

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .append(""); 
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ 
    status: "online", 
    message: "Motbung Veng API is running." 
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = lock.tryLock(30000); 

  if (!hasLock) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Server is busy. Please try again."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var contents = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var data = JSON.parse(contents);
    var action = data.action;
    var result = { success: false, message: "Invalid action" };

    switch (action) {
      // AUTH
      case "login": result = adminLogin(data.email, data.password); break;
      case "logout": result = adminLogout(); break;
      case "createAdmin": result = createAdmin(data.name, data.email, data.password); break;
      case "getAdmins": result = getAdmins(); break;
      case "changePassword": result = changePassword(data.email, data.oldPassword, data.newPassword); break;
      case "deleteAdmin": result = deleteAdmin(data.email); break;

      // TOURNAMENTS
      case "getTournaments": result = getTournaments(); break;
      case "createTournament": result = createTournament(data); break;
      case "deleteTournament": result = deleteTournament(data.tournamentId); break;

      // TEAMS
      case "getTeams": result = getTeams(data); break;
      case "createTeam": result = createTeam(data); break;
      case "updateTeam": result = updateTeam(data); break;
      case "deleteTeam": result = deleteTeam(data.teamId); break;

      // MATCHES
      case "createMatch": result = createMatch(data); break;
      case "getMatches": result = getMatches(data); break;
      case "updateMatch": result = updateMatch(data); break;
      case "deleteMatch": result = deleteMatch(data.matchId); break;

      // PLAYERS
      case "getPlayers": result = getPlayers(data); break;
      case "createPlayer": result = createPlayer(data); break;
      case "updatePlayer": result = updatePlayer(data); break;
      case "deletePlayer": result = deletePlayer(data.playerId); break;

      // STANDINGS
      case "getStandings": result = getStandings(); break;
      case "recalculateStandings": result = recalculateStandings(); break;

      // BLOGS
      case "createBlog": result = createBlog(data); break;
      case "getBlogs": result = getBlogs(); break;
      case "updateBlog": result = updateBlog(data); break;
      case "deleteBlog": result = deleteBlog(data.postId); break;
      
      // COMMENTS
      case "addComment": result = addComment(data); break;
      case "getComments": result = getComments(data.blogId); break;

      // RULES
      case "getRules": result = getRules(); break;
      case "saveRules": result = saveRules(data.general, data.football, data.volleyball); break;
      
      // POOLS
      case "createPool": result = createPool(data); break;
      case "getPoolsByTournament": result = getPoolsByTournament(data.tournamentId); break;
      case "deletePool": result = deletePool(data.poolId); break;

      default: result = { success: false, message: "Unknown action: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Error: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- HELPER FUNCTIONS ---
function getSheet(name) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Add default headers if creating new
    if (name === SHEETS.PLAYERS) {
       sheet.appendRow(["ID", "Name", "Father", "Jersey", "TeamID", "TeamName", "TournID", "Sport", "CatID", "CatName", "Photo", "Admin", "Date"]);
    }
  }
  return sheet;
}

// --- IMAGE FUNCTIONS ---
function getOrCreateFolder() {
    var folderName = "Motbung_Player_Images";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    if (folders.hasNext()) folder = folders.next();
    else folder = DriveApp.createFolder(folderName);
    
    try { folder.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW); } 
    catch(e) { try { folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e2) {} }
    return folder;
}

function saveImage(base64Data, filenameId) {
  try {
    var folder;
    try {
        if (PLAYER_IMAGE_FOLDER_ID && PLAYER_IMAGE_FOLDER_ID !== "") folder = DriveApp.getFolderById(PLAYER_IMAGE_FOLDER_ID);
        else throw new Error("No ID");
    } catch(e) { folder = getOrCreateFolder(); }

    var split = base64Data.split(',');
    if (split.length < 2) return "Error: Invalid Base64"; 
    var type = split[0].split(':')[1].split(';')[0];
    var bytes = Utilities.base64Decode(split[1]);
    var ext = type.includes("png") ? "png" : "jpg";

    var blob = Utilities.newBlob(bytes, type, filenameId + "." + ext);
    var existing = folder.getFilesByName(filenameId + "." + ext);
    while (existing.hasNext()) existing.next().setTrashed(true);
    
    var file = folder.createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW); } catch(e) { try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e2) {} }
    
    return "https://lh3.googleusercontent.com/d/" + file.getId();
  } catch(e) {
    return "Error: " + e.toString();
  }
}

// --- POOL FUNCTIONS ---
function createPool(data) {
  var sheet = getSheet(SHEETS.POOLS);
  var poolId = "pool_" + Date.now();
  sheet.appendRow([poolId, data.tournamentId, data.poolName, new Date().toISOString()]);
  return { success: true, message: "Pool created" };
}

function getPoolsByTournament(tournamentId) {
  var sheet = getSheet(SHEETS.POOLS);
  var rows = sheet.getDataRange().getValues();
  var pools = [];
  for (var i = 1; i < rows.length; i++) {
    // Ensure strict string comparison or loose comparison for ID
    if (String(rows[i][1]) === String(tournamentId)) {
      pools.push({
        poolId: String(rows[i][0]),
        poolName: rows[i][2]
      });
    }
  }
  return { success: true, pools: pools };
}

function deletePool(poolId) {
  var sheet = getSheet(SHEETS.POOLS);
  var rows = sheet.getDataRange().getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(poolId)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: "Pool deleted" };
    }
  }
  return { success: false, message: "Pool not found" };
}

// --- MATCH FUNCTIONS ---
function createMatch(data) {
  var sheet = getSheet(SHEETS.MATCHES);
  var matchId = "match_" + Date.now();
  var matchNumber = data.matchNumber || (sheet.getLastRow() + 1); 
  
  sheet.appendRow([
    matchId, 
    data.tournamentId, 
    data.tournamentName, 
    data.sport, 
    data.categoryId, 
    data.categoryName,
    data.teamAId, 
    data.teamAName, 
    data.teamBId, 
    data.teamBName, 
    data.matchDate,
    data.matchTime,
    data.venue,
    0, // Score A
    0, // Score B
    "Upcoming",
    "Admin",
    new Date().toISOString(),
    data.poolId || "",
    matchNumber
  ]);
  
  return { success: true, message: "Match created", matchId: matchId };
}

function getMatches(data) {
  var sheet = getSheet(SHEETS.MATCHES);
  var range = sheet.getDataRange();
  var rows = range.getValues();
  var displayRows = range.getDisplayValues(); // Fetch formatted strings to avoid Date object LMT/Timezone issues
  var matches = [];
  
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var dr = displayRows[i]; // Corresponding display row
    if (r[0]) {
       // Check for poolId safely
       var rawPoolId = (r.length > 18) ? r[18] : "";
       var poolId = (rawPoolId === null || rawPoolId === undefined) ? "" : String(rawPoolId);

       matches.push({
         matchId: String(r[0]),
         tournamentId: String(r[1]),
         tournamentName: r[2],
         sport: r[3],
         categoryId: r[4],
         categoryName: r[5],
         teamA: { id: String(r[6]), name: r[7], score: r[13] },
         teamB: { id: String(r[8]), name: r[9], score: r[14] },
         matchDate: r[10],
         matchTime: dr[11], // Use Display Value (String) for Time
         venue: r[12],
         status: r[15],
         poolId: poolId,
         matchNumber: (r.length > 19) ? r[19] : ""
       });
    }
  }
  return { success: true, matches: matches };
}

function updateMatch(data) {
  var sheet = getSheet(SHEETS.MATCHES);
  var rows = sheet.getDataRange().getValues();
  
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.matchId)) {
      var rowNum = i + 1;
      if (data.matchDate) sheet.getRange(rowNum, 11).setValue(data.matchDate);
      if (data.matchTime) sheet.getRange(rowNum, 12).setValue(data.matchTime);
      if (data.venue) sheet.getRange(rowNum, 13).setValue(data.venue);
      if (data.teamAScore !== undefined) sheet.getRange(rowNum, 14).setValue(data.teamAScore);
      if (data.teamBScore !== undefined) sheet.getRange(rowNum, 15).setValue(data.teamBScore);
      if (data.status) sheet.getRange(rowNum, 16).setValue(data.status);
      if (data.poolId !== undefined) sheet.getRange(rowNum, 19).setValue(data.poolId);
      if (data.matchNumber) sheet.getRange(rowNum, 20).setValue(data.matchNumber);
      
      if (data.status === 'Completed') {
         recalculateStandings();
      }
      return { success: true, message: "Match updated" };
    }
  }
  return { success: false, message: "Match not found" };
}

function deleteMatch(matchId) {
  var sheet = getSheet(SHEETS.MATCHES);
  var rows = sheet.getDataRange().getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(matchId)) {
      sheet.deleteRow(i + 1);
      recalculateStandings();
      return { success: true, message: "Match deleted" };
    }
  }
  return { success: false, message: "Match not found" };
}

// --- TEAM FUNCTIONS ---
function createTeam(data) {
  var sheet = getSheet(SHEETS.TEAMS);
  var teamId = "team_" + Date.now();
  
  sheet.appendRow([
    teamId, 
    data.teamName, 
    data.tournamentId, 
    data.tournamentName || "", 
    data.sport, 
    data.categoryId, 
    data.categoryName,
    "Admin",
    new Date().toISOString(),
    data.poolId || ""
  ]);
  return { success: true, message: "Team created" };
}

function getTeams(data) {
  var sheet = getSheet(SHEETS.TEAMS);
  var rows = sheet.getDataRange().getValues();
  var teams = [];
  for (var i = 1; i < rows.length; i++) {
    if(rows[i][0]) {
      // Safe access for column 10 (index 9)
      var rawPoolId = (rows[i].length > 9) ? rows[i][9] : "";
      var poolId = (rawPoolId === null || rawPoolId === undefined) ? "" : String(rawPoolId);
      
      teams.push({
        teamId: String(rows[i][0]),
        teamName: rows[i][1],
        tournamentId: String(rows[i][2]),
        tournamentName: rows[i][3],
        sport: rows[i][4],
        categoryId: rows[i][5],
        categoryName: rows[i][6],
        poolId: poolId
      });
    }
  }
  return { success: true, teams: teams };
}

function updateTeam(data) {
  var sheet = getSheet(SHEETS.TEAMS);
  var rows = sheet.getDataRange().getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.teamId)) {
       var row = i + 1;
       if (data.teamName) sheet.getRange(row, 2).setValue(data.teamName);
       if (data.tournamentId) sheet.getRange(row, 3).setValue(data.tournamentId);
       if (data.tournamentName) sheet.getRange(row, 4).setValue(data.tournamentName);
       if (data.sport) sheet.getRange(row, 5).setValue(data.sport);
       if (data.categoryId) sheet.getRange(row, 6).setValue(data.categoryId);
       if (data.categoryName) sheet.getRange(row, 7).setValue(data.categoryName);
       if (data.poolId !== undefined) sheet.getRange(row, 10).setValue(data.poolId);
       
       return { success: true, message: "Team updated successfully" };
    }
  }
  return { success: false, message: "Team not found" };
}

function deleteTeam(teamId) {
  var sheet = getSheet(SHEETS.TEAMS);
  var rows = sheet.getDataRange().getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(teamId)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

// --- STANDINGS FUNCTIONS ---
function recalculateStandings() {
  var matchSheet = getSheet(SHEETS.MATCHES);
  var teamSheet = getSheet(SHEETS.TEAMS);
  var stdSheet = getSheet(SHEETS.STANDINGS);
  
  var matches = matchSheet.getDataRange().getValues();
  var teams = teamSheet.getDataRange().getValues();
  
  var stats = {};
  
  for (var i=1; i<teams.length; i++) {
    var tid = String(teams[i][0]);
    if(tid) {
      // Safe access poolId
      var rawPId = (teams[i].length > 9) ? teams[i][9] : "";
      var pId = (rawPId === null || rawPId === undefined) ? "" : String(rawPId);
      
      stats[tid] = {
        teamId: tid,
        teamName: teams[i][1],
        category: teams[i][6],
        poolId: pId,
        p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0
      };
    }
  }
  
  for (var i=1; i<matches.length; i++) {
    var m = matches[i];
    if (m[15] === 'Completed') { 
      var tA = String(m[6]); 
      var tB = String(m[8]); 
      var sA = Number(m[13]); 
      var sB = Number(m[14]); 
      
      if (stats[tA] && stats[tB]) {
        stats[tA].p++; stats[tA].gf += sA; stats[tA].ga += sB;
        stats[tB].p++; stats[tB].gf += sB; stats[tB].ga += sA;
        
        if (sA > sB) {
          stats[tA].w++; stats[tA].pts += 3; stats[tB].l++;
        } else if (sB > sA) {
          stats[tB].w++; stats[tB].pts += 3; stats[tA].l++;
        } else {
          stats[tA].d++; stats[tA].pts += 1;
          stats[tB].d++; stats[tB].pts += 1;
        }
      }
    }
  }
  
  stdSheet.clear();
  // Ensure schema includes PoolId
  stdSheet.appendRow(["TeamID", "TeamName", "Played", "Wins", "Draws", "Losses", "GF", "GA", "GD", "Points", "CategoryName", "LastUpdated", "PoolId"]);
  
  var now = new Date().toISOString();
  
  for (var id in stats) {
    var s = stats[id];
    s.gd = s.gf - s.ga;
    stdSheet.appendRow([
      s.teamId, s.teamName, s.p, s.w, s.d, s.l, s.gf, s.ga, s.gd, s.pts, s.category, now, s.poolId
    ]);
  }
  
  return { success: true, message: "Standings recalculated" };
}

function getStandings() {
  var sheet = getSheet(SHEETS.STANDINGS);
  var rows = sheet.getDataRange().getValues();
  var data = [];
  for (var i=1; i<rows.length; i++) {
    var r = rows[i];
    if(r[0]) {
      // Safe access poolId (index 12 / 13th column)
      var rawPoolId = (r.length > 12) ? r[12] : "";
      var poolId = (rawPoolId === null || rawPoolId === undefined) ? "" : String(rawPoolId);
      
      data.push({
        teamId: String(r[0]),
        teamName: r[1],
        played: r[2],
        wins: r[3],
        draws: r[4],
        losses: r[5],
        goalsFor: r[6],
        goalsAgainst: r[7],
        goalDifference: r[8],
        points: r[9],
        categoryName: r[10],
        lastUpdated: r[11],
        poolId: poolId
      });
    }
  }
  return { success: true, standings: data };
}

// --- TOURNAMENT FUNCTIONS ---
function createTournament(data) {
  var sheet = getSheet(SHEETS.TOURNAMENTS);
  var tid = "tourn_" + Date.now();
  sheet.appendRow([tid, data.tournamentName, data.sport, data.categoryId, data.categoryName]);
  return { success: true, message: "Tournament created" };
}

function getTournaments() {
  var sheet = getSheet(SHEETS.TOURNAMENTS);
  var rows = sheet.getDataRange().getValues();
  var data = [];
  for (var i=1; i<rows.length; i++) {
    if(rows[i][0]) {
      data.push({
        tournamentId: String(rows[i][0]),
        tournamentName: rows[i][1],
        sport: rows[i][2],
        categoryId: rows[i][3],
        categoryName: rows[i][4]
      });
    }
  }
  return { success: true, tournaments: data };
}

function deleteTournament(id) {
  var sheet = getSheet(SHEETS.TOURNAMENTS);
  var rows = sheet.getDataRange().getValues();
  for (var i=0; i<rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i+1);
      return { success: true };
    }
  }
  return { success: false };
}

// --- PLAYER FUNCTIONS ---
function createPlayer(data) {
  var sheet = getSheet(SHEETS.PLAYERS);
  var pid = "pl_" + Date.now();
  
  var imageUrl = "";
  if (data.imageBase64 && data.imageBase64.length > 100) {
    imageUrl = saveImage(data.imageBase64, pid);
  } else {
    imageUrl = (data.photoUrl && data.photoUrl.startsWith("http")) ? data.photoUrl : "";
  }

  // UPDATED SCHEMA (13 Columns): 
  // ID, Name, Father, Jersey, TeamID, TeamName, TournID, Sport, CatID, CatName, Photo, Admin, Date
  sheet.appendRow([
    pid, 
    data.playerName, 
    data.fatherName, 
    data.jerseyNo, 
    data.teamId, 
    data.teamName, 
    data.tournamentId || "",
    data.sport || "",
    data.categoryId || "",
    data.categoryName || "",
    imageUrl, // Column 11 (Index 10)
    "Admin",
    new Date().toISOString()
  ]);
  return { success: true, message: "Player created" };
}

function updatePlayer(data) {
  var sheet = getSheet(SHEETS.PLAYERS);
  var rows = sheet.getDataRange().getValues();
  
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.playerId)) {
       var rowNum = i + 1;
       // Update text fields
       sheet.getRange(rowNum, 2).setValue(data.playerName);
       sheet.getRange(rowNum, 3).setValue(data.fatherName);
       sheet.getRange(rowNum, 4).setValue(data.jerseyNo);
       
       // Update Image if provided
       if (data.imageBase64 && data.imageBase64.length > 100) {
         var newUrl = saveImage(data.imageBase64, data.playerId);
         if (newUrl.indexOf("Error") === 0) return { success: false, message: newUrl };
         sheet.getRange(rowNum, 11).setValue(newUrl); // Column 11 is Photo
       }
       return { success: true, message: "Player updated" };
    }
  }
  return { success: false, message: "Player not found" };
}

function getPlayers(data) {
  var sheet = getSheet(SHEETS.PLAYERS);
  var rows = sheet.getDataRange().getValues();
  var players = [];
  // Skip Header
  for(var i=1; i<rows.length; i++){
    if(rows[i][0]){
      players.push({
        playerId: String(rows[i][0]),
        playerName: rows[i][1],
        fatherName: rows[i][2],
        jerseyNo: rows[i][3],
        teamId: String(rows[i][4]),
        teamName: rows[i][5],
        tournamentId: String(rows[i][6]),
        sport: rows[i][7],
        categoryId: rows[i][8],
        categoryName: rows[i][9],
        photoUrl: rows[i][10] // Col 11
      });
    }
  }
  return { success: true, players: players };
}

function deletePlayer(id) {
  var sheet = getSheet(SHEETS.PLAYERS);
  var rows = sheet.getDataRange().getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

// --- BLOG/NEWS FUNCTIONS ---
function createBlog(data) {
  var sheet = getSheet(SHEETS.BLOGS);
  var id = "blog_" + Date.now();
  var date = new Date().toISOString();
  
  var imageUrl = data.coverImageUrl || "";
  if (data.coverImageUrl && data.coverImageUrl.startsWith("data:")) {
     imageUrl = saveImage(data.coverImageUrl, "Blog_" + id);
  }

  sheet.appendRow([id, data.title, data.content, imageUrl, "Admin", date]);
  return { success: true, message: "Blog posted" };
}

function getBlogs() {
  var sheet = getSheet(SHEETS.BLOGS);
  var rows = sheet.getDataRange().getValues();
  var blogs = [];
  for(var i=1; i<rows.length; i++){
    if(rows[i][0]){
      blogs.push({
        postId: String(rows[i][0]),
        title: rows[i][1],
        content: rows[i][2],
        coverImageUrl: rows[i][3],
        createdBy: rows[i][4],
        createdAt: rows[i][5]
      });
    }
  }
  return { success: true, blogs: blogs.reverse() };
}

function updateBlog(data) {
    var sheet = getSheet(SHEETS.BLOGS);
    var rows = sheet.getDataRange().getValues();
    for (var i = 0; i < rows.length; i++) {
        if (String(rows[i][0]) === String(data.postId)) {
            sheet.getRange(i+1, 2).setValue(data.title);
            sheet.getRange(i+1, 3).setValue(data.content);
            if(data.coverImageUrl && data.coverImageUrl.startsWith("data:")) {
                var url = saveImage(data.coverImageUrl, "Blog_" + data.postId);
                sheet.getRange(i+1, 4).setValue(url);
            } else if (data.coverImageUrl) {
                sheet.getRange(i+1, 4).setValue(data.coverImageUrl);
            }
            return { success: true };
        }
    }
    return { success: false };
}

function deleteBlog(id) {
    var sheet = getSheet(SHEETS.BLOGS);
    var rows = sheet.getDataRange().getValues();
    for (var i = 0; i < rows.length; i++) {
        if (String(rows[i][0]) === String(id)) {
            sheet.deleteRow(i + 1);
            return { success: true };
        }
    }
    return { success: false };
}

// --- COMMENT FUNCTIONS ---
function addComment(data) {
  var sheet = getSheet(SHEETS.COMMENTS);
  var id = "cmt_" + Date.now();
  sheet.appendRow([id, data.blogId, data.name, data.comment, new Date().toISOString()]);
  return { success: true };
}

function getComments(blogId) {
  var sheet = getSheet(SHEETS.COMMENTS);
  var rows = sheet.getDataRange().getValues();
  var comments = [];
  for(var i=1; i<rows.length; i++) {
    if(String(rows[i][1]) === String(blogId)) {
      comments.push({
        commentId: String(rows[i][0]),
        blogId: String(rows[i][1]),
        name: rows[i][2],
        comment: rows[i][3],
        createdAt: rows[i][4]
      });
    }
  }
  return { success: true, comments: comments };
}

// --- RULES FUNCTIONS ---
function getRules() {
    var sheet = getSheet(SHEETS.RULES);
    var rows = sheet.getDataRange().getValues();
    var general = [], football = [], volleyball = [];
    
    for(var i=0; i<rows.length; i++) {
        if(rows[i][0] === 'GENERAL') general.push(rows[i][1]);
        if(rows[i][0] === 'FOOTBALL') football.push(rows[i][1]);
        if(rows[i][0] === 'VOLLEYBALL') volleyball.push(rows[i][1]);
    }
    return { success: true, general: general, football: football, volleyball: volleyball };
}

function saveRules(general, football, volleyball) {
    var sheet = getSheet(SHEETS.RULES);
    sheet.clear();
    var data = [];
    if(general) general.forEach(function(r){ data.push(['GENERAL', r]); });
    if(football) football.forEach(function(r){ data.push(['FOOTBALL', r]); });
    if(volleyball) volleyball.forEach(function(r){ data.push(['VOLLEYBALL', r]); });
    
    if(data.length > 0) {
        sheet.getRange(1, 1, data.length, 2).setValues(data);
    }
    return { success: true };
}

// --- ADMIN FUNCTIONS ---
function getAdmins() {
  var sheet = getSheet(SHEETS.ADMINS);
  var rows = sheet.getDataRange().getValues();
  var admins = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0]) {
       admins.push({
         adminId: String(rows[i][0]),
         name: rows[i][1],
         email: rows[i][2]
       });
    }
  }
  return { success: true, admins: admins };
}

function createAdmin(name, email, password) {
  var sheet = getSheet(SHEETS.ADMINS);
  var rows = sheet.getDataRange().getValues();
  for(var i=0; i<rows.length; i++){
    if(rows[i][2] == email) return { success: false, message: "Email already exists" };
  }
  
  var id = "adm_" + Date.now();
  sheet.appendRow([id, name, email, password, "true", new Date().toISOString()]);
  return { success: true, message: "Admin created" };
}

function adminLogin(email, password) {
  var sheet = getSheet(SHEETS.ADMINS);
  var rows = sheet.getDataRange().getValues();
  
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][2] == email && rows[i][3] == password) {
       return { 
         success: true, 
         name: rows[i][1],
         mustChangePassword: (rows[i][4] === "true" || rows[i][4] === true)
       };
    }
  }
  return { success: false, message: "Invalid credentials" };
}

function adminLogout() {
  return { success: true };
}

function changePassword(email, oldPassword, newPassword) {
  var sheet = getSheet(SHEETS.ADMINS);
  var rows = sheet.getDataRange().getValues();
  
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][2] == email && rows[i][3] == oldPassword) {
       sheet.getRange(i+1, 4).setValue(newPassword);
       sheet.getRange(i+1, 5).setValue("false");
       return { success: true, message: "Password updated" };
    }
  }
  return { success: false, message: "Invalid old password" };
}

function deleteAdmin(email) {
   var sheet = getSheet(SHEETS.ADMINS);
   var rows = sheet.getDataRange().getValues();
   for (var i = 0; i < rows.length; i++) {
    if (rows[i][2] == email) {
       sheet.deleteRow(i+1);
       return { success: true };
    }
   }
   return { success: false };
}
