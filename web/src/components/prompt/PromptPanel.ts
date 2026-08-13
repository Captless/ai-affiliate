import { generationStore } from "../../state/generationState";
import { referenceStore } from "../../state/referenceState";
import { buildPrompt, getPose, getStyle } from "../../services/promptService";
import { el } from "../../utils/dom";
import { toast } from "../../utils/toast";

export class PromptPanel {
  private isEditing = false;
  private textarea: HTMLTextAreaElement | null = null;
  private footerInfo: HTMLElement | null = null;
  private lastPose: string | null = null;
  private lastStyle: string | null = null;

  constructor(private container: HTMLElement) {
    generationStore.subscribe(() => this.render());
    referenceStore.subscribe(() => this.render());
    this.render();
  }

  private recompose(): void {
    const gen = generationStore.get();
    const refs = referenceStore.get();
    const prompt = buildPrompt({
      references: refs,
      pose: getPose(gen.poseId),
      style: getStyle(gen.styleId),
      userPrompt: gen.userPrompt,
    });
    this.isEditing = false;
    generationStore.update((s) => ({ ...s, generatedPrompt: prompt }));
  }

  private updateFooter(): void {
    const gen = generationStore.get();
    if (!this.footerInfo) return;
    const words = gen.generatedPrompt.trim() ? gen.generatedPrompt.trim().split(/\s+/).length : 0;
    this.footerInfo.textContent = `${words} words · ${gen.generatedPrompt.length} chars`;
  }

  private render(): void {
    const gen = generationStore.get();

    // While the user is typing, keep the editor DOM untouched so focus survives.
    if (this.isEditing && this.textarea) {
      this.updateFooter();
      return;
    }
    this.isEditing = false;

    // Auto-recompose when pose or style changed, unless the user is mid-edit.
    if (this.lastPose !== null && (gen.poseId !== this.lastPose || gen.styleId !== this.lastStyle)) {
      this.lastPose = gen.poseId;
      this.lastStyle = gen.styleId;
      this.recompose();
      return;
    }
    this.lastPose = gen.poseId;
    this.lastStyle = gen.styleId;
    this.container.replaceChildren();

    const header = el("div", { class: "flex items-end justify-between gap-4 mb-3" }, [
      el("div", {}, [
        el("div", { class: "eyebrow mb-1" }, ["Prompt / Creative direction"]),
        el("p", { class: "text-[11px] text-faint" }, [
          "Auto-composed from references, pose, style and your direction. Edit freely before generating.",
        ]),
      ]),
      el("div", { class: "flex items-center gap-2" }, [
        el("button", { class: "chip", type: "button" }, ["Recompose"]),
        el("button", { class: "chip", type: "button" }, ["Copy"]),
      ]),
    ]);
    const headerButtons = header.lastChild as HTMLElement;
    (headerButtons.firstChild as HTMLElement).addEventListener("click", () => this.recompose());
    (headerButtons.lastChild as HTMLElement).addEventListener("click", () => {
      navigator.clipboard.writeText(gen.generatedPrompt).then(
        () => toast("Prompt copied."),
        () => toast("Could not copy.", "err")
      );
    });

    const userPromptInput = el("input", {
      class: "input-text mb-3",
      type: "text",
      placeholder: "Your own direction — e.g. “golden hour, city rooftop, soft smile” (optional)",
      value: gen.userPrompt,
    });
    userPromptInput.addEventListener("input", () => {
      generationStore.update((s) => ({ ...s, userPrompt: userPromptInput.value }));
    });
    userPromptInput.addEventListener("blur", () => {
      if (userPromptInput.value !== generationStore.get().userPrompt) this.recompose();
    });

    const textarea = el("textarea", {
      class: "prompt-editor",
      placeholder: "Your creative brief will appear here…",
      spellcheck: "false",
    });
    textarea.value = gen.generatedPrompt;
    textarea.addEventListener("input", () => {
      this.isEditing = true;
      generationStore.update((s) => ({ ...s, generatedPrompt: textarea.value }));
    });
    this.textarea = textarea;

    const footer = el("div", { class: "flex items-center justify-between mt-2 font-mono text-[10px] text-faint" }, [
      el("span", {}, ["auto-composed"]),
      el("span", { id: "prompt-footer-info" }),
    ]);
    this.footerInfo = footer.lastChild as HTMLElement;
    this.updateFooter();

    this.container.append(header, userPromptInput, textarea, footer);
  }
}
