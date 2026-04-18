// IPL 2026 Stat leaders (seed data, UI display)
export interface BatterStat {
  name: string;
  team: string; // shortName
  matches: number;
  innings: number;
  runs: number;
  highest: number;
  average: number;
  strikeRate: number;
  fifties: number;
  hundreds: number;
  fours: number;
  sixes: number;
}

export interface BowlerStat {
  name: string;
  team: string; // shortName
  matches: number;
  innings: number;
  overs: number;
  wickets: number;
  runs: number;
  best: string;
  economy: number;
  average: number;
  fourW: number;
  fiveW: number;
}

// Orange Cap — Most Runs
export const ORANGE_CAP_2026: BatterStat[] = [
  { name: "Virat Kohli",       team: "RCB",  matches: 10, innings: 10, runs: 612, highest: 113, average: 68.00, strikeRate: 154.5, fifties: 5, hundreds: 1, fours: 58, sixes: 24 },
  { name: "Suryakumar Yadav",  team: "MI",   matches: 10, innings: 10, runs: 548, highest:  98, average: 60.88, strikeRate: 168.7, fifties: 5, hundreds: 0, fours: 47, sixes: 31 },
  { name: "Shubman Gill",      team: "GT",   matches: 10, innings: 10, runs: 521, highest: 104, average: 57.88, strikeRate: 148.2, fifties: 4, hundreds: 1, fours: 52, sixes: 19 },
  { name: "Ruturaj Gaikwad",   team: "CSK",  matches: 10, innings: 10, runs: 498, highest:  92, average: 55.33, strikeRate: 146.0, fifties: 5, hundreds: 0, fours: 51, sixes: 17 },
  { name: "Travis Head",       team: "SRH",  matches:  9, innings:  9, runs: 467, highest: 102, average: 58.37, strikeRate: 191.4, fifties: 3, hundreds: 1, fours: 45, sixes: 28 },
  { name: "Sanju Samson",      team: "RR",   matches: 10, innings: 10, runs: 442, highest:  85, average: 49.11, strikeRate: 158.1, fifties: 4, hundreds: 0, fours: 38, sixes: 22 },
  { name: "Heinrich Klaasen",  team: "SRH",  matches:  9, innings:  9, runs: 419, highest:  88, average: 52.37, strikeRate: 178.3, fifties: 3, hundreds: 0, fours: 30, sixes: 27 },
  { name: "KL Rahul",          team: "LSG",  matches: 10, innings: 10, runs: 408, highest:  82, average: 45.33, strikeRate: 142.1, fifties: 3, hundreds: 0, fours: 40, sixes: 14 },
  { name: "Rishabh Pant",      team: "DC",   matches: 10, innings: 10, runs: 392, highest:  78, average: 43.55, strikeRate: 156.8, fifties: 3, hundreds: 0, fours: 36, sixes: 18 },
  { name: "Andre Russell",     team: "KKR",  matches: 10, innings:  9, runs: 358, highest:  72, average: 44.75, strikeRate: 198.8, fifties: 2, hundreds: 0, fours: 24, sixes: 32 },
];

// Purple Cap — Most Wickets
export const PURPLE_CAP_2026: BowlerStat[] = [
  { name: "Jasprit Bumrah",     team: "MI",   matches: 10, innings: 10, overs: 39.2, wickets: 22, runs: 248, best: "5/14", economy: 6.30, average: 11.27, fourW: 1, fiveW: 1 },
  { name: "Mohammed Shami",     team: "GT",   matches: 10, innings: 10, overs: 38.0, wickets: 19, runs: 282, best: "4/22", economy: 7.42, average: 14.84, fourW: 2, fiveW: 0 },
  { name: "Yuzvendra Chahal",   team: "PBKS", matches: 10, innings: 10, overs: 38.4, wickets: 18, runs: 312, best: "4/19", economy: 8.06, average: 17.33, fourW: 2, fiveW: 0 },
  { name: "Varun Chakaravarthy",team: "KKR",  matches: 10, innings: 10, overs: 39.0, wickets: 17, runs: 274, best: "3/18", economy: 7.02, average: 16.11, fourW: 0, fiveW: 0 },
  { name: "Harshal Patel",      team: "SRH",  matches:  9, innings:  9, overs: 33.4, wickets: 16, runs: 298, best: "4/25", economy: 8.84, average: 18.62, fourW: 1, fiveW: 0 },
  { name: "T Natarajan",        team: "DC",   matches: 10, innings: 10, overs: 37.2, wickets: 15, runs: 306, best: "3/21", economy: 8.19, average: 20.40, fourW: 0, fiveW: 0 },
  { name: "Rashid Khan",        team: "GT",   matches: 10, innings: 10, overs: 40.0, wickets: 15, runs: 268, best: "3/16", economy: 6.70, average: 17.86, fourW: 0, fiveW: 0 },
  { name: "Sunil Narine",       team: "KKR",  matches: 10, innings: 10, overs: 39.4, wickets: 14, runs: 256, best: "4/18", economy: 6.45, average: 18.28, fourW: 1, fiveW: 0 },
  { name: "Mukesh Kumar",       team: "RR",   matches: 10, innings: 10, overs: 36.2, wickets: 14, runs: 314, best: "3/24", economy: 8.65, average: 22.42, fourW: 0, fiveW: 0 },
  { name: "Mohammed Siraj",     team: "RCB",  matches:  9, innings:  9, overs: 33.0, wickets: 13, runs: 289, best: "3/27", economy: 8.75, average: 22.23, fourW: 0, fiveW: 0 },
];
