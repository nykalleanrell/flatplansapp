"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Brand, Issue } from "@/lib/types";

export default function IssuesPage() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [newName, setNewName] = useState("");
  const [newPageCount, setNewPageCount] = useState(64);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data, error: authError }) => {
      if (authError || !data.user) { router.replace("/login"); return; }

      const { data: brandData, error: brandError } = await supabase
        .from("brands")
        .select("*")
        .single();
      if (brandError) setLoadError(`Kunde inte ladda varumärke: ${brandError.message}`);
      if (brandData) setBrand(brandData);

      const { data: issueData } = await supabase
        .from("issues")
        .select("*")
        .order("created_at", { ascending: false });
      setIssues(issueData ?? []);
      setLoading(false);
    });
  }, [router]);

  async function createIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    if (!brand) { setLoadError("Varumärke saknas – ladda om sidan och försök igen."); return; }
    const supabase = createClient();
    const { data: issue } = await supabase
      .from("issues")
      .insert({ brand_id: brand.id, name: newName.trim(), page_count: newPageCount })
      .select()
      .single();
    if (!issue) return;

    const pages = Array.from({ length: newPageCount }, (_, i) => ({
      issue_id: issue.id,
      page_number: i + 1,
      content_type: null,
      article_wp_id: null,
      article_title: null,
      article_url: null,
    }));
    await supabase.from("pages").insert(pages);
    router.push(`/flatplan/${issue.id}`);
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Laddar…</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h1 className="font-semibold text-gray-900">{brand?.name ?? "Flatplan"}</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/settings")} className="text-sm text-gray-500 hover:text-gray-700">Inställningar</button>
          <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700">Logga ut</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-10 px-6">
        {loadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">{loadError}</div>
        )}
        <form onSubmit={createIssue} className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <h2 className="font-medium text-gray-900 mb-4">Nytt nummer</h2>
          <div className="flex gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="T.ex. KM 3 2026"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sidor:</span>
              <input
                type="number"
                value={newPageCount}
                onChange={(e) => setNewPageCount(Number(e.target.value))}
                min={4}
                max={300}
                step={4}
                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">
              Skapa
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-2">
          {issues.map((issue) => (
            <button
              key={issue.id}
              onClick={() => router.push(`/flatplan/${issue.id}`)}
              className="bg-white border border-gray-200 rounded-xl px-5 py-4 text-left hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <span className="font-medium text-gray-900">{issue.name}</span>
              <span className="text-sm text-gray-400 ml-3">{issue.page_count} sidor</span>
            </button>
          ))}
          {issues.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">Inga nummer ännu.</p>
          )}
        </div>
      </main>
    </div>
  );
}
