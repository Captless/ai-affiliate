import { generationStore } from "../../state/generationState";
import { referenceStore } from "../../state/referenceState";
import { buildPrompt, getPose } from "../../services/promptService";
import { el } from "../../utils/dom";
import { toast } from "../../utils/toast";

export class PromptPanel {
  private isEditing = false;
  private draft: string | null = null;
  private textarea: HTMLTextAreaElement | null = null;
  private footerInfo: HTMLElement | null = null;
  private lastPose: string | null = null;

  constructor(private container: HTMLElement) {
    generationStore.subscribe(() => this.render());
    referenceStore.subscribe(() => this.render());
    this.render();
  }

  private currentText(): string {
    return this.draft ?? this.textarea?.value ?? generationStore.get().generatedPrompt;
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
    this.draft = null;
    generationStore.update((s) => ({ ...s, generatedPrompt: prompt }));
  }

  private updateFooter(): void {
    if (!this.footerInfo) return;
    const text = this.currentText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.footerInfo.textContent = `${words} words, ${text.length} chars`;
  }

  private autoResize(textarea: HTMLTextAreaElement): void {
    const max = window.innerHeight * 0.6;
    textarea.style.height = "auto";
    const content = textarea.scrollHeight;
    textarea.style.height = `${Math.min(content, max)}px`;
  }

  private render(): void {
    const gen = generationStore.get();

    // Pose changed: reset edit state and recompose.
    if (this.lastPose !== null && gen.poseId !== this.lastPose) {
      this.lastPose = gen.poseId;
      this.recompose();
      return;
    }
    this.lastPose = gen.poseId;

    // While editing, keep the editor DOM untouched so focus survives.
    if (this.isEditing && this.textarea) {
      this.updateFooter();
      return;
    }
    this.container.replaceChildren();

    const textarea = el("textarea", {
      class: "prompt-editor",
      placeholder: "Your creative brief will appear here…",
      spellcheck: "false",
      readonly: this.isEditing ? null : "true",
    });
    textarea.value = gen.generatedPrompt;
    textarea.addEventListener("input", () => {
      this.draft = textarea.value;
      this.autoResize(textarea);
      this.updateFooter();
    });
    this.textarea = textarea;
    this.autoResize(textarea);

    const editBtn = el("button", { class: "chip", type: "button" }, [this.isEditing ? "Confirm" : "Edit"]);
    editBtn.addEventListener("click", () => this.toggleEdit(textarea, editBtn));

    const copyBtn = el("button", { class: "chip", type: "button" }, ["Copy"]);
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(this.currentText()).then(
        () => toast("Prompt copied."),
        () => toast("Could not copy.", "err")
      );
    });

    const footer = el("div", { class: "flex items-center justify-end mt-2 font-mono text-[10px] text-faint" }, [
      el("span", {}, ["0 words, 0 chars"]),
    ]);
    this.footerInfo = footer.lastChild as HTMLElement;
    this.updateFooter();

    const root = el("div", { class: "flex flex-col" }, [
      el("div", { class: "flex items-end justify-end gap-2 mb-3" }, [editBtn, copyBtn]),
      textarea,
      footer,
    ]);

    this.container.appendChild(root);
  }

  private toggleEdit(textarea: HTMLTextAreaElement, editBtn: HTMLButtonElement): void {
    if (this.isEditing) {
      // Confirm: commit the draft to the store.
      generationStore.update((s) => ({ ...s, generatedPrompt: this.currentText() }));
      this.isEditing = false;
      this.draft = null;
    } else {
      // Enter edit mode: make editable, focus, flip button to Confirm.
      this.isEditing = true;
      textarea.removeAttribute("readonly");
      editBtn.replaceChildren("Confirm");
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }
}
