# AI Affiliate — UI Design Polish Specification

## Design Objective

Polish the existing AI Affiliate interface without redesigning it.

The existing visual identity must remain intact:

- existing theme
- existing color palette
- existing font family
- existing layout structure
- existing component language
- existing workflow

The goal is to make the application feel like a **finished, professionally designed tool** rather than an early implementation.

Do not redesign the application.

Do not introduce a new design system.

Do not replace working components unnecessarily.

The implementation must first inspect the current UI and then improve it systematically.

---

# 1. Mandatory UI Audit Before Changes

Before modifying the frontend, inspect the actual rendered UI and the existing frontend implementation.

Review:

- global layout
- header
- navigation
- page/container widths
- cards
- panels
- sections
- form controls
- labels
- buttons
- inputs
- dropdowns
- upload areas
- image previews
- generated-output areas
- spacing
- typography
- borders
- shadows
- radii
- hover states
- active states
- disabled states
- loading states
- empty states
- responsive behavior

Do not make isolated cosmetic changes without considering the entire page.

The goal is **visual consistency across the whole application**.

---

# 2. Preserve the Existing Design Language

Inspect the current implementation and preserve:

- font family
- primary colors
- background colors
- existing accent color
- existing border treatment
- existing radius style
- existing general layout

Do NOT replace the current theme with:

- generic dark SaaS
- purple AI gradients
- glassmorphism
- excessive rounded cards
- excessive pills
- completely new typography
- a new component library

The result should still immediately look like the same application.

Think:

> existing design → refined version

not:

> existing design → completely different product

---

# 3. Global Layout Consistency

Audit the main page geometry.

Fix:

- uneven content widths
- inconsistent left/right margins
- inconsistent section widths
- misaligned cards
- awkward vertical spacing
- elements that do not share the same alignment grid
- inconsistent container padding
- sections that appear randomly positioned

Establish a consistent visual grid using the existing layout system.

Related sections should visually line up.

For example:

```text
┌──────────────────────────────────────────────┐
│ Header                                       │
├──────────────────────────────────────────────┤
│                                              │
│ Section                                      │
│ ┌──────────────────────────────────────────┐ │
│ │ Content                                  │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Section                                      │
│ ┌──────────────────────────────────────────┐ │
│ │ Content                                  │ │
│ └──────────────────────────────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘