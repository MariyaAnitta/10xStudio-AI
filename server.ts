import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fetchSceneImage } from './src/services/pexels_fetcher';

dotenv.config();

const app = express();
const port = 3005;

// Configure Multer for local uploads
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// Gold Standard Fallback Library (High-End Unsplash IDs)
const FALLBACK_IMAGES = [
  "photo-1514362545857-3bc16c4c7d1b", // Cocktail
  "photo-1414235077428-338989a2e8c0", // Dining
  "photo-1552566626-52f8b828add9", // Luxury Interior
  "photo-1470770841072-f978cf4d019e", // Rooftop
  "photo-1504674900247-0877df9cc836", // Food Plating
  "photo-1517248135467-4c7edcad34c4", // Modern Office
  "photo-1486406146926-c627a92ad1ab", // City Architecture
  "photo-1510626176961-4b57d4f39208", // Drinks
  "photo-1554118811-1e0d58224f24", // Minimal Interior
  "photo-1514924013511-282bb1155ab3"  // Evening Skyline
];

app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(process.cwd(), 'public', 'assets')));

app.post('/api/generate-composition', async (req, res) => {
  const { prompt } = req.body;

  try {
    const escapedPrompt = prompt.replace(/"/g, '\\"');
    const pythonPath = 'python';
    const scriptPath = path.join(process.cwd(), 'gemini_bridge.py');
    
    console.log(`Starting Python Bridge for: ${prompt.substring(0, 50)}...`);

    exec(`${pythonPath} "${scriptPath}" "${escapedPrompt}"`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Python Error: ${error.message}`);
        return res.status(500).json({ error: 'Failed to generate composition via Python Bridge' });
      }
      
      try {
        const matches = stdout.match(/\{[\s\S]*\}/g);
        if (!matches) throw new Error('No JSON-like structure found in AI response');

        let result: any = null;
        for (const match of matches.reverse()) {
          try {
            const parsed = JSON.parse(match);
            if (parsed.title && parsed.html) {
              result = parsed;
              break;
            }
          } catch (e) { continue; }
        }

        if (!result) throw new Error('Could not find a valid Video Composition in the AI output');

        if (result.scenes && result.scenes.length > 0) {
          console.log(`Processing ${result.scenes.length} scenes...`);
          
          for (let i = 0; i < result.scenes.length; i++) {
            const scene = result.scenes[i];
            const imageData = await fetchSceneImage(scene.image_query, i);
            const placeholder = `PLACEHOLDER_IMAGE_${i}`;
            
            if (imageData && imageData.localPath) {
              const placeholderRegex = new RegExp(`PLACEHOLDER_IMAGE_${i}`, 'g');
              const fullUrl = `http://localhost:3005${imageData.localPath}`;
              result.html = result.html.replace(placeholderRegex, fullUrl);
              console.log(`[Pexels] Scene ${i} globally mapped to absolute asset: ${fullUrl}`);
            } else {
              // DIVERSE FALLBACK SYSTEM
              const fallbackId = FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
              const fallbackUrl = `https://images.unsplash.com/photo-${fallbackId}?auto=format&fit=crop&q=80&w=1920`;
              const placeholderRegex = new RegExp(`PLACEHOLDER_IMAGE_${i}`, 'g');
              result.html = result.html.replace(placeholderRegex, fallbackUrl);
              console.log(`[Fallback] Scene ${i} globally mapped to diverse Unsplash ID: ${fallbackId}`);
            }
          }
        }

        res.json(result);
      } catch (parseError: any) {
        console.error("Pipeline Error:", parseError.message);
        res.status(500).json({ error: parseError.message, raw: stdout });
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/visual-automation', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const inputPath = req.file.path;
  const outputDir = path.join(process.cwd(), 'public', 'assets', 'processed');
  const pythonPath = 'python';
  const scriptPath = path.join(process.cwd(), 'visual_processor_nano.py');

  console.log(`Starting Visual Automation Processor for: ${req.file.originalname}`);

  exec(`${pythonPath} "${scriptPath}" "${inputPath}" "${outputDir}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Python Error: ${error.message}`);
      return res.status(500).json({ error: 'Failed to process image via Python Bridge' });
    }

    try {
      const lines = stdout.trim().split('\n');
      let result = null;
      for (const line of lines.reverse()) {
        if (line.trim().startsWith('{')) {
          try {
            result = JSON.parse(line);
            break;
          } catch (e) {}
        }
      }

      if (!result || !result.success) {
        throw new Error(result ? result.error : 'Invalid output from processor');
      }

      // Handle multiple results
      const urls = result.results.map((item: any) => ({
        style: item.style,
        url: `http://localhost:${port}/assets/processed/${item.filename}`
      }));

      res.json({ success: true, versions: urls });

    } catch (parseError: any) {
      console.error("Pipeline Error:", parseError.message);
      res.status(500).json({ error: parseError.message, raw: stdout });
    }
  });
});

app.post('/api/visual-intelligence', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const { dishName, orders, margin, views, revenue, rating, avgOrders, avgViews } = req.body;
  
  console.log(`[INTELLIGENCE] Data Received:`, {
    dishName, orders, margin, views, revenue, rating
  });

  const inputPath = req.file.path;
  const pythonPath = 'python';
  const scriptPath = path.join(process.cwd(), 'visual_intelligence.py');

  console.log(`Starting Visual Intelligence Analysis for: ${req.file.originalname}`);

  const args = [
    `"${scriptPath}"`,
    `"${inputPath}"`,
    `"${dishName || 'Dish'}"`,
    orders || 0,
    margin || 0,
    views || 0,
    `"${revenue || '₹0'}"`,
    rating || 0,
    avgOrders || 1000,
    avgViews || 5000
  ].join(' ');

  exec(`${pythonPath} ${args}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Python Error: ${error.message}`);
      return res.status(500).json({ error: 'Failed to analyze visual intelligence' });
    }

    try {
      const lines = stdout.trim().split('\n');
      let result = null;
      for (const line of lines.reverse()) {
        if (line.trim().startsWith('{')) {
          try {
            result = JSON.parse(line);
            break;
          } catch (e) {}
        }
      }

      if (!result || !result.success) {
        throw new Error(result ? result.error : 'Invalid output from intelligence engine');
      }

      res.json(result);

    } catch (parseError: any) {
      console.error("Intelligence Pipeline Error:", parseError.message);
      res.status(500).json({ error: parseError.message, raw: stdout });
    }
  });
});

app.listen(port, () => {
  console.log(`10xStudio API (Python Bridged) running at http://localhost:${port}`);
});
