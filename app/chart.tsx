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
  TornFactionBasicApi,
  FairFightScore,
  FFScouterResult,
  GraphData,
  TornMemberApi,
  FFScouterJson,
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
    return function (data: GraphData) {
      setter(massage_graph_data(data));
      nameSetter(data.name);
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

    const left_data: GraphData[] = sorted_left.map((value) => {
      const member: TornMemberApi =
        leftfactiondata.members["" + value.player_id];
      const opponent_scores = sorted_right.map(
        (enemy) =>
          new FairFightScore(
            rightfactionbasic.members["" + enemy.player_id].name,
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
            value.defender_ff != null && value.defender_ff >= POSSIBLE_BSS_MAX,
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
    });

    const right_data: GraphData[] = sorted_right.map((value) => {
      const member: TornMemberApi =
        rightfactiondata.members["" + value.player_id];
      const opponent_scores = sorted_left.map(
        (ours) =>
          new FairFightScore(
            leftfactionbasic.members["" + ours.player_id].name,
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
            value.defender_ff != null && value.defender_ff >= POSSIBLE_BSS_MAX,
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
    });

    console.log(left_data);
    console.log(right_data);

    return { left_data: left_data, right_data: right_data };
  }

  return (
    <>
      <Card className="col-span-12 lg:col-span-6">
        <CardHeader>
          <CardTitle>FF as attacker (left)</CardTitle>
        </CardHeader>
        <ChartContainer config={chartConfig}>
          <ComposedChart
            data={left_data}
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
              label="Easy targets"
              stackId="attcounts"
              fill={EASY_COLOR}
              onClick={handleClick(setLeftSelected, setLeftNameSelected)}
            />
            <Bar
              name="Possible"
              dataKey={(value) => value.possible_attacks.length}
              label="Possible attacks"
              stackId="attcounts"
              fill={POSSIBLE_COLOR}
              onClick={handleClick(setLeftSelected, setLeftNameSelected)}
            />
            <Bar
              name="Impossible"
              dataKey={(value) => value.hard_attacks.length}
              label="Impossible attacks"
              stackId="attcounts"
              fill={HARD_COLOR}
              onClick={handleClick(setLeftSelected, setLeftNameSelected)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
      <Card className="col-span-12 lg:col-span-6">
        <CardHeader>
          <CardTitle>FF as attacker (right)</CardTitle>
        </CardHeader>
        <ChartContainer config={chartConfig}>
          <ComposedChart
            data={right_data}
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
              fill={EASY_COLOR}
              onClick={handleClick(setRightSelected, setRightNameSelected)}
            />
            <Bar
              dataKey={(value) => value.possible_attacks.length}
              name="Possible"
              label="Possible attacks"
              stackId="attcounts"
              fill={POSSIBLE_COLOR}
              onClick={handleClick(setRightSelected, setRightNameSelected)}
            />
            <Bar
              dataKey={(value) => value.hard_attacks.length}
              name="Impossible"
              label="Impossible attacks"
              stackId="attcounts"
              fill={HARD_COLOR}
              onClick={handleClick(setRightSelected, setRightNameSelected)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
      <Card className="col-span-12 lg:col-span-6">
        <CardHeader>
          <CardTitle>FF as defender (left)</CardTitle>
        </CardHeader>
        <ChartContainer config={chartConfig}>
          <ComposedChart
            data={left_data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={1} />
            <YAxis label="count" domain={[0, max_yaxis]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              dataKey={(value) => value.easy_defends.length}
              name="Easy"
              label="Easy defends"
              stackId="defcounts"
              fill={EASY_COLOR}
              onClick={handleClick(setLeftSelected, setLeftNameSelected)}
            />
            <Bar
              dataKey={(value) => value.possible_defends.length}
              name="Possible"
              label="Possible defends"
              stackId="defcounts"
              fill={POSSIBLE_COLOR}
              onClick={handleClick(setLeftSelected, setLeftNameSelected)}
            />
            <Bar
              dataKey={(value) => value.hard_defends.length}
              name="Impossible"
              label="Impossible defends"
              stackId="defcounts"
              fill={HARD_COLOR}
              onClick={handleClick(setLeftSelected, setLeftNameSelected)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
      <Card className="col-span-12 lg:col-span-6">
        <CardHeader>
          <CardTitle>FF as defender (right)</CardTitle>
        </CardHeader>
        <ChartContainer config={chartConfig}>
          <ComposedChart
            data={right_data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={1} />
            <YAxis label="count" domain={[0, max_yaxis]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              dataKey={(value) => value.easy_defends.length}
              name="Easy"
              label="Easy defends"
              stackId="defcounts"
              fill={EASY_COLOR}
              onClick={handleClick(setRightSelected, setRightNameSelected)}
            />
            <Bar
              dataKey={(value) => value.possible_defends.length}
              name="Possible"
              label="Possible defends"
              stackId="defcounts"
              fill={POSSIBLE_COLOR}
              onClick={handleClick(setRightSelected, setRightNameSelected)}
            />
            <Bar
              dataKey={(value) => value.hard_defends.length}
              name="Impossible"
              label="Impossible defends"
              stackId="defcounts"
              fill={HARD_COLOR}
              onClick={handleClick(setRightSelected, setRightNameSelected)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
      <Card className="col-span-12 lg:col-span-6">
        <CardHeader>
          <CardTitle>FF as attacker ({leftNameSelected})</CardTitle>
        </CardHeader>
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
              interval={1}
            />
            <YAxis
              yAxisId="attacker"
              domain={[EASY_BSS_MAX - 0.3, POSSIBLE_BSS_MAX + 0.3]}
              allowDataOverflow
            />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              xAxisId="name"
              yAxisId="attacker"
              dataKey="attacker_ff"
              name={"FF of " + leftNameSelected}
              fill="#666600"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
      <Card className="col-span-12 lg:col-span-6">
        <CardHeader>
          <CardTitle>FF as defender ({leftNameSelected})</CardTitle>
        </CardHeader>
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
              interval={1}
            />
            <YAxis
              yAxisId="defender"
              domain={[EASY_BSS_MAX - 0.3, POSSIBLE_BSS_MAX + 0.3]}
              allowDataOverflow
            />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              xAxisId="name"
              yAxisId="defender"
              dataKey="defender_ff"
              name="FF of attacker"
              fill="#006666"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
      <Card className="col-span-12 lg:col-span-6">
        <CardHeader>
          <CardTitle>FF as attacker ({rightNameSelected})</CardTitle>
        </CardHeader>
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
              interval={1}
            />
            <YAxis
              yAxisId="attacker"
              domain={[EASY_BSS_MAX - 0.3, POSSIBLE_BSS_MAX + 0.3]}
              allowDataOverflow
            />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              xAxisId="name"
              yAxisId="attacker"
              name={"FF of " + rightNameSelected}
              dataKey="attacker_ff"
              fill="#666600"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
      <Card className="col-span-12 lg:col-span-6">
        <CardHeader>
          <CardTitle>FF as defender ({rightNameSelected})</CardTitle>
        </CardHeader>
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
              interval={1}
            />
            <YAxis
              yAxisId="defender"
              domain={[EASY_BSS_MAX - 0.3, POSSIBLE_BSS_MAX + 0.3]}
              allowDataOverflow
            />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend verticalAlign="top" />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              xAxisId="name"
              yAxisId="defender"
              dataKey="defender_ff"
              name="FF of attacker"
              fill="#006666"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </ComposedChart>
        </ChartContainer>
      </Card>
    </>
  );
}
