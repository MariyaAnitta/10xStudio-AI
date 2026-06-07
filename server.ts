import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fetchSceneImage } from './src/services/pexels_fetcher';
import { saveToFirestore, uploadToFirebaseStorage, getStorageAndDbStatus, getSession, saveSession, saveScheduledPost, getAndLockDuePosts, markPostPublished } from './src/services/firebaseService';

dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;

// Use venv python on Linux/Render, fallback to system python on Windows
const PYTHON_PATH = process.platform === 'win32'
  ? 'python'
  : (fs.existsSync(path.join(process.cwd(), 'venv', 'bin', 'python3'))
      ? path.join(process.cwd(), 'venv', 'bin', 'python3')
      : 'python3');

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
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use('/videos', express.static(path.join(process.cwd(), 'localvideos')));

// Serve built React files
const clientDist = path.join(process.cwd(), 'dist');
app.use(express.static(clientDist));

app.use((req, res, next) => {
  const start = Date.now();
  const timeStr = new Date().toLocaleTimeString();
  console.log(`\n[${timeStr}] 🌐 REQUEST: ${req.method} ${req.originalUrl}`);
  if (req.method === 'POST') {
    console.log(`[${timeStr}] 📥 BODY:`, JSON.stringify(req.body).slice(0, 150) + (JSON.stringify(req.body).length > 150 ? '...' : ''));
  }
  res.on('finish', () => {
    const duration = Date.now() - start;
    const emoji = res.statusCode >= 200 && res.statusCode < 300 ? '🟢' : '🔴';
    console.log(`[${timeStr}] ${emoji} RESPONSE: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// User Session Endpoints
app.get('/api/get-session', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email query parameter is required' });
  }
  try {
    const session = await getSession(email as string);
    return res.json({ success: true, session });
  } catch (error: any) {
    console.error(`[API] get-session error:`, error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/save-session', async (req, res) => {
  const { email, session } = req.body;
  if (!email || !session) {
    return res.status(400).json({ success: false, error: 'Email and session are required' });
  }
  try {
    await saveSession(email, session);
    return res.json({ success: true });
  } catch (error: any) {
    console.error(`[API] save-session error:`, error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

const videoDir = path.join(process.cwd(), 'localvideos');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

app.post('/api/generate-composition', async (req, res) => {
  const { prompt } = req.body;

  try {
    const escapedPrompt = prompt.replace(/"/g, '\\"');
    const pythonPath = PYTHON_PATH;
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
  const pythonPath = PYTHON_PATH;
  const scriptPath = path.join(process.cwd(), 'visual_processor_nano.py');

  console.log(`Starting Visual Automation Processor for: ${req.file.originalname}`);

  exec(`${pythonPath} "${scriptPath}" "${inputPath}" "${outputDir}"`, async (error, stdout, stderr) => {
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

      // Automatically upload to Google Cloud Storage
      const urls = [];
      for (const item of result.results) {
        const localPath = path.join(outputDir, item.filename);
        const destination = `generated/${Date.now()}-${item.filename}`;
        try {
          const publicUrl = await uploadToFirebaseStorage(localPath, destination);
          urls.push({ style: item.style, url: publicUrl });
        } catch (err) {
          console.error(`Failed to upload ${item.filename} to Google Cloud Storage:`, err);
          // Fallback to local URL if GCS fails
          urls.push({ 
            style: item.style, 
            url: `${req.protocol}://${req.get('host')}/assets/processed/${item.filename}`  
          });
        }
      }

      res.json({ success: true, versions: urls });

    } catch (parseError: any) {
      console.error("Pipeline Error:", parseError.message);
      res.status(500).json({ error: parseError.message, raw: stdout });
    }
  });
});

app.post('/api/visual-intelligence', upload.single('image'), async (req, res) => {
  let inputPath = '';
  let originalName = 'image.jpeg';

  if (req.file) {
    inputPath = req.file.path;
    originalName = req.file.originalname;
  } else if (req.body.imageUrl) {
    try {
      console.log(`[INTELLIGENCE] Downloading image from URL: ${req.body.imageUrl}`);
      const response = await fetch(req.body.imageUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const buffer = await response.arrayBuffer();
      originalName = `downloaded-${Date.now()}.jpeg`;
      inputPath = path.join(process.cwd(), 'public', 'uploads', originalName);
      fs.writeFileSync(inputPath, Buffer.from(buffer));
    } catch (err) {
      console.error("Failed to download image URL:", err);
      return res.status(400).json({ error: 'Failed to download provided image URL' });
    }
  } else {
    return res.status(400).json({ error: 'No image file or imageUrl provided' });
  }

  const { dishName, orders, margin, views, revenue, rating, avgOrders, avgViews } = req.body;
  
  console.log(`[INTELLIGENCE] Data Received:`, {
    dishName, orders, margin, views, revenue, rating
  });

  const pythonPath = PYTHON_PATH;
  const scriptPath = path.join(process.cwd(), 'visual_intelligence.py');

  console.log(`Starting Visual Intelligence Analysis for: ${originalName}`);

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

  exec(`${pythonPath} ${args}`, async (error, stdout, stderr) => {
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

      // Automatically save to Google Cloud Storage and Firestore
      const destination = `generated/${Date.now()}-${originalName}`;
      let publicUrl = '';
      let docId = '';
      try {
        publicUrl = await uploadToFirebaseStorage(inputPath, destination);
        const dataToSave = {
          ...result,
          selected_image_url: publicUrl,
          dishName, orders, margin, views, revenue, rating
        };
        docId = await saveToFirestore('visual_audits', dataToSave);
        console.log(`[INTELLIGENCE] Auto-saved to Firestore with ID: ${docId}`);
      } catch (err) {
        console.error(`[INTELLIGENCE] Failed to auto-save:`, err);
      }

      res.json({ ...result, docId, publicUrl });

    } catch (parseError: any) {
      console.error("Intelligence Pipeline Error:", parseError.message);
      res.status(500).json({ error: parseError.message, raw: stdout });
    }
  });
});

app.post('/api/generate-menu', upload.single('image'), (req, res) => {
  const { dishName, category, description, brandStyle, primaryColor } = req.body;
  const inputPath = req.file ? req.file.path.replace(/\\/g, '/') : 'null';
  
  console.log(`Starting Menu Card Generation for: ${dishName}`);

  const pythonPath = PYTHON_PATH;
  const scriptPath = path.join(process.cwd(), 'menu_generator.py');
  
  const args = [
    `"${scriptPath}"`,
    `"${dishName || 'Dish'}"`,
    `"${category || 'Starters'}"`,
    `"${description || ''}"`,
    `"${brandStyle || 'luxury'}"`,
    `"${primaryColor || '#D4121A'}"`,
    req.file ? `"${inputPath}"` : 'null'
  ].join(' ');

  exec(`${pythonPath} ${args}`, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Python Error: ${error.message}, Stderr: ${stderr}`);
      return res.status(500).json({ error: 'Failed to generate menu details' });
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
        throw new Error(result ? result.error : 'Invalid output from menu generator');
      }

      // Fetch a real professional photo of the specific dish from Pexels in AI Generate mode!
      if (!result.image_url && !req.file) {
        console.log(`[Pexels] Fetching professional food photo for: ${dishName}`);
        const pexelsData = await fetchSceneImage(`${dishName} food photography`, `menu_${Date.now()}`, 'landscape');
        if (pexelsData && pexelsData.localPath) {
          result.image_url = `http://localhost:${port}${pexelsData.localPath}`;
        } else {
          // Preset stock list fallback
          const foodImages: Record<string, string> = {
            'Starters': 'https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Soup': 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Main Course': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Rice & Biryani': 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Desserts': 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Beverages': 'https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Salads': 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Combo': 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800',
            'Breads': 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800',
          };
          result.image_url = foodImages[category] || foodImages['Starters'];
        }
      } else if (result.image_url) {
        const localPath = path.join(process.cwd(), 'public', result.image_url);
        const localUrl = `http://localhost:${port}${result.image_url}`;
        if (fs.existsSync(localPath)) {
          const destination = `generated/${Date.now()}-menu-dish.jpg`;
          try {
            const publicUrl = await uploadToFirebaseStorage(localPath, destination);
            // Keep publicUrl in result if needed, but use localUrl for image_url to ensure UI rendering
            result.public_url = publicUrl;
          } catch (err) {
            console.error(`Failed to upload menu image to Firebase:`, err);
          }
        }
        result.image_url = localUrl;
      }

      res.json(result);

    } catch (parseError: any) {
      console.error("Menu pipeline error:", parseError.message);
      res.status(500).json({ error: parseError.message, raw: stdout });
    }
  });
});

app.post('/api/save-intelligence', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    const { audit_results } = req.body;
    
    if (!file || !audit_results) {
      return res.status(400).json({ error: 'Missing image or audit results' });
    }

    const parsedResults = JSON.parse(audit_results);
    
    // Upload to Google Cloud Storage
    const destination = `generated/${Date.now()}-${file.originalname}`;
    const publicUrl = await uploadToFirebaseStorage(file.path, destination);

    // Save to Firestore
    const dataToSave = {
      ...parsedResults,
      selected_image_url: publicUrl,
    };
    
    const docId = await saveToFirestore('visual_audits', dataToSave);

    res.json({ success: true, docId, publicUrl });
  } catch (error: any) {
    console.error('Error saving to DB:', error);
    res.status(500).json({ error: 'Failed to save to database' });
  }
});

app.post('/api/export-mp4', async (req, res) => {
  const { html_content } = req.body;
  if (!html_content) return res.status(400).json({ error: 'No HTML content provided' });

  const timestamp = Date.now();
  const outputFileName = `video_${timestamp}.mp4`;
  const outputFilePath = path.join(process.cwd(), 'localvideos', outputFileName);
  const tempHtmlPath = path.join(process.cwd(), 'localvideos', `temp_${timestamp}.html`);

  try {
    fs.writeFileSync(tempHtmlPath, html_content, 'utf-8');

    const pythonPath = PYTHON_PATH;
    const scriptPath = path.join(process.cwd(), 'video_renderer.py');
    const duration = 15; // default 15s

    exec(`${pythonPath} "${scriptPath}" "${tempHtmlPath}" "${outputFilePath}" ${duration}`, async (error, stdout, stderr) => {
      // Clean up temp html
      if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);

      if (error) {
        console.error(`MP4 Export Error: ${stderr}`);
        return res.status(500).json({ error: 'Video rendering failed' });
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

        if (result && result.success) {
          const localFilePath = path.join(process.cwd(), 'localvideos', result.filename);
          let publicUrl = '';
          if (fs.existsSync(localFilePath)) {
            const destination = `videos/${Date.now()}-${result.filename}`;
            try {
              publicUrl = await uploadToFirebaseStorage(localFilePath, destination);
            } catch (err) {
              console.error(`Failed to upload MP4 to GCS Storage:`, err);
            }
          }

          // Save video metadata to Firestore
          try {
            await saveToFirestore('videos', {
              filename: result.filename,
              publicUrl: publicUrl,
              localUrl: `http://localhost:${port}/videos/${result.filename}`,
            });
          } catch (dbErr) {
            console.error(`[VIDEO] Failed to save video meta to Firestore:`, dbErr);
          }

          res.json({ 
            success: true, 
            mp4_url: `http://localhost:${port}/videos/${result.filename}`,
            publicUrl: publicUrl
          });
        } else {
          throw new Error('Invalid output from video renderer');
        }
      } catch (parseErr: any) {
        res.status(500).json({ error: parseErr.message });
      }
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/verify-storage-db', async (req, res) => {
  try {
    const status = await getStorageAndDbStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-campaign', upload.single('image'), (req, res) => {
  const { dishName, campaignType, brandStyle, tone, description, price, mode } = req.body;
  const inputPath = req.file ? req.file.path.replace(/\\/g, '/') : 'null';
  
  console.log(`Starting Campaign Generation for: ${dishName}, Type: ${campaignType}, Mode: ${mode || 'all'}`);

  const scriptPath = path.join(process.cwd(), 'campaign_generator.py');
  const pythonPath = PYTHON_PATH;
  
  // Create arguments safely
  const args = [
    `"${scriptPath}"`,
    `"${dishName || 'Dish'}"`,
    `"${campaignType || 'Promo'}"`,
    `"${brandStyle || 'luxury'}"`,
    `"${tone || 'Casual'}"`,
    `"${description || ''}"`,
    `"${price || ''}"`,
    `"${inputPath}"`,
    `"${mode || 'all'}"`
  ].join(' ');

  exec(`${pythonPath} ${args}`, async (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      console.error(`stderr: ${stderr}`);
      return res.status(500).json({ success: false, error: 'AI generation failed' });
    }
    
    try {
      // Find the first occurrence of '{' to parse JSON, ignoring any random python print statements before it
      const jsonStr = stdout.substring(stdout.indexOf('{'));
      const result = JSON.parse(jsonStr);

      // Map local generated images to localhost URLs and upload to GCS
      if (result.images) {
        const uploadedImages = [];
        for (const img of result.images) {
          const filename = path.basename(img.url);
          const localPath = path.join(process.cwd(), 'public', 'assets', 'processed', filename);
          let publicUrl = '';
          
          if (fs.existsSync(localPath)) {
            const destination = `generated/${Date.now()}-${filename}`;
            try {
              publicUrl = await uploadToFirebaseStorage(localPath, destination);
            } catch (err) {
              console.error(`Failed to upload campaign poster to GCS:`, err);
            }
          }
          
          uploadedImages.push({
            ...img,
            url: `/assets/processed/${filename}`,
            publicUrl: publicUrl || `/assets/processed/${filename}`
          });
        }
        result.images = uploadedImages;
      }

      // Save campaign metadata to Firestore
      try {
        const docId = await saveToFirestore('campaigns', {
          dishName: dishName || 'Dish',
          campaignType: campaignType || 'Promo',
          brandStyle: brandStyle || 'luxury',
          tone: tone || 'Casual',
          description: description || '',
          price: price || '',
          caption: result.caption || '',
          hashtags: result.hashtags || [],
          images: result.images || [],
        });
        result.docId = docId;
        console.log(`[CAMPAIGN] Saved to Firestore successfully: ${docId}`);
      } catch (dbErr) {
        console.error(`[CAMPAIGN] Failed to save campaign metadata:`, dbErr);
      }

      res.json(result);
    } catch (parseError) {
      console.error(`Failed to parse AI output. Raw output: ${stdout}`);
      res.status(500).json({ success: false, error: 'Failed to parse AI response' });
    }
  });
});

// --- HIGGSFIELD AI ENDPOINTS ---
app.post('/api/higgsfield/generate', async (req, res) => {
  const { prompt, aspect_ratio, resolution } = req.body;
  const apiKey = process.env.HIGGSFIELD_API_KEY;
  const apiSecret = process.env.HIGGSFIELD_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Higgsfield API credentials not configured.' });
  }

  try {
    const response = await fetch('https://platform.higgsfield.ai/higgsfield-ai/soul/standard', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}:${apiSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, aspect_ratio, resolution: resolution || '720p' })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || JSON.stringify(data));
    }
    res.json(data);
  } catch (error: any) {
    console.error('Higgsfield Generate Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/higgsfield/status', async (req, res) => {
  const { request_id } = req.query;
  const apiKey = process.env.HIGGSFIELD_API_KEY;
  const apiSecret = process.env.HIGGSFIELD_API_SECRET;

  if (!request_id) return res.status(400).json({ error: 'Missing request_id' });

  try {
    const response = await fetch(`https://platform.higgsfield.ai/requests/${request_id}/status`, {
      headers: {
        'Authorization': `Key ${apiKey}:${apiSecret}`
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Higgsfield Status Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// === Social Media Publishing API ===

const publishToSocialPlatform = async (platform: any, imageUrl: string, caption: string, metaToken: string, fbPageId: string, igBusinessId: string, fbPageToken?: string) => {
  const results: any = {};
  
  try {
    if (platform.id === 'fb') {
      const tokenToUse = fbPageToken || metaToken;
      const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${fbPageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: imageUrl,
          message: caption,
          access_token: tokenToUse
        })
      });
      results.facebook = await fbResponse.json();
      console.log('FB Publish Result:', results.facebook);
    }

    if (platform.id === 'ig_post' || platform.id === 'ig_story') {
      const isStory = platform.id === 'ig_story';
      const payload: any = {
        image_url: imageUrl,
        access_token: metaToken
      };
      if (isStory) {
        payload.media_type = 'STORIES';
      } else {
        payload.caption = caption;
      }

      const igCreateResponse = await fetch(`https://graph.facebook.com/v19.0/${igBusinessId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const igCreateData = await igCreateResponse.json();
      console.log('IG Create Result:', igCreateData);
      
      if (igCreateData.id) {
        let maxRetries = 5;
        let igPublishData = null;
        
        while (maxRetries > 0) {
          const igPublishResponse = await fetch(`https://graph.facebook.com/v19.0/${igBusinessId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: igCreateData.id,
              access_token: metaToken
            })
          });
          igPublishData = await igPublishResponse.json();
          
          if (igPublishData.error && igPublishData.error.code === 9007) {
            console.log(`IG Media not ready. Retrying in 5 seconds... (${maxRetries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            maxRetries--;
          } else {
            break;
          }
        }
        
        results.instagram = igPublishData;
        console.log('IG Publish Result:', results.instagram);
      } else {
        results.instagram = igCreateData;
      }
    }
  } catch (err) {
    console.error(`Error publishing to ${platform.id}:`, err);
    results.error = err;
  }
  
  return results;
};

app.post('/api/publish-now', upload.any(), async (req, res) => {
  try {
    const { caption, platforms } = req.body;
    const platformsArr = JSON.parse(platforms || '[]');
    
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'Image is required for publishing' });
    }

    const baseUrl = process.env.RENDER_EXTERNAL_URL || `${req.protocol}://${req.get('host')}`;

    const metaToken = process.env.META_ACCESS_TOKEN;
    const fbPageId = process.env.FB_PAGE_ID;
    const igBusinessId = process.env.IG_BUSINESS_ID;
    const fbPageToken = process.env.PAGE_ACCESS_TOKEN;

    if (!metaToken || metaToken === 'your_facebook_access_token_here') {
      return res.status(400).json({ error: 'Meta Access Token is missing or invalid. Please configure it in your environment variables.' });
    }

    const results: any = {};
    for (const platform of platformsArr) {
      const fileField = `image_${platform.id}`;
      const file = (req.files as any[]).find(f => f.fieldname === fileField) || (req.files as any[])[0];
      
      if (!file) continue;
      const imageUrl = `${baseUrl}/uploads/${file.filename}`;
      
      const resData = await publishToSocialPlatform(platform, imageUrl, caption, metaToken, fbPageId, igBusinessId, fbPageToken);
      Object.assign(results, resData);
    }

    res.json({ success: true, results });
  } catch (error: any) {
    console.error('Publishing error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/schedule-campaign', upload.any(), async (req, res) => {
  try {
    const { caption, platforms, dishName } = req.body;
    const platformsArr = JSON.parse(platforms || '[]');
    
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'Image is required for scheduling' });
    }

    const metaToken = process.env.META_ACCESS_TOKEN;
    if (!metaToken) {
      return res.status(400).json({ error: 'Meta Access Token is missing' });
    }

    const selectedPlatforms = platformsArr.filter((p: any) => p.scheduleTime);
    if (selectedPlatforms.length === 0) {
      return res.status(400).json({ error: 'No schedule time provided for any platform.' });
    }

    // Upload each image to GCS so URLs survive server restarts/ephemeral disk wipes
    const imageUrls: Record<string, string> = {};
    for (const file of req.files as any[]) {
      const platformId = file.fieldname.replace('image_', ''); // e.g. 'ig_post', 'ig_story', 'fb', 'fallback'
      const destination = `scheduled/${Date.now()}-${platformId}-${file.originalname}`;
      try {
        const gcsUrl = await uploadToFirebaseStorage(file.path, destination);
        imageUrls[platformId] = gcsUrl;
        console.log(`[Scheduler] GCS upload for ${platformId}: ${gcsUrl}`);
      } catch (uploadErr: any) {
        console.error(`[Scheduler] GCS upload failed for ${platformId}:`, uploadErr.message);
        // Fallback to local URL only if GCS fails
        const baseUrl = process.env.RENDER_EXTERNAL_URL || `${req.protocol}://${req.get('host')}`;
        imageUrls[platformId] = `${baseUrl}/uploads/${file.filename}`;
      }
    }

    // Save to Firestore queue — now with permanent GCS image URLs
    const docId = await saveScheduledPost({
      platforms: selectedPlatforms,
      imageUrls,
      caption,
      dishName: dishName || '',
    });

    console.log(`[Scheduler] Queued ${selectedPlatforms.length} platform(s) to Firestore. Doc: ${docId}`);
    selectedPlatforms.forEach((p: any) => {
      console.log(`[Scheduler] Platform: ${p.id} scheduled for ${p.scheduleTime}`);
    });
    
    res.json({ 
      success: true, 
      message: `Scheduled ${selectedPlatforms.length} platform(s) successfully! They will post at their configured times.`,
      firestoreDocId: docId,
    });
  } catch (error: any) {
    console.error('Scheduling error:', error);
    res.status(500).json({ error: error.message });
  }
});


// === Cron Endpoint — called every 5 minutes by an external scheduler ===
// Set up at: https://cron-job.org → target URL: GET https://your-app.onrender.com/api/cron/process-schedules
app.get('/api/cron/process-schedules', async (req, res) => {
  try {
    console.log('[CRON] Running scheduled posts processor...');
    const duePosts = await getAndLockDuePosts();

    if (duePosts.length === 0) {
      console.log('[CRON] No posts due. Sleeping.');
      return res.json({ success: true, processed: 0 });
    }

    const metaToken = process.env.META_ACCESS_TOKEN || '';
    const fbPageId = process.env.FB_PAGE_ID || '';
    const igBusinessId = process.env.IG_BUSINESS_ID || '';
    const fbPageToken = process.env.PAGE_ACCESS_TOKEN;

    let processedCount = 0;

    for (const post of duePosts) {
      const allResults: any = {};
      const now = new Date().toISOString();

      for (const platform of (post.platforms || [])) {
        if (!platform.scheduleTime || platform.scheduleTime > now) continue;

        const imageUrl = post.imageUrls[platform.id] || post.imageUrls['fallback'] || Object.values(post.imageUrls)[0];
        if (!imageUrl) {
          console.warn(`[CRON] No image URL for platform ${platform.id} in post ${post.id}`);
          continue;
        }

        console.log(`[CRON] Publishing ${platform.id} for post ${post.id}...`);
        const result = await publishToSocialPlatform(
          platform, imageUrl, post.caption, metaToken, fbPageId, igBusinessId, fbPageToken
        );
        Object.assign(allResults, result);
      }

      await markPostPublished(post.id, allResults);
      processedCount++;
    }

    console.log(`[CRON] Done. Processed ${processedCount} post(s).`);
    res.json({ success: true, processed: processedCount });
  } catch (error: any) {
    console.error('[CRON] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});



// Fallback for React Router (must be AFTER all API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// === Internal scheduled posts processor (runs on startup + every 5 minutes) ===
const runScheduledPostsProcessor = async () => {
  try {
    const duePosts = await getAndLockDuePosts();
    if (duePosts.length === 0) {
      console.log('[AUTO-SCHEDULER] No posts due at this time.');
      return;
    }

    const metaToken = process.env.META_ACCESS_TOKEN || '';
    const fbPageId = process.env.FB_PAGE_ID || '';
    const igBusinessId = process.env.IG_BUSINESS_ID || '';
    const fbPageToken = process.env.PAGE_ACCESS_TOKEN;
    let processedCount = 0;

    for (const post of duePosts) {
      const allResults: any = {};
      const now = new Date().toISOString();

      for (const platform of (post.platforms || [])) {
        if (!platform.scheduleTime || platform.scheduleTime > now) continue;

        const imageUrl = post.imageUrls[platform.id] || post.imageUrls['fallback'] || Object.values(post.imageUrls)[0] as string;
        if (!imageUrl) {
          console.warn(`[AUTO-SCHEDULER] No image URL for platform ${platform.id} in post ${post.id}`);
          continue;
        }

        console.log(`[AUTO-SCHEDULER] 🚀 Publishing ${platform.id} for doc ${post.id}...`);
        const result = await publishToSocialPlatform(
          platform, imageUrl, post.caption, metaToken, fbPageId, igBusinessId, fbPageToken
        );
        Object.assign(allResults, result);
      }

      await markPostPublished(post.id, allResults);
      processedCount++;
    }

    if (processedCount > 0) {
      console.log(`[AUTO-SCHEDULER] ✅ Processed ${processedCount} scheduled post(s).`);
    }
  } catch (err: any) {
    console.error('[AUTO-SCHEDULER] Error:', err.message);
  }
};

app.listen(port, '0.0.0.0', () => {
  console.log(`10xStudio API (Python Bridged) running at http://0.0.0.0:${port}`);
  
  // Process any missed posts immediately on startup
  setTimeout(runScheduledPostsProcessor, 5000);
  
  // Then check every 5 minutes continuously
  setInterval(runScheduledPostsProcessor, 5 * 60 * 1000);
  console.log('[AUTO-SCHEDULER] Scheduled posts processor started (runs every 5 minutes).');
});
