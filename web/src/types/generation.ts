export type GenerationStatus =
  | "queued"
  | "processing"
  | "downloading"
  | "completed"
  | "failed";

export interface GenerationJob {
  id: string;
  status: GenerationStatus;
  prompt: string;
  aspect_ratio: string | null;
  resolution: string | null;
  output_format: string | null;
  pose_id: string | null;
  generation_style: string | null;
  user_prompt: string | null;
  model_reference_id: string | null;
  outfit_reference_id: string | null;
  api_key_id: string | null;
  api_key_label: string | null;
  wavespeed_task_id: string | null;
  error: string | null;
  file_path: string | null;
  output_ext: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
}

export interface GenerationSettings {
  aspect_ratio: string;
  resolution: string;
  output_format: "png" | "jpeg";
  enable_image_search: boolean;
  enable_web_search: boolean;
}
