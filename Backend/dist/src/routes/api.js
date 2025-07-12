"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const util_1 = require("../util");
const vertex_setup_1 = require("../vertex_setup");
const authMiddleware_1 = require("../middleware/authMiddleware");
const bucket_1 = require("../terraform/bucket");
const run_1 = require("../terraform/run");
const apiRouter = express_1.default.Router();
const dummySystem = true;
apiRouter.use(authMiddleware_1.tokenVerification); // Apply token verification middleware to all routes
// POST /api/generate
apiRouter.post('/generate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Generate request received");
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    // Simulated AI generation
    const code = yield computeAiAnswer(prompt);
    console.log('Generated code:', code);
    return res.json({ code });
}));
// POST /api/preview
apiRouter.post('/preview', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Code is required' });
    }
    const user = 'giacomino';
    // Simulate preview logic
    // const output = `Preview output for: ${code.substring(0, 30)}...`;
    const folderId = yield (0, bucket_1.uploadTerraform)(user, code);
    const output = yield (0, run_1.plan)(user, folderId);
    return res.json({ output });
}));
// POST /api/confirm
apiRouter.post('/confirm', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Code is required' });
    }
    // Simulated confirmation (e.g., DB write)
    console.log('Code confirmed:', code);
    return res.status(200).json({ success: true });
}));
exports.default = apiRouter;
const computeAiAnswer = (message) => __awaiter(void 0, void 0, void 0, function* () {
    if (dummySystem) {
        console.log("Using dummy response");
        return util_1.dummyTfResponse;
    }
    else {
        const request = {
            contents: [{ role: 'user', parts: [{ text: message }] }],
        };
        const result = yield vertex_setup_1.generativeModel.generateContent(request);
        console.log('Response json stringify: ', JSON.stringify(result.response));
        // const response = "ciao" //result.response;
        // console.log('Response: ', JSON.stringify(result));
        // const response = dummyTfResponse
        const tfFile = extractCodeContent(result.response.candidates[0].content.parts[0].text);
        console.log('TfFile', tfFile);
        return tfFile ? tfFile : "No code generated there was a mistake in the generation process";
    }
});
function extractCodeContent(inputString) {
    // Regular expression to match [code] ... [/code] tags and extract content inside
    const regex = /\[CODE\]([\s\S]*?)\[\/CODE\]/i;
    // Execute the regex on the input string
    const match = regex.exec(inputString);
    // Check if a match was found
    if (match) {
        // Extracted content is in match[1] (group 1 of the regex match)
        return match[1].trim(); // trim() removes any surrounding whitespace
    }
    else {
        return null; // Return null if no [code] tags were found
    }
}
/*

Token verification
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token invalid" });

    req.user = user; // Store user info in request
    next();
  });
}

// Example protected route
app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "You are authenticated", user: req.user });
});
*/ 
