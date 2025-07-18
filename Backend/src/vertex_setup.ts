const {
  FunctionDeclarationSchemaType,
  HarmBlockThreshold,
  HarmCategory,
  VertexAI
} = require('@google-cloud/vertexai');
import { GOOGLE_PROJECT_ID } from "../secrets";

const project = GOOGLE_PROJECT_ID; // Replace with your Google Cloud project ID
const location = 'europe-west1'; // e.g., 'us-central1'
const textModel =  'gemini-2.5-pro'; // e.g., 'gemini-1.5-flash-latest'

const vertexAI = new VertexAI({project: project, location: location});
const context = ""
// Instantiate Gemini models
export const generativeModel = vertexAI.getGenerativeModel({
    model: textModel,
    // The following parameters are optional
    // They can also be passed to individual content generation requests
    safetySettings: [{category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE}],
    generationConfig: {maxOutputTokens: 8192},
    systemInstruction: {
      role: 'system',
      parts: [{"text": `You are a helpful Google cloud cloud engineer, specialized in wrinting IaC (Infrastructure as Code) scripts using Terraform. 
                    You are given a question and you must answer it with a Terraform script. The answer must be sourrounded by [CODE] and [/CODE] tags. The script must be valid and executable.
                    Each script must begin with the following content: 
                    terraform {
                      backend "gcs" {
                        bucket  = "!!!!GOOGLE_SHARED_USER_BUCKET"
                        prefix  = "!!!!EMAIL/!!!!FOLDERID"
                      }
                    }
                    The email and folderId variables will be replaced by the user, the script must be valid and executable.`}],
    },
});

export const generativeModelPreview = vertexAI.preview.getGenerativeModel({
    model: textModel,
});

const vertexAIBilling = new VertexAI({project: project, location: location});
export const generativeDescriptor = vertexAIBilling.getGenerativeModel({
    model: textModel,
    // The following parameters are optional
    // They can also be passed to individual content generation requests
    safetySettings: [{category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE}],
    generationConfig: {maxOutputTokens: 8192},
    systemInstruction: {
      role: 'system',
      parts: [{"text": `You are a highly skilled Google Cloud engineer with deep expertise in analyzing Terraform scripts.
         Your primary task is to review the provided Terraform configuration and produce an exhaustive description of the potential costs it may generate in Google Cloud.
          You must consider all relevant resources, their configuration parameters (like machine types, disk sizes, regions), and how these affect pricing. 
          Where applicable, include approximate cost ranges, billing implications, and suggestions for cost optimization.
          Don't use more than 150 words`
        }],
    },
});
