"use client";
import { useState } from "react";
import type { Page, Category, WpPost } from "@/lib/types";
import ArticlePicker from "./ArticlePicker";

type Props = {
  page: Page;
  categories: Category[];
  wpApiUrl: string;
  clipboard: Partial<Page> | null;
  onSave: (updates: Partial<Page>) => void;
  onCopy: (data: Partial<Page>) => void;
  onDelete: () => void;
  onDeletePage: () => void;
  onInsertAfter: () => void;
  onCopyToNext: (count: number) => void;
  onClose: () => void;
};

export default function PageEditor({ page, categories, wpApiUrl, clipboard, onSave, onCopy, onDelete, onDeletePage, onInsertAfter, onCopyToNext, onClose }: Props) {
  const [contentType, setContentType] = useState(page.content_type ?? "");
  const [articleTitle, setArticleTitle] = useState(page.article_title ?? "");
  const [articleWpId, setArticleWpId] = useState<number | null>(page.article_wp_id);
  const [articleUrl, setArticleUrl] = useState(page.article_url ?? "");
  const [articleRedaxId, setArticleRedaxId] = useState(page.article_redax_id ?? "");
  const [notes, setNotes] = useState(page.notes ?? "");
  const [showPicker, setShowPicker] = useState(false);
  const [titleMode, setTitleMode] = useState<"search" | "manual">(page.article_wp_id ? "search" : "manual");
  const [copyCount, setCopyCount] = useState(1);
  const [showPageActions, setShowPageActions] = useState(false);

  function handleArticleSelect(post: WpPost) {
    setArticleWpId(post.id);
    setArticleTitle(post.title.rendered.replace(/<[^>]+>/g, ""));
    setArticleUrl(post.link);
    setTitleMode("search");
    setShowPicker(false);
  }

  function clearArticle() {
    setArticleTitle("");
    setArticleWpId(null);
    setArticleUrl("");
    setArticleRedaxId("");
  }

  function handlePaste() {
    if (!clipboard) return;
    setContentType(clipboard.content_type ?? "");
    setArticleTitle(clipboard.article_title ?? "");
    setArticleWpId(clipboard.article_wp_id ?? null);
    setArticleUrl(clipboard.article_url ?? "");
    setArticleRedaxId(clipboard.article_redax_id ?? "");
    setNotes(clipboard.notes ?? "");
  }

  function currentData(): Partial<Page> {
    return {
      content_type: contentType || null,
      article_wp_id: articleWpId,
      article_title: articleTitle || null,
      article_url: articleUrl || null,
      article_redax_id: articleRedaxId || null,
      notes: notes || null,
    };
  }

  function handleSave() {
    onSave(currentData());
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900">Sida {page.page_number}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onCopy(currentData()); }}
                className="text-xs text-gray-400 hover:text-blue-600 border border-gray-200 rounded-lg px-2.5 py-1 hover:border-blue-400"
              >
                Kopiera
              </button>
              {clipboard && (
                <button
                  onClick={handlePaste}
                  className="text-xs text-blue-600 border border-blue-300 rounded-lg px-2.5 py-1 hover:bg-blue-50"
                >
                  Klistra in
                </button>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-1">×</button>
            </div>
          </div>

          {/* Innehåll */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Innehållstyp</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setContentType("")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${!contentType ? "border-gray-400 bg-gray-100" : "border-gray-200 hover:border-gray-300"}`}
                >
                  Ingen
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setContentType(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all ${contentType === c.id ? "ring-2 ring-offset-1 ring-gray-400" : "opacity-80 hover:opacity-100"}`}
                    style={{ backgroundColor: c.color }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-500">Artikel</label>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => setTitleMode("search")} className={`px-2 py-0.5 rounded ${titleMode === "search" ? "text-blue-600 font-medium" : "text-gray-400 hover:text-gray-600"}`}>Sök</button>
                  <button onClick={() => setTitleMode("manual")} className={`px-2 py-0.5 rounded ${titleMode === "manual" ? "text-blue-600 font-medium" : "text-gray-400 hover:text-gray-600"}`}>Skriv in</button>
                </div>
              </div>
              {titleMode === "search" ? (
                <div className="flex gap-2">
                  <div className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 truncate bg-gray-50">
                    {articleTitle || <span className="text-gray-400">Ingen artikel vald</span>}
                  </div>
                  <button onClick={() => setShowPicker(true)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:border-blue-400 hover:text-blue-600">Sök</button>
                  {articleTitle && <button onClick={clearArticle} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-red-500 hover:border-red-300">×</button>}
                </div>
              ) : (
                <input
                  type="text"
                  value={articleTitle}
                  onChange={(e) => { setArticleTitle(e.target.value); setArticleWpId(null); setArticleUrl(""); }}
                  placeholder="Skriv in rubrik manuellt…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              {articleUrl && (
                <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block">Öppna artikel ↗</a>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Redax-kod</label>
              <input
                type="text"
                value={articleRedaxId}
                onChange={(e) => setArticleRedaxId(e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="76004"
                maxLength={5}
                className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Anteckningar</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Sidåtgärder */}
          <div className="mt-5 border-t border-gray-100 pt-4">
            <button
              onClick={() => setShowPageActions(!showPageActions)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              Sidåtgärder {showPageActions ? "▲" : "▼"}
            </button>
            {showPageActions && (
              <div className="mt-3 flex flex-col gap-2">
                {/* Lägg till sida efter */}
                <button
                  onClick={onInsertAfter}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors"
                >
                  <span>+</span> Lägg till sida efter denna
                </button>

                {/* Kopiera innehåll till följande sidor */}
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-600">Kopiera innehåll till följande</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={copyCount}
                    onChange={(e) => setCopyCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                    className="w-12 border border-gray-300 rounded px-2 py-0.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">sidor</span>
                  <button
                    onClick={() => onCopyToNext(copyCount)}
                    className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Kör
                  </button>
                </div>

                {/* Radera sida */}
                <button
                  onClick={onDeletePage}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-2 transition-colors"
                >
                  <span>×</span> Radera sidan (omnumrerar)
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-4">
            <button onClick={onDelete} className="text-sm text-gray-400 hover:text-red-500">Rensa innehåll</button>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Avbryt</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Spara</button>
            </div>
          </div>
        </div>
      </div>

      {showPicker && (
        <ArticlePicker wpApiUrl={wpApiUrl} onSelect={handleArticleSelect} onClose={() => setShowPicker(false)} />
      )}
    </>
  );
}
