import type { WpPost } from "./types";

export async function searchPosts(apiUrl: string, query: string): Promise<WpPost[]> {
  const base = apiUrl.replace(/\/$/, "");
  const url = `${base}/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&per_page=20&_fields=id,title,link,date`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}
