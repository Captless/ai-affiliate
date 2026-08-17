# AI Affiliate — Targeted Improvement Plan

## Objective

Improve the existing AI Affiliate application without changing its existing architecture, workflow, image-generation functionality, theme, or visual identity.

This is a targeted enhancement, NOT a rewrite.

Before making any changes, scan and understand the complete existing repository and codebase.

---

## Mandatory Codebase-First Workflow

Before editing anything:

1. Scan the complete repository structure.
2. Read `AGENTS.md`, `codemap.md`, and the existing `plan.md` if present.
3. Inspect the frontend implementation.
4. Inspect the current image-generation UI.
5. Inspect the current model-reference implementation.
6. Inspect the outfit-reference implementation.
7. Inspect the WaveSpeed integration.
8. Inspect the current prompt construction.
9. Inspect existing file/image storage.
10. Inspect the current Tailwind/theme/font configuration.
11. Identify the exact files and components responsible for these features.

Do NOT assume file paths or architecture.

Reuse the existing implementation wherever possible.

Do NOT create duplicate components, duplicate API routes, duplicate services, or a second image-generation workflow.

---

# 1. Preserve Existing Functionality

The current image-generation workflow must remain functionally unchanged.

Do NOT:

- replace the current image-generation implementation
- redesign the image-generation architecture
- change the existing WaveSpeed integration unnecessarily
- change how the existing outfit reference works
- change the existing model-reference mechanism
- remove existing controls
- change existing API contracts unnecessarily
- introduce a new framework
- rewrite working components

The goal is to **add functionality around the existing workflow**.

---

# 2. Add Model Image Upload Library

Add a small model-image asset area to the existing UI.

The user should be able to upload multiple model reference images.

Example:

MODEL IMAGES

[ image ] [ image ] [ image ] [+ Add]

Each uploaded image should remain available during the session and/or use the repository's existing local persistence approach if one already exists.

Do not create a complex database for this feature.

Use the repository's existing file/storage approach where possible.

---

# 3. Drag Model Image Into Existing Model Reference

This is the primary new interaction.

The existing Model Reference card/input must remain.

Add support for dragging an uploaded model image from the new Model Images area into the existing Model Reference input.

Flow:

```text
Model Images
    │
    │ drag
    ▼
Existing Model Reference
    │
    ▼
Existing Image Generation