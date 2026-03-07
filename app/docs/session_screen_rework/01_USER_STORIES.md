# Session Screen User Stories

Epic: As a GM, I need to plan my sessions guided by the "Lazy DM" steps so I can focus on what's important and what's needed to run the upcoming session

## Features outline/overview

### Sessions screen

- Example: NpcsScreen
- "add-new" button that inits new session and triggers navigation to the newly created session
- list of created sessions that navigates to the Session Screen when clicked
- sortable by session name, session date, created at, updated at

### Session screen

- 2 toggleable views: Prep-View and In-Game-View
  - Prep-View:
    - nav side bar that navigates between sections in the same screen and not between screens
      - lives within the session screen (not replacing global screens nav side bar)
      - has button to add new sections
      - has drag & drop to rearrange sections
    - header section:
      - session date picker
      - show/hide all tooltips
      - toggle to In-Game-View
    - step sections:
      - header section with step actions/utilities
      - tooltip section
      - text editor
  - In-Game-View:
    - header section:
      - session date (read-only)
      - toggle to Session-Prep-View
    - text editor for session summary
    - Read-only view of the session notes with check-box edge case
- other:
  - checkbox capability for lexical text editor
  - date picker for session date

## Prep-View vs In-Game-View

As a GM, I want to be able to toggle between prep-view and in-game-view so I can have a clear boundary between "focussing on prep" vs "focussing on the game".
Acceptance Criteria:

- lives in header section that is visible in both views

## Prep-View specifics

Acceptance Criteria for all stories in this section:

- each session starts with a pre-defined template
- all adjustment belong to each session independently

### "Lazy DM Steps"

As a GM, I need a template that has each "Lazy DM" prep step so I don't mix up my prep work.
Acceptance Criteria:

- 1 section per step (See `LAZY_DM_STEPS.md`)
- each section consists of:
  - header section that has: checkbox, step name as heading, tooltips toggle, move up/down button, delete button
  - hidable tooltips with default "hidden" with texts outlined in `LAZY_DM_STEPS.md`
  - text editor field

Design notes:

- delete button is a trash can icon
- move up/down are chevron icons
- tooltips toggle is a question mark icon that reflects toggled state
- step name/heading is actually a prefilled input field

### Tooltips Toggle

As a GM, I need helpful tooltips and reminders for each "Lazy DM" step that I can toggle into view when I need them so I can find guidance if I don't know what to do or what is important at a certain step.
Acceptance Criteria:

- should appear between section header and text editor field
- should be able to toggle in/out for each step individually
- should have global "show/hide all" functionality. Behavior: When no tooltip is visible -> show all. Other -> hide all

### Steps management

As a GM, I need to track the steps I already did with checkmarks so I can see my progress and pick up where I left if I had to pause my prepping.
Acceptance Criteria:

- survive app restart/screen changes

As a GM, I want to be able to change the arrangement of the "Lazy DM" steps so I can decide where which information shows up depending of where I deem it important.
Acceptance Criteria:

- move up/down functionality at each section head

As a GM, I want to be able to remove steps so I can keep the final session prep document as tight as possible.
Acceptance Criteria:

- delete button opens a pop up with a one-click confirm warning that the step and all its contents will be deleted permanently before executing

As a GM, I want to be able to add additional steps/text editor sections so I introduce my own steps when I need them.
Acceptance Criteria:

- button is part of Steps navigation
- is the last button within the step navigation
- scrolls to new added section at the very bottom and sets focus to section name input field

Design notes:

- "+"-button kind of like the "add new" button in list screens (e. g. NPCsScreen)

### Steps navigation

As a GM, I want a navigation similar to the screens navigation so I can navigate between sections fast.
Acceptance Criteria:

- nav side bar similar to screens nav that lives within the session screen
- has drag-and-drop functionality to change arrangement
- reflects changes made in sections (checked state, step name changes, order when moved up/down, disappears when section is deleted) -> intentional duplication of functionality that also can be done at each section
- scrolls to clicked section and sets focus to text editor

## In-Game-View specifics

As a GM, I want my pure session notes as a whole document without text editor tools or instructions so I won't be distracted from the ongoing session.
Acceptance Criteria:

- sections are indicated by section headers
- text is read-only
- created checkmarks are still checkable.

As a GM, I need a text editor field so I can summarize what important stuff happened that might be relevant for future sessions.
Note: Phase one will require user to go into the old session to catch up on the old session. Phase 2 will be a new screen where the summaries will be displayed with a timeline -> different epic
Acceptance Criteria:

- is at the top between session name and session notes with a fixed height

## Other

As a GM, I want to have a date input for the session date so I can sort the sessions list by the date the sessions happened.
Acceptance Criteria:

- Date picker in session screen
- sort option in sessions screen
- displays format used throughout the app

As a GM, I want to be able to add check box lists in the text editor so I can mark down my progress during sessions.
Acceptance Criteria:

- can be checked even when text is read-only
