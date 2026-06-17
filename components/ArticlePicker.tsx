"use client";
import { useState, useEffect } from "react";
import { searchPosts } from "@/lib/wp";
import type { WpPost } from "@/lib/types";

type Props = {
  wpApiUrl: string;
  onSelect: (post: WpPost) => void;
  onClose: () => void;
};

export default function ArticlePicker({ wpApiUrl, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WpPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const posts = await searchPosts(wpApiUrl, query);
      setResults(posts);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, wpApiUrl]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Välj artikel</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök artiklar…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="max-h-72 overflow-y-auto flex flex-col gap-1">
          {loading && <p className="text-gray-400 text-sm text-center py-4">Söker…</p>}
          {!loading && results.length === 0 && query.length >= 2 && (
            <p className="text-gray-400 text-sm text-center py-4">Inga träffar</p>
          )}
          {results.map((post) => (
            <button
              key={post.id}
              onClick={() => onSelect(post)}
              className="text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-sm text-gray-800"
              dangerouslySetInnerHTML={{ __html: post.title.rendered }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
