import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchModules } from "../api";
import LegacyModuleCard from "../components/LegacyModuleCard";
import ModuleForm from "../components/ModuleForm";

export default function ModulesPage() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["modules"],
    queryFn: fetchModules
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Modules</h1>

      <ModuleForm />

      {isLoading && <p>Loading modules...</p>}
      {error && <p className="text-red-600">Error loading modules</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((m: any) => (
          <LegacyModuleCard key={m.id} id={m.id} name={m.name} category={m.category} description={m.description} cover_image={m.cover_image} />
        ))}
      </div>
    </div>
  );
}
