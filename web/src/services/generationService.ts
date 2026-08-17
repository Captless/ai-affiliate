import { api } from "./api";
import { generationStore } from "../state/generationState";
import type { GenerationJob, GenerationSettings } from "../types/generation";

export interface GeneratePayload {
  prompt: string;
  settings: GenerationSettings;
  generation_style: string | null;
  user_prompt: string;
  key_selection: string;
  manual_key_id: string | null;
}

interface GenerationsResponse {
  generations: GenerationJob[];
}

interface GenerationResponse {
  generation: GenerationJob;
}

export async function listGenerations(): Promise<GenerationJob[]> {
  const data = await api.get<GenerationsResponse>("/api/generations");
  generationStore.update((state) => ({ ...state, jobs: data.generations }));
  return data.generations;
}

export async function getGeneration(id: string): Promise<GenerationJob> {
  const data = await api.get<GenerationResponse>(`/api/generations/${id}`);
  return data.generation;
}

export async function submitGeneration(payload: GeneratePayload): Promise<GenerationJob> {
  const data = await api.post<GenerationResponse>("/api/generate", {
    prompt: payload.prompt,
    aspect_ratio: payload.settings.aspect_ratio,
    resolution: payload.settings.resolution,
    output_format: payload.settings.output_format,
    enable_image_search: payload.settings.enable_image_search,
    enable_web_search: payload.settings.enable_web_search,
    generation_style: payload.generation_style,
    user_prompt: payload.user_prompt,
    key_selection: payload.key_selection,
    manual_key_id: payload.manual_key_id,
  });
  await listGenerations();
  return data.generation;
}

export async function deleteGeneration(id: string): Promise<void> {
  await api.del<{ ok: boolean }>(`/api/generations/${id}`);
  await listGenerations();
}
