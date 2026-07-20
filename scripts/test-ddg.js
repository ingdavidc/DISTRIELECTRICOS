const { image_search } = require('duckduckgo-images-api');

async function search() {
  try {
    const results = await image_search({ query: "Toma Aerea 15A Leviton", moderate: true });
    console.log(results.slice(0, 3));
  } catch (error) {
    console.error(error);
  }
}

search();
