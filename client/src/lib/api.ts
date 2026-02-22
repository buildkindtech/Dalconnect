import { queryClient } from "./queryClient";
import { useQuery } from "@tanstack/react-query";

export interface Business {
  id: string;
  name_en: string;
  name_ko: string | null;
  category: string;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  hours: Record<string, string> | null;
  logo_url: string | null;
  cover_url: string | null;
  photos: string[] | null;
  tier: string | null;
  featured: boolean | null;
  claimed: boolean | null;
  rating: string | null;
  review_count: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  content: string | null;
  category: string | null;
  published_date: string | null;
  source: string | null;
  thumbnail_url: string | null;
  created_at: string | null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

export function useBusinesses(params?: { category?: string; city?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.city) searchParams.set("city", params.city);
  if (params?.search) searchParams.set("search", params.search);
  const qs = searchParams.toString();
  
  return useQuery<Business[]>({
    queryKey: ["businesses", params],
    queryFn: () => fetchJson(`/api/businesses${qs ? `?${qs}` : ""}`),
  });
}

export function useBusiness(id: string) {
  return useQuery<Business>({
    queryKey: ["business", id],
    queryFn: () => fetchJson(`/api/businesses/${id}`),
    enabled: !!id,
  });
}

export function useFeaturedBusinesses() {
  return useQuery<Business[]>({
    queryKey: ["featured"],
    queryFn: () => fetchJson("/api/featured"),
  });
}

export function useNews(category?: string) {
  return useQuery<NewsItem[]>({
    queryKey: ["news", category],
    queryFn: () => fetchJson(category ? `/api/news/${category}` : "/api/news"),
  });
}
