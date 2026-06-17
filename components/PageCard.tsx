"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Page, Category } from "@/lib/types";

type Props = {
  page: Page;
  categories: Category[];
  onClick: () => void;
};

export default function PageCard({ page, categories, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const cat = categories.find((c) => c.id === page.content_type);
  const isEmpty = !cat;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: cat?.color ?? "#ffffff",
        borderColor: cat?.color ?? "#d1d5db",
        opacity: isDragging ? 0.4 : 1,
        minHeight: 110,
      }}
      className="relative rounded-lg border-2 cursor-grab active:cursor-grabbing hover:brightness-95 transition-all select-none w-full"
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <div className="p-2 flex flex-col justify-between" style={{ minHeight: 110 }}>
        {/* Titel */}
        <div
          className="text-xs font-semibold leading-tight line-clamp-3"
          style={{ color: isEmpty ? "#6b7280" : "rgba(255,255,255,0.95)" }}
        >
          {page.article_title || (cat ? cat.name : "")}
        </div>

        {/* Botten: kategori + redax-kod */}
        <div className="flex items-end justify-between gap-1 mt-1">
          {page.article_redax_id && (
            <div
              className="text-xs font-mono ml-auto"
              style={{ color: isEmpty ? "#9ca3af" : "rgba(255,255,255,0.85)" }}
            >
              {page.article_redax_id}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
