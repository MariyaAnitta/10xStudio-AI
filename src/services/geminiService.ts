export interface VideoComposition {
  title: string;
  html: string; // The full 10xFrame HTML composition
  totalDuration: number; // in seconds
  scenes?: any[]; // Fallback scene-based schema
  audioTracks?: any[]; // Narrator audio tracks
}

export async function generateVideoComposition(prompt: string): Promise<VideoComposition> {
  const response = await fetch('/api/generate-composition', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate video composition via 10xStudio API');
  }

  return response.json();
}
