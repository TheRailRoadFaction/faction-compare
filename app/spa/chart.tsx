import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useState, Dispatch, SetStateAction } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DrillDownData,
  FactionData,
  FairFightScore,
  FFScouter,
  GraphData,
  Member,
} from "./types";

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

interface ChartInterface {
  ourdata: FFScouter[];
  enemydata: FFScouter[];
  ourfactionbasic: FactionData;
  enemyfactionbasic: FactionData;
}

export function MyChart({
  ourdata,
  enemydata,
  ourfactionbasic,
  enemyfactionbasic,
}: ChartInterface) {
  const { our_data, enemy_data } = massage_data();
  const max_yaxis = Math.max(our_data.length, enemy_data.length);

  const [ourSelected, setOurSelected] = useState<DrillDownData[]>([]);
  const [enemySelected, setEnemySelected] = useState<DrillDownData[]>([]);

  function handleClick(setter: Dispatch<SetStateAction<DrillDownData[]>>) {
    return function (data: GraphData) {
      setter(massage_graph_data(data));
    };
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

  function massage_data() {
    // factions sorted by lower BSS to highest
    const sorted_ours = ourdata.toSorted((a, b) => a.bss_public - b.bss_public);
    const sorted_enemy = enemydata.toSorted(
      (a, b) => a.bss_public - b.bss_public
    );

    const our_data: GraphData[] = sorted_ours.map((value) => {
      const member: Member = ourfactionbasic.members["" + value.player_id];
      const opponent_scores = sorted_enemy.map(
        (enemy) =>
          new FairFightScore(
            enemyfactionbasic.members["" + enemy.player_id].name,
            "" + enemy.player_id,
            value.bss_public,
            enemy.bss_public
          )
      );
      return {
        name: member?.name ?? "Unknown",
        opponent_scores: opponent_scores,
        bss_public: value.bss_public,
        easy_attacks: opponent_scores.filter(
          (value) => value.attacker_ff <= EASY_BSS_MAX
        ),
        possible_attacks: opponent_scores.filter(
          (value) =>
            value.attacker_ff <= POSSIBLE_BSS_MAX &&
            value.attacker_ff > EASY_BSS_MAX
        ),
        hard_attacks: opponent_scores.filter(
          (value) => value.attacker_ff > POSSIBLE_BSS_MAX
        ),
        easy_defends: opponent_scores.filter(
          (value) => value.defender_ff <= EASY_BSS_MAX
        ),
        possible_defends: opponent_scores.filter(
          (value) =>
            value.defender_ff <= POSSIBLE_BSS_MAX &&
            value.defender_ff > EASY_BSS_MAX
        ),
        hard_defends: opponent_scores.filter(
          (value) => value.defender_ff > POSSIBLE_BSS_MAX
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
            ours.bss_public
          )
      );
      return {
        name: member?.name ?? "Unknown",
        opponent_scores: opponent_scores,
        bss_public: value.bss_public,
        easy_attacks: opponent_scores.filter(
          (value) => value.attacker_ff <= EASY_BSS_MAX
        ),
        possible_attacks: opponent_scores.filter(
          (value) =>
            value.attacker_ff <= POSSIBLE_BSS_MAX &&
            value.attacker_ff > EASY_BSS_MAX
        ),
        hard_attacks: opponent_scores.filter(
          (value) => value.attacker_ff > POSSIBLE_BSS_MAX
        ),
        easy_defends: opponent_scores.filter(
          (value) => value.defender_ff <= EASY_BSS_MAX
        ),
        possible_defends: opponent_scores.filter(
          (value) =>
            value.defender_ff <= POSSIBLE_BSS_MAX &&
            value.defender_ff > EASY_BSS_MAX
        ),
        hard_defends: opponent_scores.filter(
          (value) => value.defender_ff > POSSIBLE_BSS_MAX
        ),
      };
    });

    console.log(our_data);
    console.log(enemy_data);

    return { our_data: our_data, enemy_data: enemy_data };
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
