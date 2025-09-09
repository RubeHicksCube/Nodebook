import React from 'react';

type ModuleCardProps = {
  id: string;
  name: string;
  category: string;
  description: string;
  coverImage?: string | null;
};

export default function ModuleCard({ name, category, description, coverImage }: ModuleCardProps) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col">
      {coverImage && (
        <img
          src={coverImage}
          alt={name}
          className="w-full h-32 object-cover rounded-lg mb-2"
        />
      )}
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="text-sm text-gray-500">{category}</p>
      <p className="text-gray-700 mt-1 line-clamp-3">{description}</p>
    </div>
  );
}
