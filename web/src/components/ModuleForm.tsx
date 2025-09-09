import React, { useState } from 'react';
import axios from 'axios';

type Props = {
  onCreated: (mod: any) => void;
};

export default function ModuleForm({ onCreated }: Props) {
  const [form, setForm] = useState({ name: '', category: '', description: '' });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('category', form.category);
    formData.append('description', form.description);
    if (file) formData.append('coverImage', file);

    const res = await axios.post(import.meta.env.VITE_API_URL + '/modules', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    onCreated(res.data);
    setForm({ name: '', category: '', description: '' });
    setFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 bg-gray-50 p-4 rounded-lg shadow">
      <input
        type="text"
        placeholder="Module Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="border p-2 w-full rounded"
        required
      />
      <input
        type="text"
        placeholder="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        className="border p-2 w-full rounded"
      />
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="border p-2 w-full rounded"
      />
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="w-full"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Create Module
      </button>
    </form>
  );
}
