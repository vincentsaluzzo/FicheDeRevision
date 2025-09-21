import OpenAI from "openai";
import { AIResponse, Exercise } from "../types";
import { getEducationLevel } from "../config/education";
import { getImageBase64 } from "./imageService";

const debugLog = (message: string, data?: any) => {
  const DEBUG_AI = process.env.DEBUG_AI === "true";
  if (DEBUG_AI) {
    console.log(`[AI DEBUG] ${message}`);
    if (data !== undefined) {
      if (typeof data === "string" && data.length > 500) {
        console.log(
          `[AI DEBUG] ${data.substring(0, 500)}... (truncated, ${
            data.length
          } chars total)`
        );
      } else {
        console.log("[AI DEBUG]", JSON.stringify(data, null, 2));
      }
    }
  }
};

let openAIClient: OpenAI | null = null;

const getOpenAI = (): OpenAI => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (!openAIClient) {
    openAIClient = new OpenAI({ apiKey });
  }
  return openAIClient;
};

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

// Helper: Use OpenAI Responses API (GPT-5 family)
const generateWithGpt5Responses = async (
  prompt: string,
  imageBase64: string,
  model: string
): Promise<string> => {
  const responsesUrl = "https://api.openai.com/v1/responses";
  const maxOutputTokens =
    Number(process.env.OPENAI_MAX_OUTPUT_TOKENS) || 100000;

  const responsesPayload: any = {
    model,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: imageBase64 },
        ],
      },
    ],
    text: { format: { type: "json_object" } },
    max_output_tokens: maxOutputTokens,
  };

  debugLog("OpenAI Responses payload:", {
    model: responsesPayload.model,
    max_output_tokens: responsesPayload.max_output_tokens,
    text: responsesPayload.text,
    hasImage: true,
  });

  debugLog("Sending request to OpenAI (Responses API)...");
  const startTime = Date.now();
  const resp = await fetch(responsesUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(responsesPayload),
  });
  const endTime = Date.now();
  debugLog(`OpenAI Responses reply received in ${endTime - startTime}ms`);

  if (!resp.ok) {
    const errorText = await resp.text();
    debugLog("OpenAI Responses error:", errorText);
    throw new Error(
      `OpenAI Responses API error: ${resp.status} - ${errorText}`
    );
  }

  const data: any = await resp.json();
  debugLog("OpenAI Responses data keys:", Object.keys(data || {}));
  debugLog("OpenAI Responses usage: ", data.usage);

  const outputShape = Array.isArray(data?.output)
    ? data.output.map((o: any, i: number) => ({
        index: i,
        keys: o ? Object.keys(o) : [],
        type: o?.type,
        contentTypes: Array.isArray(o?.content)
          ? o.content.map((p: any) => p?.type || typeof p)
          : Array.isArray(o?.message?.content)
          ? o.message.content.map((p: any) => p?.type || typeof p)
          : typeof o?.content,
      }))
    : null;
  debugLog("OpenAI Responses output shape:", outputShape);
  debugLog("OpenAI Responses text preview:", {
    textType: typeof data?.text,
    hasValue: !!data?.text?.value,
    valuePreview:
      typeof data?.text?.value === "string"
        ? (data.text.value as string).slice(0, 120)
        : undefined,
  });

  try {
    const firstMsg = Array.isArray(data?.output)
      ? data.output.find((o: any) => o?.type === "message")
      : undefined;
    const msgContent = Array.isArray(firstMsg?.content)
      ? firstMsg.content
      : Array.isArray(firstMsg?.message?.content)
      ? firstMsg.message.content
      : undefined;
    debugLog(
      "OpenAI first message content preview:",
      Array.isArray(msgContent) ? msgContent.slice(0, 2) : msgContent
    );
  } catch (_) {}

  // Prefer the convenience field
  const textValue: string =
    typeof data?.output_text === "string" && data.output_text.trim()
      ? data.output_text.trim()
      : "";

  let stitched = "";
  if (!textValue && Array.isArray(data?.output)) {
    const allParts: string[] = [];
    for (const item of data.output) {
      const candidateContent = Array.isArray(item?.content)
        ? item.content
        : Array.isArray(item?.message?.content)
        ? item.message.content
        : [];
      if (Array.isArray(candidateContent)) {
        for (const part of candidateContent) {
          if (part?.type === "output_text" && typeof part?.text === "string") {
            allParts.push(part.text);
          } else if (
            part?.type === "output_text" &&
            typeof part?.text?.value === "string"
          ) {
            allParts.push(part.text.value);
          } else if (part?.type === "text" && typeof part?.text === "string") {
            allParts.push(part.text);
          } else if (
            part?.type === "text" &&
            typeof part?.text?.value === "string"
          ) {
            allParts.push(part.text.value);
          } else if (typeof part?.content?.text === "string") {
            allParts.push(part.content.text);
          } else if (typeof part?.content?.text?.value === "string") {
            allParts.push(part.content.text.value);
          } else if (typeof part?.content === "string") {
            allParts.push(part.content);
          } else if (typeof part?.value === "string") {
            allParts.push(part.value);
          }
        }
      }
      if (typeof item?.text === "string") allParts.push(item.text);
      if (typeof item?.text?.value === "string") allParts.push(item.text.value);
    }
    stitched = allParts.join("").trim();
  }

  const content = textValue || stitched || undefined;
  debugLog("OpenAI Responses content:", content);

  if (!content) throw new Error("No content generated by OpenAI");
  return content;
};

// Helper: Use Chat Completions API (GPT-4o family and others)
const generateWithChatCompletions = async (
  prompt: string,
  imageBase64: string,
  model: string
): Promise<string> => {
  const requestPayload: any = {
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: imageBase64, detail: "high" },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
    temperature: 0.7,
  };

  debugLog("OpenAI request payload:", {
    model: requestPayload.model,
    max_tokens: requestPayload.max_tokens,
    temperature: requestPayload.temperature,
    messageCount: requestPayload.messages.length,
    hasImage: requestPayload.messages[0].content.some(
      (c: any) => c.type === "image_url"
    ),
    response_format: requestPayload.response_format,
  });

  const openai = getOpenAI();
  debugLog("Sending request to OpenAI (Chat Completions)...");
  const startTime = Date.now();
  const response = await openai.chat.completions.create(requestPayload);
  const endTime = Date.now();

  debugLog(`OpenAI response received in ${endTime - startTime}ms`);
  debugLog("OpenAI response metadata:", {
    id: response.id,
    model: response.model,
    usage: response.usage,
    finish_reason: response.choices?.[0]?.finish_reason,
  });

  debugLog("OpenAI raw first choice:", response.choices?.[0]);

  let ccContent = (response.choices?.[0]?.message as any)?.content as any;
  if (Array.isArray(ccContent)) {
    ccContent = ccContent
      .map((part: any) => (typeof part === "string" ? part : part.text || ""))
      .join("")
      .trim();
  }
  const content = typeof ccContent === "string" ? ccContent : undefined;
  debugLog("OpenAI response content:", content);

  if (!content) throw new Error("No content generated by OpenAI");
  return content;
};

export const generateRevisionWithOpenAI = async (
  imagePath: string,
  educationLevel: string
): Promise<AIResponse> => {
  try {
    debugLog("=== Starting OpenAI generation ===");
    debugLog("Education level:", educationLevel);
    debugLog("Image path:", imagePath);

    const level = getEducationLevel(educationLevel);
    if (!level) {
      throw new Error(`Invalid education level: ${educationLevel}`);
    }

    debugLog("Education level details:", level);

    const imageBase64 = await getImageBase64(imagePath);
    debugLog("Image converted to base64", {
      length: imageBase64.length,
      preview: imageBase64.substring(0, 100) + "...",
    });

    const prompt = createRevisionPrompt(level.code, level.name, level.ageRange);
    debugLog("Generated prompt:", prompt);

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const isGpt5 = /^gpt-5/i.test(model);

    // Different API paths for GPT-5 (Responses API) vs GPT-4o (Chat Completions)
    const content: string = isGpt5
      ? await generateWithGpt5Responses(prompt, imageBase64, model)
      : await generateWithChatCompletions(prompt, imageBase64, model);

    const parsedResponse = parseAIResponse(content);
    debugLog("Parsed AI response:", parsedResponse);

    debugLog("=== OpenAI generation completed successfully ===");
    return parsedResponse;
  } catch (error) {
    debugLog("=== OpenAI generation failed ===");
    debugLog("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    console.error("OpenAI API error:", error);
    throw new Error(
      `OpenAI generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const generateRevisionWithMistral = async (
  imagePath: string,
  educationLevel: string
): Promise<AIResponse> => {
  try {
    debugLog("=== Starting Mistral generation ===");
    debugLog("Education level:", educationLevel);
    debugLog("Image path:", imagePath);

    const level = getEducationLevel(educationLevel);
    if (!level) {
      throw new Error(`Invalid education level: ${educationLevel}`);
    }

    debugLog("Education level details:", level);

    const imageBase64 = await getImageBase64(imagePath);
    debugLog("Image converted to base64", {
      length: imageBase64.length,
      preview: imageBase64.substring(0, 100) + "...",
    });

    const prompt = createRevisionPrompt(level.code, level.name, level.ageRange);
    debugLog("Generated prompt:", prompt);

    const requestPayload = {
      model: "pixtral-12b-2409",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: imageBase64,
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    };

    debugLog("Mistral request payload:", {
      model: requestPayload.model,
      max_tokens: requestPayload.max_tokens,
      temperature: requestPayload.temperature,
      messageCount: requestPayload.messages.length,
      hasImage: requestPayload.messages[0].content.some(
        (c: any) => c.type === "image_url"
      ),
    });

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY?.substring(
        0,
        10
      )}...`,
    };

    debugLog("Mistral request headers:", {
      "Content-Type": headers["Content-Type"],
      Authorization: headers.Authorization,
    });

    debugLog("Sending request to Mistral...");

    const startTime = Date.now();
    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify(requestPayload),
    });
    const endTime = Date.now();

    debugLog(`Mistral response received in ${endTime - startTime}ms`);
    debugLog("Mistral response status:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.text();
      debugLog("Mistral error response:", errorData);
      throw new Error(`Mistral API error: ${response.status} - ${errorData}`);
    }

    const data: any = await response.json();
    debugLog("Mistral response data:", {
      id: data.id,
      model: data.model,
      usage: data.usage,
      choices: data.choices?.length,
    });

    const content = data.choices[0]?.message?.content;
    debugLog("Mistral response content:", content);

    if (!content) {
      throw new Error("No content generated by Mistral");
    }

    const parsedResponse = parseAIResponse(content);
    debugLog("Parsed AI response:", parsedResponse);

    debugLog("=== Mistral generation completed successfully ===");
    return parsedResponse;
  } catch (error) {
    debugLog("=== Mistral generation failed ===");
    debugLog("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    console.error("Mistral API error:", error);
    throw new Error(
      `Mistral generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

const createRevisionPrompt = (
  levelCode: string,
  levelName: string,
  ageRange: string
): string => {
  return `Tu es un enseignant français expérimenté. Analyse cette image de cours/leçon et crée une fiche de révision adaptée au niveau ${levelCode} (${levelName}, ${ageRange}).

La fiche de révision doit contenir :

1. **Titre** : Un titre clair et attrayant pour la leçon
2. **Résumé** : Les points clés à retenir (3-5 points maximum)
3. **Exercices** : 3-4 exercices variés adaptés au niveau

Types d'exercices possibles :
- Questions à choix multiples (QCM)
- Vrai/Faux avec justification
- Compléter les phrases
- Questions courtes

IMPORTANT : Adapte le vocabulaire et la complexité au niveau ${levelCode}. Les exercices doivent être progressifs et permettre de vérifier la compréhension.

Format de réponse attendu (en JSON) :
{
  "title": "Titre de la leçon",
  "content": "Résumé avec les points clés à retenir",
  "exercises": [
    {
      "type": "multiple_choice",
      "question": "Question...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "answer": "A",
      "explanation": "Explication..."
    }
  ]
}

Réponds uniquement avec le JSON, sans texte supplémentaire.`;
};

const parseAIResponse = (content: string): AIResponse => {
  try {
    debugLog("=== Parsing AI response ===");
    debugLog("Raw content length:", content.length);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      debugLog(
        "No JSON found in response. Content preview:",
        content.substring(0, 200)
      );
      throw new Error("No JSON found in response");
    }

    debugLog("Extracted JSON string:", jsonMatch[0]);

    const parsed = JSON.parse(jsonMatch[0]);
    debugLog("Successfully parsed JSON:", parsed);

    if (!parsed.title || !parsed.content) {
      debugLog(
        "Missing required fields. Available fields:",
        Object.keys(parsed)
      );
      throw new Error("Missing required fields in AI response");
    }

    const exercises: Exercise[] = (parsed.exercises || []).map(
      (ex: any, index: number) => {
        debugLog(`Processing exercise ${index + 1}:`, ex);
        return {
          type: ex.type || "short_answer",
          question: ex.question || "",
          options: ex.options || [],
          answer: ex.answer || "",
          explanation: ex.explanation || "",
        };
      }
    );

    const result = {
      title: parsed.title,
      content: parsed.content,
      exercises,
    };

    debugLog("Final parsed result:", result);
    debugLog("=== AI response parsing completed ===");

    return result;
  } catch (error) {
    debugLog("=== AI response parsing failed ===");
    debugLog("Parse error:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
    });

    console.error("Error parsing AI response:", error);

    const fallbackResult = {
      title: "Fiche de révision",
      content: content.substring(0, 500) + "...",
      exercises: [],
    };

    debugLog("Using fallback result:", fallbackResult);
    return fallbackResult;
  }
};

export const generateRevision = async (
  imagePath: string,
  educationLevel: string,
  preferredAI: "openai" | "mistral" = "openai"
): Promise<{ response: AIResponse; provider: "openai" | "mistral" }> => {
  debugLog("=== Starting revision generation ===");
  debugLog("Parameters:", {
    imagePath,
    educationLevel,
    preferredAI,
  });

  debugLog("Available API keys:", {
    openai: !!process.env.OPENAI_API_KEY,
    mistral: !!process.env.MISTRAL_API_KEY,
  });

  let lastError: Error | null = null;

  const providers: ("openai" | "mistral")[] =
    preferredAI === "openai" ? ["openai", "mistral"] : ["mistral", "openai"];

  debugLog("Provider order:", providers);

  for (const provider of providers) {
    try {
      debugLog(`Attempting generation with ${provider}...`);

      if (provider === "openai" && process.env.OPENAI_API_KEY) {
        debugLog("Using OpenAI provider");
        const response = await generateRevisionWithOpenAI(
          imagePath,
          educationLevel
        );
        debugLog("=== Revision generation completed with OpenAI ===");
        return { response, provider };
      } else if (provider === "mistral" && process.env.MISTRAL_API_KEY) {
        debugLog("Using Mistral provider");
        const response = await generateRevisionWithMistral(
          imagePath,
          educationLevel
        );
        debugLog("=== Revision generation completed with Mistral ===");
        return { response, provider };
      } else {
        debugLog(`Skipping ${provider} - API key not available`);
      }
    } catch (error) {
      debugLog(`${provider} generation failed:`, {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "Unknown error",
      });

      console.warn(`${provider} generation failed:`, error);
      lastError = error instanceof Error ? error : new Error("Unknown error");
      continue;
    }
  }

  debugLog("=== All providers failed ===");
  debugLog("Last error:", lastError);

  throw lastError || new Error("All AI providers failed");
};
