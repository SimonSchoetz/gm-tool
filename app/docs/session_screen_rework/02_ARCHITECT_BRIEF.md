# Session/s Screen Architect Brief

## Feature: Prep-View / In-Game-View toggle

User Story:
As a GM, I want to be able to toggle between prep-view and
in-game-view so I can have a clear boundary between
"focussing on prep" vs "focussing on the game."

Acceptance Criteria:

- [ ] Toggle control lives in the header section visible in both views
- [ ] Toggling is non-destructive — switching views does not affect any saved content

Scope Boundaries:
What this story includes: the toggle control and view-switching mechanism
What this story does not include: what each view renders — covered
by the Lazy DM Steps, Tooltips, In-Game pure view, and
In-Game Notes stories

Open Questions:

## Feature: Lazy DM Steps template

User Story:
As a GM, I need a template that has each "Lazy DM" prep step
so I don't mix up my prep work.

Acceptance Criteria:

- [ ] 8 sections created on session init — one per step as defined
      in LAZY_DM_STEPS.md, in that order
- [ ] Each section consists of:
      header (checkbox + step name heading + tooltips toggle +
      move up/down buttons + delete button),
      hidable tooltip (default: hidden, text from LAZY_DM_STEPS.md),
      text editor field
- [ ] Each new session starts with this pre-defined template
- [ ] All adjustments belong to each session independently

Scope Boundaries:
What this story includes: section anatomy and template
initialisation on session creation
What this story does not include: tooltip toggle behavior
(Tooltips Toggle story); step action behaviors — move, delete,
add (Steps management stories); sidebar navigation
(Steps navigation story)

Design notes:

- Delete button = trash can icon
- Move up/down = chevron icons
- Tooltips toggle = question mark icon reflecting toggle state
- Step name = prefilled input field (editable)

Open Questions:

## Feature: Per-step tooltip toggle

User Story:
As a GM, I need helpful tooltips and reminders for each
"Lazy DM" step that I can toggle into view when I need them
so I can find guidance if I don't know what to do or what is
important at a certain step.

Acceptance Criteria:

- [ ] Tooltip renders between section header and text editor field
- [ ] Each step's tooltip can be toggled individually
- [ ] Global "show/hide all": when no tooltip is visible → show all;
      any tooltip visible → hide all
- [ ] All tooltips default to hidden on session creation

Scope Boundaries:
What this story includes: per-step toggle, global toggle with
defined edge-case behavior, default hidden state
What this story does not include: tooltip content — defined in
LAZY_DM_STEPS.md; tooltips are not shown in In-Game-View
(covered by In-Game pure view story)

Open Questions:

## Feature: Step completion checkmarks

User Story:
As a GM, I need to track the steps I already did with checkmarks
so I can see my progress and pick up where I left if I had to
pause my prepping.

Acceptance Criteria:

- [ ] Each step section has a checkbox in its header
- [ ] Check state persists across app restarts and screen navigation
- [ ] Check state is per-session independently
- [ ] All checkmarks start unchecked on session creation

Scope Boundaries:
What this story includes: checkbox in section header, persistence,
per-session isolation
What this story does not include: reflection of checked state in
Steps navigation sidebar (Steps navigation story); checkboxes
inside text editor content (Checkbox capability story)

Open Questions:

## Feature: Step rearrangement via section header

User Story:
As a GM, I want to be able to change the arrangement of the
"Lazy DM" steps so I can decide where which information shows
up depending of where I deem it important.

Acceptance Criteria:

- [ ] Move up/down controls available at each section header
- [ ] Order change is per-session independently
- [ ] Order change is reflected in Steps navigation sidebar

Scope Boundaries:
What this story includes: move up/down controls on section headers
What this story does not include: drag-and-drop rearrangement —
handled by Steps navigation story as intentional duplication

Open Questions:

## Feature: Step deletion

User Story:
As a GM, I want to be able to remove steps so I can keep the
session prep screen as tight as possible.

Acceptance Criteria:

- [ ] Delete button in section header triggers a confirmation
      popup before executing
- [ ] Confirmation popup explicitly states that the step and all
      its contents will be deleted permanently
- [ ] Deletion is permanent — content is not recoverable
- [ ] Deleted step disappears from Steps navigation
- [ ] Deletion is per-session independently

Scope Boundaries:
What this story includes: delete action with confirmation,
permanent removal
What this story does not include: recovering deleted steps —
not supported

Open Questions:

## Feature: Add custom steps

User Story:
As a GM, I want to be able to add additional steps/text editor
sections so I introduce my own steps when I need them.

Acceptance Criteria:

- [ ] Add button is the last item in Steps navigation
- [ ] Adding a step scrolls to the new section at the bottom and
      sets focus to the section name input field
- [ ] New steps are added per-session independently

Scope Boundaries:
What this story includes: add action triggered from Steps
navigation, scroll and focus behavior on add
What this story does not include: recovering previously deleted
default steps — deletions are permanent (Remove story)

Design notes:

- Add button resembles the "add new" button used in list screens
  (e.g. NpcsScreen)

Open Questions:

- Does a custom step include a tooltip slot, or only the checkbox,
  name input, move up/down, delete, and text editor? No tooltip
  content exists for custom steps — confirm whether the tooltip
  control should appear or be omitted.

## Feature: Steps navigation sidebar

User Story:
As a GM, I want a navigation similar to the screens navigation
so I can navigate between sections fast.

Acceptance Criteria:

- [ ] Nav sidebar lives within the session screen and does not
      replace the global screens navigation sidebar
- [ ] Clicking a section item scrolls to that section and sets
      focus to its text editor
- [ ] Drag-and-drop rearranges sections (intentional duplication
      of section header move up/down)
- [ ] Reflects real-time section changes: checked state, step name
      edits, order from move up/down, disappears when section deleted
- [ ] Add button for new steps is the last item in the navigation

Scope Boundaries:
What this story includes: sidebar navigation, drag-and-drop
rearrangement, real-time state sync, add button placement
What this story does not include: add button scroll/focus behavior
on add — covered by Add steps story

Open Questions:

## Feature: In-Game-View — read-only session notes

User Story:
As a GM, I want my pure session notes as a whole document without
text editor tools or instructions so I won't be distracted from
the ongoing session.

Acceptance Criteria:

- [ ] All step text renders as read-only
- [ ] Text editor toolbars not shown
- [ ] Tooltip sections not shown
- [ ] Section headers remain visible to delineate sections
- [ ] Step completion checkmarks in section headers remain
      interactive (checkable)
- [ ] Checkbox list items inside text editor content remain
      interactive (checkable)

Scope Boundaries:
What this story includes: read-only rendering of all prep content,
suppression of editor UI and tooltips, checkbox interactivity
edge cases
What this story does not include: session summary text editor —
separate story; view toggle to return to Prep-View — toggle story

Open Questions:

## Feature: In-Game session summary

User Story:
As a GM, I need a text editor field so I can summarize what
important stuff happened that might be relevant for future sessions.

Acceptance Criteria:

- [ ] Editable text editor field positioned at the top of
      In-Game-View, between session name and the read-only
      session notes, with a fixed height

Note: Phase 1 — user navigates to previous session to read its
summary. Phase 2 (different epic) — dedicated timeline screen
displaying summaries across sessions.

Scope Boundaries:
What this story includes: summary text editor placement and
fixed height in In-Game-View
What this story does not include: surfacing previous session
summaries in current session prep — Phase 2, different epic

Open Questions:

## Feature: Session date picker and sort

User Story:
As a GM, I want to have a date input for the session date so I
can sort the sessions list by the date the sessions happened.

Acceptance Criteria:

- [ ] Date picker available in Prep-View session header
- [ ] Session date displayed read-only in In-Game-View header
- [ ] Sessions list sortable by session date
- [ ] Date format consistent with format used throughout the app

Scope Boundaries:
What this story includes: date picker on session screen,
read-only date in in-game header, sort by date in sessions list
What this story does not include: other sort options listed in
the features overview (session name, created at, updated at) —
these have no corresponding stories; architect should flag
whether they need stories before planning

Open Questions:

## Feature: Checkbox lists in Lexical text editor

User Story:
As a GM, I want to be able to add check box lists in the text
editor so I can mark down my progress during sessions.

Acceptance Criteria:

- [ ] Text editor supports inserting checkbox list items
- [ ] Checkbox list items remain interactive (checkable/uncheckable)
      when the text editor is in read-only mode

Scope Boundaries:
What this story includes: checkbox list capability in Lexical,
read-only interactivity edge case; applies to all text editors
in the screen (prep step editors and summary editor)
What this story does not include: step completion checkmarks in
section headers — separate concept

Open Questions:

- Does the installed version of Lexical support checkbox list
  nodes natively, or does this require a custom node
  implementation? The read-only interactivity edge case may
  require custom handling regardless — confirm before planning.
