require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function main() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("API Key present:", !!apiKey);
    const genAI = new GoogleGenerativeAI("");
    
    // Let's test if gemini-3.0-flash works
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Model instantiated");
    
    const result = await model.generateContent("Hola, esto es una prueba");
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("SDK Error:", err.message);
  }
}

main();
