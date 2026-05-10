# SF1: Config [FOUNDATION]

[FOUNDATION: SF2 and SF3 depend on this]

Add `@services` and `@domain` path aliases to all three config files. Expand
`tsconfig.json`'s `include` array to cover the new directories. Add `services`
and `domain` to vitest coverage. Do not run baseline checks after this SF alone —
run only after SF2 and SF3 are also complete.

## Files Affected

```text
Modified:
  app/tsconfig.json
  app/vite.config.ts
  app/vitest.config.ts
```

## DB Changes

None.

## Config Changes

### `app/tsconfig.json`

Add to `compilerOptions.paths`:

```json
"@services/*": ["./services/*"],
"@domain": ["./domain/index.ts"],
"@domain/*": ["./domain/*"]
```

Add `"services"` and `"domain"` to the `include` array:

```json
"include": ["src", "db", "util", "services", "domain"]
```

### `app/vite.config.ts`

Add to `resolve.alias`:

```typescript
'@services': path.resolve(__dirname, './services'),
'@domain': path.resolve(__dirname, './domain'),
```

### `app/vitest.config.ts`

Add to `resolve.alias`:

```typescript
'@services': path.resolve(__dirname, './services'),
'@domain': path.resolve(__dirname, './domain'),
```

Add `services` and `domain` to the coverage `include` pattern:

```typescript
coverage: {
  include: ['src/**/*.{ts,tsx}', 'services/**/*.ts', 'domain/**/*.ts'],
},
```
