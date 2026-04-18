// IPL 2026 Teams Data with official logo URLs and team colors
export interface IPLTeam {
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  espnId: string; // ESPN Cricinfo team ID for API calls
}

export const IPL_TEAMS: IPLTeam[] = [
  {
    name: "Chennai Super Kings",
    shortName: "CSK",
    logo: "https://scores.iplt20.com/ipl/teamlogos/CSK.png",
    primaryColor: "#FCCA06",
    espnId: "4343",
  },
  {
    name: "Mumbai Indians",
    shortName: "MI",
    logo: "https://scores.iplt20.com/ipl/teamlogos/MI.png",
    primaryColor: "#004BA0",
    espnId: "4346",
  },
  {
    name: "Royal Challengers Bengaluru",
    shortName: "RCB",
    logo: "https://scores.iplt20.com/ipl/teamlogos/RCB.png",
    primaryColor: "#D4213D",
    espnId: "4340",
  },
  {
    name: "Kolkata Knight Riders",
    shortName: "KKR",
    logo: "https://scores.iplt20.com/ipl/teamlogos/KKR.png",
    primaryColor: "#3A225D",
    espnId: "4341",
  },
  {
    name: "Rajasthan Royals",
    shortName: "RR",
    logo: "https://scores.iplt20.com/ipl/teamlogos/RR.png",
    primaryColor: "#EA1A85",
    espnId: "4345",
  },
  {
    name: "Delhi Capitals",
    shortName: "DC",
    logo: "https://scores.iplt20.com/ipl/teamlogos/DC.png",
    primaryColor: "#004C93",
    espnId: "4344",
  },
  {
    name: "Sunrisers Hyderabad",
    shortName: "SRH",
    logo: "https://scores.iplt20.com/ipl/teamlogos/SRH.png",
    primaryColor: "#F7A721",
    espnId: "5143",
  },
  {
    name: "Punjab Kings",
    shortName: "PBKS",
    logo: "https://scores.iplt20.com/ipl/teamlogos/PBKS.png",
    primaryColor: "#ED1B24",
    espnId: "4342",
  },
  {
    name: "Gujarat Titans",
    shortName: "GT",
    logo: "https://scores.iplt20.com/ipl/teamlogos/GT.png",
    primaryColor: "#1C1C1C",
    espnId: "6904",
  },
  {
    name: "Lucknow Super Giants",
    shortName: "LSG",
    logo: "https://scores.iplt20.com/ipl/teamlogos/LSG.png",
    primaryColor: "#A72056",
    espnId: "6903",
  },
];

// Utility: find team by name or short name
export const findIPLTeam = (nameOrShort: string): IPLTeam | undefined => {
  const q = nameOrShort.toLowerCase().trim();
  return IPL_TEAMS.find(
    t =>
      t.name.toLowerCase() === q ||
      t.shortName.toLowerCase() === q ||
      t.name.toLowerCase().includes(q) ||
      q.includes(t.shortName.toLowerCase())
  );
};

// Get player image URL from ESPN Cricinfo
export const getPlayerImageUrl = (espnPlayerId: string | number): string => {
  return `https://p.imgci.com/db/PICTURES/CMS/${Math.floor(Number(espnPlayerId) / 1000) * 1000}/${espnPlayerId}.1.png`;
};
