# AI Affiliate Studio — Implementation Prompt

You are a senior full-stack developer implementing a local-first image generation utility called **AI Affiliate Studio**.

The goal is to build a clean, modular, extensible local web application for generating social-media-ready AI fashion images through the **WaveSpeed AI API using Nano Banana 2 only**.

This is a personal/local production tool, not a SaaS application. Keep the infrastructure lightweight, but **do not sacrifice code organization or modularity**.

---

## 1. Core Requirements

Build a local web application with:

1. A **Reference Images section** at the top of the page.
2. Two persistent image references:

   * Model Reference
   * Outfit Reference
3. An **Image Generation card** below the references.
4. A separate **editable Prompt Preview** panel beside the generation card.
5. WaveSpeed AI integration using **Nano Banana 2 only**.
6. Multiple WaveSpeed API key management.
7. API key balance and connection/status display.
8. Local generation history.
9. Local output image storage.
10. Output gallery in a responsive grid.
11. Click an output to open a fullscreen image viewer.
12. Image viewer must support:

    * Zoom
    * Pan
    * Click/hold + drag to move around the zoomed image
    * Reset zoom
    * Close viewer
13. Prompt generation should incorporate:

    * Model reference
    * Outfit reference
    * Pose/style instructions
    * User-editable prompt
14. The model should wear the outfit from the outfit reference while preserving the model reference's identity/appearance.
15. Pose generation should support authentic Instagram fashion/influencer-style outfit-flexing poses.
16. Everything except the actual WaveSpeed API request should remain local.

---

# 2. Important Architectural Rules

## DO NOT build this as a monolithic application.

Do NOT create:

* A 2,000-line `app.ts`
* A 2,000-line `server.py`
* One giant frontend component
* One giant backend service
* One generic utility containing unrelated functionality

Keep functionality separated by feature.

The project is expected to grow with additional AI/content-generation features in the future, so maintain clear boundaries from the beginning.

---

# 3. Recommended Stack

Use:

### Frontend

* TypeScript
* HTML
* CSS
* Tailwind CSS
* No React
* No Vue
* No Angular
* No Next.js

Use vanilla TypeScript with a modular component architecture.

### Backend

* Python 3
* Python standard-library `http.server`
* `sqlite3`
* Standard-library HTTP functionality where practical
* WaveSpeed REST API

Do NOT introduce FastAPI, Flask, Django, PostgreSQL, Redis, Docker, or another server framework unless there is a demonstrated technical requirement.

This is intentionally a lightweight local application.

---

# 4. Runtime / Developer Experience

The desired workflow is:

```bash
npm install
py server.py
```

Normal usage should only require:

```bash
py server.py
```

The Python server should:

1. Initialize required directories.
2. Initialize the SQLite database if it doesn't exist.
3. Verify the frontend build exists.
4. Start the local HTTP server.
5. Serve both the frontend and backend API.
6. Print the local URL.
7. Optionally open the browser automatically.
8. Shut down cleanly with Ctrl+C.

Do not require the user to run multiple servers or open multiple terminals.

The frontend should ultimately be served from the same Python server.

---

# 5. Project Structure

Use a structure similar to:

```text
ai-affiliate-studio/
│
├── server.py
├── package.json
├── tsconfig.json
├── requirements.txt
├── README.md
├── .gitignore
│
├── data/
│   └── app.db
│
├── storage/
│   ├── references/
│   │   ├── model/
│   │   └── outfit/
│   │
│   └── outputs/
│       └── generations/
│
├── web/
│   ├── index.html
│   │
│   ├── src/
│   │   ├── app.ts
│   │
│   │   ├── components/
│   │   │   ├── references/
│   │   │   │   ├── ReferenceSection.ts
│   │   │   │   ├── ModelReference.ts
│   │   │   │   └── OutfitReference.ts
│   │   │   │
│   │   │   ├── generation/
│   │   │   │   ├── GenerationCard.ts
│   │   │   │   ├── GenerationSettings.ts
│   │   │   │   └── PoseSelector.ts
│   │   │   │
│   │   │   ├── prompt/
│   │   │   │   ├── PromptPreview.ts
│   │   │   │   └── PromptBuilder.ts
│   │   │   │
│   │   │   ├── gallery/
│   │   │   │   ├── Gallery.ts
│   │   │   │   ├── GalleryItem.ts
│   │   │   │   └── ImageViewer.ts
│   │   │   │
│   │   │   └── api-keys/
│   │   │       ├── ApiKeyManager.ts
│   │   │       ├── ApiKeyCard.ts
│   │   │       └── AddApiKeyModal.ts
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── generationService.ts
│   │   │   ├── apiKeyService.ts
│   │   │   └── referenceService.ts
│   │   │
│   │   ├── state/
│   │   │   ├── appState.ts
│   │   │   ├── generationState.ts
│   │   │   └── referenceState.ts
│   │   │
│   │   ├── types/
│   │   │   ├── generation.ts
│   │   │   ├── references.ts
│   │   │   ├── apiKeys.ts
│   │   │   └── settings.ts
│   │   │
│   │   └── utils/
│   │       ├── image.ts
│   │       ├── formatting.ts
│   │       └── validation.ts
│   │
│   └── dist/
│
└── backend/
    ├── api/
    │   ├── routes.py
    │   ├── generation_routes.py
    │   ├── reference_routes.py
    │   ├── api_key_routes.py
    │   └── settings_routes.py
    │
    ├── services/
    │   ├── wavespeed_service.py
    │   ├── generation_service.py
    │   ├── api_key_service.py
    │   ├── storage_service.py
    │   └── balance_service.py
    │
    ├── models/
    │   ├── generation.py
    │   ├── api_key.py
    │   └── settings.py
    │
    ├── database/
    │   ├── database.py
    │   └── migrations.py
    │
    └── utils/
        ├── validation.py
        └── files.py
```

You may adjust the exact structure if necessary, but preserve the same architectural separation.

Do not arbitrarily collapse feature modules.

---

# 6. UI Layout

The main page should have this hierarchy:

```text
AI AFFILIATE STUDIO

┌─────────────────────────────────────────────┐
│ Header                                      │
│ App name                    API Keys / ⚙    │
└─────────────────────────────────────────────┘

REFERENCE IMAGES

┌──────────────────────┐ ┌──────────────────────┐
│ MODEL REFERENCE      │ │ OUTFIT REFERENCE     │
│                      │ │                      │
│      image           │ │       image          │
│                      │ │                      │
│ Replace / Remove     │ │ Replace / Remove     │
└──────────────────────┘ └──────────────────────┘


GENERATION

┌──────────────────────┐ ┌────────────────────────────┐
│ IMAGE GENERATION     │ │ PROMPT PREVIEW             │
│                      │ │                            │
│ Model                │ │ Editable prompt textarea   │
│ Nano Banana 2        │ │                            │
│                      │ │                            │
│ Settings             │ │                            │
│                      │ │                            │
│ Pose Style           │ │                            │
│                      │ │                            │
│ [ GENERATE ]         │ │                            │
└──────────────────────┘ └────────────────────────────┘


OUTPUTS

┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ image  │ │ image  │ │ image  │ │ image  │
└────────┘ └────────┘ └────────┘ └────────┘
```

The two reference images MUST NOT be inside the generation card.

They are persistent session-level inputs.

---

# 7. Reference System

There are exactly two reference types for V1.

## Model Reference

Purpose:

* Face identity
* Hair
* Body proportions
* General appearance
* Overall visual identity

Features:

* Upload
* Preview
* Replace
* Remove
* Validate image format
* Store locally

## Outfit Reference

Purpose:

* Clothing
* Accessories
* Colors
* Materials
* Styling
* Garment structure

Features:

* Upload
* Preview
* Replace
* Remove
* Validate image format
* Store locally

References should persist during the current application session.

The user should be able to generate multiple outputs without re-uploading the references.

---

# 8. Generation Card

The generation card should contain Nano Banana 2 configuration.

Do not create a multi-model selector in V1.

Display:

```text
Model
Nano Banana 2
```

The exact available settings must be based on the current WaveSpeed Nano Banana 2 API specification.

Do NOT invent unsupported API parameters.

Possible settings may include:

* Aspect ratio
* Resolution
* Number of outputs
* Seed, if supported
* Output format, if supported
* Other Nano Banana 2-supported parameters

Before implementing API parameters, verify the current WaveSpeed API request schema from the official documentation.

---

# 9. Pose System

Create a pose-style selector.

Initial presets should include concepts such as:

* Instagram Outfit Flex
* Mirror Fit Check
* Casual Standing
* Street Fashion
* Walking Fashion
* Seated Lifestyle
* Candid Influencer
* Editorial Fashion

The pose system should encourage:

* Natural body language
* Authentic influencer aesthetics
* Casual outfit-flexing behavior
* Non-stiff poses
* Natural hand positioning
* Natural weight distribution
* Fashion-oriented framing

The user should also have a randomize option.

Do not hardcode the entire final prompt into the UI.

Use a prompt builder.

---

# 10. Prompt Builder

The prompt system should combine:

```text
Model Reference
+
Outfit Reference
+
Pose Style
+
Generation Style
+
User Prompt
```

The generated prompt should instruct the image model to:

* Use the model reference for identity and appearance.
* Preserve recognizable facial identity.
* Preserve hairstyle and body proportions.
* Use the outfit reference as the clothing source.
* Transfer the outfit accurately.
* Preserve important clothing details.
* Generate a natural Instagram-style fashion pose.
* Avoid making the result look artificially posed unless the selected pose intentionally calls for it.

The final generated prompt must be displayed in an editable textarea.

The user must be able to modify the generated prompt before clicking Generate.

---

# 11. API Key Management

Support multiple WaveSpeed API keys.

The UI should display:

```text
API KEYS

Primary
● Active
Balance: $XX.XX

Secondary
● Active
Balance: $XX.XX

Backup
○ Error
Balance: unavailable
```

Features:

* Add key
* Remove key
* Enable/disable key
* Rename key
* Test key
* Refresh balance
* Show status
* Show last error
* Show last successful request
* Manual key selection
* Automatic key selection

Never expose the full API key to the frontend after storage.

Display only a masked representation.

Example:

```text
ws_••••••••••••••••••42
```

---

# 12. API Key Selection

Implement a simple automatic selection system.

V1 strategies:

```text
Automatic
Manual
```

Automatic mode should skip:

* Disabled keys
* Invalid keys
* Keys that failed authentication
* Keys that are unavailable

Keep the selection logic inside `api_key_service.py`.

Do not put API-key-selection logic inside UI components.

---

# 13. Generation Architecture

Generation should be treated as a job.

Do NOT block the browser waiting for a potentially long generation request.

Conceptually:

```text
POST /api/generate
        ↓
job_id
        ↓
processing
        ↓
WaveSpeed
        ↓
poll / wait
        ↓
download result
        ↓
save locally
        ↓
completed
```

Frontend should display states:

```text
Queued
Generating
Downloading
Completed
Failed
```

If WaveSpeed provides a webhook or other preferred asynchronous mechanism, evaluate it, but keep the local implementation simple.

---

# 14. Backend API

Implement clean endpoints such as:

```text
GET    /api/health

GET    /api/references
POST   /api/references/model
POST   /api/references/outfit
DELETE /api/references/model
DELETE /api/references/outfit

GET    /api/keys
POST   /api/keys
DELETE /api/keys/{id}
POST   /api/keys/{id}/test
GET    /api/keys/{id}/balance

POST   /api/generate
GET    /api/generations
GET    /api/generations/{id}
DELETE /api/generations/{id}

GET    /api/settings
PUT    /api/settings
```

Keep route handlers thin.

Business logic belongs in services.

---

# 15. Local Storage

All application data should remain local.

Use:

```text
data/app.db
```

for:

* API key metadata
* API key storage
* generation metadata
* settings
* generation status
* timestamps
* prompt history

Use:

```text
storage/references/
```

for current reference files.

Use:

```text
storage/outputs/generations/
```

for generated images.

A generation should have a unique directory:

```text
storage/outputs/generations/{generation_id}/
```

Store relevant metadata alongside it.

---

# 16. Gallery

Outputs should appear underneath the generation interface.

Requirements:

* Responsive grid
* Latest images first
* Thumbnail
* Generation timestamp
* Generation status
* Click to preview
* Delete
* Download

Keep gallery logic isolated from generation logic.

---

# 17. Image Viewer

Clicking an image should open a fullscreen/modal viewer.

Required behavior:

* Fit image to viewport initially.
* Mouse wheel zoom.
* Click/hold + drag to pan.
* Zoom should be centered around the cursor where practical.
* Prevent accidental browser image dragging.
* Double-click or reset control returns to default zoom.
* Escape closes viewer.
* Close button available.

Design the viewer so touch/pinch support can be added later without rewriting the gallery.

---

# 18. Error Handling

Never silently fail.

Handle:

* Invalid API key
* WaveSpeed authentication failure
* Insufficient balance
* Rate limits
* API timeout
* Invalid request
* Invalid reference image
* Generation failure
* Failed output download
* Missing local file
* Corrupt image
* Network failure

Show user-friendly errors in the UI.

Keep technical error details available for debugging.

---

# 19. Security

Even though this is local:

* Do not expose API keys to frontend JavaScript.
* Do not return raw API keys through API responses.
* Validate uploaded files.
* Restrict file access to known storage directories.
* Prevent path traversal.
* Never allow arbitrary filesystem paths from the browser.
* Do not commit API keys to Git.
* Add sensitive local files to `.gitignore`.

---

# 20. Styling

The UI should feel like a polished internal creative tool rather than a generic admin dashboard.

Preferred aesthetic:

* Dark interface
* Clean spacing
* Modern cards
* Subtle borders
* Minimal visual noise
* Strong image previews
* Clear primary Generate button
* Responsive layout
* Good empty states
* Good loading states

The gallery should visually prioritize the generated images.

Do not over-design the UI with unnecessary animations.

---

# 21. TypeScript Rules

Use strict TypeScript.

Avoid:

```ts
any
```

unless genuinely unavoidable.

Define interfaces/types for:

* Generation
* GenerationSettings
* GenerationJob
* ReferenceImage
* ApiKey
* ApiKeyStatus
* AppSettings
* PromptConfiguration

Keep shared types in:

```text
web/src/types/
```

Do not duplicate the same interface across components.

---

# 22. Python Rules

Keep `server.py` thin.

Do not put WaveSpeed implementation directly into `server.py`.

Do not put database logic directly into route handlers.

Use:

```text
routes
    ↓
services
    ↓
database / external APIs / filesystem
```

Keep WaveSpeed-specific logic isolated inside:

```text
backend/services/wavespeed_service.py
```

This is important because the application may support additional AI providers in the future.

---

# 23. WaveSpeed Integration

Use the official WaveSpeed API documentation as the source of truth.

The application should target:

**Nano Banana 2 only.**

Before implementation:

1. Verify the current Nano Banana 2 endpoint.
2. Verify authentication format.
3. Verify request payload.
4. Verify reference image requirements.
5. Verify supported generation settings.
6. Verify response format.
7. Verify job-status/polling behavior.
8. Verify balance endpoint.
9. Verify relevant error responses.

Do not guess API fields.

Keep all WaveSpeed-specific behavior isolated from the rest of the application.

---

# 24. Build Philosophy

Prioritize:

1. Correctness
2. Maintainability
3. Clear architecture
4. Simple local deployment
5. Good UX
6. Extensibility

Do not prematurely implement:

* User authentication
* Cloud storage
* PostgreSQL
* Redis
* Docker
* Multi-provider abstraction
* SaaS billing
* Cloud deployment
* Complex state-management frameworks
* Unnecessary frontend frameworks

This is a local production tool.

---

# 25. Future Extensibility

Design the application so future features can be added without rewriting existing features.

Potential future modules include:

```text
Caption Generator
Hashtag Generator
TikTok Content Planner
Batch Generation
Prompt Presets
Pose Presets
Style Presets
Campaign Manager
Favorite Images
Image Tagging
Generation Comparison
Regenerate
Variation Generator
Video Generation
Content Export
```

Do not implement these now.

However, avoid architectural decisions that make them difficult to add later.

For example:

```text
components/
├── generation/
├── gallery/
├── references/
├── prompt/
├── api-keys/
```

makes it easy to eventually add:

```text
components/
├── captions/
├── campaigns/
├── batch-generation/
```

without disturbing the existing system.

---

# 26. Implementation Order

Implement incrementally in this order:

### Phase 1 — Project Foundation

* Create directory structure.
* Create Python HTTP server.
* Create frontend shell.
* Configure TypeScript.
* Configure Tailwind.
* Create SQLite initialization.
* Create local storage directories.
* Make `py server.py` serve the application.

### Phase 2 — References

* Model reference upload.
* Outfit reference upload.
* Local storage.
* Preview.
* Replace.
* Delete.
* Reference state.

### Phase 3 — API Key Manager

* Add key.
* Store key.
* Mask key in UI.
* Enable/disable.
* Test connection.
* Balance.
* Status.

### Phase 4 — Generation

* Nano Banana 2 API integration.
* Generation settings.
* Prompt builder.
* Pose presets.
* Generation job lifecycle.
* Local output storage.

### Phase 5 — Gallery

* Generation history.
* Grid.
* Image thumbnails.
* Delete.
* Download.
* Fullscreen viewer.
* Zoom.
* Pan.

### Phase 6 — Polish

* Loading states.
* Error states.
* Empty states.
* Responsive behavior.
* Keyboard interactions.
* Better API-key management.
* Better prompt editing.

---

# 27. Development Rules

Before changing existing code:

1. Understand the existing architecture.
2. Find the appropriate feature module.
3. Modify the smallest appropriate surface.
4. Do not move unrelated functionality.
5. Do not duplicate existing services.
6. Do not create a second implementation of an existing feature.
7. Keep components focused.
8. Keep API access inside services.
9. Keep business logic out of UI components.
10. Keep route handlers thin.

If a feature doesn't fit cleanly into the existing architecture, stop and reconsider the architecture before implementing it.

---

# 28. Validation

After implementation, verify:

### Startup

```bash
npm install
py server.py
```

Then open:

```text
http://localhost:8000
```

### Functional checks

* Application loads.
* Model reference uploads.
* Outfit reference uploads.
* References persist.
* API key can be added.
* API key is masked.
* API key status works.
* Balance works.
* Nano Banana 2 generation works.
* Prompt is editable.
* Pose preset changes prompt.
* Generation status updates.
* Generated image is saved locally.
* Gallery displays image.
* Clicking image opens viewer.
* Zoom works.
* Drag-to-pan works.
* Reset works.
* Delete works.
* Browser refresh does not corrupt local state.
* Restarting the Python server preserves SQLite data and generated files.

---

# 29. Important Instruction

Do not simplify the architecture just because this is a small project.

The desired architecture is:

**simple infrastructure + modular code.**

That means:

```text
No heavy frameworks
        +
No monolithic files
        +
Clear feature boundaries
        +
Local-first storage
        +
Easy startup
```

Do not replace the component architecture with a single `app.ts`.

Do not replace the backend architecture with a giant `server.py`.

Do not introduce unnecessary enterprise infrastructure.

Build the smallest **properly structured** version of the application.

---

# 30. Start Implementation

First inspect the repository and existing project files.

Before writing implementation code:

1. Determine whether an existing project structure exists.
2. Read any `AGENTS.md`, project instructions, README, or relevant configuration.
3. Identify existing conventions that should be preserved.
4. Verify the current WaveSpeed Nano Banana 2 API documentation.
5. Create an implementation plan.
6. Then implement Phase 1.

Do not blindly overwrite existing files.

After each major phase, validate the application before moving to the next phase.

The final result should be a clean, maintainable, local-first **AI Affiliate Studio** that can grow into a larger content-production tool without requiring a rewrite.


# UI/UX DESIGN DIRECTIVE — IMPORTANT

The interface must have a **distinct visual identity**.

Do NOT produce a generic AI SaaS dashboard.

Avoid the common pattern of:

* Huge rounded cards everywhere
* Excessive glassmorphism
* Purple/blue AI gradients
* Generic Inter-only typography
* Excessive shadows
* Floating dashboard widgets
* Sidebar + cards + statistics layout
* Excessive pill-shaped buttons
* Generic "AI Studio" visual language
* Unnecessary icons everywhere
* Excessive borders around every element

The application should feel like a **purpose-built creative production tool**, not an admin dashboard.

---

## 1. Overall Design Direction

Aim for:

**Simple + Modern + Sleek + Editorial + Creative**

The interface should feel inspired by:

* Modern fashion/editorial websites
* Professional photography tools
* Minimal creative software
* High-end fashion magazines
* Modern image-generation interfaces

Think:

> "A minimalist digital fashion studio"

rather than:

> "A generic AI SaaS dashboard."

The design should be visually interesting through **layout, typography, spacing, proportions, and hierarchy**, rather than through excessive decoration.

---

# 2. Create a Strong Visual Identity

Use typography as one of the primary design elements.

Do not use a single font for the entire application.

Use a deliberate font pairing such as:

```text
Display / headings:
A distinctive editorial or fashion-oriented serif

UI / controls:
A clean modern sans-serif

Metadata / technical information:
A compact monospace font
```

For example, the design could use a combination similar to:

```text
Display:
DM Serif Display / Playfair Display / Instrument Serif

UI:
Inter / Manrope / Geist

Technical:
JetBrains Mono / IBM Plex Mono
```

Choose the actual fonts based on the visual direction you establish.

Do not randomly mix fonts.

Typography should have a clear hierarchy.

---

# 3. Avoid the "Everything Is a Card" Problem

Not every section needs a container.

Use **open composition**.

For example, instead of:

```text
┌─────────────────────────────┐
│ REFERENCE IMAGES            │
│                             │
│ ┌─────────┐  ┌─────────┐   │
│ │ MODEL   │  │ OUTFIT  │   │
│ └─────────┘  └─────────┘   │
└─────────────────────────────┘
```

consider a more editorial layout:

```text
REFERENCE / 01

MODEL                    OUTFIT

[       image       ]    [       image       ]

identity reference       garment reference
```

Use whitespace and typography to create separation.

Borders should be used intentionally, not around every component.

---

# 4. Reference Section

The reference section should be visually prominent without being oversized.

Consider an asymmetrical composition.

For example:

```text
REFERENCE IMAGES

01  MODEL                          02  OUTFIT

┌─────────────────┐               ┌──────────────────────┐
│                 │               │                      │
│                 │               │                      │
│                 │               │                      │
│                 │               │                      │
└─────────────────┘               │                      │
                                  │                      │
                                  └──────────────────────┘

identity                         garment
```

The two reference areas do not necessarily need to have identical dimensions.

An asymmetric editorial composition is encouraged.

---

# 5. Main Generation Area

The generation area should feel like the **central workspace**.

Do not make it look like a standard form.

Instead, use visual hierarchy.

Possible structure:

```text
GENERATE

Nano Banana 2                         01

9:16                                  Settings
Instagram Outfit Flex                 ...

────────────────────────────────────────────

PROMPT

Create an authentic...

────────────────────────────────────────────

                         [ GENERATE → ]
```

The prompt should feel like the main creative input rather than another boxed form field.

---

# 6. Prompt Editor

The prompt editor should be one of the most visually distinctive parts of the application.

Avoid a generic:

```text
┌─────────────────────────┐
│ Enter prompt...         │
│                         │
└─────────────────────────┘
```

Instead, make it feel like an **editorial creative brief**.

For example:

```text
PROMPT / CREATIVE DIRECTION

"An authentic fashion...
Instagram-style outfit...
natural body language..."

                              248 words
```

Use large typography, generous spacing, and subtle metadata.

The prompt should still be clearly editable.

---

# 7. Generation Controls

Controls should be compact and elegant.

Avoid large generic dropdowns everywhere.

Use a combination of:

* Compact selectors
* Segmented controls
* Minimal dropdowns
* Small inline settings
* Toggle controls
* Numeric inputs where appropriate

Example:

```text
FORMAT       9:16     4:5     1:1

POSE         Outfit Flex  ↓

OUTPUT       1 image     ↓

SEED         Random
```

Controls should visually recede behind the creative content.

The image and prompt are the primary focus.

---

# 8. Generate Button

The Generate button should be visually distinctive but restrained.

Do not use:

* Neon gradients
* Giant glowing buttons
* Excessive animation
* Generic purple AI styling

Consider something editorial and tactile:

```text
GENERATE IMAGE   →
```

or:

```text
GENERATE  /  01
```

Use subtle hover interaction.

The button should feel like an action in a professional creative tool.

---

# 9. Output Gallery

The output gallery should NOT look like a generic grid of equal cards.

Experiment with an editorial image layout.

For example:

```text
OUTPUTS                                      12 IMAGES


      ┌──────────────┐ ┌───────┐ ┌──────────────┐
      │              │ │       │ │              │
      │              │ │       │ │              │
      │              │ │       │ │              │
      │              │ │       │ │              │
      │              │ └───────┘ │              │
      │              │           │              │
      └──────────────┘           └──────────────┘

      ┌───────┐ ┌────────────────────┐ ┌───────┐
      │       │ │                    │ │       │
      │       │ │                    │ │       │
      └───────┘ └────────────────────┘ └───────┘
```

However, maintain usability.

The gallery can use a responsive CSS grid with varying spans/aspect ratios.

Do not sacrifice browsing efficiency purely for visual novelty.

---

# 10. Image Viewer

The fullscreen viewer should feel like a **photography/lightbox experience**.

Keep the interface minimal.

When the image opens:

```text
                                      ×

                ┌─────────────────┐
                │                 │
                │                 │
                │     IMAGE       │
                │                 │
                │                 │
                └─────────────────┘

01 / 12
```

Controls should appear subtly.

The image itself should dominate the viewport.

Avoid a giant toolbar.

---

# 11. Color System

Use a restrained palette.

Do not automatically use:

```text
purple
blue
cyan
pink
neon gradients
```

Instead, establish a simple sophisticated palette.

For example:

```text
Background
Primary text
Secondary text
Muted text
Subtle border
Accent
```

An off-black / warm-white / muted neutral palette is acceptable.

A small accent color can be used sparingly.

The accent should support the design rather than dominate it.

---

# 12. Spacing

Use whitespace aggressively.

The interface should breathe.

Avoid:

```text
[Card][Card][Card][Card]
```

with everything tightly packed.

Instead use:

```text
SECTION TITLE


CONTENT


SECTION TITLE


CONTENT
```

Use larger vertical rhythm between major sections.

---

# 13. Responsive Design

The interface must work well at:

* 1920px desktop
* 1440px desktop
* 1280px laptop
* 1024px tablet
* Mobile widths

Desktop should take advantage of available horizontal space.

Mobile should naturally collapse:

```text
References
      ↓
Generation
      ↓
Prompt
      ↓
Outputs
```

Do not simply shrink the desktop layout.

Design responsive behavior intentionally.

---

# 14. Micro-interactions

Use subtle interaction design.

Examples:

### Reference upload

Image gently transitions into preview state.

### Generate

Button transitions:

```text
Generate
   ↓
Generating...
   ↓
Completed
```

### Gallery

Images subtly respond to hover.

### Image viewer

Smooth zoom/pan.

### API key status

Clear but restrained status indicator.

Keep animations short and purposeful.

Avoid excessive motion.

---

# 15. Empty States

Empty states should be designed rather than displaying:

```text
No images found.
```

For example:

```text
OUTPUTS

Your generated images
will appear here.

Generate your first look →
```

The empty state should match the visual language of the rest of the application.

---

# 16. API Key UI

The API key manager should not look like a standard settings table.

Consider a compact editorial list:

```text
API ACCESS

01   PRIMARY
     ● Connected
     $12.48

02   BACKUP
     ● Connected
     $8.21

03   SPARE
     ○ Disabled
```

Use typography and spacing instead of heavy cards.

---

# 17. Visual Hierarchy

The visual hierarchy should generally be:

```text
1. Generated imagery
2. Reference imagery
3. Prompt / creative direction
4. Generate action
5. Generation settings
6. Metadata / technical information
```

The UI should make the images feel like the product.

Controls are secondary.

---

# 18. Design Exploration

Before implementing the final UI, explore at least **3 different layout concepts internally**.

For example:

### Concept A — Editorial Studio

Large typography, asymmetric image layout, generous whitespace.

### Concept B — Minimal Creative Canvas

Extremely minimal UI with controls arranged around a central workspace.

### Concept C — Fashion Contact Sheet

Strong typography, photography-inspired image grids, compact metadata.

Select the strongest concept and implement it consistently.

Do not mix random elements from all three.

---

# 19. Important Constraint

"Unique" does NOT mean:

* Weird
* Overly experimental
* Hard to use
* Excessively animated
* Full of decorative elements
* Unnecessarily complex

The design should be:

**distinctive but practical.**

A user should immediately understand:

1. Where to upload the model.
2. Where to upload the outfit.
3. What will be generated.
4. What prompt will be used.
5. How to generate.
6. Where the results are.

The uniqueness should come from **composition, typography, spacing, and interaction**, not confusion.

---

# 20. Design Quality Standard

Before considering the UI complete, evaluate it against:

* Does it look like a custom-designed tool?
* Does it avoid the generic SaaS dashboard appearance?
* Is the typography intentional?
* Are fonts used purposefully?
* Does the layout have a recognizable visual identity?
* Is there enough whitespace?
* Are images visually prioritized?
* Are controls unobtrusive?
* Does the interface remain practical?
* Does it feel polished at 1440px?
* Does it remain usable at 1280px?
* Does mobile collapse naturally?
* Are animations subtle?
* Are empty/loading/error states designed consistently?

If the result looks like something generated from a generic Tailwind dashboard template, **redesign it before considering the UI finished**.
