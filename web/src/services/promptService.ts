import type { ReferenceSlots } from "../types/references";

/* Fixed pose — natural, relaxed Instagram fashion pose. Only adjusts posing, never background. */
const FIXED_POSE = `Natural relaxed fashion pose: weight on one leg, hands placed loosely, effortless and candid body language, natural weight distribution, relaxed hands, not stiff or posed. Keep the pose authentic and Instagram-style, like an influencer naturally showing off an outfit. Only change the pose and outfit — do not change the background, environment, lighting, or camera perspective.`;

export const MODEL_IDENTITY = `Make the person in the main model reference wear the exact outfit shown in the outfit reference. Preserve the model's identity, face, hairstyle, body proportions, skin texture, appearance, background, environment, mirror, lighting, camera perspective, and overall visual character from the main reference. Only change the outfit and pose.`;

export const QUALITY = `Keep the result highly photorealistic, with realistic skin, fabric, lighting, and natural image quality.`;

export const NEGATIVE_PROMPT = `identity change, face change, hairstyle change, body modification, altered proportions, changed background, changed environment, different lighting, different mirror, added objects, extra people, outfit alteration, color change, material change, distorted anatomy, deformed hands, unrealistic skin, skin smoothing, beauty retouching, artificial pose, CGI, cartoon, blurry, low quality, text, logo, watermark`;

export interface BuildPromptInput {
  references: ReferenceSlots;
  userPrompt: string;
}

export function buildPrompt(input: BuildPromptInput): string {
  const user = input.userPrompt.trim().replace(/\s+/g, " ");
  const parts: string[] = [MODEL_IDENTITY, FIXED_POSE, QUALITY];
  if (user) parts.push(user);
  parts.push(`Avoid: ${NEGATIVE_PROMPT}`);
  return parts.join("\n\n");
}
