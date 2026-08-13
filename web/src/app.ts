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
import { buildPrompt, getPose, getStyle } from "./services/promptService";
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
    style: getStyle(gen.styleId),
    userPrompt: gen.userPrompt,
  });
  generationStore.update((s) => ({ ...s, generatedPrompt: prompt }));
}

async function boot(): Promise<void> {
  const main = document.createElement("main");
  main.className = "mx-auto w-full max-w-7xl px-6 md:px-10 pb-28";

  const sections = {
    header: document.createElement("div"),
    references: document.createElement("section"),
    generate: document.createElement("section"),
    pose: document.createElement("section"),
    gallery: document.createElement("section"),
  };
  sections.header.className = "";
  sections.references.className = "mt-12";
  sections.generate.className =
    "mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14";
  sections.pose.className = "mt-16";
  sections.gallery.className = "mt-16";

  const genLeft = document.createElement("div");
  const genRight = document.createElement("div");
  sections.generate.append(genLeft, genRight);

  main.append(
    sections.header,
    sections.references,
    sections.generate,
    sections.pose,
    sections.gallery
  );
  appRoot.appendChild(main);

  new Header(sections.header);
  new ReferenceSection(sections.references);
  new GenerationPanel(genLeft);
  new PromptPanel(genRight);
  new PoseSelector(sections.pose);
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
    // The backend being unreachable is surfaced by the API layer per request.
    const banner = document.createElement("div");
    banner.className =
      "mt-8 border border-bad/40 bg-[#201512] px-4 py-3 text-xs text-bad";
    banner.textContent =
      "Could not reach the local studio server. Make sure `py server.py` is running.";
    appRoot.prepend(banner);
  }
}

void boot();
