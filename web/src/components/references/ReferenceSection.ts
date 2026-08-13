import { referenceStore } from "../../state/referenceState";
import { removeReference, uploadReference } from "../../services/referenceService";
import { validateImageFile } from "../../utils/validation";
import { formatBytes, el } from "../../utils/dom";
import { toast } from "../../utils/toast";
import type { ReferenceImage } from "../../types/references";

type RefType = "model" | "outfit";

interface SlotConfig {
  type: RefType;
  label: string;
  sub: string;
}

export class ReferenceSection {
  private configs: SlotConfig[] = [
    { type: "model", label: "Model", sub: "identity, face, hair, body" },
    { type: "outfit", label: "Outfit", sub: "garment, colour, material" },
  ];

  constructor(private container: HTMLElement) {
    referenceStore.subscribe(() => this.render());
    this.render();
  }

  private render(): void {
    this.container.replaceChildren();
    const refs = referenceStore.get();

    const header = el("div", { class: "flex items-center justify-between gap-4 mb-4" }, [
      el("div", { class: "eyebrow" }, ["References"]),
      el("div", { class: "font-mono text-[10px] text-faint tracking-[0.2em] hidden sm:block" }, [
        "stored locally",
      ]),
    ]);

    const grid = el("div", {
      class: "flex flex-col gap-3",
    }, [
      this.buildSlot(refs.model, this.configs[0]),
      this.buildSlot(refs.outfit, this.configs[1]),
    ]);

    this.container.appendChild(header);
    this.container.appendChild(grid);
  }

  private buildSlot(ref: ReferenceImage | null, config: SlotConfig): HTMLElement {
    const height = config.type === "model" ? "120px" : "150px";
    const slot = el("div", {
      class: "ref-slot",
      style: `width:100%;height:${height};`,
    });

    const typeTag = el("span", { class: "ref-tag" }, [config.label]);
    slot.appendChild(typeTag);

    if (ref) {
      const preview = el("div", { class: "ref-preview h-full" }, [
        el("img", { src: ref.url, alt: `${config.label} reference` }),
      ]);
      slot.appendChild(preview);

      const actions = el("div", { class: "ref-actions" }, [
        this.actionButton("Replace", () => this.triggerFileDialog(config.type, slot)),
        this.actionButton("Remove", () => this.remove(config.type), true),
      ]);
      slot.appendChild(actions);
    } else {
      const empty = el("div", { class: "ref-empty", title: `Upload ${config.label.toLowerCase()} reference` }, [
        el("span", { class: "plus" }, ["+"]),
        el("span", { class: "ref-empty-label" }, [config.label]),
        el("span", { class: "ref-empty-hint" }, [config.sub]),
      ]);
      empty.addEventListener("click", () => this.triggerFileDialog(config.type, slot));
      slot.appendChild(empty);
    }

    this.attachDrop(slot, config.type);
    return slot;
  }

  private actionButton(label: string, handler: () => void, danger = false): HTMLElement {
    const button = el("button", {
      class: `ref-action${danger ? " danger" : ""}`,
      type: "button",
    }, [label]);
    button.addEventListener("click", handler);
    return button;
  }

  private triggerFileDialog(type: RefType, slot: HTMLElement): void {
    const input = el("input", { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif", class: "hidden" });
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      await this.upload(type, file, slot);
    });
    document.body.appendChild(input);
    input.click();
    input.remove();
  }

  private attachDrop(slot: HTMLElement, type: RefType): void {
    let counter = 0;
    slot.addEventListener("dragenter", (event) => {
      event.preventDefault();
      counter++;
      slot.classList.add("drop-active");
    });
    slot.addEventListener("dragover", (event) => event.preventDefault());
    slot.addEventListener("dragleave", () => {
      counter = Math.max(0, counter - 1);
      if (counter === 0) slot.classList.remove("drop-active");
    });
    slot.addEventListener("drop", async (event) => {
      event.preventDefault();
      counter = 0;
      slot.classList.remove("drop-active");
      const file = event.dataTransfer?.files?.[0];
      if (file) await this.upload(type, file, slot);
    });
  }

  private async upload(type: RefType, file: File, slot: HTMLElement): Promise<void> {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast(validation.reason ?? "Invalid image.", "err");
      return;
    }
    slot.classList.add("drop-active");
    try {
      const ref = await uploadReference(type, file);
      toast(`${type === "model" ? "Model" : "Outfit"} reference set (${formatBytes(ref.size)}).`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Upload failed.", "err");
    } finally {
      slot.classList.remove("drop-active");
    }
  }

  private async remove(type: RefType): Promise<void> {
    try {
      await removeReference(type);
      toast(`${type === "model" ? "Model" : "Outfit"} reference removed.`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not remove reference.", "err");
    }
  }
}
