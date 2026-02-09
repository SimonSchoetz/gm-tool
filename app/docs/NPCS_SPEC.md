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

### 7. Implementing Future Features

For similar features (Sessions, Locations, Items, etc.):

1. **Start with the Requirements Checklist** (above) - define schema and list all files to create
2. **Follow the Architecture Pattern** - work layer by layer (Database → Domain → Service → Provider → Routes → Screens)
3. **Avoid the Common Pitfalls** - use Route enums, prefix CSS classes, no try/catch in UI layers
4. **Reference existing patterns** - use adventure implementation as template
5. **Test thoroughly** - create, read, update, delete, and cascade delete scenarios
