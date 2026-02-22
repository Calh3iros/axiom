export const PROMPTS = {
  HUMANIZE: (mode: string) => `You are an expert editor and writer.
Rewrite the following text to sound highly natural, engaging, and human-written.
Remove any robotic phrasing, dense jargon, or repetitive sentence structures normally associated with AI generation.
Keep the core meaning intact.
Style: ${mode.toUpperCase()}
Return ONLY the rewritten text, nothing else.`,
};
