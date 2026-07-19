require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  if (data.models) {
    const flashModels = data.models.filter(m => m.name.includes("flash"));
    console.log("Available Flash Models:");
    flashModels.forEach(m => console.log(m.name, " - Supported generation methods:", m.supportedGenerationMethods));
  } else {
    console.log(data);
  }
}
listModels();
