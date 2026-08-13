import { appStore } from "../../state/appState";
import { el } from "../../utils/dom";

interface ViewTransform {
  scale: number;
  tx: number;
  ty: number;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 12;

export class ImageViewer {
  private backdrop: HTMLElement | null = null;
  private stage: HTMLElement | null = null;
  private canvas: HTMLElement | null = null;
  private image: HTMLImageElement | null = null;
  private zoomLabel: HTMLElement | null = null;

  private transform: ViewTransform = { scale: 1, tx: 0, ty: 0 };
  private panning = false;
  private pointerId: number | null = null;
  private lastX = 0;
  private lastY = 0;

  constructor(private mount: HTMLElement) {
    appStore.subscribe(() => {
      const job = appStore.get().viewerJob;
      if (job && !this.backdrop) this.open(job);
      if (!job && this.backdrop) this.close();
    });
  }

  private open(job: { id: string; image_url: string | null; prompt: string; created_at: string }): void {
    this.transform = { scale: 1, tx: 0, ty: 0 };
    this.panning = false;

    const backdrop = el("div", { class: "viewer-backdrop" });
    const topbar = el("div", { class: "viewer-topbar" }, [
      el("div", { class: "flex items-center gap-4" }, [
        el("span", { class: "font-mono text-[10px] uppercase tracking-[0.25em] text-faint" }, ["Viewer"]),
        el("span", { class: "viewer-statusline" }, [`${job.id.slice(0, 8)} / ${new Date(job.created_at).toLocaleString()}`]),
      ]),
      el("div", { class: "flex items-center gap-4" }, [
        el("span", { class: "viewer-zoom-hint", id: "viewer-zoom" }, ["100%"]),
        el("button", { class: "chip", type: "button" }, ["Reset"]),
        el("button", { class: "chip", type: "button" }, ["Close"]),
      ]),
    ]);

    const zoomHint = topbar.querySelector("#viewer-zoom") as HTMLElement;
    const resetBtn = topbar.querySelectorAll("button")[0] as HTMLElement;
    const closeBtn = topbar.querySelectorAll("button")[1] as HTMLElement;
    resetBtn.addEventListener("click", () => this.reset());
    closeBtn.addEventListener("click", () => this.requestClose());

    const stage = el("div", { class: "viewer-stage" });
    const canvas = el("div", { class: "viewer-canvas" });

    const img = new Image();
    img.alt = "generated image";
    img.draggable = false;
    img.src = job.image_url ?? "";
    img.addEventListener("load", () => this.fitToStage());
    canvas.appendChild(img);

    stage.appendChild(canvas);
    backdrop.append(topbar, stage);
    this.mount.appendChild(backdrop);

    this.backdrop = backdrop;
    this.stage = stage;
    this.canvas = canvas;
    this.image = img;
    this.zoomLabel = zoomHint;

    this.wireStage();
    this.update();
  }

  private wireStage(): void {
    const stage = this.stage;
    if (!stage) return;

    stage.addEventListener("wheel", (event) => {
      event.preventDefault();
      const rect = stage.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;
      const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
      this.zoomAt(factor, cursorX, cursorY);
    }, { passive: false });

    stage.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      this.panning = true;
      this.pointerId = event.pointerId;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      stage.setPointerCapture(event.pointerId);
      stage.classList.add("panning");
      event.preventDefault();
    });

    stage.addEventListener("pointermove", (event) => {
      if (!this.panning || this.pointerId !== event.pointerId) return;
      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.transform.tx += dx;
      this.transform.ty += dy;
      this.update();
    });

    const endPan = (event: PointerEvent) => {
      if (this.pointerId !== event.pointerId) return;
      this.panning = false;
      this.pointerId = null;
      stage.classList.remove("panning");
    };
    stage.addEventListener("pointerup", endPan);
    stage.addEventListener("pointercancel", endPan);

    stage.addEventListener("dblclick", (event) => {
      event.preventDefault();
      if (this.transform.scale > 1.01) {
        this.reset();
      } else {
        const rect = stage.getBoundingClientRect();
        this.zoomAt(2.2, event.clientX - rect.left, event.clientY - rect.top);
      }
    });
  }

  private zoomAt(factor: number, cursorX: number, cursorY: number): void {
    const t = this.transform;
    const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * factor));
    const realFactor = nextScale / t.scale;
    if (realFactor === 1) return;
    // Keep the point under the cursor stationary.
    t.tx = cursorX - realFactor * (cursorX - t.tx);
    t.ty = cursorY - realFactor * (cursorY - t.ty);
    t.scale = nextScale;
    this.update();
  }

  private reset(): void {
    this.transform = { scale: 1, tx: 0, ty: 0 };
    this.update();
  }

  private fitToStage(): void {
    const stage = this.stage;
    const image = this.image;
    if (!stage || !image) return;
    const pad = 40;
    const stageW = stage.clientWidth;
    const stageH = stage.clientHeight;
    if (!stageW || !stageH) return;
    const scale = Math.min(
      1,
      (stageW - pad) / image.naturalWidth,
      (stageH - pad) / image.naturalHeight
    );
    this.transform.scale = scale;
    this.transform.tx = 0;
    this.transform.ty = 0;
    this.update();
  }

  private update(): void {
    if (!this.canvas || !this.image) return;
    const t = this.transform;
    // The canvas is anchored at the stage center; position the top-left.
    const imgW = this.image.naturalWidth * t.scale;
    const imgH = this.image.naturalHeight * t.scale;
    const stageW = this.stage?.clientWidth ?? 0;
    const stageH = this.stage?.clientHeight ?? 0;
    this.canvas.style.left = `${stageW / 2 - imgW / 2 + t.tx}px`;
    this.canvas.style.top = `${stageH / 2 - imgH / 2 + t.ty}px`;
    this.canvas.style.width = `${imgW}px`;
    this.canvas.style.height = `${imgH}px`;
    if (this.image) {
      this.image.style.width = "100%";
      this.image.style.height = "100%";
    }
    if (this.zoomLabel) {
      this.zoomLabel.textContent = `${Math.round(t.scale * 100)}%`;
    }
  }

  private requestClose(): void {
    appStore.update((s) => ({ ...s, viewerJob: null }));
  }

  private close(): void {
    this.backdrop?.remove();
    this.backdrop = null;
    this.stage = null;
    this.canvas = null;
    this.image = null;
    this.zoomLabel = null;
  }

  handleEscape(): void {
    if (this.backdrop) this.requestClose();
  }
}
