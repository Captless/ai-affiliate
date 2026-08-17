import { generationStore } from "../../state/generationState";
import { referenceStore } from "../../state/referenceState";
import { appStore } from "../../state/appState";
import { submitGeneration } from "../../services/generationService";
import { el } from "../../utils/dom";
import { toast } from "../../utils/toast";

const ASPECT_RATIOS = ["1:1", "2:3", "3:4", "4:5", "9:16", "16:9", "21:9"];
const RESOLUTIONS = ["0.5k", "1k", "2k", "4k"];

export class GenerationPanel {
  constructor(private container: HTMLElement) {
    generationStore.subscribe(() => this.render());
    referenceStore.subscribe(() => this.render());
    appStore.subscribe(() => this.render());
    this.render();
  }

  private render(): void {
    this.container.replaceChildren();
    const gen = generationStore.get();
    const refs = referenceStore.get();
    const app = appStore.get();

    const aspect = this.buildSegmented("Aspect", ASPECT_RATIOS, gen.settings.aspect_ratio, (v) =>
      generationStore.update((s) => ({ ...s, settings: { ...s.settings, aspect_ratio: v } }))
    );
    const resolution = this.buildSegmented("Resolution", RESOLUTIONS, gen.settings.resolution, (v) =>
      generationStore.update((s) => ({ ...s, settings: { ...s.settings, resolution: v } }))
    );
    const format = this.buildSegmented(
      "Format",
      ["png", "jpeg"],
      gen.settings.output_format,
      (v) =>
        generationStore.update((s) => ({
          ...s,
          settings: { ...s.settings, output_format: v as "png" | "jpeg" },
        }))
    );
    const toggles = el("div", { class: "grid grid-cols-2 gap-x-6 gap-y-3" }, [
      this.buildToggle(
        "Image search",
        "let the model pull context from your references",
        gen.settings.enable_image_search,
        (v) => generationStore.update((s) => ({ ...s, settings: { ...s.settings, enable_image_search: v } }))
      ),
      this.buildToggle(
        "Web search",
        "augment with related web imagery",
        gen.settings.enable_web_search,
        (v) => generationStore.update((s) => ({ ...s, settings: { ...s.settings, enable_web_search: v } }))
      ),
    ]);

    const generateBtn = el("button", {
      class: "btn-primary w-full py-3 text-xs tracking-[0.2em] uppercase",
      type: "button",
      disabled: gen.submitting ? "true" : null,
    }, [
      gen.submitting ? el("span", { class: "spinner" }) : null,
      gen.submitting ? "Submitting…" : "Generate",
    ]);
    generateBtn.addEventListener("click", () => this.generate());

    const readiness = el("div", { class: "flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]" }, [
      el("span", { class: refs.model ? "text-good" : "text-bad" }, [refs.model ? "model ✓" : "model missing"]),
      el("span", { class: refs.outfit ? "text-good" : "text-bad" }, [refs.outfit ? "outfit ✓" : "outfit missing"]),
      el("span", { class: app.keys.some((k) => k.is_enabled) ? "text-good" : "text-bad" }, [
        app.keys.some((k) => k.is_enabled) ? "key ✓" : "key missing",
      ]),
    ]);

    const root = el("div", { class: "flex flex-col gap-5" }, [
      el("div", { class: "eyebrow" }, ["Output"]),
      el("div", { class: "space-y-5" }, [aspect, resolution, format, toggles]),
      el("div", { class: "rule" }),
      el("div", { class: "flex items-end justify-between gap-4" }, [
        el("div", { class: "font-mono text-[10px] text-faint leading-relaxed uppercase tracking-[0.15em]" }, [
          "nano-banana-2",
          el("br"),
          "two-reference fashion edit",
        ]),
        el("div", { class: "w-44" }, [generateBtn]),
      ]),
      readiness,
    ]);

    this.container.appendChild(root);
  }

  private buildSegmented(
    label: string,
    values: string[],
    active: string,
    onChange: (value: string) => void
  ): HTMLElement {
    const group = el("div", { class: "seg flex-wrap" }, [
      ...values.map((value) => {
        const button = el("button", { type: "button", "data-active": String(value === active) }, [value]);
        button.addEventListener("click", () => onChange(value));
        return button;
      }),
    ]);
    return el("div", { class: "flex items-center justify-between gap-4" }, [
      el("span", { class: "eyebrow shrink-0" }, [label]),
      group,
    ]);
  }

  private buildToggle(
    label: string,
    hint: string,
    checked: boolean,
    onChange: (value: boolean) => void
  ): HTMLElement {
    const box = el("input", { type: "checkbox", class: "accent-[var(--brass)] h-3.5 w-3.5 shrink-0" });
    box.checked = checked;
    box.addEventListener("change", () => onChange(box.checked));
    return el("label", { class: "flex items-start gap-2.5 cursor-pointer" }, [
      box,
      el("span", { class: "flex flex-col" }, [
        el("span", { class: "text-xs text-paper" }, [label]),
        el("span", { class: "text-[10px] text-faint leading-snug" }, [hint]),
      ]),
    ]);
  }

  private async generate(): Promise<void> {
    const gen = generationStore.get();
    const refs = referenceStore.get();
    const app = appStore.get();

    if (!refs.model || !refs.outfit) {
      toast("Add both a model and an outfit reference first.", "err");
      return;
    }
    if (!app.keys.some((k) => k.is_enabled)) {
      toast("Add and enable at least one WaveSpeed API key first.", "err");
      return;
    }
    if (!gen.generatedPrompt.trim()) {
      toast("Compose a prompt before generating.", "err");
      return;
    }
    if (gen.submitting) return;

    generationStore.update((s) => ({ ...s, submitting: true }));
    try {
      await submitGeneration({
        prompt: gen.generatedPrompt,
        settings: gen.settings,
        generation_style: gen.styleId,
        user_prompt: gen.userPrompt,
        key_selection: app.settings.key_selection,
        manual_key_id: app.settings.manual_key_id,
      });
      toast("Generation queued.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not queue generation.", "err");
    } finally {
      generationStore.update((s) => ({ ...s, submitting: false }));
    }
  }
}
