import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { image } = await req.json();
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Models listed in order of priority
    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash-002", "gemini-1.5-pro"];
    let result = null;
    let lastError = null;

    const prompt = `
      Identify the main object in this image precisely.
      
      Return ONLY a JSON object in this format:
      {
        "title": "Exact object name",
        "summary": "2-sentence overview",
        "facts": ["Key fact 1", "Key fact 2", "Key fact 3"]
      }
    `;

    // Try each model until one succeeds
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });

        result = await model.generateContent([
          prompt,
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);

        if (result) break; // Success, break out of loop
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed, attempting next model...`);
      }
    }

    if (!result) {
      throw lastError || new Error("All AI models were unavailable.");
    }

    const output = JSON.parse(result.response.text());
    return Response.json(output);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

