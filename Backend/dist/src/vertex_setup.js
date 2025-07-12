"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generativeModelPreview = exports.generativeModel = void 0;
const { FunctionDeclarationSchemaType, HarmBlockThreshold, HarmCategory, VertexAI } = require('@google-cloud/vertexai');
const secrets_1 = require("../secrets");
const project = secrets_1.GOOGLE_PROJECT_ID; // Replace with your Google Cloud project ID
const location = 'us-central1'; // e.g., 'us-central1'
const textModel = 'gemini-2.5-pro'; // e.g., 'gemini-1.5-flash-latest'
const vertexAI = new VertexAI({ project: project, location: location });
// Instantiate Gemini models
exports.generativeModel = vertexAI.getGenerativeModel({
    model: textModel,
    // The following parameters are optional
    // They can also be passed to individual content generation requests
    safetySettings: [{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }],
    generationConfig: { maxOutputTokens: 8192 },
    systemInstruction: {
        role: 'system',
        parts: [{ "text": `You are an expert cloud architect. You will be given a task to generate Terraform code for Google Cloud resources. Ensure the code is efficient and follows best practices.
        The code must be well structured and sourrunded by [CODE] tags.` }],
    },
});
exports.generativeModelPreview = vertexAI.preview.getGenerativeModel({
    model: textModel,
});
