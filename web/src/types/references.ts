export interface ReferenceImage {
  id: string;
  type: "model" | "outfit";
  filename: string;
  stored_name: string;
  mime: string;
  size: number;
  created_at: string;
  updated_at: string;
  url: string;
}

export type ReferenceSlots = {
  model: ReferenceImage | null;
  outfit: ReferenceImage | null;
};
