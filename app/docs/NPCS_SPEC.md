# SPEC: NPCs

## Before anything else

Read all CLAUDE.md files!
Before starting to generate code, clarify any uncertainties

## Purpose

I want to be able to create and manage NPCs of an adventure.

Example:

When on adventure route, the "NPCs" nav button in the sidebar nav is being enabled. When clicking on it, I will see a list of already created NPCs with some core facts like their name, profile image, ect. at the top of the list is a button the creates a new NPC and routes me to the screen where I can edit the description amongst other things.

## Requirements Checklist

### Schema Definition

Define the complete schema upfront. Consider:

- **Core fields**: id (PK), name, other business-specific fields
- **Foreign keys**: What does this entity belong to? (e.g., adventure_id for NPCs)
- **Optional fields**: rank, faction, hometown, etc.
- **Rich content**: Does it need a description field for TextEditor?
- **Media**: Does it need an image_id field for UploadImgBtn?
- **Timestamps**: created_at, updated_at (always include)

**NPC Schema Example:**

```typescript
{
  id: string                    // PK (nanoid)
  adventure_id: string          // FK to adventures (CASCADE on delete)
  name: string                  // Required
  rank?: string                 // Optional
  faction?: string              // Optional
  hometown?: string             // Optional
  description?: string          // Optional (for rich text editor)
  image_id?: string             // Optional FK to images (SET NULL on delete)
  created_at: string           // Auto timestamp
  updated_at: string           // Auto timestamp
}
```

### Files to Create

All files listed below need to be created from scratch:

**Database Layer** (`/db/npc/`):

- `schema.ts` - Table definition using `defineTable` utility
- `types.ts` - TypeScript types (Npc, CreateNpcInput, UpdateNpcInput)
- `create.ts` - Create function
- `get.ts` - Get single by ID
- `get-all.ts` - Get all (filtered by parent if applicable)
- `update.ts` - Update function
- `remove.ts` - Delete function
- `index.ts` - Barrel exports
- Update `/db/database.ts` to register the new table

**Domain Layer** (`/src/domain/npcs/`):

- `errors.ts` - Domain-specific error classes
- `index.ts` - Barrel exports

**Service Layer** (`/src/services/`):

- `npcsService.ts` - Business logic, image handling, throws domain errors

**Provider Layer** (`/src/providers/npcs/`):

- `NpcProvider.tsx` - TanStack Query provider with React Context
- `useNpcs.ts` - Hook to consume context
- `index.ts` - Barrel exports
- Update `/src/providers/DataProvider.tsx` to add provider to chain

**Routes** (`/src/routes/`):

- Add enum values to `/src/routes/index.tsx` (e.g., `NPCS = '/npcs'`, `NPC = '/npc'`)
- `adventure.$adventureId.npcs.tsx` - List route
- `adventure.$adventureId.npc.$npcId.tsx` - Detail route

**Screens** (`/src/screens/`):

- `/src/screens/npcs/NpcsScreen.tsx` - List view (similar to AdventuresScreen)
- `/src/screens/npcs/NpcsScreen.css` - Styles with `npcs-` prefix
- `/src/screens/npc/NpcScreen.tsx` - Detail view (similar to AdventureScreen)
- `/src/screens/npc/NpcScreen.css` - Styles with `npc-` prefix
- Update `/src/screens/index.ts` to export both screens

## Implementation Guidelines

### Pattern Reference

- **Database**: Follow pattern from `db/adventure/`
- **Domain**: Follow pattern from `src/domain/adventures/`
- **Service**: Follow pattern from `src/services/adventureService.ts`
- **Provider**: Follow pattern from `src/providers/adventures/`
- **Screens**: Use AdventureScreen/AdventuresScreen as reference (but prefix all CSS classes!)

### Key Considerations

- Similar functionality to adventures: list view with create button, detail view with edit/delete
- Use Route enum constants (never plain strings)
- Prefix all CSS class names with feature name (e.g., `npc-`, `session-`)
- Follow TanStack Query pattern (no manual state + useEffect + try/catch)
- Implement debounced updates (500ms) for text inputs
- Add optimistic UI updates for responsive feel

---

## Learnings & Implementation Notes

### 1. Route Composition - ALWAYS Use Route Enum

**❌ WRONG:**

```typescript
// Don't use plain strings for routes
to={`/adventure/${adventureId}/npcs/${npcId}`}
router.navigate({ to: `/adventure/${adventureId}/npcs` })
```

**✅ CORRECT:**

```typescript
// Always use Route enum constants from @/routes
to={`/${Routes.ADVENTURE}/${adventureId}/${Routes.NPC}/${npcId}`}
router.navigate({ to: `/${Routes.ADVENTURE}/${adventureId}/${Routes.NPCS}` })
```

**Why:** Using the Route enum ensures type safety, prevents typos, and makes route changes easier to maintain across the codebase.

### 2. CSS Class Name Prefixing

When copy/pasting screens as templates, **always prefix class names** to avoid CSS conflicts:

**❌ WRONG (from AdventureScreen):**

```tsx
<div className='text-edit-area'>
  <Input className='title-input' />
</div>
```

**✅ CORRECT (for NpcScreen):**

```tsx
<div className='npc-text-edit-area'>
  <Input className='npc-name-input' />
</div>
```

**Pattern:** Prefix with the feature name (e.g., `npc-`, `session-`, `adventure-`) to:

- Prevent CSS conflicts between similar screens
- Make it clear which screen's styles apply
- Allow independent styling without side effects

### 3. Route File Naming Convention

**Pattern:** Route files should match the Route enum values:

- **List routes** (plural): `adventure.$adventureId.npcs.tsx` → renders list of NPCs
- **Detail routes** (singular): `adventure.$adventureId.npc.$npcId.tsx` → renders single NPC detail

This matches the enum structure:

```typescript
Routes.NPCS = 'npcs'; // Plural for list
Routes.NPC = 'npc'; // Singular for detail
```

### 4. Architecture Pattern Summary

Follow this layered architecture consistently:

```
1. Database Layer    → CRUD operations, schema, types
2. Domain Layer      → Error classes, business types
3. Service Layer     → Business logic, throws domain errors
4. Provider Layer    → TanStack Query + React Context (no try/catch)
5. Routes           → TanStack Router file-based routing
6. Screens          → UI only (no error handling)
```

**Key principles:**

- Services throw domain-specific errors
- Providers wrap TanStack Query (never manual state + useEffect + try/catch)
- Screens have NO error handling - Error Boundary catches everything
- Debounced updates (500ms) for text inputs
- Optimistic UI updates via queryClient.setQueryData

### 5. Provider Chain in DataProvider

Add new providers to the chain in logical order:

```tsx
<ImageProvider>          {/* Base resources */}
  <AdventureProvider>    {/* Top-level entities */}
    <NpcProvider>        {/* Belongs to adventures */}
      <SessionProvider>  {/* Also belongs to adventures */}
```

### 6. Common Pitfalls to Avoid

1. **Don't use plain route strings** - always use `Routes.CONSTANT`
2. **Don't forget CSS prefixes** when copying screens
3. **Don't add try/catch in providers** - let TanStack Query handle errors
4. **Don't add try/catch in screens** - let Error Boundary handle errors
5. **Don't forget foreign key constraints** (e.g., adventure_id with CASCADE)
6. **Don't forget to register new tables** in `database.ts`
7. **Don't forget to export screens** in `screens/index.ts`

### 7. Parameter-Based Hooks Pattern (Critical!)

**Problem:** When refreshing a page on a route like `/adventure/xyz/npc/abc`, the route persists but provider state is lost. The old pattern required manual `initEntity(id)` calls in useEffect, which didn't work on page refresh.

#### Old Pattern (Don't Use) ❌

```typescript
// Provider stored entity in context state
const [npc, setNpc] = useState<Npc | null>(null);
const initNpc = (id: string) => { /* fetch and setNpc */ };

// Screen had to call init in useEffect
const NpcScreen = () => {
  const { npcId } = useParams({ from: '...' });
  const { npc, initNpc } = useNpcs();

  useEffect(() => {
    initNpc(npcId); // ❌ Doesn't run on page refresh
  }, [npcId]);

  if (!npc) return <div>Loading...</div>;
  // ...
};
```

**Problems:**
- State lost on page refresh (npc is null even though route has npcId)
- Manual useEffect boilerplate in every screen
- Easy to forget to call init
- Not aligned with TanStack Query best practices

#### New Pattern (Use This) ✅

**For Single Entities:** Create standalone hooks that accept ID parameters

```typescript
// useNpc.ts - standalone hook (no provider needed)
export const useNpc = (npcId: string): UseNpcReturn => {
  const { data: npc, isPending: isLoadingNpc } = useQuery({
    queryKey: ['npc', npcId],
    queryFn: () => service.getNpcById(npcId),
    enabled: !!npcId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNpcData }) =>
      service.updateNpc(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['npc', variables.id] });
    },
  });

  // Debounced update function...
  const updateNpc = (data: UpdateNpcData) => { /* ... */ };

  return { npc, loading: isLoadingNpc, saveError, updateNpc, deleteNpc };
};

// Screen - clean and simple!
const NpcScreen = () => {
  const { npcId } = useParams({ from: '...' });
  const { npc, updateNpc, loading } = useNpc(npcId); // ✅ Just works!

  if (loading || !npc) return <div>Loading...</div>;
  // NO useEffect, NO init call - automatically fetches based on npcId
};
```

**For Lists:** Create standalone hooks that accept parent ID parameters

```typescript
// useNpcs.ts - standalone hook
export const useNpcs = (adventureId: string): UseNpcsReturn => {
  const { data: npcs = [], isPending } = useQuery({
    queryKey: ['npcs', adventureId],
    queryFn: () => service.getAllNpcs(adventureId),
    enabled: !!adventureId,
  });

  // Create, delete mutations...

  return { npcs, loading: isPending, createNpc };
};

// Screen
const NpcsScreen = () => {
  const { adventureId } = useParams({ from: '...' });
  const { npcs, createNpc, loading } = useNpcs(adventureId); // ✅ Just works!
  // ...
};
```

#### When to Use Providers vs Standalone Hooks

**Use Provider (with Context):**

- For app-wide state needed by multiple unrelated components
- For list operations that multiple routes need (e.g., all adventures)
- When you need to share mutations across many components
- Example: `AdventureProvider` for the adventures list + create/delete

**Use Standalone Hooks (no Provider):**

- For single-entity operations tied to route params
- When each screen has its own isolated data needs
- When the entity ID comes from the URL
- Examples: `useAdventure(id)`, `useNpc(id)`, `useSession(id)`

#### Benefits of Parameter-Based Pattern

1. **Survives page refresh** - Route params persist, TanStack Query auto-fetches
2. **Simpler code** - No useEffect, no manual init calls
3. **Type-safe** - ID is required parameter, can't forget it
4. **Better caching** - TanStack Query manages cache by ID automatically
5. **Cleaner separation** - Each hook is independent, no tangled provider state

#### Implementation Checklist

When implementing a new feature with single-entity views:

- [ ] Create `useEntity(id)` hook that accepts ID parameter
- [ ] Use `useQuery` with `queryKey: ['entity', id]`
- [ ] Enable query only when ID exists: `enabled: !!id`
- [ ] Return loading state and data directly from hook
- [ ] In screen, get ID from route params and pass to hook
- [ ] Remove all useEffect and manual init calls
- [ ] Test page refresh on entity detail routes

### 8. Implementing Future Features

For similar features (Sessions, Locations, Items, etc.):

1. **Start with the Requirements Checklist** (above) - define schema and list all files to create
2. **Follow the Architecture Pattern** - work layer by layer (Database → Domain → Service → Provider → Routes → Screens)
3. **Use parameter-based hooks** for single-entity operations (see Learning #7)
4. **Avoid the Common Pitfalls** - use Route enums, prefix CSS classes, no try/catch in UI layers
5. **Reference existing patterns** - use adventure implementation as template
6. **Test thoroughly** - create, read, update, delete, cascade delete, and **page refresh** scenarios
