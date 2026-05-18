# Generic Spec for domains similar to

## User Story

As a developer, I want a reusable spec that allows me to trigger the implementation of new domains so that I can safe time and resources because I don't need to create a new spec for each.

## AC

- I give the implementer the spec and the domain name and it should derive everything else from the spec
- Instead of complete create and writes it should copy/duplicate folders and files of an existing domain and only make surgical changes, like changing the folder/file/component names, updating imports, etc.

## Basis for copy/paste: NPC Domain

- db `@app/db/npc`
- service `@app/services/npcsService.ts`
- domain `@app/domain/npcs`
- DAL `@app/src/data-access-layer/npcs`
- screens `@app/src/screens/npc` and `@app/src/data-access-layer/npcs`

## What needs to be updated (not exhaustive list)

- db
- routes
- breadcrumbs for `@app/src/components/Header`
