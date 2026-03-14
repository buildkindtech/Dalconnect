import { Link } from "wouter";
import { MapPin, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Business } from "@/lib/api";
import { getCategoryColor, getCategoryIcon, proxyPhotoUrl } from "@/lib/imageDefaults";
import * as Icons from "lucide-react";

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const iconName = getCategoryIcon(business.category) as keyof typeof Icons;
  const IconComponent = Icons[iconName] as React.ComponentType<{ className?: string }>;
  const colorClass = getCategoryColor(business.category);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group h-full rounded-xl">
      <CardContent className="p-0">
        <Link href={`/business/${business.id}`}>
          {/* Image */}
          {business.cover_url ? (
            <div
              className="w-full h-28 md:h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
              style={{ backgroundImage: `url(${proxyPhotoUrl(business.cover_url) || business.cover_url})` }}
            />
          ) : (
            <div className={`w-full h-28 md:h-48 bg-gradient-to-br ${colorClass} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
              {IconComponent && <IconComponent className="h-10 w-10 md:h-16 md:w-16 text-white/80" />}
            </div>
          )}
        </Link>

        {/* Content */}
        <Link href={`/business/${business.id}`}>
          <div className="p-2 md:p-5">
            {/* Category badge */}
            <span className="text-[10px] md:text-xs text-primary font-semibold uppercase tracking-wide">
              {business.category}
            </span>

            {/* Name */}
            <h3 className="text-xs md:text-lg font-bold text-slate-800 group-hover:text-primary transition-colors font-ko line-clamp-2 leading-snug mt-0.5">
              {business.name_ko || business.name_en}
            </h3>

            {/* Rating + City */}
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-0.5">
                {business.rating && parseFloat(business.rating) > 0 ? (
                  <>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-slate-700 ml-0.5">{business.rating}</span>
                    {business.review_count && business.review_count > 0 && (
                      <span className="text-[10px] text-slate-400 ml-0.5">({business.review_count})</span>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-slate-400">평점 없음</span>
                )}
              </div>
              {business.city && (
                <div className="flex items-center gap-0.5 text-[10px] text-slate-400">
                  <MapPin className="h-2.5 w-2.5" />
                  <span>{business.city}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
