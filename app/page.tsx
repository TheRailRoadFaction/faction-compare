"use client";
import { useEffect, useState } from "react";
import { LoginForm } from "./login-form";
import { FFScouterResult, keys, TornFactionBasicApi } from "./types";
import { Loader } from "lucide-react";
import { MyChart } from "./chart";

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

export default function SPA() {
  const [keys, setKeys] = useState<keys>();
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
  }, []);

  useEffect(() => {
    if (!keys) {
      return;
    }
    const queryString = new URLSearchParams({
      selections: "basic",
      key: keys.publicKey,
    });
    fetch("https://api.torn.com/faction/37498?" + queryString.toString())
      .then((res) => res.json())
      .then((value) => TornFactionBasicApi.parse(value))
      .then((value: TornFactionBasicApi) => setLeftFactionBasic(value));

    fetch("https://api.torn.com/faction/44040?" + queryString.toString())
      .then((res) => res.json())
      .then((value) => TornFactionBasicApi.parse(value))
      .then((value: TornFactionBasicApi) => setRightFactionBasic(value));
  }, [keys]);

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
    <div className="grid grid-cols-12 gap-10 m-10">
      <MyChart
        leftffscouterdata={leftFFScouterData}
        rightffscouterdata={rightFFScouterData}
        leftfactionbasic={leftFactionBasic}
        rightfactionbasic={rightFactionBasic}
      />
    </div>
  );
}
