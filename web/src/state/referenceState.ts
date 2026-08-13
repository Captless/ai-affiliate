import { Store } from "./store";
import type { ReferenceSlots } from "../types/references";

export const referenceStore = new Store<ReferenceSlots>({
  model: null,
  outfit: null,
});
