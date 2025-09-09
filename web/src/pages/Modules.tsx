import { useEffect, useState } from 'react';
import axios from 'axios';
import ModuleCard from '../components/ModuleCard';
import ModuleForm from '../components/ModuleForm';

export default function ModulesPage() {
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    axios.get(import.meta.env.VITE_API_URL + '/modules').then((res) => setModules(res.data));
  }, []);

  const handleCreated = (mod: any) => setModules([...modules, mod]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Modules</h1>
      <ModuleForm onCreated={handleCreated} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((m) => (
          <ModuleCard key={m.id} {...m} />
        ))}
      </div>
    </div>
  );
}
