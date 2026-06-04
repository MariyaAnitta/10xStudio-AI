import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const PEXELS_KEY = process.env.PEXELS_API_KEY;

export async function fetchSceneImage(aiQuery: string, sceneId: string | number, orientation: 'portrait' | 'landscape' = 'landscape') {
  if (!PEXELS_KEY) {
    console.warn("PEXELS_API_KEY not found. Falling back to direct URLs.");
    return null;
  }

  try {
    // Step 1: Search Pexels with AI-generated photographer query
    const searchRes = await axios.get('https://api.pexels.com/v1/search', {
      headers: { Authorization: PEXELS_KEY },
      params: {
        query: aiQuery,
        orientation,
        size: 'large',
        per_page: 5
      }
    });

    const photos = searchRes.data.photos;
    if (!photos || !photos.length) {
      console.error(`No images found for: ${aiQuery}`);
      return null;
    }

    const photo = photos[0];
    const imageUrl = photo.src.original + (orientation === 'portrait' ? '?auto=compress&w=1080&h=1920&fit=crop' : '?auto=compress&w=1920&h=1080&fit=crop');

    // Step 2: Ensure assets folder exists
    const assetsDir = path.join(process.cwd(), 'public', 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Step 3: Download to assets/ (critical for HyperFrames)
    const filename = `scene_${sceneId}.jpg`;
    const dest = path.join(assetsDir, filename);
    const writer = fs.createWriteStream(dest);
    
    const imgRes = await axios.get(imageUrl, { responseType: 'stream' });
    imgRes.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', (err) => reject(err));
    });

    return {
      localPath: `/assets/${filename}`, // Public URL for the browser
      credit: `Photo by ${photo.photographer} on Pexels`,
      avgColor: photo.avg_color
    };
  } catch (error: any) {
    console.error(`Pexels Fetch Error: ${error.message}`);
    return null;
  }
}
