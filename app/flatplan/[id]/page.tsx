"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { createClient } from "@/lib/supabase";
import type { Brand, Issue, Page } from "@/lib/types";
import PageCard from "@/components/PageCard";
import PageEditor from "@/components/PageEditor";

export default function FlatplanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [clipboard, setClipboard] = useState<Partial<Page> | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { router.replace("/login"); return; }

    const [{ data: issueData }, { data: brandData }, { data: pagesData }] = await Promise.all([
      supabase.from("issues").select("*").eq("id", id).single(),
      supabase.from("brands").select("*").single(),
      supabase.from("pages").select("*").eq("issue_id", id).order("page_number"),
    ]);

    if (issueData) setIssue(issueData);
    if (brandData) setBrand(brandData);
    if (pagesData) setPages(pagesData);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel(`issue-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pages", filter: `issue_id=eq.${id}` }, (payload) => {
        if (payload.eventType === "UPDATE") {
          setPages((prev) => prev.map((p) => p.id === (payload.new as Page).id ? payload.new as Page : p));
        } else if (payload.eventType === "INSERT") {
          setPages((prev) => [...prev, payload.new as Page].sort((a, b) => a.page_number - b.page_number));
        } else if (payload.eventType === "DELETE") {
          setPages((prev) => prev.filter((p) => p.id !== (payload.old as Page).id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, load]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(pages, oldIndex, newIndex).map((p, i) => ({
      ...p,
      page_number: i + 1,
    }));
    setPages(reordered);

    const supabase = createClient();
    await Promise.all(
      reordered.map((p) =>
        supabase.from("pages").update({ page_number: p.page_number }).eq("id", p.id)
      )
    );
  }

  async function savePage(page: Page, updates: Partial<Page>) {
    const supabase = createClient();
    await supabase.from("pages").update(updates).eq("id", page.id);
    setPages((prev) => prev.map((p) => p.id === page.id ? { ...p, ...updates } : p));
  }

  async function clearPage(page: Page) {
    await savePage(page, { content_type: null, article_wp_id: null, article_title: null, article_url: null, article_redax_id: null, notes: null });
    setEditingPage(null);
  }

  async function deletePage(page: Page) {
    const supabase = createClient();
    // Ta bort sidan och omnumrera efterföljande
    await supabase.from("pages").delete().eq("id", page.id);
    const renumbered = pages
      .filter((p) => p.id !== page.id)
      .map((p, i) => ({ ...p, page_number: i + 1 }));
    setPages(renumbered);
    await Promise.all(renumbered.map((p) =>
      supabase.from("pages").update({ page_number: p.page_number }).eq("id", p.id)
    ));
    await supabase.from("issues").update({ page_count: renumbered.length }).eq("id", id);
    setEditingPage(null);
  }

  async function insertPageAfter(page: Page) {
    const supabase = createClient();
    const insertAt = page.page_number + 1;
    // Flytta upp alla sidor efter denna
    const toShift = pages.filter((p) => p.page_number >= insertAt);
    const shifted = toShift.map((p) => ({ ...p, page_number: p.page_number + 1 }));
    await Promise.all(shifted.map((p) =>
      supabase.from("pages").update({ page_number: p.page_number }).eq("id", p.id)
    ));
    await supabase.from("pages").insert({ issue_id: id, page_number: insertAt });
    await supabase.from("issues").update({ page_count: pages.length + 1 }).eq("id", id);
    setEditingPage(null);
  }

  async function copyPageToNext(page: Page, count: number) {
    const supabase = createClient();
    const updates = { content_type: page.content_type, article_wp_id: page.article_wp_id, article_title: page.article_title, article_url: page.article_url, article_redax_id: page.article_redax_id, notes: page.notes };
    const targets = pages.filter((p) => p.page_number > page.page_number && p.page_number <= page.page_number + count);
    await Promise.all(targets.map((p) => supabase.from("pages").update(updates).eq("id", p.id)));
    setPages((prev) => prev.map((p) => targets.find((t) => t.id === p.id) ? { ...p, ...updates } : p));
    setEditingPage(null);
  }

  async function addPage() {
    if (!issue) return;
    const supabase = createClient();
    const lastNum = pages[pages.length - 1]?.page_number ?? 0;
    await supabase.from("pages").insert({ issue_id: id, page_number: lastNum + 1 });
    await supabase.from("issues").update({ page_count: lastNum + 1 }).eq("id", id);
  }

  async function removePage() {
    if (pages.length === 0) return;
    const lastPage = pages[pages.length - 1];
    const supabase = createClient();
    await supabase.from("pages").delete().eq("id", lastPage.id);
    await supabase.from("issues").update({ page_count: pages.length - 1 }).eq("id", id);
  }

  function stats() {
    if (!brand) return [];
    const total = pages.length;
    return brand.categories.map((cat) => {
      const count = pages.filter((p) => p.content_type === cat.id).length;
      const pct = total ? Math.round((count / total) * 100) : 0;
      return { ...cat, count, pct };
    });
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Laddar…</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <button onClick={() => router.push("/issues")} className="text-gray-400 hover:text-gray-600 text-lg">‹</button>
        <h1 className="font-semibold text-gray-900">{issue?.name}</h1>
        <span className="text-gray-400 text-sm">{pages.length} sidor</span>
        <div className="flex-1" />
        <button onClick={addPage} className="text-sm text-gray-500 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-1 hover:border-blue-400">+ Sida</button>
        <button onClick={removePage} className="text-sm text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg px-3 py-1 hover:border-red-300">− Sida</button>
      </header>

      {brand && (
        <div className="bg-white border-b border-gray-200 px-6 py-2 flex gap-4 overflow-x-auto">
          {stats().map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-gray-600">{s.name}</span>
              <span className="text-xs font-semibold text-gray-800">{s.pct}%</span>
              <span className="text-xs text-gray-400">({s.count})</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 p-6 overflow-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
            {/* Flex-wrap: framsida + uppslag + baksida på samma rad, litet gap inom uppslag, stort mellan */}
            <div className="flex flex-wrap" style={{ gap: 12 }}>

              {/* Framsida – ensam sida */}
              {pages[0] && (
                <div className="flex flex-col items-center gap-0.5">
                  <div style={{ width: 88 }}>
                    <PageCard page={pages[0]} categories={brand?.categories ?? []} onClick={() => setEditingPage(pages[0])} />
                  </div>
                  <span className="text-xs text-gray-400">1</span>
                </div>
              )}

              {/* Inre uppslag – par av sidor med litet avstånd emellan */}
              {(() => {
                const inner = pages.slice(1, pages.length > 1 ? pages.length - 1 : undefined);
                const spreads: Page[][] = [];
                for (let i = 0; i < inner.length; i += 2) spreads.push(inner.slice(i, i + 2));
                return spreads.map((spread) => (
                  <div key={spread[0].id} className="flex flex-col">
                    <div className="flex rounded-lg overflow-hidden" style={{ gap: 2, backgroundColor: "#d1d5db" }}>
                      {spread.map((page) => (
                        <div key={page.id} style={{ width: 88 }}>
                          <PageCard page={page} categories={brand?.categories ?? []} onClick={() => setEditingPage(page)} />
                        </div>
                      ))}
                    </div>
                    <div className="flex" style={{ gap: 2 }}>
                      {spread.map((page) => (
                        <div key={page.id} className="text-center text-xs text-gray-500 font-medium pt-0.5" style={{ width: 88 }}>
                          {page.page_number}
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}

              {/* Baksida – ensam sida */}
              {pages.length > 1 && (
                <div className="flex flex-col items-center gap-0.5">
                  <div style={{ width: 88 }}>
                    <PageCard page={pages[pages.length - 1]} categories={brand?.categories ?? []} onClick={() => setEditingPage(pages[pages.length - 1])} />
                  </div>
                  <span className="text-xs text-gray-400">{pages[pages.length - 1].page_number}</span>
                </div>
              )}

            </div>
          </SortableContext>
        </DndContext>
      </div>

      {editingPage && brand && (
        <PageEditor
          page={editingPage}
          categories={brand.categories}
          wpApiUrl={brand.wp_api_url}
          clipboard={clipboard}
          onSave={(updates) => savePage(editingPage, updates)}
          onCopy={(data) => setClipboard(data)}
          onDelete={() => clearPage(editingPage)}
          onDeletePage={() => deletePage(editingPage)}
          onInsertAfter={() => insertPageAfter(editingPage)}
          onCopyToNext={(count) => copyPageToNext(editingPage, count)}
          onClose={() => setEditingPage(null)}
        />
      )}
    </div>
  );
}
