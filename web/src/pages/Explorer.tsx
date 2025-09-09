import React, { useEffect, useState } from "react";
import api from "../api";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

export default function ExplorerPage() {
  const [moduleId, setModuleId] = useState("");
  const [definitionId, setDefinitionId] = useState("");
  const [field, setField] = useState("");
  const [points, setPoints] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [definitions, setDefinitions] = useState<any[]>([]);

  useEffect(() => {
    loadModules();
  }, []);

  async function loadModules() {
    const res = await api.get("/modules");
    setModules(res.data);
  }

  async function loadDefinitions(mid: string) {
    const res = await api.get(`/modules/${mid}/definitions`);
    setDefinitions(res.data);
  }

  async function run() {
    if (!moduleId || !definitionId || !field) return;
    const res = await api.get("/explorer/aggregate", { params: { moduleId, definitionId, field } });
    // convert points to chart format
    const pts = res.data.points.map((p: any) => ({ date: new Date(p.date).toLocaleDateString(), value: p.value }));
    setPoints(pts);
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">Global Explorer</h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select onChange={(e) => { setModuleId(e.target.value); loadDefinitions(e.target.value); }} className="bg-gray-800 p-2 rounded">
          <option value="">Select module</option>
          {modules.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        <select onChange={(e) => setDefinitionId(e.target.value)} className="bg-gray-800 p-2 rounded">
          <option value="">Select definition</option>
          {definitions.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <input placeholder="Field name" value={field} onChange={(e) => setField(e.target.value)} className="bg-gray-800 p-2 rounded" />
        <button onClick={run} className="bg-blue-600 px-3 py-2 rounded">Run</button>
      </div>

      <div className="mt-6 bg-gray-900 p-4 rounded">
        <h3 className="font-medium">Chart</h3>
        {points.length ? (
          <LineChart width={800} height={300} data={points}>
            <Line type="monotone" dataKey="value" stroke="#60a5fa" />
            <CartesianGrid stroke="#374151" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
          </LineChart>
        ) : (
          <div className="text-gray-400">No data yet</div>
        )}
      </div>
    </div>
  );
}
