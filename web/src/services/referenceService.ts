import { api } from "./api";
import { referenceStore } from "../state/referenceState";
import type { ReferenceImage, ReferenceSlots } from "../types/references";

export async function loadReferences(): Promise<ReferenceSlots> {
  const data = await api.get<ReferenceSlots>("/api/references");
  referenceStore.set({ model: data.model, outfit: data.outfit });
  return data;
}

export async function uploadReference(
  type: "model" | "outfit",
  file: File
): Promise<ReferenceImage> {
  const form = new FormData();
  form.append("file", file, file.name);
  const data = await fetch(`/api/references/${type}`, {
    method: "POST",
    body: form,
  }).then(async (response) => {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; reference?: ReferenceImage }
      | null;
    if (!response.ok) {
      throw new Error(payload?.error ?? "Upload failed.");
    }
    return payload;
  });
  if (!data?.reference) {
    throw new Error("Upload failed, no reference returned.");
  }
  const next: ReferenceSlots = referenceStore.get();
  next[type] = data.reference;
  referenceStore.set({ ...next });
  return data.reference;
}

export async function removeReference(type: "model" | "outfit"): Promise<void> {
  await api.del<{ ok: boolean }>(`/api/references/${type}`);
  const next: ReferenceSlots = referenceStore.get();
  next[type] = null;
  referenceStore.set({ ...next });
}
