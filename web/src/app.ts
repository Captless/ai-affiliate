import { Header } from "./components/Header";
import { ReferenceSection } from "./components/references/ReferenceSection";
import { GenerationPanel } from "./components/generation/GenerationPanel";
import { PromptPanel } from "./components/prompt/PromptPanel";
import { Gallery } from "./components/gallery/Gallery";
import { ImageViewer } from "./components/gallery/ImageViewer";
import { ApiKeyManager } from "./components/api-keys/ApiKeyManager";
import { generationStore } from "./state/generationState";
import { loadReferences } from "./services/referenceService";
import { loadKeys, loadSettings } from "./services/apiKeyService";
import { listGenerations } from "./services/generationService";
import { buildPrompt } from "./services/promptService";
import type { GenerationStatus } from "./types/generation";

const ACTIVE_STATUSES: GenerationStatus[] = ["queued", "processing", "downloading"];

const appRoot = document.getElementById("app") as HTMLElement;
const modalRoot = document.getElementById("modals") as HTMLElement;

function hasActiveJobs(): boolean {
  return generationStore
    .get()
    .jobs.some((job) => ACTIVE_STATUSES.includes(job.status));
}

function startPolling(): void {
  if (generationStore.get().isPolling) return;
  generationStore.update((s) => ({ ...s, isPolling: true }));
  void pollLoop();
}

async function pollLoop(): Promise<void> {
  try {
    await listGenerations();
  } catch {
    generationStore.update((s) => ({ ...s, isPolling: false }));
    return;
  }
  if (hasActiveJobs()) {
    window.setTimeout(() => void pollLoop(), 2500);
  } else {
    generationStore.update((s) => ({ ...s, isPolling: false }));
  }
}

async function composeInitialPrompt(): Promise<void> {
  const gen = generationStore.get();
  if (gen.generatedPrompt) return;
  const refs = await loadReferences();
  const prompt = buildPrompt({
    references: refs,
    userPrompt: gen.userPrompt,
  });
  generationStore.update((s) => ({ ...s, generatedPrompt: prompt }));
}

async function boot(): Promise<void> {
  const headerWrap = document.createElement("div");
  headerWrap.className =
    "sticky top-0 z-40 w-full bg-ink/90 backdrop-blur-sm border-b border-line";

  const main = document.createElement("main");
  main.className = "mx-auto w-full max-w-[1500px] px-6 md:px-10 pb-28";

  const sections = {
    header: document.createElement("div"),
    card: document.createElement("div"),
    gallery: document.createElement("div"),
  };
  sections.header.className = "mx-auto w-full max-w-[1500px] px-6 md:px-10";
  sections.card.className = "mt-12 border border-line bg-[#131211] px-6 py-6";
  sections.gallery.className = "mt-12";

  const blocks = {
    references: document.createElement("div"),
    output: document.createElement("div"),
    prompt: document.createElement("div"),
  };
  blocks.references.className = "pb-6 border-b border-line";
  blocks.output.className = "py-6 border-b border-line";
  blocks.prompt.className = "flex flex-col flex-1 min-h-0";

  const leftCol = document.createElement("div");
  leftCol.className = "flex flex-col";
  leftCol.append(blocks.references, blocks.output);

  const rightCol = document.createElement("div");
  rightCol.className = "flex flex-col h-full";
  rightCol.append(blocks.prompt);

  const genRow = document.createElement("div");
  genRow.className = "grid gap-8 lg:grid-cols-[420px_minmax(0,1.1fr)] lg:gap-8 items-stretch";
  genRow.append(leftCol, rightCol);

  sections.card.append(genRow);

  main.append(sections.card, sections.gallery);
  headerWrap.appendChild(sections.header);
  appRoot.append(headerWrap, main);

  new Header(sections.header);
  new ReferenceSection(blocks.references);
  new GenerationPanel(blocks.output);
  new PromptPanel(blocks.prompt);
  new Gallery(sections.gallery);
  const viewer = new ImageViewer(modalRoot);
  new ApiKeyManager(modalRoot);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") viewer.handleEscape();
  });

  generationStore.subscribe(() => {
    if (hasActiveJobs()) startPolling();
  });

  try {
    await Promise.all([loadKeys(), loadSettings(), composeInitialPrompt()]);
    const jobs = await listGenerations();
    if (jobs.some((job) => ACTIVE_STATUSES.includes(job.status))) startPolling();
  } catch {
    const banner = document.createElement("div");
    banner.className =
      "mt-8 border border-bad/40 bg-[#2a1610] px-4 py-3 text-xs text-bad";
    banner.textContent =
      "Could not reach the local studio server. Make sure `py server.py` is running.";
    appRoot.prepend(banner);
  }
}

void boot();
