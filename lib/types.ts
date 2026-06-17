export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Brand = {
  id: string;
  name: string;
  wp_api_url: string;
  categories: Category[];
};

export type Issue = {
  id: string;
  brand_id: string;
  name: string;
  page_count: number;
  created_at: string;
};

export type Page = {
  id: string;
  issue_id: string;
  page_number: number;
  content_type: string | null;
  article_wp_id: number | null;
  article_title: string | null;
  article_url: string | null;
  article_redax_id: string | null;
  notes: string | null;
};

export type WpPost = {
  id: number;
  title: { rendered: string };
  link: string;
  date: string;
};
