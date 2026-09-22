import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-flash-latest",
];

/**
 * Call Gemini API with automatic model fallback in case of rate limits or high demand
 */
async function callGemini(contents, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const ai = new GoogleGenAI({ apiKey });
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 1000,
          systemInstruction: options.systemInstruction,
        },
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini warning] Model ${model} failed: ${err.message}. Trying next fallback...`);
    }
  }

  throw lastError || new Error("All Gemini models failed to respond");
}

/**
 * Call Groq API if GROQ_API_KEY is configured
 */
async function callGroq(messages, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1000,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

/**
 * Unified text generation that prioritizes Gemini and falls back to Groq (or vice-versa)
 */
export async function generateText({ systemPrompt, userPrompt, temperature, maxTokens }) {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGemini(userPrompt, {
        systemInstruction: systemPrompt,
        temperature,
        maxTokens,
      });
    } catch (geminiErr) {
      console.error("[AI Service] Gemini call failed:", geminiErr.message);
      if (process.env.GROQ_API_KEY) {
        console.log("[AI Service] Falling back to Groq...");
        return await callGroq(
          [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: userPrompt },
          ],
          { temperature, maxTokens }
        );
      }
      throw geminiErr;
    }
  }

  if (process.env.GROQ_API_KEY) {
    return await callGroq(
      [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: userPrompt },
      ],
      { temperature, maxTokens }
    );
  }

  throw new Error("No AI API key found. Please set GEMINI_API_KEY or GROQ_API_KEY in backend/.env");
}

/**
 * Unified Chat generation supporting multi-turn conversation history
 */
export async function generateChatReply({ systemContext, history = [], message }) {
  if (process.env.GEMINI_API_KEY) {
    try {
      // Build conversation prompt for Gemini
      const formattedHistory = (history || []).slice(-8).map(h => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`).join("\n");
      const fullPrompt = `${formattedHistory ? formattedHistory + "\n" : ""}User: ${message}\nAssistant:`;

      return await callGemini(fullPrompt, {
        systemInstruction: systemContext,
        temperature: 0.5,
        maxTokens: 500,
      });
    } catch (geminiErr) {
      console.error("[AI Service] Gemini Chat failed:", geminiErr.message);
      if (process.env.GROQ_API_KEY) {
        console.log("[AI Service] Falling back to Groq for chat...");
        const groqMessages = [
          ...(systemContext ? [{ role: "system", content: systemContext }] : []),
          ...(history || []).slice(-6).map(h => ({ role: h.role, content: h.content })),
          { role: "user", content: message },
        ];
        return await callGroq(groqMessages, { temperature: 0.5, maxTokens: 500 });
      }
      throw geminiErr;
    }
  }

  if (process.env.GROQ_API_KEY) {
    const groqMessages = [
      ...(systemContext ? [{ role: "system", content: systemContext }] : []),
      ...(history || []).slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];
    return await callGroq(groqMessages, { temperature: 0.5, maxTokens: 500 });
  }

  throw new Error("No AI API key found. Please set GEMINI_API_KEY in backend/.env");
}

/**
 * Generate and parse JSON responses safely (cleaning backticks and formatting)
 */
export async function generateJson({ prompt, systemPrompt }) {
  const rawText = await generateText({
    systemPrompt: systemPrompt || "You are a JSON-only API. You must respond ONLY with raw, valid JSON. No explanations, no backticks, no markdown.",
    userPrompt: prompt,
    temperature: 0,
    maxTokens: 1500,
  });

  // Strip markdown ```json ``` code fences if model adds them
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}
