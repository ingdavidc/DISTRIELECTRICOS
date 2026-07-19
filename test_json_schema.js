require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });

const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

async function main() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      supplier: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          identification: { type: SchemaType.STRING },
          email: { type: SchemaType.STRING },
          phone: { type: SchemaType.STRING },
        },
      },
      products: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            sku: { type: SchemaType.STRING },
            name: { type: SchemaType.STRING },
            quantity: { type: SchemaType.NUMBER },
            cost: { type: SchemaType.NUMBER },
            tax: { type: SchemaType.NUMBER },
          },
        },
      },
    },
  };

  const prompt = "Genera un JSON con proveedor y 2 productos. Asegurate de incluir nombres raros con comillas como: Cable \"super\" loco";

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    console.log("RAW TEXT:", result.response.text());
  } catch (err) {
    console.error("ERROR:", err);
  }
}

main();
