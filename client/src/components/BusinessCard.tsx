import { Link } from "wouter";
import { MapPin, Star, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Business } from "@/lib/api";
import { getCategoryColor, getCategoryIcon } from "@/lib/imageDefaults";
import * as Icons from "lucide-react";

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const iconName = getCategoryIcon(business.category) as keyof typeof Icons;
  const IconComponent = Icons[iconName] as React.ComponentType<{ className?: string }>;
  const colorClass = getCategoryColor(business.category);
  
  return (
    <Card className="overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full rounded-xl">
      <CardContent className="p-0">
        <Link href={`/business/${business.id}`}>
          {/* Image or Icon Fallback */}
          {business.cover_url ? (
            <div 
              className="w-full h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
              style={{ backgroundImage: `url(${business.cover_url})` }}
            />
          ) : (
            <div className={`w-full h-48 bg-gradient-to-br ${colorClass} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
              {IconComponent && <IconComponent className="h-20 w-20 text-white/80" />}
            </div>
          )}
        </Link>
        
        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <Link href={`/business/${business.id}`} className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors font-ko">
                {business.name_ko || business.name_en}
              </h3>
              {business.name_ko && business.name_en && (
                <p className="text-sm text-slate-500 mt-0.5">{business.name_en}</p>
              )}
            </Link>
          </div>
          
          <Badge variant="secondary" className="mb-3 text-xs">
            {business.category}
          </Badge>
          
          {/* Visual Star Rating */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              {business.rating && parseFloat(business.rating) > 0 ? (
                <>
                  {[...Array(5)].map((_, i) => {
                    const rating = parseFloat(business.rating || '0');
                    const fillPercentage = Math.min(Math.max(rating - i, 0), 1);
                    return (
                      <div key={i} className="relative">
                        <Star className="h-4 w-4 text-slate-300" />
                        {fillPercentage > 0 && (
                          <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage * 100}%` }}>
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <span className="font-bold text-lg ml-1">{business.rating}</span>
                </>
              ) : (
                <span className="text-slate-400 text-sm">평점 없음</span>
              )}
            </div>
            {business.review_count && business.review_count > 0 && (
              <span className="text-slate-500 text-sm">
                💬 {business.review_count}개 리뷰
              </span>
            )}
          </div>
          
          {business.city && (
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{business.city}</span>
            </div>
          )}
          
          {business.phone && (
            <a 
              href={`tel:${business.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors md:hidden mt-3"
            >
              <Phone className="h-4 w-4" />
              <span className="font-medium">전화 걸기</span>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
