import type { PosePreset } from "../types/prompt";
import type { ReferenceSlots } from "../types/references";

export const POSES: PosePreset[] = [
  {
    id: "instagram-natural",
    label: "Instagram Natural",
    description:
      "Use a natural, relaxed Instagram fashion pose with realistic body language, natural weight distribution, relaxed hands, and an effortless candid feel.",
  },
  {
    id: "mirror-fit-check",
    label: "Mirror Fit Check",
    description:
      "Posed like a casual mirror fit-check: the model angled toward a mirror as if checking the fit, phone half-raised, natural and relaxed body language, candid energy.",
  },
  {
    id: "casual-standing",
    label: "Casual Standing",
    description:
      "Natural relaxed standing pose, weight on one leg, hands placed loosely, effortless and candid, not stiff or posed.",
  },
  {
    id: "street-fashion",
    label: "Street Fashion",
    description:
      "Street-style fashion pose: pausing on a city sidewalk, dynamic framing, relaxed posture, authentic streetwear attitude.",
  },
  {
    id: "walking-fashion",
    label: "Walking Fashion",
    description:
      "Caught mid-stride while walking, natural motion and rhythm, the garment in light movement, candid street photography style.",
  },
  {
    id: "seated-lifestyle",
    label: "Seated Lifestyle",
    description:
      "Relaxed seated pose in a lifestyle setting, legs naturally crossed, comfortable hand placement, authentic and unhurried.",
  },
  {
    id: "candid-influencer",
    label: "Candid Influencer",
    description:
      "Candid influencer moment: laughing softly or looking away from the camera, mid-conversation energy, naturally unposed.",
  },
  {
    id: "editorial-fashion",
    label: "Editorial Fashion",
    description:
      "Editorial fashion pose: confident and intentional, strong posture with elegant elongated lines, styled like a magazine shoot.",
  },
];

/* Fixed prompt sections. Always present, non-editable. */

export const MODEL_IDENTITY = `Make the person in the main model reference wear the exact outfit shown in the outfit reference. Preserve the model's identity, face, hairstyle, body proportions, skin texture, appearance, background, environment, mirror, lighting, camera perspective, and overall visual character from the main reference. Only change the outfit and pose.`;

export const QUALITY = `Keep the result highly photorealistic, with realistic skin, fabric, lighting, and natural image quality.`;

export const NEGATIVE_PROMPT = `identity change, face change, hairstyle change, body modification, altered proportions, changed background, changed environment, different lighting, different mirror, added objects, extra people, outfit alteration, color change, material change, distorted anatomy, deformed hands, unrealistic skin, skin smoothing, beauty retouching, artificial pose, CGI, cartoon, blurry, low quality, text, logo, watermark`;

/* ------------------------------------------------------------------ structure */

export interface PromptSections {
  identity: string;
  pose: string;
  quality: string;
  userPrompt: string | null;
  negative: string;
}

export interface BuildPromptInput {
  references: ReferenceSlots;
  pose: PosePreset;
  userPrompt: string;
}

export function buildPromptSections(input: BuildPromptInput): PromptSections {
  const user = input.userPrompt.trim();
  return {
    identity: MODEL_IDENTITY,
    pose: input.pose.description,
    quality: QUALITY,
    userPrompt: user ? user.replace(/\s+/g, " ").trim() : null,
    negative: NEGATIVE_PROMPT,
  };
}

export function composePositivePrompt(sections: PromptSections): string {
  const parts: string[] = [sections.identity, sections.pose, sections.quality];
  if (sections.userPrompt) parts.push(sections.userPrompt);
  parts.push(`Avoid: ${sections.negative}`);
  return parts.join("\n\n");
}

export function buildPrompt(input: BuildPromptInput): string {
  return composePositivePrompt(buildPromptSections(input));
}

export function getPose(id: string): PosePreset {
  return POSES.find((pose) => pose.id === id) ?? POSES[0];
}
