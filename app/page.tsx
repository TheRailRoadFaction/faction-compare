"use client";
import { useEffect, useState } from "react";
import { LoginForm } from "./login-form";
import {
  FFScouterResult,
  keys,
  factionIds,
  TornFactionBasicApi,
} from "./types";
import { Loader } from "lucide-react";
import { MyChart } from "./chart";
import { Button } from "@/components/ui/button";
import { FactionInputForm } from "./faction-input-form";

const getKeys = (): keys | undefined => {
  // We need this because window / localstorage might not exist as fast yet (for the first mount)
  if (!window) {
    return undefined;
  }
  const v = localStorage.getItem("keys");
  console.log(v);
  if (v == null) {
    return undefined;
  }
  try {
    const j = JSON.parse(v) as keys;
    if (j.ffScouterKey && j.publicKey) {
      return j;
    }
  } catch (e) {
    console.log("Error parsing stored keys:", e);
    localStorage.removeItem("keys");
    return undefined;
  }
  return undefined;
};
const getFactionIds = (): factionIds | undefined => {
  // We need this because window / localstorage might not exist as fast yet (for the first mount)
  if (!window) {
    return undefined;
  }
  const v = localStorage.getItem("factionIds");
  console.log(v);
  if (v == null) {
    return undefined;
  }
  try {
    const j = JSON.parse(v) as factionIds;
    if (j.leftFactionId && j.rightFactionId) {
      return j;
    }
  } catch (e) {
    console.log("Error parsing stored keys:", e);
    localStorage.removeItem("factionIds");
    return undefined;
  }
  return undefined;
};

export default function SPA() {
  const [keys, setKeys] = useState<keys>();
  const [factionIds, setFactionIds] = useState<factionIds>();
  const [rightFFScouterData, setRightFFScouterData] =
    useState<FFScouterResult>();
  //make sure to pass types here just as above
  const [leftFFScouterData, setLeftFFScouterData] = useState<FFScouterResult>();
  const [leftFactionBasic, setLeftFactionBasic] =
    useState<TornFactionBasicApi>();
  const [rightFactionBasic, setRightFactionBasic] =
    useState<TornFactionBasicApi>();

  //we need this because it should run after each time the component updates, or in this case, when window gets mounted.
  //thats the cleanest way of doing things i think
  useEffect(() => {
    setKeys(getKeys());
    setFactionIds(getFactionIds());
  }, []);

  const logout = () => {
    localStorage.removeItem("keys");
    setKeys(undefined);
  };

  const reset = () => {
    localStorage.removeItem("factionIds");
    setFactionIds(undefined);
    setLeftFFScouterData(undefined);
    setRightFFScouterData(undefined);
    setLeftFactionBasic(undefined);
    setRightFactionBasic(undefined);
  };

  useEffect(() => {
    if (!keys || !factionIds) {
      return;
    }
    const queryString = new URLSearchParams({
      selections: "basic",
      key: keys.publicKey,
    });
    fetch(
      "https://api.torn.com/faction/" +
        factionIds.leftFactionId +
        "?" +
        queryString.toString(),
    )
      .then((res) => res.json())
      .then((value) => TornFactionBasicApi.parse(value))
      .then((value: TornFactionBasicApi) => setLeftFactionBasic(value));

    fetch(
      "https://api.torn.com/faction/" +
        factionIds.rightFactionId +
        "?" +
        queryString.toString(),
    )
      .then((res) => res.json())
      .then((value) => TornFactionBasicApi.parse(value))
      .then((value: TornFactionBasicApi) => setRightFactionBasic(value));
  }, [keys, factionIds]);

  //run this every time keys changes
  useEffect(() => {
    if (!keys || !leftFactionBasic) {
      return;
    }
    //expand for every api call
    const query = new URLSearchParams({
      key: keys.ffScouterKey,
      targets: Object.keys(leftFactionBasic.members).join(","),
    });
    fetch("https://ffscouter.com/api/v1/get-stats?" + query.toString())
      .then((res) => res.json())
      .then((value) => FFScouterResult.parse(value))
      .then((value: FFScouterResult) => setLeftFFScouterData(value));
  }, [keys, leftFactionBasic]);

  useEffect(() => {
    if (!keys || !rightFactionBasic) {
      return;
    }
    //expand for every api call
    const query = new URLSearchParams({
      key: keys.ffScouterKey,
      targets: Object.keys(rightFactionBasic.members).join(","),
    });
    fetch("https://ffscouter.com/api/v1/get-stats?" + query.toString())
      .then((res) => res.json())
      .then((value) => FFScouterResult.parse(value))
      .then((value: FFScouterResult) => setRightFFScouterData(value));
  }, [keys, rightFactionBasic]);

  if (!keys) {
    return (
      <div className="container mx-auto grow flex items-center">
        <LoginForm className="w-full" setKeys={setKeys}></LoginForm>
      </div>
    );
  }

  if (!factionIds) {
    return (
      <>
        <div className="container mx-auto grow flex items-center">
          <Button onClick={logout}>Logout</Button>
        </div>
        <div className="container mx-auto grow flex items-center">
          <FactionInputForm
            className="w-full"
            setFactionIds={setFactionIds}
          ></FactionInputForm>
        </div>
      </>
    );
  }

  if (
    !leftFactionBasic ||
    !rightFactionBasic ||
    !rightFFScouterData ||
    !leftFFScouterData
  ) {
    return (
      <div className="container mx-auto grow flex items-center">
        <Loader className="animate-spin w-full"></Loader>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-5 mt-5 mx-5">
        <div>
          <Button onClick={reset}>Reset</Button>
        </div>
        <div className="justify-self-end">
          <Button onClick={logout}>Logout</Button>
        </div>
      </div>
      <div>
        <MyChart
          leftffscouterdata={leftFFScouterData}
          rightffscouterdata={rightFFScouterData}
          leftfactionbasic={leftFactionBasic}
          rightfactionbasic={rightFactionBasic}
        />
      </div>
    </>
  );
}
