import { generationStore } from "../../state/generationState";
import { referenceStore } from "../../state/referenceState";
import { buildPrompt, getPose } from "../../services/promptService";
import { el } from "../../utils/dom";
import { toast } from "../../utils/toast";

export class PromptPanel {
  private isEditing = false;
  private textarea: HTMLTextAreaElement | null = null;
  private footerInfo: HTMLElement | null = null;
  private lastPose: string | null = null;

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
      userPrompt: gen.userPrompt,
    });
    this.isEditing = false;
    generationStore.update((s) => ({ ...s, generatedPrompt: prompt }));
  }

  private updateFooter(): void {
    const gen = generationStore.get();
    if (!this.footerInfo) return;
    const words = gen.generatedPrompt.trim() ? gen.generatedPrompt.trim().split(/\s+/).length : 0;
    this.footerInfo.textContent = `${words} words, ${gen.generatedPrompt.length} chars`;
  }

  private autoResize(textarea: HTMLTextAreaElement): void {
    const max = window.innerHeight * 0.6;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, max)}px`;
  }

  private render(): void {
    const gen = generationStore.get();

    // While the user is typing, keep the editor DOM untouched so focus survives.
    if (this.isEditing && this.textarea) {
      this.updateFooter();
      return;
    }
    this.isEditing = false;

    // Auto-recompose when pose changed, unless the user is mid-edit.
    if (this.lastPose !== null && gen.poseId !== this.lastPose) {
      this.lastPose = gen.poseId;
      this.recompose();
      return;
    }
    this.lastPose = gen.poseId;
    this.container.replaceChildren();

    const textarea = el("textarea", {
      class: "prompt-editor",
      placeholder: "Your creative brief will appear here…",
      spellcheck: "false",
    });
    textarea.value = gen.generatedPrompt;
    this.autoResize(textarea);
    textarea.addEventListener("input", () => {
      this.isEditing = true;
      generationStore.update((s) => ({ ...s, generatedPrompt: textarea.value }));
      this.autoResize(textarea);
    });
    this.textarea = textarea;

    const copyBtn = el("button", { class: "chip", type: "button" }, ["Copy"]);
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(gen.generatedPrompt).then(
        () => toast("Prompt copied."),
        () => toast("Could not copy.", "err")
      );
    });

    const footer = el("div", { class: "flex items-center justify-end mt-2 font-mono text-[10px] text-faint" }, [
      el("span", {}, [String(gen.generatedPrompt.length)]),
    ]);
    this.footerInfo = footer.lastChild as HTMLElement;
    this.updateFooter();

    const root = el("div", { class: "flex flex-col" }, [
      el("div", { class: "flex items-end justify-end mb-3" }, [copyBtn]),
      textarea,
      footer,
    ]);

    this.container.appendChild(root);
  }
}
