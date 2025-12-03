/**
 * Legacy ModuleCard component - preserved for backward compatibility
 * This is the old implementation that accepts individual props.
 * New code should use the ModuleCard component from ModuleCard.tsx
 */

type Props = {
  id: number;
  name: string;
  category?: string | null;
  description?: string | null;
  cover_image?: string | null;
};

export default function LegacyModuleCard({ name, category, description, cover_image }: Props) {
  return (
    <div className="bg-white dark:bg-card rounded-lg shadow p-4 flex flex-col">
      {cover_image ? (
        <img src={cover_image} alt={name} className="w-full h-40 object-cover rounded-md mb-3" />
      ) : (
        <div className="w-full h-40 bg-gray-100 dark:bg-muted rounded-md mb-3 flex items-center justify-center text-gray-400 dark:text-muted-foreground">
          No image
        </div>
      )}
      <h3 className="text-lg font-semibold">{name}</h3>
      {category && <p className="text-sm text-gray-500 dark:text-muted-foreground">{category}</p>}
      {description && <p className="mt-2 text-gray-700 dark:text-foreground">{description}</p>}
    </div>
  );
}
