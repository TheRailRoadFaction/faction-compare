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
  CartesianGrid,
  ComposedChart,
  Label,
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
  FactionColumns,
  MemberColumns,
} from "./types";
import { CategoricalChartState } from "recharts/types/chart/types";
import { DataTable } from "./data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EASY_BSS_MAX = 2.5;
const POSSIBLE_BSS_MAX = 4.0;

enum ChartType {
  attack,
  defend,
}

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

  const [leftSelected, setLeftSelected] = useState<DrillDownData[]>([]);
  const [leftNameSelected, setLeftNameSelected] = useState("");
  const [rightSelected, setRightSelected] = useState<DrillDownData[]>([]);
  const [rightNameSelected, setRightNameSelected] = useState("");

  function handleChartClick(
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

  function handleFactionTableClick(
    setter: Dispatch<SetStateAction<DrillDownData[]>>,
    nameSetter: Dispatch<SetStateAction<string>>,
  ) {
    return function (value: GraphData) {
      setter(massage_graph_data(value));
      nameSetter(value.name);
    };
  }

  function massage_graph_data(d: GraphData): DrillDownData[] {
    return d.opponent_scores.map((value) => {
      return {
        name: value.name,
        id: value.id,
        attacker_ff: value.attacker_ff,
        defender_ff: value.defender_ff,
        attacker_ff_str: value.attacker_ff_str,
        defender_ff_str: value.defender_ff_str,
        bss_public: value.bss_public,
        bs_estimate_human: value.bs_estimate_human,
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
  ): { left_data: GraphData[]; right_data: GraphData[] } {
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
      return (value: FFScouterJson): GraphData => {
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
              enemy.bs_estimate_human,
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
          bs_estimate_human: value.bs_estimate_human,
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

  function InnerFactionChartContainer({
    data,
    chartType,
    onClick,
  }: {
    data: GraphData[];
    chartType: ChartType;
    onClick: ReturnType<typeof handleChartClick>;
  }) {
    const series = [
      {
        key: "easy",
        name: "Easy",
        stackId: "counts",
        fill: EASY_COLOR,
        stroke: EASY_COLOR,
        dataKey: `easy_${chartType == ChartType.attack ? "attacks" : "defends"}_count`,
      },
      {
        key: "possible",
        name: "Possible",
        stackId: "counts",
        fill: POSSIBLE_COLOR,
        stroke: POSSIBLE_COLOR,
        dataKey: `possible_${chartType == ChartType.attack ? "attacks" : "defends"}_count`,
      },
      {
        key: "impossible",
        name: "Impossible",
        stackId: "counts",
        fill: HARD_COLOR,
        stroke: HARD_COLOR,
        dataKey: `hard_${chartType == ChartType.attack ? "attacks" : "defends"}_count`,
      },
    ];

    return (
      <ChartContainer config={chartConfig}>
        <ComposedChart
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 60 }}
          onClick={onClick}
          style={{ cursor: "pointer" }}
        >
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            interval="equidistantPreserveStart"
          />
          <YAxis>
            <Label value="count" angle={-90} />
          </YAxis>
          <Legend verticalAlign="top" />
          <CartesianGrid strokeDasharray="3 3" />
          {series.map((s) => (
            <Area
              key={s.key}
              name={s.name}
              stackId={s.stackId}
              fill={s.fill}
              stroke={s.stroke}
              dataKey={s.dataKey}
            />
          ))}
          <ChartTooltip content={<ChartTooltipContent />} />
        </ComposedChart>
      </ChartContainer>
    );
  }

  return (
    <>
      <Tabs defaultValue="faction_charts">
        <TabsList className="mt-5 mx-5">
          <TabsTrigger value="faction_charts">Faction Charts</TabsTrigger>
          <TabsTrigger value="faction_data">Data</TabsTrigger>
          <TabsTrigger value="member_charts">Member Charts</TabsTrigger>
          <TabsTrigger value="member_data">Data</TabsTrigger>
        </TabsList>
        <TabsContent
          value="faction_charts"
          className="grid grid-cols-2 gap-5 m-5"
        >
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>FF as attacker ({leftfactionbasic.name})</CardTitle>
            </CardHeader>
            <CardContent>
              <InnerFactionChartContainer
                data={left_data}
                chartType={ChartType.attack}
                onClick={handleChartClick(setLeftSelected, setLeftNameSelected)}
              />
            </CardContent>
          </Card>
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>FF as attacker ({rightfactionbasic.name})</CardTitle>
            </CardHeader>
            <CardContent>
              <InnerFactionChartContainer
                data={right_data}
                chartType={ChartType.attack}
                onClick={handleChartClick(
                  setRightSelected,
                  setRightNameSelected,
                )}
              />
            </CardContent>
          </Card>
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>FF as defender ({leftfactionbasic.name})</CardTitle>
            </CardHeader>
            <CardContent>
              <InnerFactionChartContainer
                data={left_data}
                chartType={ChartType.defend}
                onClick={handleChartClick(setLeftSelected, setLeftNameSelected)}
              />
            </CardContent>
          </Card>
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>FF as defender ({rightfactionbasic.name})</CardTitle>
            </CardHeader>
            <CardContent>
              <InnerFactionChartContainer
                data={right_data}
                chartType={ChartType.defend}
                onClick={handleChartClick(
                  setRightSelected,
                  setRightNameSelected,
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent
          value="faction_data"
          className="grid grid-cols-2 gap-5 m-5"
        >
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>{leftfactionbasic.name} data</CardTitle>
            </CardHeader>
            <CardContent>
              Total: {left_data.length}
              <DataTable
                columns={FactionColumns}
                data={left_data}
                onClick={handleFactionTableClick(
                  setLeftSelected,
                  setLeftNameSelected,
                )}
              />
            </CardContent>
          </Card>
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>{rightfactionbasic.name} data</CardTitle>
            </CardHeader>
            <CardContent>
              Total: {right_data.length}
              <DataTable
                columns={FactionColumns}
                data={right_data}
                onClick={handleFactionTableClick(
                  setRightSelected,
                  setRightNameSelected,
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent
          value="member_charts"
          className="grid grid-cols-2 gap-5 m-5"
        >
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>FF as attacker ({leftNameSelected})</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <ComposedChart
                  data={leftSelected}
                  margin={{ top: 5, right: 5, left: 5, bottom: 60 }}
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
                  margin={{ top: 5, right: 5, left: 5, bottom: 60 }}
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
                  margin={{ top: 5, right: 5, left: 5, bottom: 60 }}
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
                  margin={{ top: 5, right: 5, left: 5, bottom: 60 }}
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
        </TabsContent>
        <TabsContent value="member_data" className="grid grid-cols-2 gap-5 m-5">
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>{leftNameSelected} details</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={MemberColumns}
                data={leftSelected}
                onClick={() => {}}
              />
            </CardContent>
          </Card>
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>{rightNameSelected} details</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={MemberColumns}
                data={rightSelected}
                onClick={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
