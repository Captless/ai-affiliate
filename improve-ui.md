UI DESIGN FIX — FIRST WORKSPACE CARD ONLY

Inspect the existing frontend implementation before changing anything.

The current page structure is already correct and should NOT be redesigned.

I specifically want you to fix the FIRST / MAIN WORKSPACE CARD shown in the current UI.

IMPORTANT:
Do NOT redesign the page into a dashboard.
Do NOT change the overall layout.
Do NOT move the major sections into a different architecture.

PRESERVE THIS STRUCTURE:

┌──────────────────────────────────────────────────────────────┐
│ REFERENCES                         PROMPT                    │
│                                                              │
│ MODEL                              PROMPT EDITOR             │
│                                                              │
│ OUTFIT                                                       │
│                                                              │
│ OUTPUT                                                       │
│                                                              │
│ Image Search / Web Search          [ EDIT ] [ COPY ]         │
│                                                              │
│ Nano-Banana-2                      GENERATE                  │
│ status indicators                                             │
└──────────────────────────────────────────────────────────────┘

LEFT:
- References
- Model
- Outfit
- Output
- Aspect
- Resolution
- Format
- Image Search
- Web Search
- Generation status/action

RIGHT:
- Prompt
- Prompt editor
- Edit
- Copy
- Word/character count

The existing composition is good.

The problem is the VISUAL EXECUTION of the prompt area.

==================================================
PRIMARY FIX — PROMPT EDITOR
==================================================

The current prompt preview/editor box is much too small.

Current behavior:

PROMPT
┌─────────────────────────────────────┐
│ prompt text                         │
└─────────────────────────────────────┘

Then there is a very large amount of unused empty space underneath.

This makes the right side of the workspace look unfinished and visually disconnected from the left reference/output column.

Increase the prompt editor's vertical height substantially.

The prompt editor should become a proper workspace surface rather than a small preview box.

It should occupy a meaningful portion of the right column and visually balance the Model + Outfit + Output content on the left.

Do NOT make it unnecessarily huge.

The goal is balanced composition, not maximum height.

==================================================
PROMPT / REFERENCE VISUAL CONSISTENCY
==================================================

The Model and Outfit reference boxes currently establish a strong visual language:

- thin technical borders
- restrained dashed/dotted treatment
- dark surface
- sharp/minimal geometry
- small technical labels
- subtle accent color
- minimal corner treatment

The prompt editor currently uses a visually different treatment:

- solid rounded outline
- different border character
- different visual weight
- feels like a generic textarea

Fix this.

The prompt editor should clearly belong to the SAME design system as the Model and Outfit reference boxes.

Do not blindly copy the exact border style if that harms usability.

Instead, establish a shared visual language:

- same border color family
- same border thickness
- same corner/radius treatment
- same surface/background relationship
- same label positioning
- same spacing rhythm
- same technical/editorial aesthetic

The prompt editor can have a slightly stronger border because it is an editable control, but it must still feel like it belongs to the same interface.

==================================================
PROMPT HEADER
==================================================

Keep:

PROMPT

and:

[ Edit ] [ Copy ]

Do not move these into another section.

Improve their alignment.

The prompt header should feel like the header of the editor itself.

Conceptually:

PROMPT                                      [ EDIT ] [ COPY ]
┌──────────────────────────────────────────────────────────┐
│                                                          │
│ prompt content                                           │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
                                      167 words · 1240 chars

The controls should not visually float above or beside an unrelated small box.

==================================================
PROMPT EDITOR CONTENT
==================================================

Preserve the existing prompt content and functionality.

Do not rewrite the prompt.

Improve only its presentation.

The text should have:

- comfortable padding
- readable line height
- proper text wrapping
- good vertical breathing room
- consistent technical/editorial typography
- subtle scrollbar styling if scrolling is required

Do not make the text tiny just to fit more content.

The editor should look intentional when viewed at the normal desktop viewport.

==================================================
WORD / CHARACTER COUNTER
==================================================

Keep the existing word/character counter.

It should remain visually secondary.

Place it consistently at the lower-right edge of the prompt editor.

Example:

┌──────────────────────────────────────────────────────────┐
│                                                          │
│ prompt content                                           │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
                                  167 words · 1240 chars

Do not make the counter look like a separate card.

==================================================
VERTICAL BALANCE
==================================================

This is extremely important.

The right prompt area should visually balance against the entire left-side workflow.

Current problem:

LEFT:
References
References
Output
Settings
Search
Generate
Status

RIGHT:
Small prompt box
Huge empty area

Fix the composition so the right side feels intentionally occupied.

The prompt editor should take advantage of the available vertical space.

However:

DO NOT simply stretch the textarea to 100% height without considering the existing workspace proportions.

Use the existing card dimensions and calculate an intentional height.

The bottom of the prompt workspace should visually align with the lower portion of the left workflow.

==================================================
DO NOT CHANGE
==================================================

Do NOT change:

- Overall page layout
- Main workspace position
- Left/right column concept
- References section
- Model reference functionality
- Outfit reference functionality
- Output controls
- Aspect ratio controls
- Resolution controls
- Format controls
- Image search
- Web search
- Generate functionality
- Gallery
- Existing application logic
- API behavior
- Existing state management

This is a focused UI refinement.

==================================================
DESIGN LANGUAGE
==================================================

Preserve the existing aesthetic:

- dark near-black background
- editorial
- technical
- restrained
- minimal
- monospace/technical typography
- thin borders
- subtle orange accent
- low visual noise
- no unnecessary gradients
- no glassmorphism
- no excessive rounded cards
- no generic AI SaaS redesign

The result should look like the SAME PRODUCT, just much more refined.

==================================================
REFERENCE VISUAL TARGET
==================================================

Think of the workspace as one cohesive technical instrument.

The reference boxes and prompt editor should feel like components manufactured from the same design system.

For example:

┌──────────────────────┐      ┌───────────────────────────────────┐
│ MODEL                │      │ PROMPT                 [EDIT][COPY]│
│                      │      │                                   │
│         +            │      │ prompt text                       │
│                      │      │                                   │
│ identity, face,      │      │                                   │
│ hair, body           │      │                                   │
└──────────────────────┘      │                                   │
                              │                                   │
┌──────────────────────┐      │                                   │
│ OUTFIT               │      │                                   │
│                      │      │                                   │
│         +            │      │                                   │
│                      │      │                                   │
│ garment, colour,     │      │                                   │
│ material             │      └───────────────────────────────────┘
└──────────────────────┘                         167 words · 1240 chars

OUTPUT
...

The exact dimensions must be determined from the existing implementation and viewport rather than hardcoded blindly.

==================================================
IMPLEMENTATION PROCESS
==================================================

Before editing:

1. Locate the component responsible for the first workspace card.
2. Inspect its current layout/grid/flex structure.
3. Inspect the existing CSS/Tailwind classes.
4. Inspect reusable border, typography, spacing, and button styles.
5. Reuse the existing design tokens and components.
6. Do not create duplicate styles or components unnecessarily.

Then implement the smallest focused change necessary to achieve the visual result.

After implementation:

1. Run existing lint/typecheck/build checks if available.
2. Verify the page at the normal desktop viewport.
3. Verify the prompt editor is substantially taller.
4. Verify the prompt editor no longer looks visually disconnected.
5. Verify its border treatment matches the reference components.
6. Verify Edit/Copy remain correctly positioned.
7. Verify the word/character counter remains correctly positioned.
8. Verify no left-side controls were accidentally shifted.
9. Verify no generation functionality was affected.
10. Verify responsive behavior.

CRITICAL:
Do not consider the task complete merely because the CSS compiles.

Visually inspect the result and make another refinement pass if the prompt editor still appears too small, disconnected, or stylistically inconsistent with the Model/Outfit reference boxes.

The final result should preserve the existing design and structure while making the first workspace card feel professionally composed and production-ready.