import { create } from 'zustand';

import { TeamItem } from '../type';

export interface TeamsState {
  teams: TeamItem[];
  getTeamById: (teamId: string) => TeamItem | undefined;
}

export const useTeamsStore = create<TeamsState>((set, get) => ({
  teams: [],
  setTeams: (teams: TeamItem[]) => set({ teams }),
  getTeamById: (teamId: string) =>
    get().teams.find((team) => team.id == teamId),
}));
