import { Header } from "./components/Header";
import { ReferenceSection } from "./components/references/ReferenceSection";
import { GenerationPanel } from "./components/generation/GenerationPanel";
import { PoseSelector } from "./components/generation/PoseSelector";
import { PromptPanel } from "./components/prompt/PromptPanel";
import { Gallery } from "./components/gallery/Gallery";
import { ImageViewer } from "./components/gallery/ImageViewer";
import { ApiKeyManager } from "./components/api-keys/ApiKeyManager";
import { generationStore } from "./state/generationState";
import { loadReferences } from "./services/referenceService";
import { loadKeys, loadSettings } from "./services/apiKeyService";
import { listGenerations } from "./services/generationService";
import { buildPrompt, getPose } from "./services/promptService";
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
    pose: getPose(gen.poseId),
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
    rail: document.createElement("aside"),
    work: document.createElement("section"),
  };
  sections.header.className = "mx-auto w-full max-w-[1500px] px-6 md:px-10";
  sections.rail.className = "pt-12 lg:sticky lg:top-[76px] lg:self-start lg:pr-2";
  sections.work.className = "pt-12";

  const blocks = {
    references: document.createElement("div"),
    output: document.createElement("div"),
    pose: document.createElement("div"),
    prompt: document.createElement("div"),
    gallery: document.createElement("div"),
  };
  blocks.references.className = "border-b border-line pb-8";
  blocks.output.className = "pt-8";
  blocks.pose.className = "mb-6";
  blocks.prompt.className = "mb-12";
  blocks.gallery.className = "";

  sections.rail.append(blocks.references, blocks.output);
  sections.work.append(blocks.pose, blocks.prompt, blocks.gallery);

  const studio = document.createElement("div");
  studio.className =
    "grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-14";
  studio.append(sections.rail, sections.work);

  main.append(studio);
  headerWrap.appendChild(sections.header);
  appRoot.append(headerWrap, main);

  new Header(sections.header);
  new ReferenceSection(blocks.references);
  new GenerationPanel(blocks.output);
  new PoseSelector(blocks.pose);
  new PromptPanel(blocks.prompt);
  new Gallery(blocks.gallery);
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
    // The backend being unreachable is surfaced by the API layer per request.
    const banner = document.createElement("div");
    banner.className =
      "mt-8 border border-bad/40 bg-[#2a1610] px-4 py-3 text-xs text-bad";
    banner.textContent =
      "Could not reach the local studio server. Make sure `py server.py` is running.";
    appRoot.prepend(banner);
  }
}

void boot();
