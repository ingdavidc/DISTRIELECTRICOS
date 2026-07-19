require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function main() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    console.log("Testing with @google/genai SDK...");
    const response = await ai.models.generateContent({
      model: 'gemini-3.0-flash',
      contents: 'Hola, esto es una prueba'
    });
    console.log("Response:", response.text);
  } catch (err) {
    console.error("New SDK Error:", err.message);
  }
}

main();
