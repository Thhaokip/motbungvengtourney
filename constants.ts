import { BlogPost, Match, Player, Standing, Team } from "./types";

// Production initial states - Data should be fetched from the backend
export const INITIAL_TEAMS: Team[] = [];
export const INITIAL_MATCHES: Match[] = [];
export const INITIAL_PLAYERS: Player[] = [];
export const INITIAL_STANDINGS: Standing[] = [];
export const INITIAL_BLOGS: BlogPost[] = [];

export const GENERAL_RULES = [
  "1. Motbung citizenship player bou hiding (Pure Motbung)",
  "2. Veng Tournament sunga boina sem aumleh vengin fine dangka ₹10,000/- a leuding ahi.",
  "3. Veng citizen – achen chenna venga kichem ding ahi.",
  "4. Referee (match officals) ho chunga koitobang boina sem aumleh MYC le Committee in achungthu asei ding ahi.",
  "5. Play petna koima kham puma ground sung lutthei lou ding.",
  "6. Veng Cup lop mid-night service kibol thei louding.",
  "7. Theme – “KICK DRUGS, SAY YES TO SPORTS” jersey a jao tei tei ding.",
  "8. Opening day le Veng March Pass competition umding.",
  "9. Tournament sunga dukan/stall boldi jouse MYC toh kijah mat na recognition akilah diu.",
  "10. Tournament suga koi veng hileh match anei jou teng, ama technical area cheh a ki suhtheng ding ahi. Eti ham khat na ajui lou aumleh fine kibol ding ahi.",
  "11. Player toh Officials ho tailou, Fans/Supporter ho koima technical area sunga lut lou ding ahi.",
  "12. Ground sung vela koiman gari aneo/alen atol lut lou ding ahi.",
  "13. Players chung chang thu complain bolding aumle tournament kipat masanga complain bolding, tournament kipat joule complain khat jong committee in entertain abol lou ding.",
  "14. Motbung Veng Tournament Fair Play award umding ahi. Hiche a hi player discipline, supporter discipline kiveding ahi."
];

export const FOOTBALL_RULES = [
  "1. Tournament Format: The tournament shall be conducted on a League-cum-Knockout basis.",
  "2. Team Categories: A-Team and B-Team competitions shall be conducted separately, each with its own fixtures and trophies.",
  "3. Reporting Time: All teams must report 30 minutes before the scheduled kick-off time. Failure to do so may result in time deduction or other disciplinary measures as decided by the referee.",
  "4. Player Conduct: Any form of verbal abuse by a player towards match officials, opponents, or spectators shall result in a caution.",
  "5. Host Team (League Matches): A host team shall be assigned for all league-round matches.",
  "6. Jersey Colour Clash: In case both teams have similar jersey colours, the away team must change their jersey.",
  "7. Substitutions: A maximum of five (5) substitutions is allowed per match, to be made in no more than three (3) substitution intervals, excluding halftime.",
  "8. Technical Area Access: Only team managers, coaches, and physiotherapists are permitted inside the technical area.",
  "9. Match Officials: Every match shall have a goal-line assistant referee.",
  "10. Player Equipment: Players must enter the field wearing a complete and proper football kit. Any player failing to comply shall be cautioned.",
  "11. Squad Size: Total registered squad: 25 players. Match-day squad: 20 players.",
  "12. Appeals to Referee: Only the team captain or vice-captain is permitted to communicate or appeal to the referee during the match.",
  "13. Player Registration: Each team must submit a complete team list, including player photographs, through the official registration form.",
  "14. Kick-off Readiness & Discipline: Teams must be on the field and ready to play at the scheduled kick-off time. Referee's decision is final. Yellow Card Fine: ₹100. Red Card Fine: ₹300.",
  "15. Two Yellow Cards: A player receiving two yellow cards in a single match shall receive a red card and will be suspended for one (1) subsequent match.",
  "16. Straight Red Card: Immediate dismissal without replacement and one-match suspension. Suspension may be extended based on review.",
  "17. Violent Conduct: Any act of intentional violence may result in team disqualification from the tournament.",
  "18. Sideline Behaviour: Coaches/supporters must not question decisions. No sideline coaching. Misconduct may lead to forfeiture.",
  "19. Match Abandonment: Referee can default offending team. If match cannot be played, it shall be rescheduled at organiser discretion.",
  "20. Protests: No protests shall be entertained. Decisions of the referees and the organiser are final.",
  "21. Team Manager Responsibility: Managers ensure suspended players do not play. Violation results in 3–0 loss.",
  "22. Match Duration: League (30+30 mins), Knockout (40+40 mins). Referee adds stoppage time.",
  "--- TIE-BREAKER RULES ---",
  "1. Group Stage: Draws remain drawn (1 point each).",
  "2. Standings Tie-Break: Goal Difference > Goals Scored > Head-to-Head > Sudden-Death Penalty.",
  "3. Knockout Draws: Decided by penalty shootouts or organiser's approved format."
];

export const VOLLEYBALL_RULES = [
  "1. Best of 5 sets.",
  "2. First 4 sets to 25 points, tie-break to 15.",
  "3. Rotation is mandatory.",
  "4. Libero cannot serve or block.",
  "5. Maximum 3 hits per side."
];