# Content section carousel and click-opened mention popups

**Purpose.** The GM steps through an entity's content sections with up/down buttons that slide the next section into view, on the entity screen and in the entity's mention popup, and opens a mention's popup in place by clicking its badge. That way the GM reads an entity's sections and mentioned entities in place during prep and play without losing the current screen.

## How it works

Happy path:

1. On an entity screen with two or more content sections, two chevron buttons (up, down) sit between the burger icon and the section name in the content panel's menu bar, styled like the step move buttons on the sessions screen. Down shows the next section in order, up the previous one; the switch is a vertical slide: going to a later section the current content moves up and out while the new one comes in from below, going to an earlier section the reverse. Picking a section from the burger menu, creating a section and deleting the shown section slide too, in the direction the section order gives. With no content section the panel's title reads "Popup Content".
2. In an entity's mention popup, two or more sections show the same buttons: the popup's menu bar reads entity name, burger and up/down buttons, then the section name in the label style. Stepping slides only the section region; the image stays. With one section the popup shows neither buttons nor section name.
3. Clicking a mention badge opens that entity's popup at the badge and does not navigate. The popup stays open while the pointer is elsewhere and closes on a click anywhere outside it or on Escape. A click inside it — its buttons, its burger menu and the section list that menu opens, its content — does not close it. Clicking the same badge again leaves it open; clicking another badge of the same entity moves the popup to that badge; clicking a badge of another entity closes the open popup and opens that one.
4. The popup's Navigate button goes to the entity screen. Pin on a click-opened popup turns it into a pinned popup. Hovering a badge opens the popup after the delay and closes it on leave; clicking a badge whose hover popup is showing keeps that popup open as a click-opened one.
5. While text is selected by dragging in a text editor, passing over a mention badge opens no popup, and releasing the mouse on a badge at the end of a drag opens none either; the selection is not interrupted.

Failure:

- At the first section up is disabled, at the last section down is; there is no wrap-around.
- Sliding to or from a section with no content in the popup shows nothing moving on that side.
- A deleted entity's badge opens its popup with the deleted-entity message.
- Popups, click-opened ones included, are cleared on route change.

Where the user waits: the popup shows only its header until the entity's sections have loaded; the slide itself takes the fast transition time.

## Data

- **Reads:** the entity's content sections in the order the section list shows them, and the entity's name; no new data.
- **Writes:** nothing. The outgoing content of a slide is a read-only snapshot, so it saves nothing. Which popups are open, and in which mode (hover, click or pinned), is in-memory state of the popups provider and is lost on route change.

## Rules

| Rule | Why | Source |
| --- | --- | --- |
| On an entity screen with no content section, the content panel's title reads "Popup Content" | The user's own wording | Simon Schötz, 2026-10-24; hand test |
| With two or more sections, up and down buttons sit between the burger and the section name in the content panel's menu bar, styled like the step move buttons on the sessions screen | — | Simon Schötz, 2026-10-24; hand test |
| Down shows the next section in order and up the previous one, as a vertical slide: later section, content moves up and out and the new one enters from below; earlier section, the reverse | — | Simon Schötz, 2026-10-24; useListNavigation.test, hand test |
| Up is disabled on the first section, down on the last; no wrap-around | Matches the step move buttons on the sessions screen the user named as the reference | Simon Schötz, 2026-10-24; useListNavigation.test |
| Picking a section from the burger menu, creating a section and deleting the shown section also slide, in the direction the section order gives; every change of the shown section slides | Every section switch then looks the same | Simon Schötz, 2026-10-24; useListNavigation.test, hand test |
| Sliding to or from a section with no content in the popup shows nothing moving for that side | — | Claude's call, 2026-10-24; no test |
| A mention popup for an entity with two or more sections shows the same buttons between its burger and its title, with the same slide and the same disabled ends | — | Simon Schötz, 2026-10-24; hand test |
| In the popup's menu bar, the section action buttons (burger, up/down) sit between the entity name and the section name; the section name carries the label styling | — | Simon Schötz, 2026-10-24; hand test |
| With one or no section, no up/down buttons are shown, on the entity screen and in the popup | The burger is not shown then either | Simon Schötz, 2026-10-24; hand test |
| With only one content section, the mention popup shows no section name in its menu bar | — | Simon Schötz, 2026-10-24; no test |
| Clicking a mention badge opens that entity's popup at the badge and does not navigate | — | Simon Schötz, 2026-10-24; MentionBadge.test |
| A click-opened popup stays open while the pointer leaves the badge and the popup, and closes on a click outside it or on Escape; pinned popups ignore Escape | Escape is the usual way to dismiss a transient popup alongside a click outside | Simon Schötz, 2026-10-24; MentionPopup.test, useDismissClickOpened.test |
| A click inside the click-opened popup — section buttons, burger menu, the section list it opens, content — does not close it | — | Simon Schötz, 2026-10-24; MentionPopup.test |
| Clicking the badge of a popup already open from a click on that same badge leaves it open; only a click elsewhere or Escape closes it | — | Simon Schötz, 2026-10-24; MentionBadge.test, useDismissClickOpened.test |
| A click-opened popup re-anchors at a newly clicked other badge of the same entity; a pinned popup is left as it is; a click on the same badge after a drag keeps the dragged position | A click opens the popup at the badge clicked | Claude's call, 2026-10-24; requestPopup.test, MentionPopup.test, hand test |
| Clicking a badge of another entity while a click-opened popup is open closes the open one and opens the clicked one's | It is a click outside the open popup, which closes it per the user's request | Claude's call, 2026-10-24; MentionBadge.test |
| The popup's Navigate button goes to the entity screen; Pin turns a click-opened popup into a pinned popup | — | Simon Schötz, 2026-10-24; MentionBadge.test, hand test |
| From a badge, the entity screen is reached only through the popup's Navigate button; no modifier-click | The popup already carries a Navigate button, so no second path is needed | proposed by Claude, accepted by Simon Schötz, 2026-10-24; no test |
| Hovering a badge opens the popup after the delay and closes it on leave; clicking a badge whose hover popup is showing keeps it open as a click-opened one | — | Simon Schötz, 2026-10-24; MentionBadge.test, requestPopup.test |
| While text is being selected, passing over a badge opens no popup, and releasing on a badge at the end of a drag opens none; the selection is not interrupted | — | Simon Schötz, 2026-10-24; MentionBadge.test, hasPointerMoved.test, isPrimaryButtonDown.test, hand test |

## Open points

None in the open-questions register.

Not yet registered; the user decides:

- A second step while a slide is still running overwrites the running transition, and for two steps the same way the first animation's end may clear the second transition early. Not reproduced in the `web` pane, whose frame rate is throttled; the slide rules above depend on it.
- The slide ends only when its animation ends; if an animation never runs (a reduced-motion override, a zero transition time), the outgoing copy would stay mounted over the content. The slide rules above depend on it.
- The slide's keyframe offsets are raw percentage values with no design token and no one-off note, surfaced by the advisory scan.
- Still hand tests in the Tauri app: a badge click inside the editor opens the popup at the badge, Navigate reaches the entity screen, and a click-opened popup stays open while the pointer is elsewhere; the Session and Encounter popups, and dragging a click-opened popup then clicking its badge again.

## Where to look

- Shared pieces: `UpDownBtns` (the button pair, also used by the sessions screen's step move buttons), `SlideTransition`, `useListNavigation` (stepping, end flags and the recorded transition), the slide-direction type.
- Entity screen: `BaseEntityContentSectionPanel`, rendering its sections through `ContentSectionBody`.
- Popup: `BaseEntityPopupContent`, `EntityReadOnlyView` (the popup's body, shared with the encounter's middle column, with `EntitySectionHeaderLeading`), `EntityPopupBody` and `EntityPopupBodyText`, `ContentSectionBody`, `MentionPopupHeader`, `MentionPopup` and its `useDismissClickOpened` hook.
- Click-open and selection suppression: `MentionBadge` with its `hasPointerMoved` and `isPrimaryButtonDown` helpers; the popups provider with `requestPopup` and the popup entry type.
- Tests: `useListNavigation.test`, `requestPopup.test`, `useDismissClickOpened.test`, `MentionPopup.test`, `MentionBadge.test`, `hasPointerMoved.test`, `isPrimaryButtonDown.test`.
