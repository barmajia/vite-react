interface CategoryHeaderProps {
  title: string;
  description?: string;
}

export function CategoryHeader({ title, description }: CategoryHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-2">{title}</h1>
      {description && (
        <p className="text-lg text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
