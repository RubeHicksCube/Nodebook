import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createModule } from "../api";

export default function ModuleForm() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append("name", name);
      form.append("category", category);
      form.append("description", description);
      if (file) form.append("coverImage", file);
      return createModule(form);
    },
    onSuccess: () => {
      qc.invalidateQueries(["modules"]);
      setName(""); setCategory(""); setDescription(""); setFile(null);
    }
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-3 bg-white p-4 rounded shadow">
      <input className="border p-2 w-full rounded" placeholder="Module name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="border p-2 w-full rounded" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
      <textarea className="border p-2 w-full rounded" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={mutation.isLoading}>
          {mutation.isLoading ? "Creating..." : "Create Module"}
        </button>
      </div>
    </form>
  );
}
