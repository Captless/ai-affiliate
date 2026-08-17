import { generationStore } from "../../state/generationState";
import { referenceStore } from "../../state/referenceState";
import { buildPrompt } from "../../services/promptService";
import { el } from "../../utils/dom";
import { toast } from "../../utils/toast";

export class PromptPanel {
  private footerInfo: HTMLElement | null = null;
  private editing = false;
  private savedValue = "";
  private ignoreNextRender = false;

  constructor(private container: HTMLElement) {
    generationStore.subscribe(() => this.render());
    referenceStore.subscribe(() => {
      const gen = generationStore.get();
      const refs = referenceStore.get();
      const prompt = buildPrompt({ references: refs, userPrompt: gen.userPrompt });
      generationStore.update((s) => ({ ...s, generatedPrompt: prompt }));
    });
    this.render();
  }

  private updateFooter(): void {
    if (!this.footerInfo) return;
    const text = generationStore.get().generatedPrompt;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.footerInfo.textContent = `${words} words, ${text.length} chars`;
  }

  private render(): void {
    if (this.ignoreNextRender) { this.ignoreNextRender = false; return; }
    const gen = generationStore.get();
    this.container.replaceChildren();

    const textarea = el("textarea", {
      class: `prompt-editor${this.editing ? " editing" : ""}`,
      placeholder: "Your creative brief will appear here\u2026",
      spellcheck: "false",
    }) as HTMLTextAreaElement;
    textarea.value = gen.generatedPrompt;
    textarea.readOnly = !this.editing;

    textarea.addEventListener("input", () => {
      this.ignoreNextRender = true;
      generationStore.update((s) => ({ ...s, generatedPrompt: textarea.value }));
      this.updateFooter();
    });

    let editBtn: HTMLElement;
    let cancelBtn: HTMLElement | null = null;

    if (this.editing) {
      editBtn = this.makeBtn("Save", "chip chip-active", () => {
        this.editing = false;
        this.savedValue = "";
        this.render();
        toast("Prompt saved.");
      });
      cancelBtn = this.makeBtn("Cancel", "chip", () => {
        this.ignoreNextRender = true;
        generationStore.update((s) => ({ ...s, generatedPrompt: this.savedValue }));
        this.editing = false;
        this.savedValue = "";
        this.render();
      });
    } else {
      editBtn = this.makeBtn("Edit", "chip", () => {
        this.savedValue = generationStore.get().generatedPrompt;
        this.editing = true;
        this.render();
        setTimeout(() => {
          if (this.textareaRef) {
            this.textareaRef.focus();
          }
        }, 30);
      });
    }

    const copyBtn = this.makeBtn("Copy", "chip", () => {
      navigator.clipboard.writeText(gen.generatedPrompt).then(
        () => toast("Prompt copied."),
        () => toast("Could not copy.", "err")
      );
    });

    const footer = el("div", { class: "flex items-center justify-end pt-2 font-mono text-[10px] text-faint" }, [
      el("span", {}, ["0 words, 0 chars"]),
    ]);
    this.footerInfo = footer.lastChild as HTMLElement;
    this.updateFooter();

    const btns = [editBtn];
    if (cancelBtn) btns.push(cancelBtn);
    btns.push(copyBtn);

    const root = el("div", { class: "flex flex-col flex-1" }, [
      el("div", { class: "flex items-center justify-between gap-2 mb-3" }, [
        el("span", { class: "eyebrow" }, ["Prompt"]),
        el("div", { class: "flex gap-2" }, btns),
      ]),
      textarea,
      footer,
    ]);

    this.textareaRef = textarea;
    this.container.appendChild(root);
  }

  private textareaRef: HTMLTextAreaElement | null = null;

  private makeBtn(label: string, cls: string, handler: () => void): HTMLElement {
    const btn = el("button", { class: cls, type: "button" }, [label]);
    btn.addEventListener("click", handler);
    return btn;
  }
}
