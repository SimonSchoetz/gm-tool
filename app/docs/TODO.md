# fix tests

Test Failure Review
31 failing tests across 4 root causes.

❌ Violations
[1] db/database.ts — Deadlock in initDatabase causes 21 DB test timeouts
Affected tests: All tests in db/**tests**/init-database.test.ts, db/adventure/**tests**/, db/session/**tests**/, db/image/**tests**/

The bug (also a production bug on first install):

initDatabase sets db = database after calling seedTableConfig. Inside seedTableConfig, create(config) is called for each unseeded config. create calls getDatabase() internally. At that point:

db is still null
initializingPromise is still set
So getDatabase() calls initDatabase() again, which returns await initializingPromise — but initializingPromise is waiting for seedTableConfig to finish, and seedTableConfig is waiting for create(), which is waiting for initializingPromise. Circular deadlock. Never resolves.

In tests, mockSelect returns [] → existing.length === 0 is always true → seed always runs → deadlock guaranteed.

Fix — db/database.ts around line 204:

// BEFORE (deadlock)
await seedTableConfig(database);
db = database;

// AFTER (deadlock-free)
db = database; // set before seeding so getDatabase() won't recurse
await seedTableConfig(database);

This is the only change needed to fix all 21 DB test timeouts. It also fixes the production first-run bug.

[2] src/components/SortableList/helper/**tests**/buildGridTemplate.test.ts:12,27 — Stale constant value in assertions
The test was written when DEFAULT_COLUMN_WIDTH was 150. The constant is now 250 (SortableList.constants.ts). The test names even hardcode (150) in the description string, which makes the mismatch invisible at a glance.

Fix — update 2 assertions:

// Line 12:
expect(result).toBe('80px minmax(250px, 1fr)'); // was 150

// Line 27:
expect(result).toBe('250px minmax(250px, 1fr)'); // was 150

Also update the test description strings (uses DEFAULT_COLUMN_WIDTH (150) → (250)).

⚠️ Concerns
[3] src/**tests**/App.test.tsx — Architecture-stale tests, recommend removal
Recommendation: Delete these 2 tests.

Both tests were written against an older architecture and are testing assumptions that no longer hold:

Assumption in test Current reality
@db/database.initDatabase is called directly \_\_root.tsx calls ensureInitialized() from @/services/database, which wraps initDatabase. The module boundary is different.
@db/adventure.getAll is called once on mount Data fetching now goes through TanStack Query → adventureService.getAllAdventures → @db/adventure. The mock is two layers too deep and the assertion (toHaveBeenCalledOnce) doesn't match how TanStack Query fires queries.
Error boundary renders "Something went wrong" The app has nested ErrorBoundary components. The outer one wraps the TanstackQueryClientProvider. The route-level beforeLoad throwing would need to surface through TanStack Router's error handling, not just React's error boundary.
A proper rewrite would need to: mock @/services/database (not @db/database), mock @/services/adventureService (not @db/adventure), and handle TanStack Router's error propagation separately. That's a rewrite, not a fix.

These tests provide zero regression protection in their current state — they don't assert anything real and are causing noise.

✅ What's Solid
buildGridTemplate tests that do pass (formats all columns as fixed px except the last, applies minmax to the only column, returns an empty string) — these are clean, isolated, and accurate.
db/image/**tests**/create.test.ts test for invalid extensions (should throw validation error for invalid file extension, should throw validation error for missing file_extension) — these pass and test real validation behavior.
The mock structure in DB tests (hoisting mockExecute/mockSelect, clearing in beforeEach) is correct in principle; the only reason they timeout is the production-code deadlock, not the test setup.
Summary
Action Files Count
Fix production bug db/database.ts (1 line change) fixes 21 tests
Update assertions buildGridTemplate.test.ts fixes 2 tests
Delete src/**tests**/App.test.tsx removes 2 permanently stale tests

# error handling

here is a another violation flagged after the error handling was added:
V1 — Error classes use class syntax in errors.ts files
app/src/domain/sessions/errors.ts lines 1–41 app/src/domain/session-steps/errors.ts lines 1–41
Rule: "Classes are permitted only where a third-party framework API requires inheritance — e.g., Lexical node types… Do not introduce classes for any other reason." Error is a JS built-in, not a third-party framework API, and is not in the listed exceptions.
The class-free alternative using factory functions:
export type SessionLoadError = Error & { name: 'SessionLoadError' }; export const sessionLoadError = (cause?: unknown): SessionLoadError => { const error = new Error(Failed to load sessions: ${cause}) as SessionLoadError; error.name = 'SessionLoadError'; return error; };
This pattern satisfies "types over interfaces" for the type side and "arrow functions only" for the factory side. The tradeoff: instanceof checks stop working — but since throwOnError: true routes all errors to Error Boundaries (which don't use instanceof), this is not a practical loss. Verify no instanceof check exists in the codebase before applying.
Note: this is also a /refine-instructions candidate — CLAUDE.md should explicitly list Error subclassing in the exceptions or endorse the factory pattern to prevent this recurring. [INSTRUCTION GAP]

whats your take on this?

Show less

The reviewer is technically right — extends Error is class inheritance, and Error is a language built-in, not a third-party framework API. The rule's exception list doesn't cover it.

But the real question is: which pattern is actually better for this project?

Factory pattern wins here. Not because "classes are bad" in the abstract, but because of how this specific codebase handles errors:

throwOnError: true on all queries → errors go straight to the Error Boundary
The Error Boundary renders a generic fallback — it doesn't discriminate by error type
No instanceof checks exist anywhere in the codebase
The typed error name (SessionLoadError) is for logging/debugging, not for branching logic
Given all that, the factory pattern costs you nothing (instanceof you'll never use) and stays consistent with the project's posture (types + arrow functions, no class keyword). The as cast is safe because you immediately set name to match the narrowed type — it's a construction pattern, not a lie.

This is a /refine-instructions candidate. The rule needs to either:

Add Error subclassing to the exceptions list, or
Endorse the factory pattern as the error creation approach
I'd recommend the latter — it resolves the ambiguity permanently and is consistent with "types over interfaces" + "arrow functions only." Brief for /refine-instructions:

File: Root CLAUDE.md, under "Coding style"

Instruction gap: The "no classes" rule doesn't address Error subclassing. Implementers default to class MyError extends Error (standard JS idiom), which violates the rule. This has now occurred twice (sessions, session-steps).

Proposed addition (after the classes rule):

Error types use factory functions, not classes: Create typed errors with a factory function + type narrowing instead of class extends Error. This aligns with "types over interfaces" and "arrow functions only." instanceof is not used in this codebase — all errors route to the Error Boundary via throwOnError: true.

// ✅ GOOD
export type SessionLoadError = Error & { name: 'SessionLoadError' };
export const sessionLoadError = (cause?: unknown): SessionLoadError => {
const error = new Error(`Failed to load sessions: ${cause}`) as SessionLoadError;
error.name = 'SessionLoadError';
return error;
};

// ❌ BAD
export class SessionLoadError extends Error { ... }

# enums

V5 — enum Routes compiles to a class-like construct app/src/routes/index.tsx Rule: "Classes are permitted only where a third-party framework API requires inheritance." TypeScript enum compiles to a mutable IIFE — it is not a plain type. CLAUDE.md says types over interfaces, no classes. Fix:
export const Routes = { HOME: '/', ADVENTURES: 'adventures', // ... } as const; export type Route = (typeof Routes)[keyof typeof Routes];

Valid catch. TypeScript enums compile to runtime IIFE objects — they're not plain types. The as const object gives identical DX (autocomplete, type narrowing) without the runtime construct.

But this is pre-existing — the enum was there before the session work. The session implementation just added two entries to it. This is a "validate before replicating" miss: the implementer added to an existing pattern without checking if the pattern itself was convention-compliant.

The fix is mechanical but wide — every file that imports Routes needs updating (route files, screen files, SideBarNav, Header). Worth doing as a standalone cleanup, not entangled with the session feature. Want me to add it as a separate spec, or is this small enough to just hand to a refactor instance directly?

Well it's a valid catch when it comes to the instruction regarding classes. But should we really avoid using enums entirely? What's safer for you?

Honestly — for me, both are equally safe to work with. I'll autocomplete and type-check either pattern correctly. This isn't a "Claude will make fewer mistakes" question.

The real question is whether the convention should ban enums. My take: yes, prefer as const as the default, but not because enums are dangerous. It's about consistency with the project's existing posture:

"types over interfaces" → you already prefer type-level constructs over runtime constructs
as const gives the same DX (autocomplete, type narrowing, exhaustive checks) without being a special TypeScript-only syntax feature
String enums don't reverse-map, so the one feature enums add over as const doesn't even apply here
But calling it a "class" violation is a stretch — the reviewer is right about the spirit, wrong about the cited rule. Enums aren't classes. If you want to ban them, it deserves its own line in CLAUDE.md rather than being shoehorned under the class rule.

Something like:

as const over enum: Use as const objects with derived types instead of TypeScript enums. Enums are runtime constructs with compilation quirks; as const achieves the same type safety with a plain object.

That said — this is cosmetic cleanup, not a structural risk. I'd queue it behind the actual session feature work, not block on it.

# frontend implementation

Can you tell me why you ignored the instructions "Raw pixel, color, and rem values are banned in component .css files." from @app/src/CLAUDE.md ? In many .css files I review just now are raw px values. I do not want you to fix this right now. But I want to know what went wrong

1. Which rule applies

From app/src/CLAUDE.md — Design token obligation:

"All CSS property values must reference tokens from styles/variables.css. Raw pixel, color, and rem values are banned in component .css files."

This rule is unconditional — it applies to every value in every component .css file, with no exception for new files, session screen work, or "quickly written" layout CSS.

2. Why it was missed

The reasoning process never included a CSS token audit step. When I wrote new .css files (e.g. PrepView.css, StepsNavSidebar.css, InGameView.css), I focused entirely on getting the layout correct and verified the TypeScript compiled. I treated CSS as a secondary concern and moved straight to the next sub-feature without running any check against the token rule.

3. The wrong mental model

"CSS is presentational scaffolding — get it working, refine it later." I treated raw pixel values as acceptable placeholders during implementation, with an implicit assumption that visual polish (including token compliance) was a separate phase. This caused the token rule to never enter the evaluation loop during implementation.

4. The correct mental model

Every .css line I write is production code, subject to the same conventions as TypeScript. Before marking a sub-feature complete, the check must be: "Does every value in every CSS file I touched reference a var(--...)?" If a needed token doesn't exist in variables.css, I add it there first — I don't hardcode at the component level and move on. The token obligation is a pre-commit gate, not a post-implementation polish step.

!! --> it should look into variables if there is something fitting - if it doesnt find anything, it should not just add new variables but in this instance is allowed to use px values - I'll clean that up later.

# .md lint vs claude formatting

Claude does different formatting than my linter - I want to sync that
