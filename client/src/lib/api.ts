import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface Business {
  id: string;
  name_en: string;
  name_ko?: string;
  category: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  hours?: Record<string, string>;
  logo_url?: string;
  cover_url?: string;
  photos?: string[];
  tier: string;
  featured: boolean;
  claimed: boolean;
  rating?: string;
  review_count?: number;
  google_place_id?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  content?: string;
  category?: string;
  published_date: string;
  source?: string;
  thumbnail_url?: string;
}

export interface BusinessesResponse {
  businesses: Business[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Category {
  category: string;
  count: number;
}

export interface SearchResponse {
  businesses: Business[];
  news: NewsItem[];
  query: string;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export function useBusinesses(params?: {
  category?: string;
  city?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.city) queryParams.append('city', params.city);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.featured) queryParams.append('featured', 'true');
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/businesses${queryString ? `?${queryString}` : ''}`;

  return useQuery<BusinessesResponse>({
    queryKey: ['businesses', params],
    queryFn: () => fetchApi<BusinessesResponse>(endpoint),
  });
}

export function useBusiness(id: string) {
  return useQuery<Business>({
    queryKey: ['business', id],
    queryFn: () => fetchApi<Business>(`/api/business/${id}`),
    enabled: !!id,
  });
}

export function useFeaturedBusinesses() {
  return useQuery<Business[]>({
    queryKey: ['businesses', 'featured'],
    queryFn: () => fetchApi<Business[]>('/api/featured'),
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetchApi<Category[]>('/api/categories'),
  });
}

export function useNews(params?: { category?: string; limit?: number }) {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/news${queryString ? `?${queryString}` : ''}`;

  return useQuery<NewsItem[]>({
    queryKey: ['news', params],
    queryFn: () => fetchApi<NewsItem[]>(endpoint),
  });
}

export function useSearch(query: string) {
  return useQuery<SearchResponse>({
    queryKey: ['search', query],
    queryFn: () => fetchApi<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
  });
}
