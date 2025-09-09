import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000"
});

export default function ModulesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', category: '', description: '' });
  const [file, setFile] = useState<File | null>(null);

  // Fetch modules
  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      const res = await api.get('/modules');
      return res.data;
    }
  });

  // Mutation for adding a module
  const createModule = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('category', form.category);
      formData.append('description', form.description);
      if (file) formData.append('coverImage', file);

      const res = await api.post('/modules', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      setForm({ name: '', category: '', description: '' });
      setFile(null);
    }
  });

  return (
    <div className="p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createModule.mutate();
        }}
        className="space-y-2"
      >
        <input
          type="text"
          placeholder="Module Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="border p-2 w-full"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 w-full"
        />
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={createModule.isPending}
        >
          {createModule.isPending ? 'Creating...' : 'Create Module'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {modules.map((m: any) => (
          <div key={m.id} className="bg-gray-100 p-4 rounded shadow">
            {m.coverImage && (
              <img
                src={m.coverImage}
                alt={m.name}
                className="w-full h-32 object-cover rounded"
              />
            )}
            <h2 className="text-lg font-semibold">{m.name}</h2>
            <p className="text-sm text-gray-600">{m.category}</p>
            <p className="text-gray-800">{m.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
