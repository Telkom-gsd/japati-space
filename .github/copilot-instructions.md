# Copilot Instructions for Japati Space (denah_kontrak)

## Project Overview

Interactive Building Floor Map application for viewing and editing room information. Two main interfaces:
1. **Viewer** (`/lantai/[floor]`) - Browse floor plans with hoverable/clickable rooms linked to Supabase data
2. **Editor** (`/editor/[floor]`) - Leaflet-based canvas for drawing/editing room polygons on floor SVGs

## Tech Stack

- **Next.js 16.1.4** (App Router) with React 19
- **Tailwind CSS v4** - uses `@import "tailwindcss"` and `@theme inline` in [globals.css](src/app/globals.css)
- **Supabase** - PostgreSQL database for room data (RLS disabled for dev)
- **Leaflet + Leaflet-Draw** - SVG canvas editor (dynamic import, no SSR)
- **TypeScript 5** with strict mode

## Architecture

```
/                          → Redirects to /lantai/lt1
/lantai/[floor]            → Floor viewer (FloorMap + RoomLegend)
/editor/[floor]            → SVG canvas editor (Leaflet-based)
/api/rooms                 → GET (list/filter), POST (create)
/api/rooms/[id]            → GET, PUT, DELETE individual room
/api/floors                → GET available floors from public/denah/*.svg
/api/save-svg              → Save edited SVG back to disk
```

## Key Patterns

### SVG Room Detection
Floor SVGs must have `inkscape:label="Area Ruangan"` layer. Path `id` → `path_id` in database:
```tsx
// FloorMap.tsx L89-99: finds room layer
const areaGroup = svg.querySelector('g[inkscape\\:label="Area Ruangan"]');
const paths = areaGroup.querySelectorAll("path");
// Path id maps to room.path_id in Supabase
```

### Next.js 16 Async Params
All dynamic routes use Promise-based params (breaking change from v15):
```typescript
// Page components
interface Props { params: Promise<{ floor: string }>; }
export default function Page({ params }: Props) {
  const { floor } = use(params);  // React 19 use() hook
}

// API routes
interface RouteParams { params: Promise<{ id: string }>; }
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
}
```

### Dynamic Import for Leaflet
SVGCanvasEditor must avoid SSR (uses browser-only APIs):
```tsx
const SVGCanvasEditor = dynamic(() => import("@/components/SVGCanvasEditor"), {
  ssr: false,
  loading: () => <div>Memuat editor...</div>,
});
```

### Database Schema (rooms table)
| Field | Type | Notes |
|-------|------|-------|
| path_id | string | SVG path `id`, links SVG to DB |
| floor | string | `lt1`, `lt2`, `ltb1` (lowercase) |
| status | enum | `"available"` \| `"occupied"` \| `"maintenance"` |
| color | string | Hex color for the room path |

## Styling Convention

**Grayscale theme only** - no bright colors:
- Backgrounds: `bg-gray-100`, `bg-white`
- Text: `text-gray-900`, `text-gray-600`, `text-gray-400`
- Borders: `border-gray-200`, `border-gray-300`
- Primary buttons: `bg-gray-900 text-white hover:bg-gray-800`
- Secondary: `border border-gray-300 text-gray-700`

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

1. Default to Server Components; add `"use client"` only for interactivity/hooks
2. Use `@/*` path alias for all imports from `src/`
3. Floor naming convention: `lt1`, `lt2`, `ltb1` (basement) - always lowercase in DB
4. SVG files: UPPERCASE in `public/denah/` (e.g., `LT1.svg`) - code handles conversion
5. UI language is Indonesian (e.g., "Lantai", "Ruangan", "Simpan")
