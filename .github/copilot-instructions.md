# Copilot Instructions for denah_kontrak

## Project Overview

Interactive Building Map application built with Next.js 16. Displays floor plan SVGs where each room is hoverable/clickable to view/edit room information stored in Supabase.

## Tech Stack

- **Next.js 16.1.4** (App Router) with React 19
- **Tailwind CSS v4** - uses `@import "tailwindcss"` and `@theme inline`
- **Supabase** - PostgreSQL database for room data
- **TypeScript 5** with strict mode

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Redirects to /lantai/lt1
│   ├── lantai/[floor]/page.tsx     # Dynamic floor page
│   └── api/
│       ├── rooms/route.ts          # GET/POST rooms
│       ├── rooms/[id]/route.ts     # GET/PUT/DELETE room
│       └── floors/route.ts         # GET available floors
├── components/
│   ├── FloorMap.tsx                # SVG viewer with room interactions
│   ├── RoomTooltip.tsx             # Hover tooltip
│   ├── RoomDetailModal.tsx         # Detail/edit modal
│   ├── FloorNavigation.tsx         # Floor tabs navigation
│   └── RoomLegend.tsx              # Room list sidebar
├── lib/supabase.ts                 # Supabase client
└── types/room.ts                   # TypeScript interfaces
public/denah/                       # Floor plan SVGs (LT1.svg, LT2.svg, etc.)
```

## Key Patterns

### SVG Room Detection
Floor plan SVGs must have a layer with `inkscape:label="Area Ruangan"` containing `<path>` elements. Each path's `id` attribute maps to `path_id` in the database. See [FloorMap.tsx](src/components/FloorMap.tsx#L55-L70).

### API Route Pattern
```typescript
// Next.js 16 uses Promise-based params
interface RouteParams {
  params: Promise<{ id: string }>;
}
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  // ...
}
```

### Database Schema
Room data in Supabase `rooms` table with fields: `path_id`, `floor`, `code`, `name`, `description`, `area_sqm`, `capacity`, `facilities`, `status`, `pic`, `phone`, `color`. RLS disabled for development.

### Styling Convention
**Grayscale theme only** - no bright colors. Use: `bg-gray-*`, `text-gray-*`, `border-gray-*`. Buttons: `bg-gray-900 text-white` or `border-gray-300`.

## Commands

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint check
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Component Guidelines

1. Default to Server Components; add `"use client"` only for interactivity
2. Use `@/*` path alias for imports from `src/`
3. Room status values: `"available"`, `"occupied"`, `"maintenance"`
4. Floor naming: `lt1`, `lt2`, `ltb1` (basement) - case insensitive
