import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

type Module = {
  id: string;
  name: string;
  category: string;
  description?: string;
  coverImage?: string | null;
};

export default function ModulesList() {
  const [modules, setModules] = useState<Module[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [formData, setFormData] = useState<{ [k: string]: any }>({});
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await api.get("/modules");
      setModules(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFormData((s) => ({ ...s, cover: f }));
  }

  async function create(ev: React.FormEvent) {
    ev.preventDefault();
    const fd = new FormData();
    fd.append("name", (formData.name || "").toString());
    fd.append("category", (formData.category || "Custom").toString());
    fd.append("description", (formData.description || "").toString());
    fd.append("privacy", (formData.privacy || "private").toString());
    if (formData.cover) fd.append("cover", formData.cover);

    try {
      await api.post("/modules", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setShowNew(false);
      setFormData({});
      load();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Create failed");
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Your Modules</h2>
        <button onClick={() => setShowNew(true)} className="bg-blue-600 px-3 py-2 rounded">New Module</button>
      </div>

      {showNew && (
        <div className="bg-gray-900 p-4 rounded mb-4">
          <form onSubmit={create} className="space-y-2">
            <input placeholder="Name" required onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))} className="w-full p-2 bg-gray-800 rounded" />
            <input placeholder="Category" onChange={(e) => setFormData((s) => ({ ...s, category: e.target.value }))} className="w-full p-2 bg-gray-800 rounded" defaultValue="Custom" />
            <textarea placeholder="Description" onChange={(e) => setFormData((s) => ({ ...s, description: e.target.value }))} className="w-full p-2 bg-gray-800 rounded" />
            <input type="file" accept="image/*" onChange={handleFile} />
            <select onChange={(e) => setFormData((s) => ({ ...s, privacy: e.target.value }))} defaultValue="private" className="bg-gray-800 p-2 rounded">
              <option value="private">Private</option>
              <option value="public">Public (read-only)</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 px-3 py-2 rounded">Create</button>
              <button type="button" onClick={() => setShowNew(false)} className="bg-gray-700 px-3 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((m) => (
          <div key={m.id} className="bg-gray-900 p-4 rounded flex items-start gap-4">
            {m.coverImage ? <img src={m.coverImage} alt="cover" className="w-20 h-20 object-cover rounded" /> : <div className="w-20 h-20 bg-gray-800 rounded" />}
            <div>
              <div className="text-lg font-semibold">{m.name}</div>
              <div className="text-sm text-gray-400">{m.category}</div>
              <div className="text-sm mt-2">{m.description}</div>
              <div className="mt-3">
                <button onClick={() => navigate(`/module/${m.id}`)} className="bg-blue-600 px-2 py-1 rounded">Open</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
