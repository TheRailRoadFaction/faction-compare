import { ColumnDef } from "@tanstack/react-table";
import * as z from "zod";

export type keys = { ffScouterKey: string; publicKey: string };
export type factionIds = { leftFactionId: string; rightFactionId: string };

export class FairFightScore {
  name: string;
  id: string;
  attacker_ff: number | null;
  defender_ff: number | null;
  bss_public: number | null;
  bs_estimate_human: string | null;
  constructor(
    name: string,
    id: string,
    battle_score: number | null,
    opponent_battle_score: number | null,
    bs_estimate_human: string | null,
  ) {
    this.name = name;
    this.id = id;
    this.bss_public = opponent_battle_score;
    this.bs_estimate_human = bs_estimate_human;
    if (battle_score == null || opponent_battle_score == null) {
      this.attacker_ff = null;
      this.defender_ff = null;
    } else {
      this.attacker_ff =
        Math.trunc(1 + (8 / 3) * (opponent_battle_score / battle_score) * 100) /
        100;
      this.defender_ff =
        Math.trunc(1 + (8 / 3) * (battle_score / opponent_battle_score) * 100) /
        100;
    }
  }
}

export const FFScouterJson = z.object({
  player_id: z.number(),
  fair_fight: z.nullable(z.number()),
  bs_estimate: z.nullable(z.number()),
  bs_estimate_human: z.nullable(z.string()),
  bss_public: z.nullable(z.number()),
  last_updated: z.nullable(z.number()),
});

export type FFScouterJson = z.infer<typeof FFScouterJson>;

export const FFScouterResult = z.array(FFScouterJson);

export type FFScouterResult = z.infer<typeof FFScouterResult>;

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
  bss_public: number | null;
  bs_estimate_human: string | null;
  attacker_ff: number | null;
  defender_ff: number | null;
  easy_attack: number;
  possible_attack: number;
  hard_attack: number;
  easy_defend: number;
  possible_defend: number;
  hard_defend: number;
}

export interface GraphData {
  name: string;
  number: number;
  id: number;
  opponent_scores: FairFightScore[];
  bss_public: number | null;
  bs_estimate_human: string | null;
  easy_attacks: FairFightScore[];
  possible_attacks: FairFightScore[];
  hard_attacks: FairFightScore[];
  easy_defends: FairFightScore[];
  possible_defends: FairFightScore[];
  hard_defends: FairFightScore[];
  easy_attacks_count: number;
  possible_attacks_count: number;
  hard_attacks_count: number;
  easy_defends_count: number;
  possible_defends_count: number;
  hard_defends_count: number;
}

export const TornWarFactionApi = z.object({
  name: z.string(),
  score: z.number(),
  chain: z.number(),
});

export type TornWarFactionApi = z.infer<typeof TornWarFactionApi>;

export const TornMemberApi = z.object({
  name: z.string(),
  level: z.number(),
  days_in_faction: z.number(),
  last_action: z.object({
    status: z.string(),
    timestamp: z.number(),
    relative: z.string(),
  }),
  status: z.object({
    description: z.string(),
    details: z.string(),
    state: z.string(),
    color: z.string(),
    until: z.number(),
  }),
  position: z.string(),
});

export type TornMemberApi = z.infer<typeof TornMemberApi>;

export const TornFactionBasicApi = z.object({
  ID: z.number(),
  name: z.string(),
  tag: z.string(),
  tag_image: z.string(),
  leader: z.number(),
  "co-leader": z.number(),
  respect: z.number(),
  age: z.number(),
  capacity: z.number(),
  best_chain: z.number(),
  territory_wars: z.object(),
  raid_wars: z.object(),
  peace: z.object(),
  rank: z.object({
    level: z.number(),
    name: z.string(),
    division: z.number(),
    position: z.number(),
    wins: z.number(),
  }),
  ranked_wars: z.record(
    z.string(),
    z.object({
      factions: z.record(z.string(), TornWarFactionApi),
      war: z.object({
        start: z.number(),
        end: z.number(),
        target: z.number(),
        winner: z.number(),
      }),
    }),
  ),
  members: z.record(z.string(), TornMemberApi),
});

export type TornFactionBasicApi = z.infer<typeof TornFactionBasicApi>;

//export interface FactionData {
//  ID: number;
//  name: string;
//  tag: string;
//  tag_image: string;
//  leader: number;
//  "co-leader": number;
//  respect: number;
//  age: number;
//  capacity: number;
//  best_chain: number;
//  territory_wars: object;
//  raid_wars: object;
//  peace: object;
//  rank: {
//    level: number;
//    name: string;
//    division: number;
//    position: number;
//    wins: number;
//  };
//  ranked_wars: {
//    [war_id: string]: {
//      factions: {
//        [faction_id: string]: {
//          name: string;
//          score: number;
//          chain: number;
//        };
//      };
//      war: {
//        start: number;
//        end: number;
//        target: number;
//        winner: number;
//      };
//    };
//  };
//  members: { [player_id: string]: Member };
//}
//
//export interface Member {
//  name: string;
//  level: number;
//  days_in_faction: number;
//  last_action: {
//    status: string;
//    timestamp: number;
//    relative: string;
//  };
//  status: {
//    description: string;
//    details: string;
//    state: string;
//    color: string;
//    until: number;
//  };
//  position: string;
//}

export const FactionColumns: ColumnDef<GraphData>[] = [
  {
    accessorKey: "number",
    header: "Index",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "bss_public",
    header: "BSS",
  },
  {
    accessorKey: "bs_estimate_human",
    header: "BS Est",
  },
  {
    accessorKey: "easy_attacks_count",
    header: "Easy att",
  },
  {
    accessorKey: "possible_attacks_count",
    header: "Possible att",
  },
  {
    accessorKey: "hard_attacks_count",
    header: "Hard att",
  },
  {
    accessorKey: "easy_defends_count",
    header: "Easy def",
  },
  {
    accessorKey: "possible_defends_count",
    header: "Possible def",
  },
  {
    accessorKey: "hard_defends_count",
    header: "Hard def",
  },
];

export const MemberColumns: ColumnDef<DrillDownData>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "bss_public",
    header: "BSS",
  },
  {
    accessorKey: "bs_estimate_human",
    header: "BS Est",
  },
  {
    accessorKey: "attacker_ff",
    header: "FF att",
  },
  {
    accessorKey: "defender_ff",
    header: "FF def",
  },
];
