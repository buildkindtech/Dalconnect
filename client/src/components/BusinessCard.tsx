import { Link } from "wouter";
import { MapPin, Star, UtensilsCrossed, Church, Heart, Scissors, Home as HomeIcon, Scale, Car, GraduationCap, ShoppingCart, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Business } from "@/lib/api";

interface BusinessCardProps {
  business: Business;
}

// Category icon mapping
const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  
  if (cat.includes('restaurant') || cat.includes('식당')) return UtensilsCrossed;
  if (cat.includes('교회') || cat.includes('church')) return Church;
  if (cat.includes('병원') || cat.includes('medical') || cat.includes('dental')) return Heart;
  if (cat.includes('미용') || cat.includes('beauty') || cat.includes('salon')) return Scissors;
  if (cat.includes('부동산') || cat.includes('real estate')) return HomeIcon;
  if (cat.includes('법률') || cat.includes('회계') || cat.includes('law') || cat.includes('accounting')) return Scale;
  if (cat.includes('자동차') || cat.includes('auto')) return Car;
  if (cat.includes('학원') || cat.includes('academy') || cat.includes('education')) return GraduationCap;
  if (cat.includes('마트') || cat.includes('market') || cat.includes('grocery')) return ShoppingCart;
  
  return Building2; // Default icon
};

// Category color mapping
const getCategoryColor = (category: string) => {
  const cat = category.toLowerCase();
  
  if (cat.includes('restaurant') || cat.includes('식당')) return 'from-red-500 to-red-600';
  if (cat.includes('교회') || cat.includes('church')) return 'from-purple-500 to-purple-600';
  if (cat.includes('병원') || cat.includes('medical') || cat.includes('dental')) return 'from-blue-500 to-blue-600';
  if (cat.includes('미용') || cat.includes('beauty') || cat.includes('salon')) return 'from-pink-500 to-pink-600';
  if (cat.includes('부동산') || cat.includes('real estate')) return 'from-green-500 to-green-600';
  if (cat.includes('법률') || cat.includes('회계') || cat.includes('law') || cat.includes('accounting')) return 'from-indigo-500 to-indigo-600';
  if (cat.includes('자동차') || cat.includes('auto')) return 'from-orange-500 to-orange-600';
  if (cat.includes('학원') || cat.includes('academy') || cat.includes('education')) return 'from-yellow-500 to-yellow-600';
  if (cat.includes('마트') || cat.includes('market') || cat.includes('grocery')) return 'from-teal-500 to-teal-600';
  
  return 'from-slate-500 to-slate-600'; // Default color
};

export default function BusinessCard({ business }: BusinessCardProps) {
  const IconComponent = getCategoryIcon(business.category);
  const colorClass = getCategoryColor(business.category);
  
  return (
    <Link href={`/business/${business.id}`}>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group h-full">
        <CardContent className="p-0">
          {/* Image or Icon Fallback */}
          {business.cover_url ? (
            <div 
              className="w-full h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
              style={{ backgroundImage: `url(${business.cover_url})` }}
            />
          ) : (
            <div className={`w-full h-48 bg-gradient-to-br ${colorClass} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
              <IconComponent className="h-20 w-20 text-white/80" />
            </div>
          )}
          
          {/* Content */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors font-ko">
                  {business.name_ko || business.name_en}
                </h3>
                {business.name_ko && business.name_en && (
                  <p className="text-sm text-slate-500 mt-0.5">{business.name_en}</p>
                )}
              </div>
              {business.featured && (
                <Badge variant="default" className="ml-2 flex-shrink-0">추천</Badge>
              )}
            </div>
            
            <p className="text-slate-600 mb-3 text-sm font-ko">{business.category}</p>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-semibold">{business.rating || 'N/A'}</span>
              </div>
              <span className="text-slate-500 text-sm">
                ({business.review_count || 0} 리뷰)
              </span>
            </div>
            
            {business.address && (
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{business.address}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
