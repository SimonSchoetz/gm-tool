# SPEC: NPCs

## Before anything else

Read all CLAUDE.md files!
Before starting to generate code, clarify any uncertainties

## Purpose

I want to be able to create and manage NPCs of an adventure.

Example:

When on adventure route, the "NPCs" nav button in the sidebar nav is being enabled. When clicking on it, I will see a list of already created NPCs with some core facts like their name, profile image, ect. at the top of the list is a button the creates a new NPC and routes me to the screen where I can edit the description amongst other things.

## Location and components

### db

> `/db/npc` -> needs to be created and set up

### domain

> `/src/domain/npcs` -> needs to be created and set up

### provider

> `/src/provider/npcs` -> needs to be created and set up

### routes

> `adventure.$adventureId.npcs.tsx` -> already exists
> `adventure.$adventureId.npcs.$npcId.tsx` -> needs to be created and set up

### screens

> `/src/screens/npc/NPCScreen.tsx`
> `/src/screens/npc/NPCScreen.css`
> -> Copy/Paste from AdventureScreen and need refactoring to fit the NPC specs

> `/src/screens/npcs/NPCsScreen.tsx`
> `/src/screens/npcs/NPCsScreen.css`
> -> Frontend outlines functionalities that need to be implemented and plugged together with the soon to be npcs provider

### service

> `/src/services/npcsService` -> needs to be created and set up

## Props / API

```typescript
type NpcSchemaOutline = {
  id: string;
  name: string;
  faction?: string;
  hometown?: string;
  createdAt: -> same logic as adventure;
  updatedAt: -> same logic as adventure;
};
```

Use the generic HtmlProps from `@/types` when typing the component

## Related Components

It should be a similar setup to adventure. In the already created NpcsScreen, I only want similar functionalities as in AdventuresScreen for the moment (routing to existing npcs or create a new one). Other functionalities I already outlined, like sorting the list via list headings will be implemented in another session
