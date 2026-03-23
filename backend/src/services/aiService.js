import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client - relies on GEMINI_API_KEY environment variable
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({}) : null;

/**
 * Service to interact with Gemini Flash for analyzing student feedback
 */
export const analyzeFeedback = async (rawFeedback, isResolve = false) => {
  if (!ai) {
    console.warn('Gemini API key is missing. Using MVP Mock AI Engine for demonstration.');
    
    // Demonstrate the interception loop for MVP purposes
    if (!isResolve && (rawFeedback.toLowerCase().includes('worst') || rawFeedback.toLowerCase().includes('bad') || rawFeedback.length < 30)) {
      return {
        status: 'requires_revision',
        sanitizedFeedback: null,
        objectiveScore: null,
        controlQuestions: [
          "Could you provide a specific example of what happened during class to help the instructor understand?",
          "What is one constructive suggestion you have for improving this course?"
        ],
        aiMetadata: {
          sentiment: 'negative',
          biasFlagged: true,
          flags: ["Unconstructive phrasing", "Lacks specific, actionable examples"]
        }
      };
    }

    // If it passes the mock check (e.g. they answered the control questions and revised)
    return {
      status: 'approved',
      sanitizedFeedback: rawFeedback + " (AI Note: The feedback was reviewed and deemed constructive.)",
      objectiveScore: 85,
      aiMetadata: {
        sentiment: 'positive',
        biasFlagged: false,
        flags: []
      }
    };
  }

  const prompt = `
  You are an expert AI evaluator for a university faculty feedback system.
  Analyze the following student feedback for a teacher.
  
  Feedback: "${rawFeedback}"
  
  Task:
  1. Determine if the feedback contains significant bias, abusive language, or unconstructive personal attacks.
  2. If it is constructive (even if critical), sanitize any minor emotional language or PII, and provide an objective score (0-100).
  3. If it is unconstructive or biased, flag it, provide a list of flags, and generate 1-2 control questions to help the student reformulate their feedback constructively.
  
  Return the result ONLY as a JSON string matching this exact structure, with no markdown formatting:
  {
    "status": "approved" | "requires_revision",
    "sanitizedFeedback": "String (cleaned feedback) OR null if requires_revision",
    "objectiveScore": Number (0-100) OR null if requires_revision,
    "controlQuestions": ["String question 1", "String question 2"] (empty array if approved),
    "aiMetadata": {
      "sentiment": "positive" | "neutral" | "negative" | "mixed",
      "biasFlagged": Boolean,
      "flags": ["String array of issues"]
    }
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const aiResult = JSON.parse(response.text);
    return aiResult;
  } catch (error) {
    console.error('Error analyzing feedback with Gemini:', error);
    throw new Error('Failed to process feedback via AI control engine.');
  }
};
