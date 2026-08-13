import { generationStore } from "../../state/generationState";
import { referenceStore } from "../../state/referenceState";
import { buildPrompt, getPose } from "../../services/promptService";
import { el } from "../../utils/dom";
import { toast } from "../../utils/toast";

export class PromptPanel {
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
    generationStore.update((s) => ({ ...s, generatedPrompt: prompt }));
  }

  private updateFooter(): void {
    if (!this.footerInfo) return;
    const gen = generationStore.get();
    const text = gen.generatedPrompt;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.footerInfo.textContent = `${words} words, ${text.length} chars`;
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

    this.container.replaceChildren();

    const textarea = el("textarea", {
      class: "prompt-editor",
      placeholder: "Your creative brief will appear here…",
      spellcheck: "false",
      readonly: "true",
    });
    textarea.value = gen.generatedPrompt;

    const editBtn = el("button", { class: "chip", type: "button" }, ["Edit"]);
    editBtn.addEventListener("click", () => this.openEditor());

    const copyBtn = el("button", { class: "chip", type: "button" }, ["Copy"]);
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(gen.generatedPrompt).then(
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

  private openEditor(): void {
    const overlay = el("div", {
      class: "fixed inset-0 z-[110] bg-[rgba(5,5,4,0.6)] flex items-start justify-center p-8 pt-[14vh] overflow-y-auto",
    });
    const panel = el("div", { class: "modal-panel !max-w-2xl" });
    overlay.appendChild(panel);
    this.container.ownerDocument.body.appendChild(overlay);

    const textarea = el("textarea", {
      class: "prompt-editor !h-[40vh]",
      spellcheck: "false",
    });
    textarea.value = generationStore.get().generatedPrompt;

    const cancelBtn = el("button", { class: "btn", type: "button" }, ["Cancel"]);
    const confirmBtn = el("button", { class: "btn-primary", type: "button" }, ["Confirm"]);

    const dismiss = () => overlay.remove();

    cancelBtn.addEventListener("click", dismiss);
    overlay.addEventListener("pointerdown", (event) => {
      if (event.target === overlay) dismiss();
    });
    document.addEventListener("keydown", keydown);
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        document.removeEventListener("keydown", keydown);
        dismiss();
      }
    }

    confirmBtn.addEventListener("click", () => {
      generationStore.update((s) => ({ ...s, generatedPrompt: textarea.value }));
      dismiss();
    });

    const footer = el("div", { class: "flex items-center justify-end gap-2 mt-4" }, [cancelBtn, confirmBtn]);

    const body = el("div", { class: "px-6 py-5" }, [
      el("div", { class: "eyebrow mb-1" }, ["Edit prompt"]),
      el("h4", { class: "display-title text-xl mb-4" }, ["Edit generated prompt"]),
      textarea,
      el("p", { class: "text-[10px] text-faint mt-3" }, [
        "Your changes override the generated prompt. Selecting a different pose resets it.",
      ]),
      footer,
    ]);

    panel.appendChild(body);
    setTimeout(() => textarea.focus(), 30);
  }
}
