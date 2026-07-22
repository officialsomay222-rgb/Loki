var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_vite = require("vite");

// api/index.ts
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var import_genai = require("@google/genai");
var import_groq_sdk = __toESM(require("groq-sdk"), 1);
var import_inference = require("@huggingface/inference");
function extractImageQuery(message) {
  if (!message) return null;
  const cleanMessage = message.replace(/^(show\s+me|give\s+me|send|find|search\s+for|i\s+need|mujhe|bhai|bro)\s+(an?\s+)?/i, "").trim();
  const prefixRegex = /^(?:image|picture|photo|pic|img)s?\s*(?:of|about|for)?\s+(.+)$/i;
  const suffixRegex = /^(.+?)\s+(?:ki|ka|ke)?\s*(?:image|picture|photo|pic|img)s?(?:\s+(?:dikhao|do|bhejo|please|chahiye|de|dikhana))?$/i;
  let match = cleanMessage.match(prefixRegex);
  if (match && match[1]) return match[1].trim();
  match = cleanMessage.match(suffixRegex);
  if (match && match[1]) return match[1].trim();
  const origRegex = /(?:image|picture|photo|pic|img)s?\s*(?:of|about|for)?\s+(.+)/i;
  match = message.match(origRegex);
  if (match && match[1]) return match[1].trim();
  const fallbackSuffixRegex = /(.+?)\s+(?:ki|ka|ke)?\s*(?:image|picture|photo|pic|img)s?/i;
  match = message.match(fallbackSuffixRegex);
  if (match && match[1]) return match[1].trim();
  return null;
}
var app = (0, import_express.default)();
var getTodayDateString = () => {
  const today = /* @__PURE__ */ new Date();
  return today.toISOString().split("T")[0];
};
var defaultOrigins = [
  "https://loki-x-prime.vercel.app",
  "https://loki-x.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173"
];
app.use((0, import_cors.default)({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean) : defaultOrigins;
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
app.set("trust proxy", 1);
app.use((0, import_helmet.default)({
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
  xFrameOptions: false
}));
var limiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  // Disable the `X-RateLimit-*` headers
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});
app.use("/api/", limiter);
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});
app.get("/api/quota", (req, res) => {
  try {
    res.json({ date: getTodayDateString(), fast_count: 0, generate_count: 0, ultra_count: 0 });
  } catch (error) {
    console.error("Quota API Error:", error);
    res.status(500).json({ error: "Internal server error while fetching quota." });
  }
});
app.post("/api/transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64 || typeof audioBase64 !== "string") {
      return res.status(400).json({ error: "audioBase64 is required and must be a string" });
    }
    let groqKey = process.env.GROQ_API_KEY;
    if (groqKey && (groqKey.includes("MY_GROQ") || groqKey.includes("YOUR_"))) groqKey = void 0;
    if (!groqKey) {
      return res.status(400).json({
        error: "Groq API Key is missing. Please add 'GROQ_API_KEY' to your AI Studio Secrets (Settings -> Secrets) to enable voice transcription."
      });
    }
    const groq = new import_groq_sdk.default({ apiKey: groqKey });
    const buffer = Buffer.from(audioBase64, "base64");
    const fs = await import("fs");
    const path2 = await import("path");
    const os = await import("os");
    const { randomUUID } = await import("crypto");
    const tempFilePath = path2.join(os.tmpdir(), `audio_${randomUUID()}.webm`);
    fs.writeFileSync(tempFilePath, buffer);
    try {
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-large-v3",
        response_format: "json",
        prompt: 'The following is a conversation in English and Hinglish (Hindi written in the Latin alphabet). Please transcribe exactly as spoken, keeping Hinglish words in Latin script. Examples: "Haan bhai, kya haal hai?", "Theek hai."'
      });
      res.json({ text: transcription.text });
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (error) {
    console.error("Transcription Error:", error);
    res.status(500).json({ error: "Internal server error during transcription." });
  }
});
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required and must be a string" });
    }
    let geminiKey = process.env.GEMINI_API_KEY;
    let googleKey = process.env.GOOGLE_AI_KEY;
    const apiKey = googleKey || geminiKey;
    if (!apiKey) {
      return res.status(400).json({ error: "Google AI Key is missing." });
    }
    const ai = new import_genai.GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" }
          }
        }
      }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audioBase64: base64Audio });
    } else {
      throw new Error("Failed to generate audio");
    }
  } catch (error) {
    console.error("TTS Error:", error);
    res.status(500).json({ error: "Internal server error during TTS." });
  }
});
app.post("/api/chat", async (req, res) => {
  const { message, history, mode, systemInstruction, temperature, topP, topK, thinkingMode, searchGrounding, attachments } = req.body;
  if (!message && (!attachments || attachments.length === 0) && mode !== "image") {
    return res.status(400).json({ error: "Message or attachments are required" });
  }
  const setupSSE = () => {
    if (!res.headersSent) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
    }
  };
  try {
    if (mode === "fast" || mode === "pro" || mode === "happy") {
      let geminiKey = process.env.GEMINI_API_KEY;
      let googleKey = process.env.GOOGLE_AI_KEY;
      let groqKey = process.env.GROQ_API_KEY;
      let hfKey = process.env.HF_TOKEN;
      if (geminiKey && (geminiKey.includes("MY_GEMINI") || geminiKey.includes("YOUR_"))) geminiKey = void 0;
      if (googleKey && (googleKey.includes("MY_GOOGLE") || googleKey.includes("YOUR_"))) googleKey = void 0;
      if (groqKey && (groqKey.includes("MY_GROQ") || groqKey.includes("YOUR_"))) groqKey = void 0;
      if (hfKey && (hfKey.includes("MY_HF") || hfKey.includes("YOUR_"))) hfKey = void 0;
      const apiKey = googleKey || geminiKey;
      const hasAttachments = attachments && attachments.length > 0;
      let imageMarkdown = "";
      if (searchGrounding) {
        const imageQuery = extractImageQuery(message);
        if (imageQuery) {
        }
      }
      if (hasAttachments || thinkingMode || searchGrounding) {
        if (!apiKey) {
          return res.status(400).json({ error: "Google AI Key is missing. Please add 'GOOGLE_AI_KEY' or 'GC' to your AI Studio Secrets to enable Vision/Fast Model." });
        }
        const ai = new import_genai.GoogleGenAI({ apiKey });
        let modelName = "gemini-3.1-flash-lite-preview";
        const config = {
          systemInstruction,
          temperature: temperature || 0.7,
          topP: topP || 0.95,
          topK: topK || 64
        };
        if (searchGrounding) {
          modelName = "gemini-2.5-flash";
          config.tools = [{ googleSearch: {} }];
        }
        if (thinkingMode) {
          config.thinkingConfig = { thinkingLevel: "HIGH" };
        }
        const contents = [];
        if (history && Array.isArray(history)) {
          history.forEach((msg) => {
            if (msg.parts && msg.parts[0] && msg.parts[0].text) {
              contents.push({
                role: msg.role === "model" || msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.parts[0].text }]
              });
            }
          });
        }
        const userParts = [];
        if (hasAttachments) {
          attachments.forEach((att) => {
            userParts.push({
              inlineData: {
                data: att.data,
                mimeType: att.mimeType
              }
            });
          });
        }
        let finalMessage = message || " ";
        if (!message || message.trim().length === 0) {
          if (hasAttachments) finalMessage = "Please analyze this image.";
        }
        if (searchGrounding) {
          const imageQuery = extractImageQuery(finalMessage);
          if (imageQuery) {
            finalMessage = `${finalMessage}

IMPORTANT: The user is asking for images. Please perform a Google Search to find relevant image URLs for "${imageQuery}". Include the images in your response using Markdown format like so: ![description](url). Return ONLY the markdown image links and a brief confirmation message.`;
          }
        }
        userParts.push({ text: finalMessage });
        contents.push({ role: "user", parts: userParts });
        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          contents,
          config
        });
        setupSSE();
        if (imageMarkdown) {
          res.write(`data: ${JSON.stringify({ text: imageMarkdown })}

`);
        }
        let sourcesAdded = false;
        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}

`);
          }
          if (!sourcesAdded && searchGrounding) {
            const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (groundingChunks && groundingChunks.length > 0) {
              sourcesAdded = true;
              let sourcesMarkdown = "\n\n**Sources:**\n";
              const addedUris = /* @__PURE__ */ new Set();
              groundingChunks.forEach((c) => {
                const uri = c.web?.uri;
                const title = c.web?.title;
                if (uri && !addedUris.has(uri)) {
                  addedUris.add(uri);
                  sourcesMarkdown += `- [${title || uri}](${uri})
`;
                }
              });
              res.write(`data: ${JSON.stringify({ text: sourcesMarkdown })}

`);
            }
          }
        }
        res.write(`data: [DONE]

`);
        res.end();
      } else {
        if (!groqKey && !hfKey) {
          return res.status(400).json({ error: "Groq or HuggingFace API Key is missing. Please add 'GROQ_API_KEY' or 'HF_TOKEN' to your AI Studio Secrets to enable Fast/Pro/Happy models." });
        }
        const messages = [];
        if (systemInstruction && systemInstruction.trim() !== "") {
          messages.push({ role: "system", content: systemInstruction });
        }
        const historyMessages = (history || []).filter((msg) => msg?.parts?.[0]?.text && msg.parts[0].text.trim() !== "").map((msg) => ({
          role: msg.role === "model" || msg.role === "assistant" ? "assistant" : "user",
          content: msg.parts[0].text
        }));
        messages.push(...historyMessages);
        let finalMessage = message && message.trim() !== "" ? message : " ";
        messages.push({ role: "user", content: finalMessage });
        if (groqKey) {
          const groq = new import_groq_sdk.default({ apiKey: groqKey });
          const modelName = mode === "pro" ? "openai/gpt-oss-120b" : mode === "fast" ? "groq/compound-mini" : "llama-3.1-8b-instant";
          const stream = await groq.chat.completions.create({
            messages,
            model: modelName,
            temperature: temperature || 0.7,
            top_p: topP || 0.95,
            max_tokens: 4e3,
            stream: true
          });
          setupSSE();
          if (imageMarkdown) {
            res.write(`data: ${JSON.stringify({ text: imageMarkdown })}

`);
          }
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              res.write(`data: ${JSON.stringify({ text: content })}

`);
            }
          }
        } else if (hfKey) {
          const hf = new import_inference.HfInference(hfKey);
          const modelName = mode === "pro" ? "mistralai/Mistral-7B-Instruct-v0.2" : mode === "fast" ? "HuggingFaceH4/zephyr-7b-beta" : "microsoft/Phi-3-mini-4k-instruct";
          const stream = hf.chatCompletionStream({
            model: modelName,
            messages,
            temperature: temperature || 0.7,
            top_p: topP || 0.95,
            max_tokens: 4e3
          });
          setupSSE();
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              res.write(`data: ${JSON.stringify({ text: content })}

`);
            }
          }
        }
        res.write(`data: [DONE]

`);
        res.end();
      }
    } else if (mode === "image") {
      setupSSE();
      const prompt = message && message.trim().length > 0 ? message.trim() : "A beautiful sunset";
      const seed = Math.floor(Math.random() * 1e6);
      const encodedPrompt = encodeURIComponent(prompt).replace(/\(/g, "%28").replace(/\)/g, "%29");
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true`;
      const responseText = `![Generated Image](${imageUrl})

*Image generated successfully!*`;
      res.write(`data: ${JSON.stringify({ text: responseText })}

`);
      res.write(`data: [DONE]

`);
      res.end();
    } else {
      return res.status(400).json({ error: "Invalid mode selected" });
    }
  } catch (error) {
    console.error("Chat API Error:", error);
    let errorMessage = "Internal server error while processing your request.";
    const statusCode = error.status || error.statusCode || 500;
    if (!res.headersSent) {
      res.status(statusCode).json({ error: errorMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMessage })}

`);
      res.write(`data: [DONE]

`);
      res.end();
    }
  }
});
var api_default = app;

// server.ts
var import_path = __toESM(require("path"), 1);
async function startServer() {
  const app2 = (0, import_express2.default)();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3e3;
  app2.use(api_default);
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    console.log("Starting Vite in middleware mode...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app2.use(vite.middlewares);
  } else {
    console.log("Serving static files from dist...");
    app2.use(import_express2.default.static("dist"));
    app2.get("*", (req, res) => {
      res.sendFile(import_path.default.join(process.cwd(), "dist", "index.html"));
    });
  }
  app2.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} (Production: ${isProduction})`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
