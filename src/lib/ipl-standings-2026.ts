// IPL 2026 Live Standings (seed data, UI display)
export interface StandingRow {
  shortName: string;
  played: number;
  won: number;
  lost: number;
  noResult: number;
  points: number;
  nrr: number;
  form: ("W" | "L" | "N")[]; // last 5
}

// Sorted in typical mid-season order; tweak as needed.
export const IPL_2026_STANDINGS: StandingRow[] = [
  { shortName: "MI",   played: 10, won: 8, lost: 2, noResult: 0, points: 16, nrr:  1.42, form: ["W","W","L","W","W"] },
  { shortName: "CSK",  played: 10, won: 7, lost: 3, noResult: 0, points: 14, nrr:  0.98, form: ["W","L","W","W","W"] },
  { shortName: "RCB",  played: 10, won: 7, lost: 3, noResult: 0, points: 14, nrr:  0.74, form: ["W","W","W","L","W"] },
  { shortName: "KKR",  played: 10, won: 6, lost: 4, noResult: 0, points: 12, nrr:  0.55, form: ["L","W","W","W","L"] },
  { shortName: "GT",   played: 10, won: 6, lost: 4, noResult: 0, points: 12, nrr:  0.31, form: ["W","L","W","L","W"] },
  { shortName: "SRH",  played: 10, won: 5, lost: 5, noResult: 0, points: 10, nrr:  0.12, form: ["L","W","L","W","W"] },
  { shortName: "RR",   played: 10, won: 5, lost: 5, noResult: 0, points: 10, nrr: -0.18, form: ["W","L","L","W","L"] },
  { shortName: "DC",   played: 10, won: 4, lost: 6, noResult: 0, points:  8, nrr: -0.42, form: ["L","L","W","L","W"] },
  { shortName: "LSG",  played: 10, won: 3, lost: 7, noResult: 0, points:  6, nrr: -0.78, form: ["L","L","W","L","L"] },
  { shortName: "PBKS", played: 10, won: 3, lost: 7, noResult: 0, points:  6, nrr: -1.05, form: ["L","W","L","L","L"] },
];
