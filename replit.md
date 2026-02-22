# DFW Hanin - Korean Community Directory

## Overview
Korean community directory website for Dallas-Fort Worth area featuring authentic Korean businesses. Full-stack application with React frontend and Express/PostgreSQL backend. Korean is the default language throughout the entire interface.

## Recent Changes
- **2026-02-22**: Converted from static frontend prototype to full-stack app with PostgreSQL database
- Created businesses and news tables with proper schema
- Implemented API routes with storage interface pattern
- Seeded database with 10 Korean restaurants and 4 news articles
- Updated all frontend pages to fetch data from API endpoints
- Fixed nested anchor tag warnings (wouter Link)

## Architecture
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui + wouter routing
- **Backend**: Express 5 + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Noto Sans KR typography, blue (#3B82F6) primary, orange (#F59E0B) secondary

### Key Files
- `shared/schema.ts` - Database schema (businesses, news, users tables)
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface (IStorage) with DatabaseStorage implementation
- `server/routes.ts` - API routes (uses storage interface)
- `server/seed.ts` - Database seed script
- `client/src/lib/api.ts` - Frontend API hooks (useBusinesses, useBusiness, useFeaturedBusinesses, useNews)
- `client/src/pages/` - Home, Listings, BusinessDetail, News, Pricing pages

### API Endpoints
- `GET /api/businesses` - List businesses with optional filters (category, city, search, featured)
- `GET /api/businesses/:id` - Get single business
- `GET /api/featured` - Get featured businesses
- `GET /api/news` - List news with optional category filter
- `GET /api/news/:category` - Get news by category

## User Preferences
- Korean language as default throughout the application
- Mobile-first responsive design
- Categories: 식당, 미용/뷰티, 의료/병원, 법률 서비스, 부동산, 자동차 서비스, 교육/학원, 이벤트/기획
