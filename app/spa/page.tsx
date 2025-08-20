"use client";
import { useEffect, useState } from "react";
import { LoginForm } from "./login-form";
import { FFScouter, keys } from "./types";
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
  const [loading, setLoading] = useState(true);
  const [enemyData, setEnemyData] = useState<FFScouter[]>();
  //make sure to pass types here just as above
  const [ourData, setOurData] = useState();
  const [ourFactionBasic, setOurFactionBasic] = useState();
  const [enemyFactionBasic, setEnemyFactionBasic] = useState();

  //we need this because it should run after each time the component updates, or in this case, when window gets mounted.
  //thats the cleanest way of doing things i think
  useEffect(() => {
    setKeys(getKeys());
    setLoading(false);
  }, []);

  //run this every time keys changes
  useEffect(() => {
    //expand for every api call
    fetch("url")
      .then((res) => res.json())
      .then((value: FFScouter[]) => setEnemyData(value));
  }, [keys]);

  if (loading) {
    return (
      <div className="container mx-auto grow flex items-center">
        <Loader className="animate-spin w-full"></Loader>
      </div>
    );
  }

  if (!keys) {
    return (
      <div className="container mx-auto grow flex items-center">
        <LoginForm className="w-full" setKeys={setKeys}></LoginForm>
      </div>
    );
  }
  //expand for every prop passed.
  if(!enemyData){
    return (
      <div className="container mx-auto grow flex items-center">
        <Loader className="animate-spin w-full"></Loader>
      </div>
    );
  }

  //expand all props using state here
  return (
    <div className="grid grid-cols-12 gap-10 m-10">
      <p className="col-span-12">{JSON.stringify(keys)}</p>

      <MyChart enemydata={enemyData} ourdata={[]} ourfactionbasic={} enemyfactionbasic={}/>
    </div>
  );
}
