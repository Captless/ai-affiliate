import { addKey } from "../../services/apiKeyService";
import { validateApiKey } from "../../utils/validation";
import { el } from "../../utils/dom";
import { toast } from "../../utils/toast";

export class AddKeyModal {
  constructor(
    private mount: HTMLElement,
    private onClose: () => void
  ) {
    this.open();
  }

  private open(): void {
    const overlay = el("div", {
      class: "fixed inset-0 z-[110] bg-[rgba(5,5,4,0.6)] flex items-start justify-center p-8 pt-[14vh] overflow-y-auto",
    });
    const panel = el("div", { class: "modal-panel !max-w-md" });
    overlay.appendChild(panel);
    this.mount.appendChild(overlay);

    const label = el("input", {
      class: "input-text",
      type: "text",
      placeholder: "Label, e.g. Main account",
      value: "",
    });
    const key = el("input", {
      class: "input-text mt-3 font-mono !text-xs",
      type: "password",
      placeholder: "ws_…",
      autocomplete: "off",
    });
    const error = el("p", { class: "text-[11px] text-bad mt-2 min-h-4", style: "min-height:16px" });

    const cancelBtn = el("button", { class: "btn", type: "button" }, ["Cancel"]);
    const saveBtn = el("button", { class: "btn-primary", type: "submit" }, ["Save key"]);
    saveBtn.dataset.loading = "false";

    const form = el("form", { class: "px-6 py-5" }, [
      el("div", { class: "eyebrow mb-1" }, ["New API key"]),
      el("h4", { class: "display-title text-xl mb-4" }, ["Add WaveSpeed key"]),
      label,
      key,
      error,
      el("p", { class: "text-[10px] text-faint leading-relaxed mt-3" }, [
        "Keys are stored locally in data/app.db, masked in the UI, and never sent to the browser. Generate keys at wavespeed.ai.",
      ]),
      el("div", { class: "flex justify-end gap-2 mt-5" }, [cancelBtn, saveBtn]),
    ]);
    const dismiss = () => {
      overlay.remove();
      this.onClose();
    };
    cancelBtn.addEventListener("click", dismiss);
    overlay.addEventListener("pointerdown", (event) => {
      if (event.target === overlay) dismiss();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";
      const validation = validateApiKey(key.value);
      if (!validation.valid) {
        error.textContent = validation.reason ?? "";
        return;
      }
      saveBtn.setAttribute("disabled", "true");
      saveBtn.replaceChildren(el("span", { class: "spinner" }), "Saving…");
      try {
        await addKey(label.value.trim() || "Untitled Key", key.value.trim());
        toast("API key added.");
        dismiss();
      } catch (err) {
        error.textContent = err instanceof Error ? err.message : "Could not save key.";
        saveBtn.removeAttribute("disabled");
        saveBtn.replaceChildren("Save key");
      }
    });

    panel.appendChild(form);
    setTimeout(() => label.focus(), 30);
  }
}
