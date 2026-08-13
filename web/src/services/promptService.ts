import type { GenerationStyle, PosePreset } from "../types/prompt";
import type { ReferenceSlots } from "../types/references";

export const POSES: PosePreset[] = [
  {
    id: "instagram-outfit-flex",
    label: "Instagram Outfit Flex",
    description:
      "Showing off the outfit like an Instagram outfit-flex post: weight shifted to one hip, relaxed shoulders, one hand resting near a pocket or casually gesturing toward the garment, confident but understated expression.",
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

export const STYLES: GenerationStyle[] = [
  {
    id: "natural",
    label: "Natural",
    description: "natural, authentic lifestyle photography, soft available light",
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "high-fashion editorial photography, dramatic directional lighting, refined composition",
  },
  {
    id: "street",
    label: "Street",
    description: "contemporary street style photography, urban environment, candid energy",
  },
  {
    id: "glamour",
    label: "Glamour",
    description: "polished glamour photography, soft studio lighting, flattering finish",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "minimalist photography, clean background, muted tones, generous negative space",
  },
];

const CONSTRAINTS = `Create an authentic Instagram-style fashion photograph with natural body language, relaxed hand positioning, natural weight distribution and fashion-oriented framing. The result must not look stiff or artificially posed. Preserve the model's identity and keep the outfit from the outfit reference clearly recognizable.`;

export interface BuildPromptInput {
  references: ReferenceSlots;
  pose: PosePreset;
  style: GenerationStyle;
  userPrompt: string;
}

export function buildPrompt(input: BuildPromptInput): string {
  const parts: string[] = [];

  if (input.references.model) {
    parts.push(
      "Use the MODEL reference image as the source of identity: preserve the person's face, facial identity, hairstyle, body proportions and overall appearance exactly."
    );
  }
  if (input.references.outfit) {
    parts.push(
      "Use the OUTFIT reference image as the source of the outfit: dress the model in the exact outfit shown, preserving the garments, their colors, materials, cuts, details and styling."
    );
  }

  parts.push(`Pose direction: ${input.pose.description}`);
  parts.push(`Style direction: ${input.style.description}`);

  const user = input.userPrompt.trim();
  if (user) {
    parts.push(user.replace(/\s+/g, " ").trim());
  }

  parts.push(CONSTRAINTS);
  return parts.join("\n\n");
}

export function getPose(id: string): PosePreset {
  return POSES.find((pose) => pose.id === id) ?? POSES[0];
}

export function getStyle(id: string): GenerationStyle {
  return STYLES.find((style) => style.id === id) ?? STYLES[0];
}
