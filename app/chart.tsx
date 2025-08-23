import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useState, Dispatch, SetStateAction } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  XAxis,
  YAxis,
} from "recharts";
import {
  DrillDownData,
  TornFactionBasicApi,
  FairFightScore,
  FFScouterResult,
  GraphData,
  TornMemberApi,
  FFScouterJson,
} from "./types";
import { CategoricalChartState } from "recharts/types/chart/types";

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

const EASY_COLOR = "#226600";
const POSSIBLE_COLOR = "#aab000";
const HARD_COLOR = "#ff9933";

interface ChartInterface {
  leftffscouterdata: FFScouterResult;
  rightffscouterdata: FFScouterResult;
  leftfactionbasic: TornFactionBasicApi;
  rightfactionbasic: TornFactionBasicApi;
}

export function MyChart({
  leftffscouterdata,
  rightffscouterdata,
  leftfactionbasic,
  rightfactionbasic,
}: ChartInterface) {
  const { left_data, right_data } = massage_data(
    leftffscouterdata,
    rightffscouterdata,
    leftfactionbasic,
    rightfactionbasic,
  );
  const max_yaxis = Math.max(left_data.length, right_data.length);

  const [leftSelected, setLeftSelected] = useState<DrillDownData[]>([]);
  const [leftNameSelected, setLeftNameSelected] = useState("");
  const [rightSelected, setRightSelected] = useState<DrillDownData[]>([]);
  const [rightNameSelected, setRightNameSelected] = useState("");

  function handleClick(
    setter: Dispatch<SetStateAction<DrillDownData[]>>,
    nameSetter: Dispatch<SetStateAction<string>>,
  ) {
    return function (nextState: CategoricalChartState) {
      if (!nextState.activePayload || !nextState.activePayload[0]) {
        return;
      }
      setter(massage_graph_data(nextState.activePayload[0].payload));
      nameSetter(nextState.activePayload[0].payload.name);
    };
  }

  function massage_graph_data(d: GraphData): DrillDownData[] {
    return d.opponent_scores.map((value) => {
      return {
        name: value.name,
        id: value.id,
        attacker_ff: value.attacker_ff,
        defender_ff: value.defender_ff,
        easy_attack:
          value.attacker_ff != null && value.attacker_ff <= EASY_BSS_MAX
            ? 1
            : 0,
        possible_attack:
          value.attacker_ff != null &&
          value.attacker_ff <= POSSIBLE_BSS_MAX &&
          value.attacker_ff > EASY_BSS_MAX
            ? 1
            : 0,
        hard_attack:
          value.attacker_ff != null && value.attacker_ff > POSSIBLE_BSS_MAX
            ? 1
            : 0,
        easy_defend:
          value.defender_ff != null && value.defender_ff <= EASY_BSS_MAX
            ? 1
            : 0,
        possible_defend:
          value.defender_ff != null &&
          value.defender_ff <= POSSIBLE_BSS_MAX &&
          value.defender_ff > EASY_BSS_MAX
            ? 1
            : 0,
        hard_defend:
          value.defender_ff != null && value.defender_ff > POSSIBLE_BSS_MAX
            ? 1
            : 0,
      };
    });
  }

  function massage_data(
    leftffscouterdata: FFScouterResult,
    rightffscouterdata: FFScouterResult,
    leftfactiondata: TornFactionBasicApi,
    rightfactiondata: TornFactionBasicApi,
  ) {
    const sort_function = (a: FFScouterJson, b: FFScouterJson) => {
      if (a.bss_public == null && b.bss_public == null) {
        return 0;
      }
      if (a.bss_public == null) {
        return -1;
      }
      if (b.bss_public == null) {
        return 1;
      }
      return a.bss_public - b.bss_public;
    };
    // factions sorted by lower BSS to highest
    const sorted_left = leftffscouterdata.toSorted(sort_function);
    const sorted_right = rightffscouterdata.toSorted(sort_function);

    const map_data = (
      primaryfaction: TornFactionBasicApi,
      opponentfaction: TornFactionBasicApi,
      opponent: FFScouterResult,
    ) => {
      let member_number = 0;
      return (value: FFScouterJson) => {
        member_number++;
        const member: TornMemberApi =
          primaryfaction.members["" + value.player_id];
        const opponent_scores = opponent.map(
          (enemy) =>
            new FairFightScore(
              opponentfaction.members["" + enemy.player_id].name,
              "" + enemy.player_id,
              value.bss_public,
              enemy.bss_public,
            ),
        );
        const lists = {
          easy_attacks: opponent_scores.filter(
            (value) =>
              value.attacker_ff != null && value.attacker_ff <= EASY_BSS_MAX,
          ),
          possible_attacks: opponent_scores.filter(
            (value) =>
              value.attacker_ff != null &&
              value.attacker_ff <= POSSIBLE_BSS_MAX &&
              value.attacker_ff > EASY_BSS_MAX,
          ),
          hard_attacks: opponent_scores.filter(
            (value) =>
              value.attacker_ff != null && value.attacker_ff > POSSIBLE_BSS_MAX,
          ),
          easy_defends: opponent_scores.filter(
            (value) =>
              value.defender_ff != null &&
              value.defender_ff >= POSSIBLE_BSS_MAX,
          ),
          possible_defends: opponent_scores.filter(
            (value) =>
              value.defender_ff != null &&
              value.defender_ff < POSSIBLE_BSS_MAX &&
              value.defender_ff >= EASY_BSS_MAX,
          ),
          hard_defends: opponent_scores.filter(
            (value) =>
              value.defender_ff != null && value.defender_ff < EASY_BSS_MAX,
          ),
        };
        return {
          name: member?.name ?? "Unknown",
          number: member_number,
          id: value.player_id,
          opponent_scores: opponent_scores,
          bss_public: value.bss_public,
          easy_attacks: lists.easy_attacks,
          easy_attacks_count: lists.easy_attacks.length,
          possible_attacks: lists.possible_attacks,
          possible_attacks_count: lists.possible_attacks.length,
          hard_attacks: lists.hard_attacks,
          hard_attacks_count: lists.hard_attacks.length,
          easy_defends: lists.easy_defends,
          easy_defends_count: lists.easy_defends.length,
          possible_defends: lists.possible_defends,
          possible_defends_count: lists.possible_defends.length,
          hard_defends: lists.hard_defends,
          hard_defends_count: lists.hard_defends.length,
        };
      };
    };

    const left_data: GraphData[] = sorted_left.map(
      map_data(leftfactiondata, rightfactiondata, sorted_right),
    );
    const right_data: GraphData[] = sorted_right.map(
      map_data(rightfactiondata, leftfactiondata, sorted_left),
    );

    console.log(left_data);
    console.log(right_data);

    return { left_data: left_data, right_data: right_data };
  }

  return (
    <>
      <Card className="col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>FF as attacker (left)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ComposedChart
              data={left_data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              onClick={handleClick(setLeftSelected, setLeftNameSelected)}
            >
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                interval="equidistantPreserveStart"
              />
              <YAxis label="count" domain={[0, max_yaxis]} />
              <Legend verticalAlign="top" />
              <CartesianGrid strokeDasharray="3 3" />
              <Area
                dataKey={(value) => value.easy_attacks.length}
                name="Easy"
                label="Easy targets"
                stackId="attcounts"
                fill={EASY_COLOR}
                stroke={EASY_COLOR}
              />
              <Area
                name="Possible"
                dataKey={(value) => value.possible_attacks.length}
                label="Possible attacks"
                stackId="attcounts"
                fill={POSSIBLE_COLOR}
                stroke={POSSIBLE_COLOR}
              />
              <Area
                name="Impossible"
                dataKey={(value) => value.hard_attacks.length}
                label="Impossible attacks"
                stackId="attcounts"
                fill={HARD_COLOR}
                stroke={HARD_COLOR}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>FF as attacker (right)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ComposedChart
              data={right_data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              onClick={handleClick(setRightSelected, setRightNameSelected)}
            >
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                interval="equidistantPreserveStart"
              />
              <YAxis label="count" domain={[0, max_yaxis]} />
              <Legend verticalAlign="top" />
              <CartesianGrid strokeDasharray="3 3" />
              <Area
                dataKey={(value) => value.easy_attacks.length}
                name="Easy"
                label="Easy attacks"
                stackId="attcounts"
                fill={EASY_COLOR}
                stroke={EASY_COLOR}
              />
              <Area
                dataKey={(value) => value.possible_attacks.length}
                name="Possible"
                label="Possible attacks"
                stackId="attcounts"
                fill={POSSIBLE_COLOR}
                stroke={POSSIBLE_COLOR}
              />
              <Area
                dataKey={(value) => value.hard_attacks.length}
                name="Impossible"
                label="Impossible attacks"
                stackId="attcounts"
                fill={HARD_COLOR}
                stroke={HARD_COLOR}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>FF as defender (left)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ComposedChart
              data={left_data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              onClick={handleClick(setLeftSelected, setLeftNameSelected)}
            >
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                interval="equidistantPreserveStart"
              />
              <YAxis label="count" domain={[0, max_yaxis]} />
              <Legend verticalAlign="top" />
              <CartesianGrid strokeDasharray="3 3" />
              <Area
                dataKey={(value) => value.easy_defends.length}
                name="Easy"
                label="Easy defends"
                stackId="defcounts"
                fill={EASY_COLOR}
                stroke={EASY_COLOR}
              />
              <Area
                dataKey={(value) => value.possible_defends.length}
                name="Possible"
                label="Possible defends"
                stackId="defcounts"
                fill={POSSIBLE_COLOR}
                stroke={POSSIBLE_COLOR}
              />
              <Area
                dataKey={(value) => value.hard_defends.length}
                name="Impossible"
                label="Impossible defends"
                stackId="defcounts"
                fill={HARD_COLOR}
                stroke={HARD_COLOR}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>FF as defender (right)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ComposedChart
              data={right_data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              onClick={handleClick(setRightSelected, setRightNameSelected)}
            >
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                interval="equidistantPreserveStart"
              />
              <YAxis label="count" domain={[0, max_yaxis]} />
              <Legend verticalAlign="top" />
              <CartesianGrid strokeDasharray="3 3" />
              <Area
                dataKey={(value) => value.easy_defends.length}
                name="Easy"
                label="Easy defends"
                stackId="defcounts"
                fill={EASY_COLOR}
                stroke={EASY_COLOR}
              />
              <Area
                dataKey={(value) => value.possible_defends.length}
                name="Possible"
                label="Possible defends"
                stackId="defcounts"
                fill={POSSIBLE_COLOR}
                stroke={POSSIBLE_COLOR}
              />
              <Area
                dataKey={(value) => value.hard_defends.length}
                name="Impossible"
                label="Impossible defends"
                stackId="defcounts"
                fill={HARD_COLOR}
                stroke={HARD_COLOR}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>FF as attacker ({leftNameSelected})</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ComposedChart
              data={leftSelected}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <XAxis
                xAxisId="name"
                label="name"
                dataKey="name"
                angle={-45}
                textAnchor="end"
                interval="equidistantPreserveStart"
              />
              <YAxis
                yAxisId="attacker"
                domain={[EASY_BSS_MAX - 0.3, POSSIBLE_BSS_MAX + 0.3]}
                allowDataOverflow
              />
              <Legend verticalAlign="top" />
              <CartesianGrid strokeDasharray="3 3" />
              <Area
                xAxisId="name"
                yAxisId="attacker"
                dataKey="attacker_ff"
                name={"FF of " + leftNameSelected}
                fill="#666600"
                stroke="#666600"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>FF as defender ({leftNameSelected})</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ComposedChart
              data={leftSelected}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <XAxis
                xAxisId="name"
                label="name"
                dataKey="name"
                angle={-45}
                textAnchor="end"
                interval="equidistantPreserveStart"
              />
              <YAxis
                yAxisId="defender"
                domain={[EASY_BSS_MAX - 0.3, POSSIBLE_BSS_MAX + 0.3]}
                allowDataOverflow
              />
              <Legend verticalAlign="top" />
              <CartesianGrid strokeDasharray="3 3" />
              <Area
                xAxisId="name"
                yAxisId="defender"
                dataKey="defender_ff"
                name="FF of attacker"
                fill="#006666"
                stroke="#006666"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>FF as attacker ({rightNameSelected})</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ComposedChart
              data={rightSelected}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <XAxis
                xAxisId="name"
                label="name"
                dataKey="name"
                angle={-45}
                textAnchor="end"
                interval="equidistantPreserveStart"
              />
              <YAxis
                yAxisId="attacker"
                domain={[EASY_BSS_MAX - 0.3, POSSIBLE_BSS_MAX + 0.3]}
                allowDataOverflow
              />
              <Legend verticalAlign="top" />
              <CartesianGrid strokeDasharray="3 3" />
              <Area
                xAxisId="name"
                yAxisId="attacker"
                name={"FF of " + rightNameSelected}
                dataKey="attacker_ff"
                fill="#666600"
                stroke="#666600"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>FF as defender ({rightNameSelected})</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ComposedChart
              data={rightSelected}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <XAxis
                xAxisId="name"
                label="name"
                dataKey="name"
                angle={-45}
                textAnchor="end"
                interval="equidistantPreserveStart"
              />
              <YAxis
                yAxisId="defender"
                domain={[EASY_BSS_MAX - 0.3, POSSIBLE_BSS_MAX + 0.3]}
                allowDataOverflow
              />
              <Legend verticalAlign="top" />
              <CartesianGrid strokeDasharray="3 3" />
              <Area
                xAxisId="name"
                yAxisId="defender"
                dataKey="defender_ff"
                name="FF of attacker"
                fill="#006666"
                stroke="#006666"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </>
  );
}
