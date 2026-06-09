// server.ts
import express from "express";
import cors from "cors";
import dotenv2 from "dotenv";
import { exec } from "child_process";
import path3 from "path";
import fs2 from "fs";
import multer from "multer";

// src/services/pexels_fetcher.ts
import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
var PEXELS_KEY = process.env.PEXELS_API_KEY;
async function fetchSceneImage(aiQuery, sceneId, orientation = "landscape") {
  if (!PEXELS_KEY) {
    console.warn("PEXELS_API_KEY not found. Falling back to direct URLs.");
    return null;
  }
  try {
    const searchRes = await axios.get("https://api.pexels.com/v1/search", {
      headers: { Authorization: PEXELS_KEY },
      params: {
        query: aiQuery,
        orientation,
        size: "large",
        per_page: 5
      }
    });
    const photos = searchRes.data.photos;
    if (!photos || !photos.length) {
      console.error(`No images found for: ${aiQuery}`);
      return null;
    }
    const photo = photos[0];
    const imageUrl = photo.src.original + (orientation === "portrait" ? "?auto=compress&w=1080&h=1920&fit=crop" : "?auto=compress&w=1920&h=1080&fit=crop");
    const assetsDir = path.join(process.cwd(), "public", "assets");
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    const filename = `scene_${sceneId}.jpg`;
    const dest = path.join(assetsDir, filename);
    const writer = fs.createWriteStream(dest);
    const imgRes = await axios.get(imageUrl, { responseType: "stream" });
    imgRes.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on("finish", () => resolve());
      writer.on("error", (err) => reject(err));
    });
    return {
      localPath: `/assets/${filename}`,
      // Public URL for the browser
      credit: `Photo by ${photo.photographer} on Pexels`,
      avgColor: photo.avg_color
    };
  } catch (error) {
    console.error(`Pexels Fetch Error: ${error.message}`);
    return null;
  }
}

// src/services/firebaseService.ts
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import path2 from "path";
var serviceAccountPath = path2.join(process.cwd(), "service-account.json");
var app;
try {
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
  console.log("Firebase Admin initialized successfully under unified account (tenxds-agents-idp).");
} catch (error) {
  console.error("Firebase Admin initialization error", error);
  app = admin.app();
}
var db = getFirestore(app);
async function uploadToFirebaseStorage(localFilePath, destination) {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "10xstudio-ai";
  console.log(`
[STORAGE] \u{1F680} Initiating upload to Google Cloud Storage...`);
  console.log(`[STORAGE] \u{1F4C1} Local file: ${localFilePath}`);
  console.log(`[STORAGE] \u{1F4E6} Bucket: ${bucketName}`);
  console.log(`[STORAGE] \u2601\uFE0F Destination: ${destination}`);
  try {
    const bucket = getStorage(app).bucket(bucketName);
    await bucket.upload(localFilePath, {
      destination,
      metadata: {
        cacheControl: "public, max-age=31536000"
      }
    });
    console.log(`[STORAGE] \u{1F4E4} File successfully uploaded to GCS bucket.`);
    let publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
    try {
      await bucket.file(destination).makePublic();
      console.log(`[STORAGE] \u{1F513} File ACL set to public read access.`);
    } catch (aclError) {
      console.log(`[STORAGE] \u2139\uFE0F Uniform Bucket-Level Access or permissions restricted ACL settings. Generating signed URL instead.`);
      const [signedUrl] = await bucket.file(destination).getSignedUrl({
        action: "read",
        expires: "01-01-2099"
        // Far future expiry
      });
      publicUrl = signedUrl;
    }
    console.log(`[STORAGE] \u2705 Upload Complete!`);
    console.log(`[STORAGE] \u{1F517} GCS URL: ${publicUrl}
`);
    return publicUrl;
  } catch (error) {
    console.error(`
[STORAGE] \u274C GCS Upload Failed! Error: ${error.message}
`);
    throw error;
  }
}
async function saveToFirestore(collectionName, data) {
  const docRef = db.collection(collectionName).doc();
  await docRef.set({
    ...data,
    id: docRef.id,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  return docRef.id;
}
async function getStorageAndDbStatus() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "10xstudio-ai";
  const status = {
    firestoreConnected: false,
    firestoreDocuments: [],
    gcsConnected: false,
    gcsFiles: [],
    error: null
  };
  try {
    const snapshot = await db.collection("visual_audits").orderBy("timestamp", "desc").limit(5).get();
    status.firestoreConnected = true;
    status.firestoreDocuments = snapshot.docs.map((doc) => ({
      id: doc.id,
      dishName: doc.data().dishName || "Unnamed",
      timestamp: doc.data().timestamp
    }));
    const bucket = getStorage(app).bucket(bucketName);
    const [files] = await bucket.getFiles({ prefix: "generated/", maxResults: 10 });
    status.gcsConnected = true;
    status.gcsFiles = files.map((file) => ({
      name: file.name,
      publicUrl: `https://storage.googleapis.com/${bucketName}/${file.name}`
    }));
  } catch (err) {
    status.error = err.message;
    console.error("[DIAGNOSTICS] Diagnostic query failed:", err.message);
  }
  return status;
}
async function getSession(email) {
  console.log(`[FIRESTORE] \u{1F50D} Fetching session for email: ${email}`);
  try {
    const docRef = db.collection("userSessions").doc(email);
    const doc = await docRef.get();
    if (doc.exists) {
      console.log(`[FIRESTORE] \u2705 Session found for email: ${email}`);
      return doc.data();
    }
    console.log(`[FIRESTORE] \u2139\uFE0F No session found for email: ${email}`);
    return null;
  } catch (error) {
    console.error(`[FIRESTORE] \u274C Failed to fetch session for email: ${email}, Error: ${error.message}`);
    throw error;
  }
}
async function saveSession(email, sessionData) {
  console.log(`[FIRESTORE] \u{1F4BE} Saving session for email: ${email}`);
  try {
    const docRef = db.collection("userSessions").doc(email);
    await docRef.set({
      ...sessionData,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }, { merge: true });
    console.log(`[FIRESTORE] \u2705 Session successfully synced for email: ${email}`);
    return true;
  } catch (error) {
    console.error(`[FIRESTORE] \u274C Failed to save session for email: ${email}, Error: ${error.message}`);
    throw error;
  }
}

// server.ts
dotenv2.config();
var app2 = express();
var port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;
var PYTHON_PATH = process.platform === "win32" ? "python" : fs2.existsSync(path3.join(process.cwd(), "venv", "bin", "python3")) ? path3.join(process.cwd(), "venv", "bin", "python3") : "python3";
var uploadDir = path3.join(process.cwd(), "public", "uploads");
if (!fs2.existsSync(uploadDir)) {
  fs2.mkdirSync(uploadDir, { recursive: true });
}
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
var upload = multer({ storage });
var FALLBACK_IMAGES = [
  "photo-1514362545857-3bc16c4c7d1b",
  // Cocktail
  "photo-1414235077428-338989a2e8c0",
  // Dining
  "photo-1552566626-52f8b828add9",
  // Luxury Interior
  "photo-1470770841072-f978cf4d019e",
  // Rooftop
  "photo-1504674900247-0877df9cc836",
  // Food Plating
  "photo-1517248135467-4c7edcad34c4",
  // Modern Office
  "photo-1486406146926-c627a92ad1ab",
  // City Architecture
  "photo-1510626176961-4b57d4f39208",
  // Drinks
  "photo-1554118811-1e0d58224f24",
  // Minimal Interior
  "photo-1514924013511-282bb1155ab3"
  // Evening Skyline
];
app2.use(cors());
app2.use(express.json());
app2.use("/assets", express.static(path3.join(process.cwd(), "public", "assets")));
app2.use("/uploads", express.static(path3.join(process.cwd(), "public", "uploads")));
app2.use("/videos", express.static(path3.join(process.cwd(), "localvideos")));
var clientDist = path3.join(process.cwd(), "dist");
app2.use(express.static(clientDist));

// /api/proxy-image?url=... — Proxy to bypass CORS on GCS signed URLs
app2.get("/api/proxy-image", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).json({ error: "Missing url query parameter" });
  }
  try {
    const imgRes = await axios.get(imageUrl, { responseType: "stream" });
    const contentType = imgRes.headers["content-type"] || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    imgRes.data.pipe(res);
  } catch (err) {
    console.error("[proxy-image] Error:", err.message);
    res.status(500).json({ error: "Proxy failed" });
  }
});

app2.use((req, res, next) => {
  const start = Date.now();
  const timeStr = (/* @__PURE__ */ new Date()).toLocaleTimeString();
  console.log(`
[${timeStr}] \u{1F310} REQUEST: ${req.method} ${req.originalUrl}`);
  if (req.method === "POST") {
    console.log(`[${timeStr}] \u{1F4E5} BODY:`, JSON.stringify(req.body).slice(0, 150) + (JSON.stringify(req.body).length > 150 ? "..." : ""));
  }
  res.on("finish", () => {
    const duration = Date.now() - start;
    const emoji = res.statusCode >= 200 && res.statusCode < 300 ? "\u{1F7E2}" : "\u{1F534}";
    console.log(`[${timeStr}] ${emoji} RESPONSE: ${res.statusCode} (${duration}ms)`);
  });
  next();
});
app2.get("/api/get-session", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ success: false, error: "Email query parameter is required" });
  }
  try {
    const session = await getSession(email);
    return res.json({ success: true, session });
  } catch (error) {
    console.error(`[API] get-session error:`, error);
    return res.status(500).json({ success: false, error: error.message });
  }
});
app2.post("/api/save-session", async (req, res) => {
  const { email, session } = req.body;
  if (!email || !session) {
    return res.status(400).json({ success: false, error: "Email and session are required" });
  }
  try {
    await saveSession(email, session);
    return res.json({ success: true });
  } catch (error) {
    console.error(`[API] save-session error:`, error);
    return res.status(500).json({ success: false, error: error.message });
  }
});
var videoDir = path3.join(process.cwd(), "localvideos");
if (!fs2.existsSync(videoDir)) {
  fs2.mkdirSync(videoDir, { recursive: true });
}
app2.post("/api/generate-composition", async (req, res) => {
  const { prompt } = req.body;
  try {
    const escapedPrompt = prompt.replace(/"/g, '\\"');
    const pythonPath = PYTHON_PATH;
    const scriptPath = path3.join(process.cwd(), "gemini_bridge.py");
    console.log(`Starting Python Bridge for: ${prompt.substring(0, 50)}...`);
    exec(`${pythonPath} "${scriptPath}" "${escapedPrompt}"`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Python Error: ${error.message}`);
        return res.status(500).json({ error: "Failed to generate composition via Python Bridge" });
      }
      try {
        const matches = stdout.match(/\{[\s\S]*\}/g);
        if (!matches) throw new Error("No JSON-like structure found in AI response");
        let result = null;
        for (const match of matches.reverse()) {
          try {
            const parsed = JSON.parse(match);
            if (parsed.title && parsed.html) {
              result = parsed;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        if (!result) throw new Error("Could not find a valid Video Composition in the AI output");
        if (result.scenes && result.scenes.length > 0) {
          console.log(`Processing ${result.scenes.length} scenes...`);
          for (let i = 0; i < result.scenes.length; i++) {
            const scene = result.scenes[i];
            const imageData = await fetchSceneImage(scene.image_query, i);
            const placeholder = `PLACEHOLDER_IMAGE_${i}`;
            if (imageData && imageData.localPath) {
              const placeholderRegex = new RegExp(`PLACEHOLDER_IMAGE_${i}`, 'g');
              const fullUrl = imageData.localPath;
              result.html = result.html.replace(placeholderRegex, fullUrl);
              console.log(`[Pexels] Scene ${i} globally mapped to absolute asset: ${fullUrl}`);
            } else {
              const fallbackId = FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
              const fallbackUrl = `https://images.unsplash.com/photo-${fallbackId}?auto=format&fit=crop&q=80&w=1920`;
              const placeholderRegex = new RegExp(`PLACEHOLDER_IMAGE_${i}`, "g");
              result.html = result.html.replace(placeholderRegex, fallbackUrl);
              console.log(`[Fallback] Scene ${i} globally mapped to diverse Unsplash ID: ${fallbackId}`);
            }
          }
        }
        res.json(result);
      } catch (parseError) {
        console.error("Pipeline Error:", parseError.message);
        res.status(500).json({ error: parseError.message, raw: stdout });
      }
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});
app2.post("/api/visual-automation", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded" });
  }
  const inputPath = req.file.path;
  const outputDir = path3.join(process.cwd(), "public", "assets", "processed");
  const pythonPath = PYTHON_PATH;
  const scriptPath = path3.join(process.cwd(), "visual_processor_nano.py");
  console.log(`Starting Visual Automation Processor for: ${req.file.originalname}`);
  exec(`${pythonPath} "${scriptPath}" "${inputPath}" "${outputDir}"`, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Python Error: ${error.message}`);
      return res.status(500).json({ error: "Failed to process image via Python Bridge" });
    }
    try {
      const lines = stdout.trim().split("\n");
      let result = null;
      for (const line of lines.reverse()) {
        if (line.trim().startsWith("{")) {
          try {
            result = JSON.parse(line);
            break;
          } catch (e) {
          }
        }
      }
      if (!result || !result.success) {
        throw new Error(result ? result.error : "Invalid output from processor");
      }
      const urls = [];
      for (const item of result.results) {
        const localPath = path3.join(outputDir, item.filename);
        const destination = `generated/${Date.now()}-${item.filename}`;
        try {
          const publicUrl = await uploadToFirebaseStorage(localPath, destination);
          urls.push({ style: item.style, url: publicUrl });
        } catch (err) {
          console.error(`Failed to upload ${item.filename} to Google Cloud Storage:`, err);
          urls.push({
            style: item.style,
            url: `${req.protocol}://${req.get("host")}/assets/processed/${item.filename}`
          });
        }
      }
      res.json({ success: true, versions: urls });
    } catch (parseError) {
      console.error("Pipeline Error:", parseError.message);
      res.status(500).json({ error: parseError.message, raw: stdout });
    }
  });
});
app2.post("/api/visual-intelligence", upload.single("image"), async (req, res) => {
  let inputPath = "";
  let originalName = "image.jpeg";
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
      inputPath = path3.join(process.cwd(), "public", "uploads", originalName);
      fs2.writeFileSync(inputPath, Buffer.from(buffer));
    } catch (err) {
      console.error("Failed to download image URL:", err);
      return res.status(400).json({ error: "Failed to download provided image URL" });
    }
  } else {
    return res.status(400).json({ error: "No image file or imageUrl provided" });
  }
  const { dishName, orders, margin, views, revenue, rating, avgOrders, avgViews } = req.body;
  console.log(`[INTELLIGENCE] Data Received:`, {
    dishName,
    orders,
    margin,
    views,
    revenue,
    rating
  });
  const pythonPath = PYTHON_PATH;
  const scriptPath = path3.join(process.cwd(), "visual_intelligence.py");
  console.log(`Starting Visual Intelligence Analysis for: ${originalName}`);
  const args = [
    `"${scriptPath}"`,
    `"${inputPath}"`,
    `"${dishName || "Dish"}"`,
    orders || 0,
    margin || 0,
    views || 0,
    `"${revenue || "\u20B90"}"`,
    rating || 0,
    avgOrders || 1e3,
    avgViews || 5e3
  ].join(" ");
  exec(`${pythonPath} ${args}`, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Python Error: ${error.message}`);
      return res.status(500).json({ error: "Failed to analyze visual intelligence" });
    }
    try {
      const lines = stdout.trim().split("\n");
      let result = null;
      for (const line of lines.reverse()) {
        if (line.trim().startsWith("{")) {
          try {
            result = JSON.parse(line);
            break;
          } catch (e) {
          }
        }
      }
      if (!result || !result.success) {
        throw new Error(result ? result.error : "Invalid output from intelligence engine");
      }
      const destination = `generated/${Date.now()}-${originalName}`;
      let publicUrl = "";
      let docId = "";
      try {
        publicUrl = await uploadToFirebaseStorage(inputPath, destination);
        const dataToSave = {
          ...result,
          selected_image_url: publicUrl,
          dishName,
          orders,
          margin,
          views,
          revenue,
          rating
        };
        docId = await saveToFirestore("visual_audits", dataToSave);
        console.log(`[INTELLIGENCE] Auto-saved to Firestore with ID: ${docId}`);
      } catch (err) {
        console.error(`[INTELLIGENCE] Failed to auto-save:`, err);
      }
      res.json({ ...result, docId, publicUrl });
    } catch (parseError) {
      console.error("Intelligence Pipeline Error:", parseError.message);
      res.status(500).json({ error: parseError.message, raw: stdout });
    }
  });
});
app2.post("/api/generate-menu", upload.single("image"), (req, res) => {
  const { dishName, category, description, brandStyle, primaryColor } = req.body;
  const inputPath = req.file ? req.file.path.replace(/\\/g, "/") : "null";
  console.log(`Starting Menu Card Generation for: ${dishName}`);
  const pythonPath = PYTHON_PATH;
  const scriptPath = path3.join(process.cwd(), "menu_generator.py");
  const args = [
    `"${scriptPath}"`,
    `"${dishName || "Dish"}"`,
    `"${category || "Starters"}"`,
    `"${description || ""}"`,
    `"${brandStyle || "luxury"}"`,
    `"${primaryColor || "#D4121A"}"`,
    req.file ? `"${inputPath}"` : "null"
  ].join(" ");
  exec(`${pythonPath} ${args}`, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Python Error: ${error.message}, Stderr: ${stderr}`);
      return res.status(500).json({ error: "Failed to generate menu details" });
    }
    try {
      const lines = stdout.trim().split("\n");
      let result = null;
      for (const line of lines.reverse()) {
        if (line.trim().startsWith("{")) {
          try {
            result = JSON.parse(line);
            break;
          } catch (e) {
          }
        }
      }
      if (!result || !result.success) {
        throw new Error(result ? result.error : "Invalid output from menu generator");
      }
      if (!result.image_url && !req.file) {
        console.log(`[Pexels] Fetching professional food photo for: ${dishName}`);
        const pexelsData = await fetchSceneImage(`${dishName} food photography`, `menu_${Date.now()}`, "landscape");
        if (pexelsData && pexelsData.localPath) {
          result.image_url = pexelsData.localPath;
        } else {
          const foodImages = {
            "Starters": "https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg?auto=compress&cs=tinysrgb&w=800",
            "Soup": "https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=800",
            "Main Course": "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800",
            "Rice & Biryani": "https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=800",
            "Desserts": "https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800",
            "Beverages": "https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=800",
            "Salads": "https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=800",
            "Combo": "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800",
            "Breads": "https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800"
          };
          result.image_url = foodImages[category] || foodImages["Starters"];
        }
      } else if (result.image_url) {
        const localPath = path3.join(process.cwd(), "public", result.image_url);
        const localUrl = result.image_url;
        if (fs2.existsSync(localPath)) {
          const destination = `generated/${Date.now()}-menu-dish.jpg`;
          try {
            const publicUrl = await uploadToFirebaseStorage(localPath, destination);
            result.public_url = publicUrl;
          } catch (err) {
            console.error(`Failed to upload menu image to Firebase:`, err);
          }
        }
        result.image_url = localUrl;
      }
      res.json(result);
    } catch (parseError) {
      console.error("Menu pipeline error:", parseError.message);
      res.status(500).json({ error: parseError.message, raw: stdout });
    }
  });
});
app2.post("/api/save-intelligence", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    const { audit_results } = req.body;
    if (!file || !audit_results) {
      return res.status(400).json({ error: "Missing image or audit results" });
    }
    const parsedResults = JSON.parse(audit_results);
    const destination = `generated/${Date.now()}-${file.originalname}`;
    const publicUrl = await uploadToFirebaseStorage(file.path, destination);
    const dataToSave = {
      ...parsedResults,
      selected_image_url: publicUrl
    };
    const docId = await saveToFirestore("visual_audits", dataToSave);
    res.json({ success: true, docId, publicUrl });
  } catch (error) {
    console.error("Error saving to DB:", error);
    res.status(500).json({ error: "Failed to save to database" });
  }
});
app2.post("/api/export-mp4", async (req, res) => {
  const { html_content } = req.body;
  if (!html_content) return res.status(400).json({ error: "No HTML content provided" });
  const timestamp = Date.now();
  const outputFileName = `video_${timestamp}.mp4`;
  const outputFilePath = path3.join(process.cwd(), "localvideos", outputFileName);
  const tempHtmlPath = path3.join(process.cwd(), "localvideos", `temp_${timestamp}.html`);
  try {
    fs2.writeFileSync(tempHtmlPath, html_content, "utf-8");
    const pythonPath = PYTHON_PATH;
    const scriptPath = path3.join(process.cwd(), "video_renderer.py");
    const duration = 15;
    exec(`${pythonPath} "${scriptPath}" "${tempHtmlPath}" "${outputFilePath}" ${duration}`, async (error, stdout, stderr) => {
      if (fs2.existsSync(tempHtmlPath)) fs2.unlinkSync(tempHtmlPath);
      if (error) {
        console.error(`MP4 Export Error: ${stderr}`);
        return res.status(500).json({ error: "Video rendering failed" });
      }
      try {
        const lines = stdout.trim().split("\n");
        let result = null;
        for (const line of lines.reverse()) {
          if (line.trim().startsWith("{")) {
            try {
              result = JSON.parse(line);
              break;
            } catch (e) {
            }
          }
        }
        if (result && result.success) {
          const localFilePath = path3.join(process.cwd(), "localvideos", result.filename);
          let publicUrl = "";
          if (fs2.existsSync(localFilePath)) {
            const destination = `videos/${Date.now()}-${result.filename}`;
            try {
              publicUrl = await uploadToFirebaseStorage(localFilePath, destination);
            } catch (err) {
              console.error(`Failed to upload MP4 to GCS Storage:`, err);
            }
          }
          try {
            await saveToFirestore("videos", {
              filename: result.filename,
              publicUrl: publicUrl,
              localUrl: `/videos/${result.filename}`
            });
          } catch (dbErr) {
            console.error(`[VIDEO] Failed to save video meta to Firestore:`, dbErr);
          }
          res.json({
            success: true,
            mp4_url: `/videos/${result.filename}`,
            publicUrl: publicUrl
          });
        } else {
          throw new Error("Invalid output from video renderer");
        }
      } catch (parseErr) {
        res.status(500).json({ error: parseErr.message });
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app2.get("/api/verify-storage-db", async (req, res) => {
  try {
    const status = await getStorageAndDbStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app2.post("/api/generate-campaign", upload.single("image"), (req, res) => {
  const { dishName, campaignType, brandStyle, tone, description, price, mode } = req.body;
  const inputPath = req.file ? req.file.path.replace(/\\/g, "/") : "null";
  console.log(`Starting Campaign Generation for: ${dishName}, Type: ${campaignType}, Mode: ${mode || "all"}`);
  const scriptPath = path3.join(process.cwd(), "campaign_generator.py");
  const pythonPath = PYTHON_PATH;
  const args = [
    `"${scriptPath}"`,
    `"${dishName || "Dish"}"`,
    `"${campaignType || "Promo"}"`,
    `"${brandStyle || "luxury"}"`,
    `"${tone || "Casual"}"`,
    `"${description || ""}"`,
    `"${price || ""}"`,
    `"${inputPath}"`,
    `"${mode || "all"}"`
  ].join(" ");
  exec(`${pythonPath} ${args}`, async (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      console.error(`stderr: ${stderr}`);
      return res.status(500).json({ success: false, error: "AI generation failed" });
    }
    try {
      const jsonStr = stdout.substring(stdout.indexOf("{"));
      const result = JSON.parse(jsonStr);
      if (result.images) {
        const uploadedImages = [];
        for (const img of result.images) {
          const filename = path3.basename(img.url);
          const localPath = path3.join(process.cwd(), "public", "assets", "processed", filename);
          let publicUrl = "";
          if (fs2.existsSync(localPath)) {
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
      try {
        const docId = await saveToFirestore("campaigns", {
          dishName: dishName || "Dish",
          campaignType: campaignType || "Promo",
          brandStyle: brandStyle || "luxury",
          tone: tone || "Casual",
          description: description || "",
          price: price || "",
          caption: result.caption || "",
          hashtags: result.hashtags || [],
          images: result.images || []
        });
        result.docId = docId;
        console.log(`[CAMPAIGN] Saved to Firestore successfully: ${docId}`);
      } catch (dbErr) {
        console.error(`[CAMPAIGN] Failed to save campaign metadata:`, dbErr);
      }
      res.json(result);
    } catch (parseError) {
      console.error(`Failed to parse AI output. Raw output: ${stdout}`);
      res.status(500).json({ success: false, error: "Failed to parse AI response" });
    }
  });
});
app2.post("/api/higgsfield/generate", async (req, res) => {
  const { prompt, aspect_ratio, resolution } = req.body;
  const apiKey = process.env.HIGGSFIELD_API_KEY;
  const apiSecret = process.env.HIGGSFIELD_API_SECRET;
  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "Higgsfield API credentials not configured." });
  }
  try {
    const response = await fetch("https://platform.higgsfield.ai/higgsfield-ai/soul/standard", {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiKey}:${apiSecret}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, aspect_ratio, resolution: resolution || "720p" })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || JSON.stringify(data));
    }
    res.json(data);
  } catch (error) {
    console.error("Higgsfield Generate Error:", error);
    res.status(500).json({ error: error.message });
  }
});
app2.get("/api/higgsfield/status", async (req, res) => {
  const { request_id } = req.query;
  const apiKey = process.env.HIGGSFIELD_API_KEY;
  const apiSecret = process.env.HIGGSFIELD_API_SECRET;
  if (!request_id) return res.status(400).json({ error: "Missing request_id" });
  try {
    const response = await fetch(`https://platform.higgsfield.ai/requests/${request_id}/status`, {
      headers: {
        "Authorization": `Key ${apiKey}:${apiSecret}`
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Higgsfield Status Error:", error);
    res.status(500).json({ error: error.message });
  }
});
var publishToSocialPlatform = async (platform, imageUrl, caption, metaToken, fbPageId, igBusinessId) => {
  const results = {};
  try {
    if (platform.id === "fb") {
      const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${fbPageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
          message: caption,
          access_token: metaToken
        })
      });
      results.facebook = await fbResponse.json();
      console.log("FB Publish Result:", results.facebook);
    }
    if (platform.id === "ig") {
      const isStory = platform.type === "Story";
      const payload = {
        image_url: imageUrl,
        access_token: metaToken
      };
      if (isStory) {
        payload.media_type = "STORIES";
      } else {
        payload.caption = caption;
      }
      const igCreateResponse = await fetch(`https://graph.facebook.com/v19.0/${igBusinessId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const igCreateData = await igCreateResponse.json();
      console.log("IG Create Result:", igCreateData);
      if (igCreateData.id) {
        const igPublishResponse = await fetch(`https://graph.facebook.com/v19.0/${igBusinessId}/media_publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: igCreateData.id,
            access_token: metaToken
          })
        });
        results.instagram = await igPublishResponse.json();
        console.log("IG Publish Result:", results.instagram);
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
app2.post("/api/publish-now", upload.single("image"), async (req, res) => {
  try {
    const { caption, platforms } = req.body;
    const platformsArr = JSON.parse(platforms || "[]");
    if (!req.file) {
      return res.status(400).json({ error: "Image is required for publishing" });
    }
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    const metaToken = process.env.META_ACCESS_TOKEN;
    const fbPageId = process.env.FB_PAGE_ID;
    const igBusinessId = process.env.IG_BUSINESS_ID;
    if (!metaToken || metaToken === "your_facebook_access_token_here") {
      return res.status(400).json({ error: "Meta Access Token is missing or invalid. Please configure it in your environment variables." });
    }
    const results = {};
    for (const platform of platformsArr) {
      const resData = await publishToSocialPlatform(platform, imageUrl, caption, metaToken, fbPageId, igBusinessId);
      Object.assign(results, resData);
    }
    res.json({ success: true, results });
  } catch (error) {
    console.error("Publishing error:", error);
    res.status(500).json({ error: error.message });
  }
});
app2.post("/api/schedule-campaign", upload.single("image"), async (req, res) => {
  try {
    const { caption, platforms } = req.body;
    const platformsArr = JSON.parse(platforms || "[]");
    if (!req.file) {
      return res.status(400).json({ error: "Image is required for scheduling" });
    }
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    const metaToken = process.env.META_ACCESS_TOKEN;
    const fbPageId = process.env.FB_PAGE_ID;
    const igBusinessId = process.env.IG_BUSINESS_ID;
    if (!metaToken || metaToken === "your_facebook_access_token_here") {
      return res.status(400).json({ error: "Meta Access Token is missing or invalid. Please configure it in your environment variables." });
    }
    const now = Date.now();
    let scheduledCount = 0;
    for (const platform of platformsArr) {
      if (!platform.scheduleTime) continue;
      const targetTime = new Date(platform.scheduleTime).getTime();
      let delayMs = targetTime - now;
      if (delayMs <= 0) {
        publishToSocialPlatform(platform, imageUrl, caption, metaToken, fbPageId, igBusinessId);
        scheduledCount++;
      } else {
        if (delayMs > 2147483647) delayMs = 2147483647;
        console.log(`[Scheduler] Queuing post to ${platform.id} in ${Math.round(delayMs / 1e3)} seconds...`);
        setTimeout(() => {
          publishToSocialPlatform(platform, imageUrl, caption, metaToken, fbPageId, igBusinessId);
        }, delayMs);
        scheduledCount++;
      }
    }
    res.json({
      success: true,
      message: `Successfully scheduled ${scheduledCount} queues!`,
      details: { caption, platforms: platformsArr }
    });
  } catch (error) {
    console.error("Scheduling error:", error);
    res.status(500).json({ error: error.message });
  }
});
app2.get("*", (req, res) => {
  res.sendFile(path3.join(clientDist, "index.html"));
});
app2.listen(port, "0.0.0.0", () => {
  console.log(`10xStudio API (Python Bridged) running at http://0.0.0.0:${port}`);
});
