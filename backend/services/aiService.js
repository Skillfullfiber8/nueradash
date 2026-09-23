import { GoogleGenAI } from "@google/genai";

let cachedDiscoveredModels = null;

/**
 * Build list of candidate models with process.env.GEMINI_MODEL as primary
 */
function getCandidateModels() {
  const envModel = process.env.GEMINI_MODEL?.trim();
  const models = [
    envModel,
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-flash-8b",
    "gemini-pro",
  ].filter(Boolean);
  return Array.from(new Set(models));
}

/**
 * Helper to get an initialized GoogleGenAI client instance
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    const err = new Error("GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment variables.");
    err.status = 503;
    err.code = "MISSING_GEMINI_API_KEY";
    throw err;
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

/**
 * Query ModelService.ListModels to discover models available to this specific API key
 */
async function discoverAvailableModels(ai) {
  if (cachedDiscoveredModels && cachedDiscoveredModels.length > 0) {
    return cachedDiscoveredModels;
  }
  try {
    console.log("[GEMINI] Querying ModelService.ListModels for available models with this API key...");
    const pager = await ai.models.list();
    const discovered = [];
    for await (const m of pager) {
      const name = m.name ? m.name.replace(/^models\//, "") : "";
      if (name && (name.includes("gemini") || name.includes("flash") || name.includes("pro"))) {
        discovered.push(name);
      }
    }
    console.log(`[GEMINI] Discovered ${discovered.length} models from Google API:`, discovered);
    if (discovered.length > 0) {
      cachedDiscoveredModels = discovered;
    }
    return discovered;
  } catch (err) {
    console.warn("[GEMINI] ModelService.ListModels query failed:", err.message);
    return [];
  }
}

/**
 * Sanitize and format Gemini errors safely without leaking sensitive information or API keys
 */
function formatGeminiError(err) {
  let message = err?.message || String(err);
  // Redact potential API keys or sensitive token strings from error text
  message = message.replace(/AIzaSy[A-Za-z0-9_-]{33}/g, "[REDACTED_API_KEY]");
  message = message.replace(/key=[A-Za-z0-9_-]+/gi, "key=[REDACTED]");

  if (message.includes("API_KEY_INVALID") || message.includes("401") || message.includes("API key not valid")) {
    const authErr = new Error("Gemini API authentication failed: Invalid or expired GEMINI_API_KEY.");
    authErr.status = 401;
    authErr.code = "GEMINI_AUTH_ERROR";
    return authErr;
  }
  if (message.includes("RESOURCE_EXHAUSTED") || message.includes("429") || message.includes("Quota exceeded")) {
    const quotaErr = new Error("Gemini API quota exceeded or rate limited. Please retry shortly.");
    quotaErr.status = 429;
    quotaErr.code = "GEMINI_QUOTA_EXCEEDED";
    return quotaErr;
  }
  if (message.includes("NOT_FOUND") || message.includes("404") || message.includes("models/")) {
    const modelErr = new Error(`Gemini model error: ${message}`);
    modelErr.status = 502;
    modelErr.code = "GEMINI_MODEL_ERROR";
    return modelErr;
  }
  return err;
}

/**
 * Call Gemini API with automatic candidate cycling and dynamic ListModels discovery fallback
 */
async function callGemini(contents, options = {}) {
  const ai = getGeminiClient();
  const candidateModels = getCandidateModels();
  let lastError = null;

  // 1. Try pre-configured candidate models
  for (const model of candidateModels) {
    try {
      console.log(`[GEMINI] Calling Gemini API (model: ${model})...`);

      const config = {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 1000,
      };

      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }

      if (options.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }

      if (options.responseSchema) {
        config.responseSchema = options.responseSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      if (response && response.text) {
        console.log(`[GEMINI] Successfully generated content using model: ${model}`);
        return response.text.trim();
      }
    } catch (err) {
      const formatted = formatGeminiError(err);
      lastError = formatted;

      // If missing API key or auth failed, do not cycle through further models
      if (formatted.code === "MISSING_GEMINI_API_KEY" || formatted.code === "GEMINI_AUTH_ERROR") {
        throw formatted;
      }

      console.warn(`[GEMINI] Model candidate "${model}" failed: ${formatted.message}. Attempting next option...`);
    }
  }

  // 2. If standard models returned 404/NOT_FOUND, query ListModels dynamically for active models
  console.warn("[GEMINI] All standard models failed. Attempting dynamic model discovery via ListModels...");
  const discoveredModels = await discoverAvailableModels(ai);

  for (const model of discoveredModels) {
    if (candidateModels.includes(model)) continue; // Already attempted
    try {
      console.log(`[GEMINI] Calling dynamically discovered model: ${model}...`);
      const config = {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 1000,
      };

      if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
      if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
      if (options.responseSchema) config.responseSchema = options.responseSchema;

      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      if (response && response.text) {
        console.log(`[GEMINI] Successfully generated content using discovered model: ${model}`);
        return response.text.trim();
      }
    } catch (err) {
      const formatted = formatGeminiError(err);
      lastError = formatted;
      console.warn(`[GEMINI] Discovered model "${model}" failed: ${formatted.message}`);
    }
  }

  // 3. If all attempts failed with 404, provide an actionable error explanation
  if (lastError && lastError.code === "GEMINI_MODEL_ERROR") {
    const helpfulErr = new Error(
      "Gemini API model not found (404). Please ensure the Generative Language API is enabled in your Google Cloud Project or generate an API key from Google AI Studio (https://aistudio.google.com/app/apikey)."
    );
    helpfulErr.status = 502;
    helpfulErr.code = "GEMINI_MODEL_UNAVAILABLE";
    throw helpfulErr;
  }

  throw lastError || new Error("All Gemini models failed to respond");
}

/**
 * Unified text generation using Google Gemini
 */
export async function generateText({ systemPrompt, userPrompt, temperature, maxTokens }) {
  try {
    return await callGemini(userPrompt, {
      systemInstruction: systemPrompt,
      temperature,
      maxTokens,
    });
  } catch (err) {
    const formatted = formatGeminiError(err);
    console.error("[AI Service] Gemini text generation failed:", formatted.message);
    throw formatted;
  }
}

/**
 * Unified Chat generation supporting multi-turn conversation history
 */
export async function generateChatReply({ systemContext, history = [], message }) {
  try {
    // Format conversation history into readable transcript for Gemini prompt
    const formattedHistory = (history || [])
      .slice(-8)
      .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
      .join("\n");

    const fullPrompt = `${formattedHistory ? formattedHistory + "\n" : ""}User: ${message}\nAssistant:`;

    return await callGemini(fullPrompt, {
      systemInstruction: systemContext,
      temperature: 0.5,
      maxTokens: 500,
    });
  } catch (err) {
    const formatted = formatGeminiError(err);
    console.error("[AI Service] Gemini Chat failed:", formatted.message);
    throw formatted;
  }
}

/**
 * Generate and parse structured JSON responses safely from Google Gemini
 */
export async function generateJson({ prompt, systemPrompt, responseSchema }) {
  try {
    const rawText = await callGemini(prompt, {
      systemInstruction: systemPrompt || "You are a JSON-only API. You must respond ONLY with valid JSON matching the requested structure. No markdown fences, no natural language commentary.",
      temperature: 0,
      maxTokens: 2000,
      responseMimeType: "application/json",
      responseSchema,
    });

    // Clean markdown fences if model inadvertently wraps JSON in ```json ... ```
    let cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[AI Service] Failed to parse JSON returned by Gemini:", cleaned);
      const jsonErr = new Error(`AI returned malformed JSON: ${parseErr.message}`);
      jsonErr.status = 502;
      jsonErr.code = "AI_JSON_PARSE_ERROR";
      throw jsonErr;
    }
  } catch (err) {
    const formatted = formatGeminiError(err);
    console.error("[AI Service] Gemini JSON generation failed:", formatted.message);
    throw formatted;
  }
}


