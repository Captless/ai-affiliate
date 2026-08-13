import { generationStore } from "../../state/generationState";
import { appStore } from "../../state/appState";
import { deleteGeneration } from "../../services/generationService";
import { el } from "../../utils/dom";
import { toast } from "../../utils/toast";
import type { GenerationJob } from "../../types/generation";

const SPAN_BY_RATIO: Record<string, string> = {
  "9:16": "span-3c span-3r",
  "2:3": "span-3c span-3r",
  "3:4": "span-3c span-3r",
  "1:1": "span-3c span-2r",
  "4:5": "span-4c span-3r",
  "3:2": "span-5c span-2r",
  "16:9": "span-6c span-2r",
  "21:9": "span-8c span-2r",
};

export class Gallery {
  constructor(private container: HTMLElement) {
    generationStore.subscribe(() => this.render());
    this.render();
  }

  private render(): void {
    this.container.replaceChildren();
    const gen = generationStore.get();

    const header = el("div", { class: "flex items-end justify-between gap-4 mb-5" }, [
      el("div", {}, [
        el("div", { class: "eyebrow mb-1" }, ["Gallery"]),
        el("h2", { class: "display-title text-2xl" }, ["Generations"]),
      ]),
      el("span", { class: "font-mono text-[10px] text-faint uppercase tracking-[0.2em]" }, [
        `${gen.jobs.length} local${gen.jobs.length === 1 ? "" : "s"}`,
      ]),
    ]);

    const grid = el("div", { class: "gallery-grid" });

    if (gen.jobs.length === 0) {
      const empty = el("div", { class: "col-span-12 border border-dashed border-[#443e35] py-20 flex flex-col items-center gap-3 text-center" }, [
        el("span", { class: "display-title text-xl text-faint" }, ["Nothing here yet"]),
        el("span", { class: "text-xs text-faint max-w-sm" }, [
          "Set your references, compose a brief and press Generate. Outputs land here, newest first.",
        ]),
      ]);
      grid.appendChild(empty);
    } else {
      for (const job of gen.jobs) {
        grid.appendChild(this.buildItem(job));
      }
    }

    this.container.append(header, grid);
  }

  private buildItem(job: GenerationJob): HTMLElement {
    const span = SPAN_BY_RATIO[job.aspect_ratio ?? ""] ?? "span-3c span-3r";
    const item = el("div", {
      class: `gallery-item ${span}`,
      tabindex: "0",
      role: "button",
      "aria-label": `Generation ${job.id.slice(0, 8)}`,
    });

    if (job.status === "completed" && job.image_url) {
      item.appendChild(el("img", { class: "thumb", src: job.image_url, alt: "generated fashion image", loading: "lazy" }));
      item.appendChild(
        el("div", { class: "gallery-meta" }, [
          el("span", {}, [this.timeLabel(job)]),
          el("span", {}, [String(job.aspect_ratio ?? "")]),
        ])
      );
    } else {
      item.appendChild(this.statusTile(job));
    }

    const actions = el("div", { class: "gallery-actions" }, [
      this.action("View", () => this.view(job), job.status !== "completed"),
      this.action("Download", () => this.download(job), job.status !== "completed"),
      this.action("Delete", () => this.remove(job), false, true),
    ]);
    item.appendChild(actions);

    const open = () => this.view(job);
    item.addEventListener("click", (event) => {
      if ((event.target as HTMLElement).closest(".gallery-actions")) return;
      open();
    });
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
    return item;
  }

  private statusTile(job: GenerationJob): HTMLElement {
    const label = job.status === "failed" ? "Failed" : this.statusLabel(job.status);
    const tile = el("div", { class: `gallery-status${job.status === "failed" ? " failed" : ""}` }, [
      job.status === "processing" || job.status === "queued" || job.status === "downloading"
        ? el("span", { class: "spinner" })
        : null,
      el("span", { class: "st-label" }, [label]),
      el("span", { class: "st-detail" }, [job.error ?? this.statusDetail(job.status)]),
    ]);
    return tile;
  }

  private statusLabel(status: GenerationJob["status"]): string {
    switch (status) {
      case "queued": return "Queued";
      case "processing": return "Generating";
      case "downloading": return "Downloading";
      case "completed": return "Completed";
      case "failed": return "Failed";
    }
  }

  private statusDetail(status: GenerationJob["status"]): string {
    switch (status) {
      case "queued": return "waiting for the worker";
      case "processing": return "WaveSpeed is rendering";
      case "downloading": return "saving output locally";
      default: return "";
    }
  }

  private timeLabel(job: GenerationJob): string {
    const date = new Date(job.completed_at ?? job.updated_at);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  private action(label: string, handler: () => void, disabled: boolean, danger = false): HTMLElement {
    const button = el("button", {
      class: `gallery-action${danger ? " danger" : ""}`,
      type: "button",
      disabled: disabled ? "true" : null,
    }, [label]);
    button.addEventListener("click", handler);
    return button;
  }

  private view(job: GenerationJob): void {
    appStore.update((s) => ({ ...s, viewerJob: job }));
  }

  private download(job: GenerationJob): void {
    if (!job.image_url) return;
    const anchor = document.createElement("a");
    anchor.href = job.image_url;
    anchor.download = `${job.id}.${job.output_ext ?? "png"}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  private async remove(job: GenerationJob): Promise<void> {
    try {
      await deleteGeneration(job.id);
      toast("Generation deleted.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not delete.", "err");
    }
  }
}
