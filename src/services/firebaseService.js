var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
// Use the service-account.json service account JSON for tenxds-agents-idp
var serviceAccountPath = path.join(process.cwd(), 'service-account.json');
var app;
try {
    app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
    });
    console.log('Firebase Admin initialized successfully under unified account (tenxds-agents-idp).');
}
catch (error) {
    console.error('Firebase Admin initialization error', error);
    app = admin.app();
}
// Connect to the default Firestore database of the tenxds-agents-idp project
var db = getFirestore(app);
/**
 * Uploads a local file to Google Cloud Storage (GCS) and returns a public URL.
 * Prints detailed, high-fidelity real-time logs in the terminal.
 * @param localFilePath Path to the local file
 * @param destination Destination path inside the GCS bucket
 */
export function uploadToFirebaseStorage(localFilePath, destination) {
    return __awaiter(this, void 0, void 0, function () {
        var bucketName, bucket, publicUrl, aclError_1, signedUrl, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    bucketName = process.env.FIREBASE_STORAGE_BUCKET || '10xstudio-ai';
                    console.log("\n[STORAGE] \uD83D\uDE80 Initiating upload to Google Cloud Storage...");
                    console.log("[STORAGE] \uD83D\uDCC1 Local file: ".concat(localFilePath));
                    console.log("[STORAGE] \uD83D\uDCE6 Bucket: ".concat(bucketName));
                    console.log("[STORAGE] \u2601\uFE0F Destination: ".concat(destination));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    bucket = getStorage(app).bucket(bucketName);
                    // Upload local file to GCS
                    return [4 /*yield*/, bucket.upload(localFilePath, {
                            destination: destination,
                            metadata: {
                                cacheControl: 'public, max-age=31536000',
                            }
                        })];
                case 2:
                    // Upload local file to GCS
                    _a.sent();
                    console.log("[STORAGE] \uD83D\uDCE4 File successfully uploaded to GCS bucket.");
                    publicUrl = "https://storage.googleapis.com/".concat(bucketName, "/").concat(destination);
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 7]);
                    return [4 /*yield*/, bucket.file(destination).makePublic()];
                case 4:
                    _a.sent();
                    console.log("[STORAGE] \uD83D\uDD13 File ACL set to public read access.");
                    return [3 /*break*/, 7];
                case 5:
                    aclError_1 = _a.sent();
                    console.log("[STORAGE] \u2139\uFE0F Uniform Bucket-Level Access or permissions restricted ACL settings. Generating signed URL instead.");
                    return [4 /*yield*/, bucket.file(destination).getSignedUrl({
                            action: 'read',
                            expires: '01-01-2099' // Far future expiry
                        })];
                case 6:
                    signedUrl = (_a.sent())[0];
                    publicUrl = signedUrl;
                    return [3 /*break*/, 7];
                case 7:
                    console.log("[STORAGE] \u2705 Upload Complete!");
                    console.log("[STORAGE] \uD83D\uDD17 GCS URL: ".concat(publicUrl, "\n"));
                    return [2 /*return*/, publicUrl];
                case 8:
                    error_1 = _a.sent();
                    console.error("\n[STORAGE] \u274C GCS Upload Failed! Error: ".concat(error_1.message, "\n"));
                    throw error_1;
                case 9: return [2 /*return*/];
            }
        });
    });
}
/**
 * Saves a document to a Firestore collection.
 * @param collectionName The collection to save to
 * @param data The data object
 */
export function saveToFirestore(collectionName, data) {
    return __awaiter(this, void 0, void 0, function () {
        var docRef;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    docRef = db.collection(collectionName).doc();
                    return [4 /*yield*/, docRef.set(__assign(__assign({}, data), { id: docRef.id, timestamp: admin.firestore.FieldValue.serverTimestamp() }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/, docRef.id];
            }
        });
    });
}
/**
 * Diagnostic utility to verify Firestore and GCS uploads without console access.
 */
export function getStorageAndDbStatus() {
    return __awaiter(this, void 0, void 0, function () {
        var bucketName, status, snapshot, bucket, files, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    bucketName = process.env.FIREBASE_STORAGE_BUCKET || '10xstudio-ai';
                    status = {
                        firestoreConnected: false,
                        firestoreDocuments: [],
                        gcsConnected: false,
                        gcsFiles: [],
                        error: null
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, db.collection('visual_audits').orderBy('timestamp', 'desc').limit(5).get()];
                case 2:
                    snapshot = _a.sent();
                    status.firestoreConnected = true;
                    status.firestoreDocuments = snapshot.docs.map(function (doc) { return ({
                        id: doc.id,
                        dishName: doc.data().dishName || 'Unnamed',
                        timestamp: doc.data().timestamp
                    }); });
                    bucket = getStorage(app).bucket(bucketName);
                    return [4 /*yield*/, bucket.getFiles({ prefix: 'generated/', maxResults: 10 })];
                case 3:
                    files = (_a.sent())[0];
                    status.gcsConnected = true;
                    status.gcsFiles = files.map(function (file) { return ({
                        name: file.name,
                        publicUrl: "https://storage.googleapis.com/".concat(bucketName, "/").concat(file.name)
                    }); });
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    status.error = err_1.message;
                    console.error('[DIAGNOSTICS] Diagnostic query failed:', err_1.message);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/, status];
            }
        });
    });
}
/**
 * Retrieves a user session from Firestore.
 * @param email User email (used as document ID)
 */
export function getSession(email) {
    return __awaiter(this, void 0, void 0, function () {
        var docRef, doc, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("[FIRESTORE] \uD83D\uDD0D Fetching session for email: ".concat(email));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    docRef = db.collection('userSessions').doc(email);
                    return [4 /*yield*/, docRef.get()];
                case 2:
                    doc = _a.sent();
                    if (doc.exists) {
                        console.log("[FIRESTORE] \u2705 Session found for email: ".concat(email));
                        return [2 /*return*/, doc.data()];
                    }
                    console.log("[FIRESTORE] \u2139\uFE0F No session found for email: ".concat(email));
                    return [2 /*return*/, null];
                case 3:
                    error_2 = _a.sent();
                    console.error("[FIRESTORE] \u274C Failed to fetch session for email: ".concat(email, ", Error: ").concat(error_2.message));
                    throw error_2;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Saves or updates a user session in Firestore.
 * @param email User email (used as document ID)
 * @param sessionData Session details to merge/save
 */
export function saveSession(email, sessionData) {
    return __awaiter(this, void 0, void 0, function () {
        var docRef, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("[FIRESTORE] \uD83D\uDCBE Saving session for email: ".concat(email));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    docRef = db.collection('userSessions').doc(email);
                    return [4 /*yield*/, docRef.set(__assign(__assign({}, sessionData), { updatedAt: new Date().toISOString() }), { merge: true })];
                case 2:
                    _a.sent();
                    console.log("[FIRESTORE] \u2705 Session successfully synced for email: ".concat(email));
                    return [2 /*return*/, true];
                case 3:
                    error_3 = _a.sent();
                    console.error("[FIRESTORE] \u274C Failed to save session for email: ".concat(email, ", Error: ").concat(error_3.message));
                    throw error_3;
                case 4: return [2 /*return*/];
            }
        });
    });
}
