export type keys = { ffScouterKey: string; publicKey: string };

export class FairFightScore {
  name: string;
  id: string;
  attacker_ff: number;
  defender_ff: number;
  constructor(
    name: string,
    id: string,
    battle_score: number,
    opponent_battle_score: number,
  ) {
    this.name = name;
    this.id = id;
    this.attacker_ff =
      Math.trunc(1 + (8 / 3) * (opponent_battle_score / battle_score) * 100) /
      100;
    this.defender_ff =
      Math.trunc(1 + (8 / 3) * (battle_score / opponent_battle_score) * 100) /
      100;
  }
}

export interface FFScouter {
  player_id: number;
  fair_fight: number;
  bs_estimate: number;
  bs_estimate_human: string;
  bss_public: number;
  last_updated: number;
}
export interface DrillDownData {
  name: string;
  id: string;
  attacker_ff: number;
  defender_ff: number;
  easy_attack: number;
  possible_attack: number;
  hard_attack: number;
  easy_defend: number;
  possible_defend: number;
  hard_defend: number;
}

export interface GraphData {
  name: string;
  opponent_scores: FairFightScore[];
  bss_public: number;
  easy_attacks: FairFightScore[];
  possible_attacks: FairFightScore[];
  hard_attacks: FairFightScore[];
  easy_defends: FairFightScore[];
  possible_defends: FairFightScore[];
  hard_defends: FairFightScore[];
}

export interface FactionData {
  ID: number;
  name: string;
  tag: string;
  tag_image: string;
  leader: number;
  "co-leader": number;
  respect: number;
  age: number;
  capacity: number;
  best_chain: number;
  territory_wars: object;
  raid_wars: object;
  peace: object;
  rank: {
    level: number;
    name: string;
    division: number;
    position: number;
    wins: number;
  };
  ranked_wars: {
    [war_id: string]: {
      factions: {
        [faction_id: string]: {
          name: string;
          score: number;
          chain: number;
        };
      };
      war: {
        start: number;
        end: number;
        target: number;
        winner: number;
      };
    };
  };
  members: { [player_id: string]: Member };
}

export interface Member {
  name: string;
  level: number;
  days_in_faction: number;
  last_action: {
    status: string;
    timestamp: number;
    relative: string;
  };
  status: {
    description: string;
    details: string;
    state: string;
    color: string;
    until: number;
  };
  position: string;
}