import { useQuery } from "@tanstack/react-query";
import { useCityContext } from "@/contexts/CityContext";

// Base API URL
const API_BASE = "/api";

// Helper to add city parameter to URL
function addCityToUrl(url: string, city: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}city=${city}`;
}

// Custom hook for businesses API
export function useBusinesses(params: {
  category?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
} = {}) {
  const { currentCity } = useCityContext();
  
  const queryString = new URLSearchParams({
    city: currentCity.id,
    ...(params.category && { category: params.category }),
    ...(params.search && { search: params.search }),
    ...(params.featured && { featured: 'true' }),
    ...(params.page && { page: params.page.toString() }),
    ...(params.limit && { limit: params.limit.toString() }),
  }).toString();

  return useQuery({
    queryKey: ['businesses', currentCity.id, params],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/businesses?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch businesses');
      }
      return response.json();
    },
  });
}

// Custom hook for news API
export function useNews(params: {
  category?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { currentCity } = useCityContext();
  
  const queryString = new URLSearchParams({
    city: currentCity.id,
    ...(params.category && { category: params.category }),
    ...(params.limit && { limit: params.limit.toString() }),
    ...(params.offset && { offset: params.offset.toString() }),
  }).toString();

  return useQuery({
    queryKey: ['news', currentCity.id, params],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/news?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      return response.json();
    },
  });
}

// Custom hook for blogs API
export function useBlogs(params: {
  category?: string;
  target_age?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { currentCity } = useCityContext();
  
  const queryString = new URLSearchParams({
    city: currentCity.id,
    ...(params.category && { category: params.category }),
    ...(params.target_age && { target_age: params.target_age }),
    ...(params.search && { search: params.search }),
    ...(params.page && { page: params.page.toString() }),
    ...(params.limit && { limit: params.limit.toString() }),
  }).toString();

  return useQuery({
    queryKey: ['blogs', currentCity.id, params],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/blogs?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch blogs');
      }
      return response.json();
    },
  });
}

// Custom hook for community posts API
export function useCommunityPosts(params: {
  category?: string;
  page?: number;
  limit?: number;
  sort?: string;
} = {}) {
  const { currentCity } = useCityContext();
  
  const queryString = new URLSearchParams({
    city: currentCity.id,
    ...(params.category && { category: params.category }),
    ...(params.page && { page: params.page.toString() }),
    ...(params.limit && { limit: params.limit.toString() }),
    ...(params.sort && { sort: params.sort }),
  }).toString();

  return useQuery({
    queryKey: ['community-posts', currentCity.id, params],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/community?action=posts&${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch community posts');
      }
      return response.json();
    },
  });
}

// Custom hook for listings/marketplace API
export function useListings(params: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
} = {}) {
  const { currentCity } = useCityContext();
  
  const queryString = new URLSearchParams({
    city: currentCity.id,
    ...(params.category && { category: params.category }),
    ...(params.search && { search: params.search }),
    ...(params.page && { page: params.page.toString() }),
    ...(params.limit && { limit: params.limit.toString() }),
    ...(params.status && { status: params.status }),
  }).toString();

  return useQuery({
    queryKey: ['listings', currentCity.id, params],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/listings?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      return response.json();
    },
  });
}

// Custom hook for featured content API
export function useFeatured(action?: string, params: Record<string, any> = {}) {
  const { currentCity } = useCityContext();
  
  const queryString = new URLSearchParams({
    city: currentCity.id,
    ...(action && { action }),
    ...params,
  }).toString();

  return useQuery({
    queryKey: ['featured', currentCity.id, action, params],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/featured?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch featured content');
      }
      return response.json();
    },
  });
}

// Custom hook for search API
export function useSearch(query: string) {
  const { currentCity } = useCityContext();
  
  return useQuery({
    queryKey: ['search', currentCity.id, query],
    queryFn: async () => {
      if (!query.trim()) {
        return { businesses: [], news: [], query };
      }
      
      const queryString = new URLSearchParams({
        q: query,
        city: currentCity.id,
      }).toString();
      
      const response = await fetch(`${API_BASE}/search?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to search');
      }
      return response.json();
    },
    enabled: !!query.trim(),
  });
}