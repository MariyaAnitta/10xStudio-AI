var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
var PEXELS_KEY = process.env.PEXELS_API_KEY;
export function fetchSceneImage(aiQuery_1, sceneId_1) {
    return __awaiter(this, arguments, void 0, function (aiQuery, sceneId, orientation) {
        var searchRes, photos, photo, imageUrl, assetsDir, filename, dest, writer_1, imgRes, error_1;
        if (orientation === void 0) { orientation = 'landscape'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!PEXELS_KEY) {
                        console.warn("PEXELS_API_KEY not found. Falling back to direct URLs.");
                        return [2 /*return*/, null];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, axios.get('https://api.pexels.com/v1/search', {
                            headers: { Authorization: PEXELS_KEY },
                            params: {
                                query: aiQuery,
                                orientation: orientation,
                                size: 'large',
                                per_page: 5
                            }
                        })];
                case 2:
                    searchRes = _a.sent();
                    photos = searchRes.data.photos;
                    if (!photos || !photos.length) {
                        console.error("No images found for: ".concat(aiQuery));
                        return [2 /*return*/, null];
                    }
                    photo = photos[0];
                    imageUrl = photo.src.original + (orientation === 'portrait' ? '?auto=compress&w=1080&h=1920&fit=crop' : '?auto=compress&w=1920&h=1080&fit=crop');
                    assetsDir = path.join(process.cwd(), 'public', 'assets');
                    if (!fs.existsSync(assetsDir)) {
                        fs.mkdirSync(assetsDir, { recursive: true });
                    }
                    filename = "scene_".concat(sceneId, ".jpg");
                    dest = path.join(assetsDir, filename);
                    writer_1 = fs.createWriteStream(dest);
                    return [4 /*yield*/, axios.get(imageUrl, { responseType: 'stream' })];
                case 3:
                    imgRes = _a.sent();
                    imgRes.data.pipe(writer_1);
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            writer_1.on('finish', function () { return resolve(); });
                            writer_1.on('error', function (err) { return reject(err); });
                        })];
                case 4:
                    _a.sent();
                    return [2 /*return*/, {
                            localPath: "/assets/".concat(filename), // Public URL for the browser
                            credit: "Photo by ".concat(photo.photographer, " on Pexels"),
                            avgColor: photo.avg_color
                        }];
                case 5:
                    error_1 = _a.sent();
                    console.error("Pexels Fetch Error: ".concat(error_1.message));
                    return [2 /*return*/, null];
                case 6: return [2 /*return*/];
            }
        });
    });
}
