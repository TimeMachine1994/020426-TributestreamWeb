# TPG Project Structure & Organization Guide

## Overview
This document outlines the file structure and best practices for the TPG side project within the TributeStream SvelteKit application. The goal is to maintain complete isolation from the main TributeStream codebase while following SvelteKit conventions.

---

## 📁 File Structure

```
frontend/src/
├── routes/
│   └── tpg/                          # All TPG routes (pages)
│       ├── +page.svelte              # Main TPG page at /tpg
│       ├── +page.server.ts           # Server-side data loading
│       ├── +layout.svelte            # TPG-specific layout (optional)
│       ├── +layout.server.ts         # TPG layout server logic
│       ├── dashboard/
│       │   ├── +page.svelte          # /tpg/dashboard
│       │   └── +page.server.ts
│       └── [other-pages]/
│           └── +page.svelte
│
├── lib/
│   └── tpg/                          # All TPG logic (reusable code)
│       ├── types/                    # TypeScript interfaces & types
│       │   ├── index.ts              # Re-export all types
│       │   ├── models.ts             # Data models
│       │   └── api.ts                # API types
│       │
│       ├── classes/                  # Class definitions
│       │   ├── index.ts              # Re-export all classes
│       │   ├── TPGManager.ts         # Main business logic class
│       │   └── DataProcessor.ts      # Data processing class
│       │
│       ├── stores/                   # Svelte stores (state management)
│       │   ├── index.ts              # Re-export all stores
│       │   ├── tpgStore.ts           # Main TPG store
│       │   └── userStore.ts          # TPG user state
│       │
│       ├── components/               # TPG-specific Svelte components
│       │   ├── index.ts              # Re-export components
│       │   ├── TPGHeader.svelte
│       │   ├── TPGDataGrid.svelte
│       │   └── TPGFooter.svelte
│       │
│       ├── utils/                    # Utility functions
│       │   ├── index.ts
│       │   ├── calculations.ts       # Math/calculation helpers
│       │   ├── validators.ts         # Input validation
│       │   ├── formatters.ts         # Data formatting
│       │   └── helpers.ts            # General helpers
│       │
│       ├── services/                 # Business logic & API clients
│       │   ├── index.ts
│       │   ├── dataService.ts        # Data fetching/manipulation
│       │   └── apiClient.ts          # HTTP client for TPG APIs
│       │
│       └── config/                   # Configuration & constants
│           ├── constants.ts          # App constants
│           └── settings.ts           # TPG settings
│
└── routes/api/
    └── tpg/                          # TPG API endpoints
        ├── data/
        │   └── +server.ts            # GET/POST /api/tpg/data
        ├── process/
        │   └── +server.ts            # POST /api/tpg/process
        └── [resource]/
            └── +server.ts
```

---

## 🎯 SvelteKit Best Practices

### 1. **Route Organization**
- All TPG pages live under `/routes/tpg/`
- Use `+page.svelte` for page components
- Use `+page.server.ts` for server-side data loading
- Use `+layout.svelte` for shared TPG layout (navigation, styling)

```svelte
<!-- routes/tpg/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;
</script>
```

### 2. **Server-Side Data Loading**
- Use `+page.server.ts` for data fetching before page renders
- Keep sensitive logic server-side only

```typescript
// routes/tpg/+page.server.ts
import type { PageServerLoad } from './$types';
import { dataService } from '$lib/tpg/services/dataService';

export const load: PageServerLoad = async ({ locals }) => {
  const tpgData = await dataService.fetchData();
  
  return {
    tpgData
  };
};
```

### 3. **Component Organization**
- Reusable TPG components go in `$lib/tpg/components/`
- Export from `index.ts` for clean imports
- Use TypeScript for props

```svelte
<!-- lib/tpg/components/TPGHeader.svelte -->
<script lang="ts">
  interface Props {
    title: string;
    subtitle?: string;
  }
  
  let { title, subtitle }: Props = $props();
</script>

<header>
  <h1>{title}</h1>
  {#if subtitle}
    <p>{subtitle}</p>
  {/if}
</header>
```

```typescript
// lib/tpg/components/index.ts
export { default as TPGHeader } from './TPGHeader.svelte';
export { default as TPGDataGrid } from './TPGDataGrid.svelte';
export { default as TPGFooter } from './TPGFooter.svelte';
```

### 4. **Type Safety**
- Define all types in `$lib/tpg/types/`
- Use TypeScript interfaces for data structures
- Export from `index.ts` for convenience

```typescript
// lib/tpg/types/models.ts
export interface TPGData {
  id: string;
  name: string;
  value: number;
  createdAt: Date;
}

export interface TPGUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export type TPGStatus = 'active' | 'inactive' | 'pending';
```

```typescript
// lib/tpg/types/index.ts
export * from './models';
export * from './api';
```

### 5. **Stores (State Management)**
- Use Svelte stores for reactive state
- Create TPG-specific stores in `$lib/tpg/stores/`
- Use `$state` rune for component-local state (Svelte 5)

```typescript
// lib/tpg/stores/tpgStore.ts
import { writable, derived } from 'svelte/store';
import type { TPGData } from '../types';

export const tpgData = writable<TPGData[]>([]);
export const selectedItem = writable<TPGData | null>(null);

export const filteredData = derived(
  [tpgData, selectedItem],
  ([$tpgData, $selectedItem]) => {
    if (!$selectedItem) return $tpgData;
    return $tpgData.filter(item => item.id === $selectedItem.id);
  }
);
```

### 6. **API Endpoints**
- API routes go in `/routes/api/tpg/`
- Use `+server.ts` for API handlers
- Return JSON responses

```typescript
// routes/api/tpg/data/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dataService } from '$lib/tpg/services/dataService';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const data = await dataService.fetchAll();
    return json({ success: true, data });
  } catch (error) {
    return json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json();
  
  try {
    const result = await dataService.create(body);
    return json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return json({ success: false, error: 'Failed to create' }, { status: 400 });
  }
};
```

### 7. **Services Pattern**
- Encapsulate business logic in service classes
- Keep components thin, move logic to services

```typescript
// lib/tpg/services/dataService.ts
import type { TPGData } from '../types';
import { apiClient } from './apiClient';

class DataService {
  async fetchAll(): Promise<TPGData[]> {
    const response = await apiClient.get('/api/tpg/data');
    return response.data;
  }

  async create(data: Partial<TPGData>): Promise<TPGData> {
    const response = await apiClient.post('/api/tpg/data', data);
    return response.data;
  }

  async update(id: string, data: Partial<TPGData>): Promise<TPGData> {
    const response = await apiClient.put(`/api/tpg/data/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/tpg/data/${id}`);
  }
}

export const dataService = new DataService();
```

### 8. **Utility Functions**
- Pure functions for common operations
- No side effects
- Easy to test

```typescript
// lib/tpg/utils/calculations.ts
export function calculateTotal(items: number[]): number {
  return items.reduce((sum, item) => sum + item, 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}
```

```typescript
// lib/tpg/utils/validators.ts
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}
```

---

## 💡 Import Examples

### Clean Imports Using Index Files
```typescript
// ✅ Good - Clean imports from index files
import { TPGHeader, TPGDataGrid } from '$lib/tpg/components';
import { tpgData, selectedItem } from '$lib/tpg/stores';
import type { TPGData, TPGUser } from '$lib/tpg/types';
import { calculateTotal, formatCurrency } from '$lib/tpg/utils';

// ❌ Avoid - Direct file imports bypass index organization
import TPGHeader from '$lib/tpg/components/TPGHeader.svelte';
import { tpgData } from '$lib/tpg/stores/tpgStore';
```

### Page Component Imports
```svelte
<!-- routes/tpg/dashboard/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';
  import { TPGHeader, TPGDataGrid } from '$lib/tpg/components';
  import { tpgData } from '$lib/tpg/stores';
  import type { TPGData } from '$lib/tpg/types';
  
  export let data: PageData;
  
  let selectedItems = $state<TPGData[]>([]);
</script>
```

---

## 🔒 Isolation Guidelines

### DO:
✅ Keep all TPG code within `tpg/` folders  
✅ Use namespaced imports (`$lib/tpg/...`)  
✅ Create TPG-specific types and interfaces  
✅ Use TPG-specific stores for state  
✅ Document TPG-specific logic clearly  

### DON'T:
❌ Import TributeStream-specific code into TPG  
❌ Mix TPG logic with TributeStream logic  
❌ Share stores between TPG and TributeStream  
❌ Create dependencies on TributeStream types  
❌ Modify shared components for TPG needs  

### Acceptable Shared Resources:
- Design tokens (colors, typography) from `$lib/design-tokens/`
- Generic UI components from `$lib/components/minimal-modern/`
- Authentication utilities (if TPG needs auth)
- General utility functions (date formatters, etc.)

---

## 📝 Naming Conventions

### Files
- Components: `PascalCase.svelte` (e.g., `TPGHeader.svelte`)
- Utilities: `camelCase.ts` (e.g., `calculations.ts`)
- Types: `camelCase.ts` (e.g., `models.ts`)
- Classes: `PascalCase.ts` (e.g., `TPGManager.ts`)

### Code
- Interfaces: `PascalCase` (e.g., `TPGData`)
- Types: `PascalCase` (e.g., `TPGStatus`)
- Functions: `camelCase` (e.g., `calculateTotal`)
- Classes: `PascalCase` (e.g., `DataService`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_ITEMS`)
- Stores: `camelCase` (e.g., `tpgData`)

### Prefixing
Consider prefixing TPG-specific items for clarity:
- `TPGHeader` (component)
- `TPGData` (type)
- `tpgStore` (store)
- `TPGManager` (class)

---

## 🚀 Getting Started Checklist

1. **Create Base Structure**
   - [ ] Create `lib/tpg/` folder
   - [ ] Create `routes/api/tpg/` folder
   - [ ] Set up subfolder structure (types, utils, components, etc.)

2. **Set Up Types**
   - [ ] Create `lib/tpg/types/models.ts`
   - [ ] Create `lib/tpg/types/index.ts`
   - [ ] Define core interfaces

3. **Create Services**
   - [ ] Create `lib/tpg/services/dataService.ts`
   - [ ] Set up API client if needed

4. **Build Components**
   - [ ] Create reusable TPG components
   - [ ] Export from `components/index.ts`

5. **Add Routes**
   - [ ] Create additional pages under `routes/tpg/`
   - [ ] Set up server-side data loading

6. **Test Integration**
   - [ ] Verify imports work correctly
   - [ ] Test API endpoints
   - [ ] Ensure no conflicts with main app

---

## 📚 Additional Resources

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## 🔄 Maintenance

- Keep this document updated as the TPG project evolves
- Document any deviations from these patterns
- Review structure periodically for optimization opportunities
- Refactor when patterns emerge that could be simplified

---

**Last Updated:** December 2025
