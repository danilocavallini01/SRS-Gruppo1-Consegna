import express, { Request, response, Response, Router } from 'express';
import { dummyTfResponse } from '../util';
import { generativeDescriptor, generativeModel } from '../vertex_setup';
import { AuthenticatedRequest, authenticateJWT } from '../middleware/authMiddleware';
import { deleteFiles, uploadTerraform } from '../terraform/bucket';
import { apply, destroy, plan } from '../terraform/run';
import { getLoggedChat, logChat } from '../logging/manager';
import { DUMMY } from '../../secrets';
import { estimateAppliedCosts } from '../pricing';
import { set } from 'mongoose';

const apiRouter: Router = express.Router();

const getRandomInt = (max: number) => {
  return Math.floor(Math.random() * max);
}

export interface AiAnswer {
  response: string,
  folderId: number,
}


// POST /api/costs
apiRouter.post("/costs",authenticateJWT, async (req: Request, res: Response): Promise<any> => {
 console.log("Calculating costs from terraform apply state...");
  const {folderId } = req.body;
    try {
        const user = (req as any).user.email;
        const result = await estimateAppliedCosts(user,folderId);
        res.status(200).json(result);
    } catch (err) {
        console.error("Error calculating applied costs:", err);
        res.status(500).json({ error: "Failed to calculate costs" });
    }
});


// POST /api/getlog
apiRouter.post('/getlog', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  console.log("Get Logs request received");
  const user = req.user.email
  const logs = await getLoggedChat(user)

  return res.json({ logs });
});

// POST /api/generate
apiRouter.post('/generate', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<any> => {

  console.log("Generate request received");
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const user = req.user.email

  // Simulated AI generation
  const answer: AiAnswer = await computeAiAnswer(prompt, user);
  console.log('Generated code:', answer.response);

  // Log Chat
  await logChat(user, prompt, answer.response, answer.folderId)
  return res.json({ answer });
});

// POST /api/costFeedback
apiRouter.post('/costFeedback', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<any> => {

  console.log("Feedback request received");
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const user = req.user.email

  // Simulated AI generation
  const answer: string = await computeAiAnswerFeedback(prompt);
  console.log('Generated feedback:', answer);

  return res.json({ answer });
});



// POST /api/preview
apiRouter.post('/preview', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const { code, folderId } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code is required' });
  }

  const user = req.user.email
  // Simulate preview logic
  // const output = `Preview output for: ${code.substring(0, 30)}...`;
  await uploadTerraform(user, folderId, code)
  const output = await plan(user, folderId)
  deleteFiles()

  return res.json({ output });
});

// POST /api/apply
apiRouter.post('/apply', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const { code, folderId } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code is required' });
  }

  const user = req.user.email
  const output = await apply(user, folderId)
  deleteFiles()

  return res.json({ output });
});

// POST /api/destroy
apiRouter.post('/destroy', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const { code, folderId } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code is required' });
  }

  const user = req.user.email
  const output = await destroy(user, folderId)
  deleteFiles()

  return res.json({ output });
});

// POST /api/confirm
apiRouter.post('/confirm', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code is required' });
  }

  // Simulated confirmation (e.g., DB write)
  console.log('Code confirmed:', code);
  return res.status(200).json({ success: true });
});

export default apiRouter;

function delay(time: number): Promise<void> {
   // Returns a promise that resolves after the specified time in milliseconds
   return new Promise(function(resolve) { 
       setTimeout(resolve, time)
   });
}

const computeAiAnswer = async (message: string, email: string): Promise<AiAnswer> => {
  const folderId = getRandomInt(1000000)

  if (DUMMY) {
    console.log("Using dummy response")
    const time = Math.floor(Math.random() * 10000) + 10000;
    await delay(time);
    console.log("Dummy response generated")

    return { response: dummyTfResponse(email, folderId), folderId: folderId };
  } else {
    const request = {
      contents: [{ role: 'user', parts: [{ text: message }] }],
    };
    const result = await generativeModel.generateContent(request);
    console.log('Response json stringify: ', JSON.stringify(result.response));

    const tfFile = extractCodeContent(result.response.candidates[0].content.parts[0].text);
    console.log('TfFile', tfFile);
    return { response: tfFile ? tfFile : "No code generated there was a mistake in the generation process", folderId: folderId };
  }
}

const computeAiAnswerFeedback = async (message: string): Promise<string> => {
  const request = {
    contents: [{ role: 'user', parts: [{ text: message }] }],
  };

  try {
    const result = await generativeDescriptor.generateContent(request);

    if (!result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.warn('No description generated, empty response');
      return "No description generated, there was a mistake in the generation process.";
    }

    const responseText = result.response.candidates[0].content.parts[0].text;
    console.log('AI Response:', responseText);
    return responseText;
  } catch (error) {
    console.error('Error generating AI feedback:', error);
    return "An error occurred during the AI generation process.";
  }
};


function extractCodeContent(inputString: string) {
  // Regular expression to match [code] ... [/code] tags and extract content inside
  const regex = /\[CODE\]([\s\S]*?)\[\/CODE\]/i;

  // Execute the regex on the input string
  const match = regex.exec(inputString);

  // Check if a match was found
  if (match) {
    // Extracted content is in match[1] (group 1 of the regex match)
    return match[1].trim(); // trim() removes any surrounding whitespace
  } else {
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

    req.user.email = user; // Store user info in request
    next();
  });
}

// Example protected route
app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "You are authenticated", user: req.user.email });
});
*/