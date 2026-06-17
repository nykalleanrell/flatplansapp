"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Brand, Category } from "@/lib/types";

const PRESET_COLORS = [
  "#eab308", "#f97316", "#ef4444", "#ec4899",
  "#a855f7", "#6366f1", "#3b82f6", "#06b6d4",
  "#10b981", "#84cc16", "#94a3b8", "#78716c",
];

export default function SettingsPage() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      const { data: brandData } = await supabase.from("brands").select("*").single();
      if (brandData) {
        setBrand(brandData);
        setCategories(brandData.categories ?? []);
      }
    });
  }, [router]);

  function addCategory() {
    if (!newName.trim()) return;
    const id = newName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (categories.find((c) => c.id === id)) return;
    setCategories([...categories, { id, name: newName.trim(), color: newColor }]);
    setNewName("");
    setNewColor(PRESET_COLORS[0]);
  }

  function removeCategory(id: string) {
    setCategories(categories.filter((c) => c.id !== id));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const arr = [...categories];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    setCategories(arr);
  }

  function moveDown(index: number) {
    if (index === categories.length - 1) return;
    const arr = [...categories];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    setCategories(arr);
  }

  async function save() {
    if (!brand) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("brands").update({ categories }).eq("id", brand.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <button onClick={() => router.push("/issues")} className="text-gray-400 hover:text-gray-600 text-lg">‹</button>
        <h1 className="font-semibold text-gray-900">Inställningar</h1>
      </header>

      <main className="max-w-lg mx-auto py-10 px-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-medium text-gray-900 mb-5">Innehållstyper</h2>

          {/* Befintliga kategorier */}
          <div className="flex flex-col gap-2 mb-6">
            {categories.map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="flex-1 text-sm text-gray-800">{cat.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => moveUp(i)} disabled={i === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-sm px-1">↑</button>
                  <button onClick={() => moveDown(i)} disabled={i === categories.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-sm px-1">↓</button>
                  <button onClick={() => removeCategory(cat.id)} className="text-gray-300 hover:text-red-500 text-sm px-1 ml-1">×</button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Inga kategorier ännu.</p>
            )}
          </div>

          {/* Lägg till ny */}
          <div className="border-t border-gray-100 pt-5">
            <label className="text-xs font-medium text-gray-500 mb-2 block">Lägg till kategori</label>
            <div className="flex gap-2 mb-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                placeholder="Namn"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addCategory}
                disabled={!newName.trim()}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
              >
                Lägg till
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  className={`w-7 h-7 rounded-full transition-transform ${newColor === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-4 w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saved ? "Sparat ✓" : saving ? "Sparar…" : "Spara ändringar"}
        </button>
      </main>
    </div>
  );
}
