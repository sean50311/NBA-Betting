export type NBATeam = {
  id: number;
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
  full_name: string;
  name: string;
};

export type NBAGame = {
  id: number;
  date: string;
  season: number;
  status: string | null;
  period: number | null;
  time: string | null;
  period_detail: string | null;
  datetime: string | null;
  postseason: boolean;
  home_team_score: number | null;
  visitor_team_score: number | null;
  home_team: NBATeam;
  visitor_team: NBATeam;
};

export type GamesResponse = {
  data: NBAGame[];
  meta: {
    next_cursor: number | null;
    per_page: number;
  };
};
