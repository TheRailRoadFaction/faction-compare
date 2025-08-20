"use client";
import { Dispatch, SetStateAction, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartTooltip,
  ChartContainer,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginData } from "@/app/login/page";
import { useNavigate } from "react-router-dom";

const EASY_BSS_MAX = 2.5;
const POSSIBLE_BSS_MAX = 4.0;

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

interface FactionData {
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

interface Member {
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

interface FFScouter {
  player_id: number;
  fair_fight: number;
  bs_estimate: number;
  bs_estimate_human: string;
  bss_public: number;
  last_updated: number;
}

class FairFightScore {
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

interface GraphData {
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

function massage_data() {
  // factions sorted by lower BSS to highest
  const sorted_ours = ourdata.toSorted((a, b) => a.bss_public - b.bss_public);
  const sorted_enemy = enemydata.toSorted(
    (a, b) => a.bss_public - b.bss_public,
  );

  const our_data: GraphData[] = sorted_ours.map((value) => {
    const member: Member = ourfactionbasic.members["" + value.player_id];
    const opponent_scores = sorted_enemy.map(
      (enemy) =>
        new FairFightScore(
          enemyfactionbasic.members["" + enemy.player_id].name,
          "" + enemy.player_id,
          value.bss_public,
          enemy.bss_public,
        ),
    );
    return {
      name: member?.name ?? "Unknown",
      opponent_scores: opponent_scores,
      bss_public: value.bss_public,
      easy_attacks: opponent_scores.filter(
        (value) => value.attacker_ff <= EASY_BSS_MAX,
      ),
      possible_attacks: opponent_scores.filter(
        (value) =>
          value.attacker_ff <= POSSIBLE_BSS_MAX &&
          value.attacker_ff > EASY_BSS_MAX,
      ),
      hard_attacks: opponent_scores.filter(
        (value) => value.attacker_ff > POSSIBLE_BSS_MAX,
      ),
      easy_defends: opponent_scores.filter(
        (value) => value.defender_ff <= EASY_BSS_MAX,
      ),
      possible_defends: opponent_scores.filter(
        (value) =>
          value.defender_ff <= POSSIBLE_BSS_MAX &&
          value.defender_ff > EASY_BSS_MAX,
      ),
      hard_defends: opponent_scores.filter(
        (value) => value.defender_ff > POSSIBLE_BSS_MAX,
      ),
    };
  });

  const enemy_data: GraphData[] = sorted_enemy.map((value) => {
    const member: Member = enemyfactionbasic.members["" + value.player_id];
    const opponent_scores = sorted_ours.map(
      (ours) =>
        new FairFightScore(
          ourfactionbasic.members["" + ours.player_id].name,
          "" + ours.player_id,
          value.bss_public,
          ours.bss_public,
        ),
    );
    return {
      name: member?.name ?? "Unknown",
      opponent_scores: opponent_scores,
      bss_public: value.bss_public,
      easy_attacks: opponent_scores.filter(
        (value) => value.attacker_ff <= EASY_BSS_MAX,
      ),
      possible_attacks: opponent_scores.filter(
        (value) =>
          value.attacker_ff <= POSSIBLE_BSS_MAX &&
          value.attacker_ff > EASY_BSS_MAX,
      ),
      hard_attacks: opponent_scores.filter(
        (value) => value.attacker_ff > POSSIBLE_BSS_MAX,
      ),
      easy_defends: opponent_scores.filter(
        (value) => value.defender_ff <= EASY_BSS_MAX,
      ),
      possible_defends: opponent_scores.filter(
        (value) =>
          value.defender_ff <= POSSIBLE_BSS_MAX &&
          value.defender_ff > EASY_BSS_MAX,
      ),
      hard_defends: opponent_scores.filter(
        (value) => value.defender_ff > POSSIBLE_BSS_MAX,
      ),
    };
  });

  console.log(our_data);
  console.log(enemy_data);

  return { our_data: our_data, enemy_data: enemy_data };
}

interface DrillDownData {
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

function massage_graph_data(d: GraphData): DrillDownData[] {
  return d.opponent_scores.map((value) => {
    return {
      name: value.name,
      id: value.id,
      attacker_ff: value.attacker_ff,
      defender_ff: value.defender_ff,
      easy_attack: value.attacker_ff <= EASY_BSS_MAX ? 1 : 0,
      possible_attack:
        value.attacker_ff <= POSSIBLE_BSS_MAX &&
        value.attacker_ff > EASY_BSS_MAX
          ? 1
          : 0,
      hard_attack: value.attacker_ff > POSSIBLE_BSS_MAX ? 1 : 0,
      easy_defend: value.defender_ff <= EASY_BSS_MAX ? 1 : 0,
      possible_defend:
        value.defender_ff <= POSSIBLE_BSS_MAX &&
        value.defender_ff > EASY_BSS_MAX
          ? 1
          : 0,
      hard_defend: value.defender_ff > POSSIBLE_BSS_MAX ? 1 : 0,
    };
  });
}

export function MyChart() {
  const { our_data, enemy_data } = massage_data();
  const max_yaxis = Math.max(our_data.length, enemy_data.length);

  const [ourSelected, setOurSelected] = useState<DrillDownData[]>([]);
  const [enemySelected, setEnemySelected] = useState<DrillDownData[]>([]);

  function handleClick(setter: Dispatch<SetStateAction<DrillDownData[]>>) {
    return function (data: GraphData) {
      setter(massage_graph_data(data));
    };
  }

  return (
    <>
      <Card className="col-span-6">
        <CardHeader>
          <CardTitle>Our targets</CardTitle>
        </CardHeader>
        <ChartContainer config={chartConfig}>
          <ComposedChart
            data={our_data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={1} />
            <YAxis label="count" domain={[0, max_yaxis]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              dataKey={(value) => value.easy_attacks.length}
              name="Easy"
              label="Easy attacks"
              stackId="attcounts"
              fill="#666600"
              onClick={handleClick(setOurSelected)}
            />
            <Bar
              name="Possible"
              dataKey={(value) => value.possible_attacks.length}
              label="Possible attacks"
              stackId="attcounts"
              fill="#ff3300"
              onClick={handleClick(setOurSelected)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
      <Card className="col-span-6">
        <CardHeader>
          <CardTitle>Enemy targets</CardTitle>
        </CardHeader>
        <ChartContainer config={chartConfig}>
          <ComposedChart
            data={enemy_data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={1} />
            <YAxis label="count" domain={[0, max_yaxis]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              dataKey={(value) => value.easy_attacks.length}
              name="Easy"
              label="Easy attacks"
              stackId="attcounts"
              fill="#666600"
              onClick={handleClick(setEnemySelected)}
            />
            <Bar
              dataKey={(value) => value.possible_attacks.length}
              name="Possible"
              label="Possible attacks"
              stackId="attcounts"
              fill="#ff3300"
              onClick={handleClick(setEnemySelected)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
      <Card className="col-span-6">
        <CardHeader>
          <CardTitle>Our defenders</CardTitle>
        </CardHeader>
        <ChartContainer config={chartConfig}>
          <ComposedChart
            data={our_data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={1} />
            <YAxis label="count" domain={[0, max_yaxis]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              dataKey={(value) => value.hard_defends.length}
              name="Hard"
              label="Hard defends"
              stackId="defcounts"
              fill="#006666"
              onClick={handleClick(setOurSelected)}
            />
            <Bar
              dataKey={(value) => value.possible_defends.length}
              name="Possible"
              label="Possible defends"
              stackId="defcounts"
              fill="#0033ff"
              onClick={handleClick(setOurSelected)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
      <Card className="col-span-6">
        <CardHeader>
          <CardTitle>Enemy defenders</CardTitle>
        </CardHeader>
        <ChartContainer config={chartConfig}>
          <ComposedChart
            data={enemy_data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={1} />
            <YAxis label="count" domain={[0, max_yaxis]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              dataKey={(value) => value.hard_defends.length}
              name="Hard"
              label="Hard defends"
              stackId="defcounts"
              fill="#006666"
              onClick={handleClick(setEnemySelected)}
            />
            <Bar
              dataKey={(value) => value.possible_defends.length}
              name="Possible"
              label="Possible defends"
              stackId="defcounts"
              fill="#0033ff"
              onClick={handleClick(setEnemySelected)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
      <Card className="col-span-6">
        <CardHeader>
          <CardTitle>Us attacking</CardTitle>
        </CardHeader>
        <ChartContainer config={chartConfig}>
          <ComposedChart
            data={ourSelected}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis
              xAxisId="name"
              label="name"
              dataKey="name"
              angle={-45}
              textAnchor="end"
              interval={1}
            />
            <YAxis
              yAxisId="attacker"
              domain={[EASY_BSS_MAX - 0.3, POSSIBLE_BSS_MAX + 0.3]}
              allowDataOverflow
              orientation="right"
            />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              xAxisId="name"
              yAxisId="attacker"
              dataKey="attacker_ff"
              name="Target"
              fill="#666600"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
      <Card className="col-span-6">
        <CardHeader>
          <CardTitle>Us defending</CardTitle>
        </CardHeader>
        <ChartContainer config={chartConfig}>
          <ComposedChart
            data={ourSelected}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis
              xAxisId="name"
              label="name"
              dataKey="name"
              angle={-45}
              textAnchor="end"
              interval={1}
            />
            <YAxis
              yAxisId="defender"
              domain={[EASY_BSS_MAX - 0.3, POSSIBLE_BSS_MAX + 0.3]}
              allowDataOverflow
              orientation="left"
            />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              xAxisId="name"
              yAxisId="defender"
              dataKey="defender_ff"
              name="Defense"
              fill="#006666"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
      <Card className="col-span-6">
        <CardHeader>
          <CardTitle>Them attacking</CardTitle>
        </CardHeader>
        <ChartContainer config={chartConfig}>
          <ComposedChart
            data={enemySelected}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis xAxisId="name" label="name" dataKey="name" />
            <YAxis
              yAxisId="attacker"
              domain={[EASY_BSS_MAX - 0.3, POSSIBLE_BSS_MAX + 0.3]}
              allowDataOverflow
              orientation="right"
            />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              xAxisId="name"
              yAxisId="attacker"
              name="Target"
              dataKey="attacker_ff"
              fill="#666600"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
      <Card className="col-span-6">
        <CardHeader>
          <CardTitle>Them defending</CardTitle>
        </CardHeader>
        <ChartContainer config={chartConfig}>
          <ComposedChart
            data={enemySelected}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis xAxisId="name" label="name" dataKey="name" />
            <YAxis
              yAxisId="defender"
              domain={[EASY_BSS_MAX - 0.3, POSSIBLE_BSS_MAX + 0.3]}
              allowDataOverflow
              orientation="left"
            />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              xAxisId="name"
              yAxisId="defender"
              dataKey="defender_ff"
              name="Defense"
              fill="#006666"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
    </>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const login_data = new LoginData(navigate);
  const keys = login_data.getKeys();

  if (keys == null) {
    navigate("/login");
  }

  return (
    <div className="grid grid-cols-12 gap-10 m-10">
      <MyChart />
    </div>
  );
}

const ourdata: FFScouter[] = [
  {
    player_id: 1737492,
    fair_fight: 6.17,
    bs_estimate: 366659230,
    bs_estimate_human: "367m",
    bss_public: 37553,
    last_updated: 1753059157,
  },
  {
    player_id: 1833269,
    fair_fight: 10.5,
    bs_estimate: 1238685378,
    bs_estimate_human: "1.24b",
    bss_public: 69023,
    last_updated: 1753062195,
  },
  {
    player_id: 1935843,
    fair_fight: 10.67,
    bs_estimate: 1283079720,
    bs_estimate_human: "1.28b",
    bss_public: 70249,
    last_updated: 1753066761,
  },
  {
    player_id: 1966169,
    fair_fight: 13.39,
    bs_estimate: 2106795675,
    bs_estimate_human: "2.11b",
    bss_public: 90017,
    last_updated: 1753060240,
  },
  {
    player_id: 1990136,
    fair_fight: 7.42,
    bs_estimate: 565575296,
    bs_estimate_human: "566m",
    bss_public: 46640,
    last_updated: 1746344032,
  },
  {
    player_id: 2070276,
    fair_fight: 7.41,
    bs_estimate: 563757799,
    bs_estimate_human: "564m",
    bss_public: 46565,
    last_updated: 1753066329,
  },
  {
    player_id: 2081561,
    fair_fight: 1.2,
    bs_estimate: 568735,
    bs_estimate_human: "569k",
    bss_public: 1479,
    last_updated: 1754730884,
  },
  {
    player_id: 2105791,
    fair_fight: 6.01,
    bs_estimate: 344092227,
    bs_estimate_human: "344m",
    bss_public: 36379,
    last_updated: 1753064313,
  },
  {
    player_id: 2124865,
    fair_fight: 15.9,
    bs_estimate: 3044726419,
    bs_estimate_human: "3.04b",
    bss_public: 108215,
    last_updated: 1753046717,
  },
  {
    player_id: 2129129,
    fair_fight: 6.75,
    bs_estimate: 453912963,
    bs_estimate_human: "454m",
    bss_public: 41783,
    last_updated: 1753040389,
  },
  {
    player_id: 2166770,
    fair_fight: 16.31,
    bs_estimate: 3212644053,
    bs_estimate_human: "3.21b",
    bss_public: 111159,
    last_updated: 1753815546,
  },
  {
    player_id: 2181282,
    fair_fight: 10.61,
    bs_estimate: 1265641754,
    bs_estimate_human: "1.27b",
    bss_public: 69770,
    last_updated: 1754201355,
  },
  {
    player_id: 2211514,
    fair_fight: 7.94,
    bs_estimate: 661175628,
    bs_estimate_human: "661m",
    bss_public: 50428,
    last_updated: 1753040022,
  },
  {
    player_id: 2259164,
    fair_fight: 19.24,
    bs_estimate: 4561249524,
    bs_estimate_human: "4.56b",
    bss_public: 132451,
    last_updated: 1754727710,
  },
  {
    player_id: 2288929,
    fair_fight: 2.43,
    bs_estimate: 28035139,
    bs_estimate_human: "28m",
    bss_public: 10384,
    last_updated: 1754018403,
  },
  {
    player_id: 2289117,
    fair_fight: 5.82,
    bs_estimate: 318645617,
    bs_estimate_human: "319m",
    bss_public: 35008,
    last_updated: 1753039122,
  },
  {
    player_id: 2310328,
    fair_fight: 5.38,
    bs_estimate: 262773597,
    bs_estimate_human: "263m",
    bss_public: 31791,
    last_updated: 1753052569,
  },
  {
    player_id: 2324540,
    fair_fight: 8.48,
    bs_estimate: 766692110,
    bs_estimate_human: "767m",
    bss_public: 54303,
    last_updated: 1753018481,
  },
  {
    player_id: 2327662,
    fair_fight: 10.03,
    bs_estimate: 1118566613,
    bs_estimate_human: "1.12b",
    bss_public: 65591,
    last_updated: 1753044974,
  },
  {
    player_id: 2418731,
    fair_fight: 1.22,
    bs_estimate: 649886,
    bs_estimate_human: "650k",
    bss_public: 1581,
    last_updated: 1755161240,
  },
  {
    player_id: 2423554,
    fair_fight: 5.73,
    bs_estimate: 306726266,
    bs_estimate_human: "307m",
    bss_public: 34347,
    last_updated: 1755172984,
  },
  {
    player_id: 2451923,
    fair_fight: 8.74,
    bs_estimate: 822539254,
    bs_estimate_human: "823m",
    bss_public: 56246,
    last_updated: 1753050980,
  },
  {
    player_id: 2464852,
    fair_fight: 3.46,
    bs_estimate: 82804726,
    bs_estimate_human: "82.8m",
    bss_public: 17846,
    last_updated: 1750763031,
  },
  {
    player_id: 2480237,
    fair_fight: 4.37,
    bs_estimate: 155899424,
    bs_estimate_human: "156m",
    bss_public: 24487,
    last_updated: 1755124939,
  },
  {
    player_id: 2485063,
    fair_fight: 11.09,
    bs_estimate: 1396494046,
    bs_estimate_human: "1.4b",
    bss_public: 73288,
    last_updated: 1753060217,
  },
  {
    player_id: 2490488,
    fair_fight: 1.33,
    bs_estimate: 1526442,
    bs_estimate_human: "1.53m",
    bss_public: 2423,
    last_updated: 1753066108,
  },
  {
    player_id: 2523260,
    fair_fight: 6.72,
    bs_estimate: 449426582,
    bs_estimate_human: "449m",
    bss_public: 41576,
    last_updated: 1753066088,
  },
  {
    player_id: 2538833,
    fair_fight: 7.21,
    bs_estimate: 529100604,
    bs_estimate_human: "529m",
    bss_public: 45111,
    last_updated: 1753004199,
  },
  {
    player_id: 2564142,
    fair_fight: 3.87,
    bs_estimate: 113233942,
    bs_estimate_human: "113m",
    bss_public: 20869,
    last_updated: 1752832833,
  },
  {
    player_id: 2590230,
    fair_fight: 11.13,
    bs_estimate: 1406381914,
    bs_estimate_human: "1.41b",
    bss_public: 73547,
    last_updated: 1752991466,
  },
  {
    player_id: 2666194,
    fair_fight: 8.25,
    bs_estimate: 720698472,
    bs_estimate_human: "721m",
    bss_public: 52649,
    last_updated: 1753027012,
  },
  {
    player_id: 2732164,
    fair_fight: 5.7,
    bs_estimate: 303235608,
    bs_estimate_human: "303m",
    bss_public: 34151,
    last_updated: 1755071473,
  },
  {
    player_id: 2788702,
    fair_fight: 9.26,
    bs_estimate: 936655315,
    bs_estimate_human: "937m",
    bss_public: 60021,
    last_updated: 1752899363,
  },
  {
    player_id: 2823379,
    fair_fight: 3.24,
    bs_estimate: 68850738,
    bs_estimate_human: "68.9m",
    bss_public: 16273,
    last_updated: 1754724960,
  },
  {
    player_id: 2832903,
    fair_fight: 1.15,
    bs_estimate: 303264,
    bs_estimate_human: "303k",
    bss_public: 1080,
    last_updated: 1753066245,
  },
  {
    player_id: 2927319,
    fair_fight: 6.57,
    bs_estimate: 425559901,
    bs_estimate_human: "426m",
    bss_public: 40457,
    last_updated: 1754735965,
  },
  {
    player_id: 2997639,
    fair_fight: 7.32,
    bs_estimate: 547197918,
    bs_estimate_human: "547m",
    bss_public: 45876,
    last_updated: 1754930015,
  },
  {
    player_id: 3095162,
    fair_fight: 1.25,
    bs_estimate: 825636,
    bs_estimate_human: "826k",
    bss_public: 1782,
    last_updated: 1753981518,
  },
  {
    player_id: 3102737,
    fair_fight: 2.28,
    bs_estimate: 22497073,
    bs_estimate_human: "22.5m",
    bss_public: 9302,
    last_updated: 1753563822,
  },
  {
    player_id: 3155560,
    fair_fight: 3.96,
    bs_estimate: 120252090,
    bs_estimate_human: "120m",
    bss_public: 21506,
    last_updated: 1753062328,
  },
  {
    player_id: 3158762,
    fair_fight: 3.81,
    bs_estimate: 108339548,
    bs_estimate_human: "108m",
    bss_public: 20413,
    last_updated: 1753521627,
  },
  {
    player_id: 3169673,
    fair_fight: 1.69,
    bs_estimate: 6523421,
    bs_estimate_human: "6.52m",
    bss_public: 5009,
    last_updated: 1753067318,
  },
  {
    player_id: 3170724,
    fair_fight: 1.06,
    bs_estimate: 55977,
    bs_estimate_human: "56k",
    bss_public: 464,
    last_updated: 1753987322,
  },
  {
    player_id: 3175218,
    fair_fight: 4.66,
    bs_estimate: 183647602,
    bs_estimate_human: "184m",
    bss_public: 26577,
    last_updated: 1753052596,
  },
  {
    player_id: 3185685,
    fair_fight: 5.28,
    bs_estimate: 251717239,
    bs_estimate_human: "252m",
    bss_public: 31115,
    last_updated: 1753065372,
  },
  {
    player_id: 3186552,
    fair_fight: 4.29,
    bs_estimate: 148564316,
    bs_estimate_human: "149m",
    bss_public: 23904,
    last_updated: 1754972798,
  },
  {
    player_id: 3187170,
    fair_fight: 5.14,
    bs_estimate: 234780650,
    bs_estimate_human: "235m",
    bss_public: 30050,
    last_updated: 1753031900,
  },
  {
    player_id: 3187613,
    fair_fight: 5.7,
    bs_estimate: 303573114,
    bs_estimate_human: "304m",
    bss_public: 34170,
    last_updated: 1755201189,
  },
  {
    player_id: 3194951,
    fair_fight: 5.86,
    bs_estimate: 323561350,
    bs_estimate_human: "324m",
    bss_public: 35277,
    last_updated: 1753063469,
  },
  {
    player_id: 3240351,
    fair_fight: 2.34,
    bs_estimate: 24650384,
    bs_estimate_human: "24.7m",
    bss_public: 9737,
    last_updated: 1754399429,
  },
  {
    player_id: 3272175,
    fair_fight: 2.94,
    bs_estimate: 51383115,
    bs_estimate_human: "51.4m",
    bss_public: 14058,
    last_updated: 1753021583,
  },
  {
    player_id: 3272629,
    fair_fight: 3.5,
    bs_estimate: 85800925,
    bs_estimate_human: "85.8m",
    bss_public: 18166,
    last_updated: 1753052585,
  },
  {
    player_id: 3308762,
    fair_fight: 1.3,
    bs_estimate: 1251546,
    bs_estimate_human: "1.25m",
    bss_public: 2194,
    last_updated: 1753064281,
  },
  {
    player_id: 3313835,
    fair_fight: 1.28,
    bs_estimate: 1071434,
    bs_estimate_human: "1.07m",
    bss_public: 2030,
    last_updated: 1753066260,
  },
  {
    player_id: 3354782,
    fair_fight: 3.56,
    bs_estimate: 89553485,
    bs_estimate_human: "89.6m",
    bss_public: 18559,
    last_updated: 1754710727,
  },
  {
    player_id: 3378569,
    fair_fight: 2.25,
    bs_estimate: 21450231,
    bs_estimate_human: "21.5m",
    bss_public: 9083,
    last_updated: 1753049674,
  },
  {
    player_id: 3411081,
    fair_fight: 1.14,
    bs_estimate: 251747,
    bs_estimate_human: "252k",
    bss_public: 984,
    last_updated: 1754833061,
  },
  {
    player_id: 3430644,
    fair_fight: 1.17,
    bs_estimate: 375024,
    bs_estimate_human: "375k",
    bss_public: 1201,
    last_updated: 1754077382,
  },
  {
    player_id: 3450188,
    fair_fight: 1.08,
    bs_estimate: 98019,
    bs_estimate_human: "98k",
    bss_public: 614,
    last_updated: 1753028192,
  },
  {
    player_id: 3516752,
    fair_fight: 1.28,
    bs_estimate: 1044164,
    bs_estimate_human: "1.04m",
    bss_public: 2004,
    last_updated: 1753066407,
  },
  {
    player_id: 3523882,
    fair_fight: 1.26,
    bs_estimate: 937612,
    bs_estimate_human: "938k",
    bss_public: 1899,
    last_updated: 1754461890,
  },
  {
    player_id: 3594281,
    fair_fight: 1.32,
    bs_estimate: 1441967,
    bs_estimate_human: "1.44m",
    bss_public: 2355,
    last_updated: 1754059382,
  },
  {
    player_id: 3618163,
    fair_fight: 1.26,
    bs_estimate: 938600,
    bs_estimate_human: "939k",
    bss_public: 1900,
    last_updated: 1755172849,
  },
  {
    player_id: 3618263,
    fair_fight: 1.09,
    bs_estimate: 111547,
    bs_estimate_human: "112k",
    bss_public: 655,
    last_updated: 1755111414,
  },
  {
    player_id: 3636038,
    fair_fight: 1.16,
    bs_estimate: 338489,
    bs_estimate_human: "338k",
    bss_public: 1141,
    last_updated: 1754751393,
  },
  {
    player_id: 3637937,
    fair_fight: 1.08,
    bs_estimate: 80376,
    bs_estimate_human: "80.4k",
    bss_public: 556,
    last_updated: 1753059925,
  },
  {
    player_id: 3665926,
    fair_fight: 1.1,
    bs_estimate: 148207,
    bs_estimate_human: "148k",
    bss_public: 755,
    last_updated: 1753045852,
  },
  {
    player_id: 3725857,
    fair_fight: 1.03,
    bs_estimate: 14237,
    bs_estimate_human: "14.2k",
    bss_public: 234,
    last_updated: 1754750615,
  },
  {
    player_id: 3814859,
    fair_fight: 1.02,
    bs_estimate: 7251,
    bs_estimate_human: "7.25k",
    bss_public: 167,
    last_updated: 1753038111,
  },
  {
    player_id: 3845926,
    fair_fight: 1.03,
    bs_estimate: 13046,
    bs_estimate_human: "13k",
    bss_public: 224,
    last_updated: 1753895869,
  },
];
const enemydata: FFScouter[] = [
  {
    player_id: 1032943,
    fair_fight: 26.52,
    bs_estimate: 9267814400,
    bs_estimate_human: "9.27b",
    bss_public: 188800,
    last_updated: 1752893400,
  },
  {
    player_id: 1393543,
    fair_fight: 7.19,
    bs_estimate: 545291140,
    bs_estimate_human: "545m",
    bss_public: 45796,
    last_updated: 1749246040,
  },
  {
    player_id: 1639649,
    fair_fight: 4.45,
    bs_estimate: 169582536,
    bs_estimate_human: "170m",
    bss_public: 25539,
    last_updated: 1752147234,
  },
  {
    player_id: 1868089,
    fair_fight: 3.47,
    bs_estimate: 86833663,
    bs_estimate_human: "86.8m",
    bss_public: 18275,
    last_updated: 1748592120,
  },
  {
    player_id: 2080108,
    fair_fight: 2.7,
    bs_estimate: 41074738,
    bs_estimate_human: "41.1m",
    bss_public: 12569,
    last_updated: 1754716465,
  },
  {
    player_id: 2128218,
    fair_fight: 1.3,
    bs_estimate: 1240163,
    bs_estimate_human: "1.24m",
    bss_public: 2184,
    last_updated: 1754746656,
  },
  {
    player_id: 2142539,
    fair_fight: 17.25,
    bs_estimate: 3757302996,
    bs_estimate_human: "3.76b",
    bss_public: 120213,
    last_updated: 1754715472,
  },
  {
    player_id: 2177862,
    fair_fight: 5.58,
    bs_estimate: 298406910,
    bs_estimate_human: "298m",
    bss_public: 33878,
    last_updated: 1752506117,
  },
  {
    player_id: 2265047,
    fair_fight: 13.76,
    bs_estimate: 2316953600,
    bs_estimate_human: "2.32b",
    bss_public: 94400,
    last_updated: 1752871446,
  },
  {
    player_id: 2327844,
    fair_fight: 7.48,
    bs_estimate: 598017077,
    bs_estimate_human: "598m",
    bss_public: 47959,
    last_updated: 1754716489,
  },
  {
    player_id: 2414097,
    fair_fight: 3.96,
    bs_estimate: 124459567,
    bs_estimate_human: "124m",
    bss_public: 21879,
    last_updated: 1748562127,
  },
  {
    player_id: 2416699,
    fair_fight: 4.08,
    bs_estimate: 135419358,
    bs_estimate_human: "135m",
    bss_public: 22822,
    last_updated: 1754706943,
  },
  {
    player_id: 2513875,
    fair_fight: 11.68,
    bs_estimate: 1623235171,
    bs_estimate_human: "1.62b",
    bss_public: 79014,
    last_updated: 1752367152,
  },
  {
    player_id: 2634079,
    fair_fight: 16.32,
    bs_estimate: 3341245192,
    bs_estimate_human: "3.34b",
    bss_public: 113362,
    last_updated: 1752330199,
  },
  {
    player_id: 2650729,
    fair_fight: 16.27,
    bs_estimate: 3317942461,
    bs_estimate_human: "3.32b",
    bss_public: 112966,
    last_updated: 1754124819,
  },
  {
    player_id: 2650843,
    fair_fight: 7.67,
    bs_estimate: 633209850,
    bs_estimate_human: "633m",
    bss_public: 49350,
    last_updated: 1742672145,
  },
  {
    player_id: 2664843,
    fair_fight: 14.52,
    bs_estimate: 2600000000,
    bs_estimate_human: "2.6b",
    bss_public: 100000,
    last_updated: 1754729394,
  },
  {
    player_id: 2692623,
    fair_fight: 13.76,
    bs_estimate: 2316953600,
    bs_estimate_human: "2.32b",
    bss_public: 94400,
    last_updated: 1752900400,
  },
  {
    player_id: 2700238,
    fair_fight: 8.64,
    bs_estimate: 831719325,
    bs_estimate_human: "832m",
    bss_public: 56559,
    last_updated: 1754697862,
  },
  {
    player_id: 2723703,
    fair_fight: 4.57,
    bs_estimate: 181003739,
    bs_estimate_human: "181m",
    bss_public: 26385,
    last_updated: 1754676471,
  },
  {
    player_id: 2731836,
    fair_fight: 1.87,
    bs_estimate: 10843499,
    bs_estimate_human: "10.8m",
    bss_public: 6458,
    last_updated: 1749592387,
  },
  {
    player_id: 2744969,
    fair_fight: 1.35,
    bs_estimate: 1722624,
    bs_estimate_human: "1.72m",
    bss_public: 2574,
    last_updated: 1752667643,
  },
  {
    player_id: 2757458,
    fair_fight: 10.4,
    bs_estimate: 1258287547,
    bs_estimate_human: "1.26b",
    bss_public: 69567,
    last_updated: 1754993016,
  },
  {
    player_id: 2761602,
    fair_fight: 6.8,
    bs_estimate: 479064463,
    bs_estimate_human: "479m",
    bss_public: 42925,
    last_updated: 1754331002,
  },
  {
    player_id: 2762907,
    fair_fight: 11.22,
    bs_estimate: 1487487832,
    bs_estimate_human: "1.49b",
    bss_public: 75638,
    last_updated: 1754676546,
  },
  {
    player_id: 2763559,
    fair_fight: 8.22,
    bs_estimate: 742433372,
    bs_estimate_human: "742m",
    bss_public: 53437,
    last_updated: 1730463987,
  },
  {
    player_id: 2778478,
    fair_fight: 1.85,
    bs_estimate: 10267051,
    bs_estimate_human: "10.3m",
    bss_public: 6284,
    last_updated: 1754698150,
  },
  {
    player_id: 2913371,
    fair_fight: 1.07,
    bs_estimate: 79510,
    bs_estimate_human: "79.5k",
    bss_public: 553,
    last_updated: 1754736989,
  },
  {
    player_id: 2919122,
    fair_fight: 3.9,
    bs_estimate: 119671270,
    bs_estimate_human: "120m",
    bss_public: 21454,
    last_updated: 1750377336,
  },
  {
    player_id: 2919365,
    fair_fight: 4.54,
    bs_estimate: 178093132,
    bs_estimate_human: "178m",
    bss_public: 26172,
    last_updated: 1752147409,
  },
  {
    player_id: 3045370,
    fair_fight: 2.91,
    bs_estimate: 51991649,
    bs_estimate_human: "52m",
    bss_public: 14141,
    last_updated: 1752147111,
  },
  {
    player_id: 3049221,
    fair_fight: 1.36,
    bs_estimate: 1875795,
    bs_estimate_human: "1.88m",
    bss_public: 2686,
    last_updated: 1748587879,
  },
  {
    player_id: 3125803,
    fair_fight: 1.28,
    bs_estimate: 1149878,
    bs_estimate_human: "1.15m",
    bss_public: 2103,
    last_updated: 1755605653,
  },
  {
    player_id: 3162152,
    fair_fight: 1.77,
    bs_estimate: 8335144,
    bs_estimate_human: "8.34m",
    bss_public: 5662,
    last_updated: 1748570445,
  },
  {
    player_id: 3162582,
    fair_fight: 1.25,
    bs_estimate: 886966,
    bs_estimate_human: "887k",
    bss_public: 1847,
    last_updated: 1753536613,
  },
  {
    player_id: 3221627,
    fair_fight: 1.1,
    bs_estimate: 154555,
    bs_estimate_human: "155k",
    bss_public: 771,
    last_updated: 1754923861,
  },
  {
    player_id: 3274458,
    fair_fight: 1.21,
    bs_estimate: 636799,
    bs_estimate_human: "637k",
    bss_public: 1565,
    last_updated: 1750108450,
  },
  {
    player_id: 3330202,
    fair_fight: 1.23,
    bs_estimate: 739952,
    bs_estimate_human: "740k",
    bss_public: 1687,
    last_updated: 1755096147,
  },
  {
    player_id: 3358683,
    fair_fight: 1.35,
    bs_estimate: 1757600,
    bs_estimate_human: "1.76m",
    bss_public: 2600,
    last_updated: 1755470963,
  },
  {
    player_id: 3363488,
    fair_fight: 1.33,
    bs_estimate: 1596526,
    bs_estimate_human: "1.6m",
    bss_public: 2478,
    last_updated: 1751894240,
  },
  {
    player_id: 3397046,
    fair_fight: 1.09,
    bs_estimate: 113944,
    bs_estimate_human: "114k",
    bss_public: 662,
    last_updated: 1754761021,
  },
  {
    player_id: 3425867,
    fair_fight: 1.74,
    bs_estimate: 7753856,
    bs_estimate_human: "7.75m",
    bss_public: 5461,
    last_updated: 1755400453,
  },
  {
    player_id: 3427031,
    fair_fight: 1.13,
    bs_estimate: 240116,
    bs_estimate_human: "240k",
    bss_public: 961,
    last_updated: 1754707218,
  },
  {
    player_id: 3427041,
    fair_fight: 1.04,
    bs_estimate: 27972,
    bs_estimate_human: "28k",
    bss_public: 328,
    last_updated: 1754736674,
  },
  {
    player_id: 3427377,
    fair_fight: 1.11,
    bs_estimate: 179114,
    bs_estimate_human: "179k",
    bss_public: 830,
    last_updated: 1754742434,
  },
  {
    player_id: 3431913,
    fair_fight: 1.47,
    bs_estimate: 3119817,
    bs_estimate_human: "3.12m",
    bss_public: 3464,
    last_updated: 1755486136,
  },
  {
    player_id: 3442956,
    fair_fight: 1.17,
    bs_estimate: 394634,
    bs_estimate_human: "395k",
    bss_public: 1232,
    last_updated: 1755012394,
  },
  {
    player_id: 3472762,
    fair_fight: 1.1,
    bs_estimate: 130697,
    bs_estimate_human: "131k",
    bss_public: 709,
    last_updated: 1755465000,
  },
  {
    player_id: 3493687,
    fair_fight: 1.17,
    bs_estimate: 403654,
    bs_estimate_human: "404k",
    bss_public: 1246,
    last_updated: 1754735221,
  },
  {
    player_id: 3508429,
    fair_fight: 1.24,
    bs_estimate: 819163,
    bs_estimate_human: "819k",
    bss_public: 1775,
    last_updated: 1753829075,
  },
  {
    player_id: 3512745,
    fair_fight: 1.38,
    bs_estimate: 2025317,
    bs_estimate_human: "2.03m",
    bss_public: 2791,
    last_updated: 1754767310,
  },
  {
    player_id: 3532786,
    fair_fight: 1.01,
    bs_estimate: 2153,
    bs_estimate_human: "2.15k",
    bss_public: 91,
    last_updated: 1754731418,
  },
  {
    player_id: 3532808,
    fair_fight: 1.01,
    bs_estimate: 703,
    bs_estimate_human: "703",
    bss_public: 52,
    last_updated: 1754742351,
  },
  {
    player_id: 3542417,
    fair_fight: 1.08,
    bs_estimate: 88371,
    bs_estimate_human: "88.4k",
    bss_public: 583,
    last_updated: 1754737174,
  },
  {
    player_id: 3584467,
    fair_fight: 1.18,
    bs_estimate: 457842,
    bs_estimate_human: "458k",
    bss_public: 1327,
    last_updated: 1754710163,
  },
  {
    player_id: 3614536,
    fair_fight: 1.13,
    bs_estimate: 256890,
    bs_estimate_human: "257k",
    bss_public: 994,
    last_updated: 1754742238,
  },
  {
    player_id: 3668596,
    fair_fight: 1.12,
    bs_estimate: 198608,
    bs_estimate_human: "199k",
    bss_public: 874,
    last_updated: 1754740931,
  },
  {
    player_id: 3673975,
    fair_fight: 1.07,
    bs_estimate: 77227,
    bs_estimate_human: "77.2k",
    bss_public: 545,
    last_updated: 1754735989,
  },
  {
    player_id: 3675116,
    fair_fight: 1.12,
    bs_estimate: 200430,
    bs_estimate_human: "200k",
    bss_public: 878,
    last_updated: 1755390726,
  },
  {
    player_id: 3688293,
    fair_fight: 1.05,
    bs_estimate: 31487,
    bs_estimate_human: "31.5k",
    bss_public: 348,
    last_updated: 1755022643,
  },
  {
    player_id: 3738141,
    fair_fight: 1.04,
    bs_estimate: 25472,
    bs_estimate_human: "25.5k",
    bss_public: 313,
    last_updated: 1754710188,
  },
  {
    player_id: 3746479,
    fair_fight: 1.01,
    bs_estimate: 3146,
    bs_estimate_human: "3.15k",
    bss_public: 110,
    last_updated: 1755425713,
  },
  {
    player_id: 3752392,
    fair_fight: 1.04,
    bs_estimate: 26791,
    bs_estimate_human: "26.8k",
    bss_public: 321,
    last_updated: 1754738409,
  },
  {
    player_id: 3767071,
    fair_fight: 1.03,
    bs_estimate: 12470,
    bs_estimate_human: "12.5k",
    bss_public: 219,
    last_updated: 1754736498,
  },
  {
    player_id: 3818819,
    fair_fight: 1.02,
    bs_estimate: 6993,
    bs_estimate_human: "6.99k",
    bss_public: 164,
    last_updated: 1754741696,
  },
  {
    player_id: 3820492,
    fair_fight: 1.01,
    bs_estimate: 3089,
    bs_estimate_human: "3.09k",
    bss_public: 109,
    last_updated: 1754735152,
  },
  {
    player_id: 3852927,
    fair_fight: 1.01,
    bs_estimate: 3146,
    bs_estimate_human: "3.15k",
    bss_public: 110,
    last_updated: 1754688162,
  },
  {
    player_id: 3862512,
    fair_fight: 1.01,
    bs_estimate: 2446,
    bs_estimate_human: "2.45k",
    bss_public: 97,
    last_updated: 1754729334,
  },
  {
    player_id: 3863372,
    fair_fight: 1.01,
    bs_estimate: 875,
    bs_estimate_human: "875",
    bss_public: 58,
    last_updated: 1754742061,
  },
  {
    player_id: 3864144,
    fair_fight: 1.01,
    bs_estimate: 550,
    bs_estimate_human: "550",
    bss_public: 46,
    last_updated: 1754742506,
  },
];
const ourfactionbasic: FactionData = {
  ID: 37498,
  name: "The Railroad",
  tag: "TRR",
  tag_image: "37498-92910.png",
  leader: 1966169,
  "co-leader": 2259164,
  respect: 2927666,
  age: 3214,
  capacity: 100,
  best_chain: 25000,
  territory_wars: {},
  raid_wars: {},
  peace: {},
  rank: {
    level: 11,
    name: "Gold",
    division: 1,
    position: 0,
    wins: 19,
  },
  ranked_wars: {
    "29256": {
      factions: {
        "15837": {
          name: "Suits",
          score: 0,
          chain: 0,
        },
        "37498": {
          name: "The Railroad",
          score: 0,
          chain: 0,
        },
      },
      war: {
        start: 1755374400,
        end: 0,
        target: 9500,
        winner: 0,
      },
    },
  },
  members: {
    "1737492": {
      name: "gazzer678",
      level: 82,
      days_in_faction: 768,
      last_action: {
        status: "Offline",
        timestamp: 1755248233,
        relative: "53 minutes ago",
      },
      status: {
        description: "Returning to Torn from South Africa",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "Utility Clerk",
    },
    "1833269": {
      name: "jeyGO",
      level: 86,
      days_in_faction: 1102,
      last_action: {
        status: "Offline",
        timestamp: 1755239224,
        relative: "3 hours ago",
      },
      status: {
        description: "In Switzerland",
        details: "",
        state: "Abroad",
        color: "blue",
        until: 0,
      },
      position: "First Class",
    },
    "1935843": {
      name: "KILROY",
      level: 52,
      days_in_faction: 659,
      last_action: {
        status: "Offline",
        timestamp: 1755233266,
        relative: "5 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "1966169": {
      name: "panopticism",
      level: 85,
      days_in_faction: 2472,
      last_action: {
        status: "Idle",
        timestamp: 1755219500,
        relative: "8 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Leader",
    },
    "1990136": {
      name: "RocketLab",
      level: 87,
      days_in_faction: 25,
      last_action: {
        status: "Offline",
        timestamp: 1755162520,
        relative: "1 day ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Passenger",
    },
    "2070276": {
      name: "Aqua_Man",
      level: 60,
      days_in_faction: 1398,
      last_action: {
        status: "Offline",
        timestamp: 1755251312,
        relative: "2 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2081561": {
      name: "Offie",
      level: 33,
      days_in_faction: 23,
      last_action: {
        status: "Offline",
        timestamp: 1755247468,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Passenger",
    },
    "2105791": {
      name: "kingkong965",
      level: 30,
      days_in_faction: 2556,
      last_action: {
        status: "Offline",
        timestamp: 1755224614,
        relative: "7 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2124865": {
      name: "MindDesigner",
      level: 100,
      days_in_faction: 2483,
      last_action: {
        status: "Offline",
        timestamp: 1755205422,
        relative: "12 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2129129": {
      name: "BugblatterBeast",
      level: 75,
      days_in_faction: 977,
      last_action: {
        status: "Offline",
        timestamp: 1755237245,
        relative: "3 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Ticket Master",
    },
    "2166770": {
      name: "HentaiHacker",
      level: 99,
      days_in_faction: 1383,
      last_action: {
        status: "Offline",
        timestamp: 1755248923,
        relative: "42 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Caboose",
    },
    "2181282": {
      name: "Itsyaboii",
      level: 70,
      days_in_faction: 1728,
      last_action: {
        status: "Offline",
        timestamp: 1755237605,
        relative: "3 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2211514": {
      name: "DirkDiggler_",
      level: 50,
      days_in_faction: 747,
      last_action: {
        status: "Offline",
        timestamp: 1755217954,
        relative: "9 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2259164": {
      name: "AnitaDrink",
      level: 70,
      days_in_faction: 1657,
      last_action: {
        status: "Offline",
        timestamp: 1755232517,
        relative: "5 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Co-leader",
    },
    "2288929": {
      name: "Frisker",
      level: 27,
      days_in_faction: 633,
      last_action: {
        status: "Idle",
        timestamp: 1755247880,
        relative: "59 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2289117": {
      name: "ElEmmel",
      level: 35,
      days_in_faction: 1760,
      last_action: {
        status: "Offline",
        timestamp: 1755246786,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2310328": {
      name: "Kaygee",
      level: 80,
      days_in_faction: 39,
      last_action: {
        status: "Idle",
        timestamp: 1755250293,
        relative: "19 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2324540": {
      name: "Jacklewis560",
      level: 78,
      days_in_faction: 1293,
      last_action: {
        status: "Offline",
        timestamp: 1755238614,
        relative: "3 hours ago",
      },
      status: {
        description: "In Switzerland",
        details: "",
        state: "Abroad",
        color: "blue",
        until: 0,
      },
      position: "First Class",
    },
    "2327662": {
      name: "LadyDezzie",
      level: 80,
      days_in_faction: 1843,
      last_action: {
        status: "Idle",
        timestamp: 1755226848,
        relative: "6 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Ticket Master",
    },
    "2418731": {
      name: "StereoPT",
      level: 40,
      days_in_faction: 38,
      last_action: {
        status: "Offline",
        timestamp: 1755250493,
        relative: "16 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Passenger",
    },
    "2423554": {
      name: "Saint_DMX",
      level: 90,
      days_in_faction: 2029,
      last_action: {
        status: "Offline",
        timestamp: 1755217838,
        relative: "9 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2451923": {
      name: "Jedidiahlorn1",
      level: 30,
      days_in_faction: 1991,
      last_action: {
        status: "Online",
        timestamp: 1755251397,
        relative: "0 minutes ago",
      },
      status: {
        description: "Traveling to South Africa",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "First Class",
    },
    "2464852": {
      name: "cogline81",
      level: 44,
      days_in_faction: 2027,
      last_action: {
        status: "Offline",
        timestamp: 1755250764,
        relative: "11 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2480237": {
      name: "breezzz",
      level: 40,
      days_in_faction: 1984,
      last_action: {
        status: "Offline",
        timestamp: 1755242438,
        relative: "2 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2485063": {
      name: "Dukeblack",
      level: 91,
      days_in_faction: 1718,
      last_action: {
        status: "Offline",
        timestamp: 1755245808,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2490488": {
      name: "GingerJesus",
      level: 56,
      days_in_faction: 547,
      last_action: {
        status: "Offline",
        timestamp: 1755210683,
        relative: "11 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2523260": {
      name: "Ozany",
      level: 71,
      days_in_faction: 653,
      last_action: {
        status: "Offline",
        timestamp: 1755222366,
        relative: "8 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2538833": {
      name: "SlimLimb",
      level: 85,
      days_in_faction: 841,
      last_action: {
        status: "Offline",
        timestamp: 1755236382,
        relative: "4 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Dispatcher",
    },
    "2564142": {
      name: "Pizzaguy3",
      level: 33,
      days_in_faction: 1845,
      last_action: {
        status: "Offline",
        timestamp: 1755208128,
        relative: "12 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2590230": {
      name: "Jockwakelin",
      level: 80,
      days_in_faction: 1728,
      last_action: {
        status: "Offline",
        timestamp: 1755239147,
        relative: "3 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2666194": {
      name: "Lozboy",
      level: 83,
      days_in_faction: 46,
      last_action: {
        status: "Offline",
        timestamp: 1755248394,
        relative: "51 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2732164": {
      name: "ApolloFenrir",
      level: 75,
      days_in_faction: 979,
      last_action: {
        status: "Offline",
        timestamp: 1755243088,
        relative: "2 hours ago",
      },
      status: {
        description: "Traveling to South Africa",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "Ticket Master",
    },
    "2788702": {
      name: "braKOOM",
      level: 68,
      days_in_faction: 34,
      last_action: {
        status: "Offline",
        timestamp: 1755246411,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2823379": {
      name: "Kinato",
      level: 35,
      days_in_faction: 738,
      last_action: {
        status: "Offline",
        timestamp: 1755244859,
        relative: "1 hour ago",
      },
      status: {
        description: "Traveling to UAE",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "First Class",
    },
    "2832903": {
      name: "Spilliam",
      level: 34,
      days_in_faction: 46,
      last_action: {
        status: "Offline",
        timestamp: 1755231983,
        relative: "5 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Passenger",
    },
    "2927319": {
      name: "Benn",
      level: 60,
      days_in_faction: 152,
      last_action: {
        status: "Offline",
        timestamp: 1755236518,
        relative: "4 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "2997639": {
      name: "za_phoenix",
      level: 77,
      days_in_faction: 640,
      last_action: {
        status: "Offline",
        timestamp: 1755251355,
        relative: "1 minute ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3095162": {
      name: "Chaiii",
      level: 54,
      days_in_faction: 546,
      last_action: {
        status: "Offline",
        timestamp: 1755240857,
        relative: "2 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3102737": {
      name: "PhaseWalker",
      level: 35,
      days_in_faction: 670,
      last_action: {
        status: "Offline",
        timestamp: 1755250867,
        relative: "9 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3155560": {
      name: "Fragile",
      level: 40,
      days_in_faction: 544,
      last_action: {
        status: "Offline",
        timestamp: 1755238481,
        relative: "3 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3158762": {
      name: "dawg78",
      level: 69,
      days_in_faction: 587,
      last_action: {
        status: "Offline",
        timestamp: 1755248904,
        relative: "42 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3169673": {
      name: "EvenSo",
      level: 20,
      days_in_faction: 585,
      last_action: {
        status: "Offline",
        timestamp: 1755248304,
        relative: "52 minutes ago",
      },
      status: {
        description: "In hospital for 43 hrs 9 mins ",
        details: "Overdosed on Xanax",
        state: "Hospital",
        color: "red",
        until: 1755406853,
      },
      position: "First Class",
    },
    "3170724": {
      name: "Cdubb2",
      level: 25,
      days_in_faction: 584,
      last_action: {
        status: "Offline",
        timestamp: 1755232937,
        relative: "5 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3175218": {
      name: "Feste",
      level: 63,
      days_in_faction: 596,
      last_action: {
        status: "Offline",
        timestamp: 1755250659,
        relative: "13 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3185685": {
      name: "Koala",
      level: 67,
      days_in_faction: 520,
      last_action: {
        status: "Offline",
        timestamp: 1755245726,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3186552": {
      name: "_HOBO_",
      level: 72,
      days_in_faction: 494,
      last_action: {
        status: "Offline",
        timestamp: 1755245114,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3187170": {
      name: "BigJeffe",
      level: 60,
      days_in_faction: 153,
      last_action: {
        status: "Offline",
        timestamp: 1755242353,
        relative: "2 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Elite",
    },
    "3187613": {
      name: "ELEKTRISHIN",
      level: 67,
      days_in_faction: 75,
      last_action: {
        status: "Offline",
        timestamp: 1755245243,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3194951": {
      name: "LeonChampagne",
      level: 78,
      days_in_faction: 284,
      last_action: {
        status: "Offline",
        timestamp: 1755250583,
        relative: "14 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Ticket Master",
    },
    "3240351": {
      name: "Darth_Ikari",
      level: 50,
      days_in_faction: 460,
      last_action: {
        status: "Offline",
        timestamp: 1755250595,
        relative: "14 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Utility Clerk",
    },
    "3272175": {
      name: "urwifesbf",
      level: 62,
      days_in_faction: 284,
      last_action: {
        status: "Offline",
        timestamp: 1755222261,
        relative: "8 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3272629": {
      name: "sanoa",
      level: 62,
      days_in_faction: 458,
      last_action: {
        status: "Offline",
        timestamp: 1755250888,
        relative: "9 minutes ago",
      },
      status: {
        description: "Traveling to China",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "First Class",
    },
    "3308762": {
      name: "SkyGor",
      level: 45,
      days_in_faction: 437,
      last_action: {
        status: "Offline",
        timestamp: 1755228077,
        relative: "6 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3313835": {
      name: "Bowertons",
      level: 43,
      days_in_faction: 327,
      last_action: {
        status: "Offline",
        timestamp: 1755212530,
        relative: "10 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3354782": {
      name: "xentac",
      level: 64,
      days_in_faction: 122,
      last_action: {
        status: "Online",
        timestamp: 1755251411,
        relative: "0 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Utility Clerk",
    },
    "3378569": {
      name: "Cbo",
      level: 58,
      days_in_faction: 340,
      last_action: {
        status: "Offline",
        timestamp: 1755248576,
        relative: "47 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3411081": {
      name: "JohnEldenring",
      level: 43,
      days_in_faction: 324,
      last_action: {
        status: "Idle",
        timestamp: 1755250573,
        relative: "14 minutes ago",
      },
      status: {
        description: "Returning to Torn from Mexico",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "First Class",
    },
    "3430644": {
      name: "binarybobo",
      level: 32,
      days_in_faction: 54,
      last_action: {
        status: "Offline",
        timestamp: 1755213351,
        relative: "10 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Passenger",
    },
    "3450188": {
      name: "ThiccSucc",
      level: 33,
      days_in_faction: 201,
      last_action: {
        status: "Offline",
        timestamp: 1755230959,
        relative: "5 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3516752": {
      name: "iDeserveACookie",
      level: 38,
      days_in_faction: 234,
      last_action: {
        status: "Offline",
        timestamp: 1755244913,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "First Class",
    },
    "3523882": {
      name: "Man_Feelings",
      level: 39,
      days_in_faction: 53,
      last_action: {
        status: "Offline",
        timestamp: 1755249637,
        relative: "30 minutes ago",
      },
      status: {
        description: "Traveling to Argentina",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "Passenger",
    },
    "3594281": {
      name: "KingDeign",
      level: 39,
      days_in_faction: 53,
      last_action: {
        status: "Offline",
        timestamp: 1755231339,
        relative: "5 hours ago",
      },
      status: {
        description: "In hospital for 11 mins ",
        details: "Mugged by someone",
        state: "Hospital",
        color: "red",
        until: 1755252160,
      },
      position: "Passenger",
    },
    "3618163": {
      name: "S-R",
      level: 26,
      days_in_faction: 131,
      last_action: {
        status: "Online",
        timestamp: 1755251330,
        relative: "2 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Passenger",
    },
    "3618263": {
      name: "AD4RSH",
      level: 25,
      days_in_faction: 57,
      last_action: {
        status: "Offline",
        timestamp: 1755243430,
        relative: "2 hours ago",
      },
      status: {
        description: "In United Kingdom",
        details: "",
        state: "Abroad",
        color: "blue",
        until: 0,
      },
      position: "Passenger",
    },
    "3636038": {
      name: "Envy33",
      level: 30,
      days_in_faction: 46,
      last_action: {
        status: "Offline",
        timestamp: 1755231543,
        relative: "5 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Passenger",
    },
    "3637937": {
      name: "User_",
      level: 26,
      days_in_faction: 44,
      last_action: {
        status: "Offline",
        timestamp: 1755236326,
        relative: "4 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Passenger",
    },
    "3665926": {
      name: "Rubelita",
      level: 29,
      days_in_faction: 53,
      last_action: {
        status: "Offline",
        timestamp: 1755225655,
        relative: "7 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Passenger",
    },
    "3725857": {
      name: "Babyfacee",
      level: 15,
      days_in_faction: 32,
      last_action: {
        status: "Offline",
        timestamp: 1755239730,
        relative: "3 hours ago",
      },
      status: {
        description: "In an Argentinian hospital for 33 mins ",
        details: "Mugged by someone",
        state: "Hospital",
        color: "red",
        until: 1755253468,
      },
      position: "Passenger",
    },
    "3814859": {
      name: "NikotinaMaruana",
      level: 15,
      days_in_faction: 60,
      last_action: {
        status: "Offline",
        timestamp: 1755239309,
        relative: "3 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Passenger",
    },
    "3845926": {
      name: "Bretterbrecher",
      level: 20,
      days_in_faction: 49,
      last_action: {
        status: "Idle",
        timestamp: 1755250382,
        relative: "17 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Passenger",
    },
  },
};
const enemyfactionbasic: FactionData = {
  ID: 44040,
  name: "Galactic Arcade",
  tag: "G.A.",
  tag_image: "44040-87818.png",
  leader: 2634079,
  "co-leader": 2692623,
  respect: 1135746,
  age: 2131,
  capacity: 80,
  best_chain: 2500,
  territory_wars: {},
  raid_wars: {},
  peace: {},
  rank: {
    level: 11,
    name: "Gold",
    division: 1,
    position: 0,
    wins: 17,
  },
  ranked_wars: {
    "29755": {
      factions: {
        "37498": {
          name: "The Railroad",
          score: 0,
          chain: 0,
        },
        "44040": {
          name: "Galactic Arcade",
          score: 0,
          chain: 0,
        },
      },
      war: {
        start: 1755810000,
        end: 0,
        target: 9100,
        winner: 0,
      },
    },
  },
  members: {
    "1032943": {
      name: "MemoryLane",
      level: 100,
      days_in_faction: 1187,
      last_action: {
        status: "Idle",
        timestamp: 1755625280,
        relative: "2 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "64-bit",
    },
    "1393543": {
      name: "Glast_Gambit",
      level: 53,
      days_in_faction: 1515,
      last_action: {
        status: "Offline",
        timestamp: 1755611332,
        relative: "5 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "1639649": {
      name: "My-Name-Jeff",
      level: 64,
      days_in_faction: 165,
      last_action: {
        status: "Offline",
        timestamp: 1755621713,
        relative: "3 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "1868089": {
      name: "Darkoth89",
      level: 50,
      days_in_faction: 541,
      last_action: {
        status: "Idle",
        timestamp: 1755631091,
        relative: "25 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2080108": {
      name: "Stevedog",
      level: 79,
      days_in_faction: 1176,
      last_action: {
        status: "Offline",
        timestamp: 1755614316,
        relative: "5 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2128218": {
      name: "Acepascal",
      level: 56,
      days_in_faction: 1577,
      last_action: {
        status: "Offline",
        timestamp: 1755631947,
        relative: "10 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2142539": {
      name: "SYTHX",
      level: 98,
      days_in_faction: 548,
      last_action: {
        status: "Offline",
        timestamp: 1755627688,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2177862": {
      name: "centexman",
      level: 78,
      days_in_faction: 1160,
      last_action: {
        status: "Idle",
        timestamp: 1755629789,
        relative: "46 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2265047": {
      name: "Ryuryu",
      level: 75,
      days_in_faction: 445,
      last_action: {
        status: "Offline",
        timestamp: 1755627619,
        relative: "1 hour ago",
      },
      status: {
        description: "Traveling to Argentina",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "16-bit",
    },
    "2327844": {
      name: "DK-Reaper",
      level: 70,
      days_in_faction: 445,
      last_action: {
        status: "Idle",
        timestamp: 1755625470,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2414097": {
      name: "EuRikachii",
      level: 20,
      days_in_faction: 561,
      last_action: {
        status: "Offline",
        timestamp: 1755606072,
        relative: "7 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2416699": {
      name: "_13th",
      level: 17,
      days_in_faction: 2088,
      last_action: {
        status: "Offline",
        timestamp: 1755611104,
        relative: "5 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2513875": {
      name: "Jacksonmundee",
      level: 85,
      days_in_faction: 855,
      last_action: {
        status: "Offline",
        timestamp: 1755605825,
        relative: "7 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Super 16-bit",
    },
    "2634079": {
      name: "IndyCar",
      level: 98,
      days_in_faction: 1620,
      last_action: {
        status: "Offline",
        timestamp: 1755627001,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Leader",
    },
    "2650729": {
      name: "RexII",
      level: 88,
      days_in_faction: 1609,
      last_action: {
        status: "Offline",
        timestamp: 1755619955,
        relative: "3 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "32-bit",
    },
    "2650843": {
      name: "tynanator",
      level: 38,
      days_in_faction: 1490,
      last_action: {
        status: "Offline",
        timestamp: 1755627925,
        relative: "1 hour ago",
      },
      status: {
        description: "Returning to Torn from China",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "16-bit",
    },
    "2664843": {
      name: "The_Diceman",
      level: 83,
      days_in_faction: 1610,
      last_action: {
        status: "Offline",
        timestamp: 1755622192,
        relative: "2 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "64-bit",
    },
    "2692623": {
      name: "Joshuhwa",
      level: 97,
      days_in_faction: 1498,
      last_action: {
        status: "Online",
        timestamp: 1755632565,
        relative: "0 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Co-leader",
    },
    "2700238": {
      name: "ZoneE",
      level: 79,
      days_in_faction: 1449,
      last_action: {
        status: "Offline",
        timestamp: 1755623097,
        relative: "2 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2723703": {
      name: "Jimmy2fingers",
      level: 70,
      days_in_faction: 1400,
      last_action: {
        status: "Offline",
        timestamp: 1755612881,
        relative: "5 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2731836": {
      name: "Minstrel",
      level: 60,
      days_in_faction: 1373,
      last_action: {
        status: "Offline",
        timestamp: 1755598139,
        relative: "9 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "32-bit",
    },
    "2744969": {
      name: "Kuvi",
      level: 50,
      days_in_faction: 1297,
      last_action: {
        status: "Offline",
        timestamp: 1755629941,
        relative: "44 minutes ago",
      },
      status: {
        description: "Traveling to China",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "16-bit",
    },
    "2757458": {
      name: "ButtermyBiscuit",
      level: 69,
      days_in_faction: 1271,
      last_action: {
        status: "Offline",
        timestamp: 1755616230,
        relative: "4 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2761602": {
      name: "Ferb_msi",
      level: 40,
      days_in_faction: 1244,
      last_action: {
        status: "Offline",
        timestamp: 1755627363,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "32-bit",
    },
    "2762907": {
      name: "VelveteenBlack",
      level: 75,
      days_in_faction: 1177,
      last_action: {
        status: "Offline",
        timestamp: 1755628432,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2763559": {
      name: "SonicHades171",
      level: 69,
      days_in_faction: 1244,
      last_action: {
        status: "Offline",
        timestamp: 1755606632,
        relative: "7 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "64-bit",
    },
    "2778478": {
      name: "SilverSpyder",
      level: 25,
      days_in_faction: 1183,
      last_action: {
        status: "Offline",
        timestamp: 1755628790,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2913371": {
      name: "PotKettleBlack",
      level: 21,
      days_in_faction: 202,
      last_action: {
        status: "Offline",
        timestamp: 1755608401,
        relative: "6 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2919122": {
      name: "BrassMoney",
      level: 55,
      days_in_faction: 843,
      last_action: {
        status: "Offline",
        timestamp: 1755628752,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "2919365": {
      name: "Twopips",
      level: 60,
      days_in_faction: 818,
      last_action: {
        status: "Online",
        timestamp: 1755631587,
        relative: "16 minutes ago",
      },
      status: {
        description: "Traveling to South Africa",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "Super 16-bit",
    },
    "3045370": {
      name: "Tamanos",
      level: 50,
      days_in_faction: 718,
      last_action: {
        status: "Offline",
        timestamp: 1755631741,
        relative: "14 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "Super 16-bit",
    },
    "3049221": {
      name: "IvyDoll",
      level: 30,
      days_in_faction: 718,
      last_action: {
        status: "Offline",
        timestamp: 1755579861,
        relative: "14 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3125803": {
      name: "Bugra1903",
      level: 41,
      days_in_faction: 617,
      last_action: {
        status: "Offline",
        timestamp: 1755614416,
        relative: "5 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3162152": {
      name: "Monuko",
      level: 30,
      days_in_faction: 618,
      last_action: {
        status: "Offline",
        timestamp: 1755618196,
        relative: "4 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3162582": {
      name: "Snickers",
      level: 34,
      days_in_faction: 532,
      last_action: {
        status: "Offline",
        timestamp: 1755582251,
        relative: "13 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3221627": {
      name: "Matatout",
      level: 35,
      days_in_faction: 62,
      last_action: {
        status: "Offline",
        timestamp: 1755620383,
        relative: "3 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3274458": {
      name: "Geschmak",
      level: 24,
      days_in_faction: 476,
      last_action: {
        status: "Offline",
        timestamp: 1755627767,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3330202": {
      name: "Medic89",
      level: 48,
      days_in_faction: 208,
      last_action: {
        status: "Idle",
        timestamp: 1755631793,
        relative: "13 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3358683": {
      name: "MidnightAcolyte",
      level: 26,
      days_in_faction: 389,
      last_action: {
        status: "Offline",
        timestamp: 1755631370,
        relative: "20 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3363488": {
      name: "VClarke",
      level: 45,
      days_in_faction: 248,
      last_action: {
        status: "Idle",
        timestamp: 1755626153,
        relative: "1 hour ago",
      },
      status: {
        description: "Returning to Torn from South Africa",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "16-bit",
    },
    "3397046": {
      name: "Boko-Harman",
      level: 32,
      days_in_faction: 248,
      last_action: {
        status: "Offline",
        timestamp: 1755592202,
        relative: "11 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3425867": {
      name: "MrThizzle",
      level: 50,
      days_in_faction: 335,
      last_action: {
        status: "Offline",
        timestamp: 1755630652,
        relative: "32 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3427031": {
      name: "DainP",
      level: 27,
      days_in_faction: 334,
      last_action: {
        status: "Offline",
        timestamp: 1755630948,
        relative: "27 minutes ago",
      },
      status: {
        description: "Returning to Torn from Japan",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "16-bit",
    },
    "3427041": {
      name: "Trigger94",
      level: 23,
      days_in_faction: 334,
      last_action: {
        status: "Offline",
        timestamp: 1755622338,
        relative: "2 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3427377": {
      name: "CornCob_USA",
      level: 24,
      days_in_faction: 334,
      last_action: {
        status: "Offline",
        timestamp: 1755577026,
        relative: "15 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3431913": {
      name: "3MBER",
      level: 23,
      days_in_faction: 329,
      last_action: {
        status: "Offline",
        timestamp: 1755626067,
        relative: "1 hour ago",
      },
      status: {
        description: "Returning to Torn from South Africa",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "Super 16-bit",
    },
    "3442956": {
      name: "WayneWeeds",
      level: 35,
      days_in_faction: 320,
      last_action: {
        status: "Offline",
        timestamp: 1755626301,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3472762": {
      name: "SaulBP",
      level: 30,
      days_in_faction: 291,
      last_action: {
        status: "Idle",
        timestamp: 1755631295,
        relative: "21 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3493687": {
      name: "Brucebannar",
      level: 32,
      days_in_faction: 254,
      last_action: {
        status: "Offline",
        timestamp: 1755576960,
        relative: "15 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3508429": {
      name: "Skylines",
      level: 30,
      days_in_faction: 259,
      last_action: {
        status: "Offline",
        timestamp: 1755631597,
        relative: "16 minutes ago",
      },
      status: {
        description: "Traveling to UAE",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "16-bit",
    },
    "3512745": {
      name: "Derknz",
      level: 40,
      days_in_faction: 238,
      last_action: {
        status: "Offline",
        timestamp: 1755610299,
        relative: "6 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3532786": {
      name: "Baconfluff",
      level: 14,
      days_in_faction: 26,
      last_action: {
        status: "Offline",
        timestamp: 1755626674,
        relative: "1 hour ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "8-bit",
    },
    "3532808": {
      name: "Asbestos_eater",
      level: 11,
      days_in_faction: 26,
      last_action: {
        status: "Idle",
        timestamp: 1755629750,
        relative: "47 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "8-bit",
    },
    "3542417": {
      name: "Diatoma",
      level: 20,
      days_in_faction: 226,
      last_action: {
        status: "Offline",
        timestamp: 1755621571,
        relative: "3 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3584467": {
      name: "uncle_bumbo",
      level: 39,
      days_in_faction: 196,
      last_action: {
        status: "Offline",
        timestamp: 1755624264,
        relative: "2 hours ago",
      },
      status: {
        description: "Returning to Torn from UAE",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "16-bit",
    },
    "3614536": {
      name: "HomophobicTuna1",
      level: 32,
      days_in_faction: 168,
      last_action: {
        status: "Offline",
        timestamp: 1755612898,
        relative: "5 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3668596": {
      name: "Liam_S",
      level: 25,
      days_in_faction: 146,
      last_action: {
        status: "Offline",
        timestamp: 1755520454,
        relative: "1 day ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3673975": {
      name: "jman0608",
      level: 24,
      days_in_faction: 138,
      last_action: {
        status: "Offline",
        timestamp: 1755566751,
        relative: "18 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3675116": {
      name: "AyaQhaZA",
      level: 20,
      days_in_faction: 128,
      last_action: {
        status: "Offline",
        timestamp: 1755630950,
        relative: "27 minutes ago",
      },
      status: {
        description: "Traveling to China",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "16-bit",
    },
    "3688293": {
      name: "Novasa",
      level: 25,
      days_in_faction: 110,
      last_action: {
        status: "Offline",
        timestamp: 1755627459,
        relative: "1 hour ago",
      },
      status: {
        description: "In China",
        details: "",
        state: "Abroad",
        color: "blue",
        until: 0,
      },
      position: "16-bit",
    },
    "3738141": {
      name: "DaHyung",
      level: 20,
      days_in_faction: 101,
      last_action: {
        status: "Online",
        timestamp: 1755632530,
        relative: "1 minute ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3746479": {
      name: "Theoneos",
      level: 16,
      days_in_faction: 91,
      last_action: {
        status: "Offline",
        timestamp: 1755595580,
        relative: "10 hours ago",
      },
      status: {
        description: "In a South African hospital for 36 mins ",
        details: "Mugged by someone",
        state: "Hospital",
        color: "red",
        until: 1755634813,
      },
      position: "16-bit",
    },
    "3752392": {
      name: "ShadowsBlade",
      level: 25,
      days_in_faction: 94,
      last_action: {
        status: "Offline",
        timestamp: 1755625304,
        relative: "2 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3767071": {
      name: "StigmaBullet",
      level: 19,
      days_in_faction: 59,
      last_action: {
        status: "Offline",
        timestamp: 1755611071,
        relative: "5 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "16-bit",
    },
    "3818819": {
      name: "frodofbaggend",
      level: 13,
      days_in_faction: 69,
      last_action: {
        status: "Offline",
        timestamp: 1755616180,
        relative: "4 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "8-bit",
    },
    "3820492": {
      name: "C45TL3",
      level: 7,
      days_in_faction: 68,
      last_action: {
        status: "Offline",
        timestamp: 1755281516,
        relative: "4 days ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "8-bit",
    },
    "3852927": {
      name: "Grandpa_Jim",
      level: 16,
      days_in_faction: 47,
      last_action: {
        status: "Offline",
        timestamp: 1755629687,
        relative: "48 minutes ago",
      },
      status: {
        description: "Returning to Torn from South Africa",
        details: "",
        state: "Traveling",
        color: "blue",
        until: 0,
      },
      position: "16-bit",
    },
    "3862512": {
      name: "hades0115",
      level: 14,
      days_in_faction: 39,
      last_action: {
        status: "Offline",
        timestamp: 1755610904,
        relative: "6 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "8-bit",
    },
    "3863372": {
      name: "SBA_SA",
      level: 9,
      days_in_faction: 40,
      last_action: {
        status: "Idle",
        timestamp: 1755630246,
        relative: "39 minutes ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "8-bit",
    },
    "3864144": {
      name: "Egotistical1",
      level: 8,
      days_in_faction: 17,
      last_action: {
        status: "Offline",
        timestamp: 1755565607,
        relative: "18 hours ago",
      },
      status: {
        description: "Okay",
        details: "",
        state: "Okay",
        color: "green",
        until: 0,
      },
      position: "8-bit",
    },
  },
};
