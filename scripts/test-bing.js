async function testBing() {
  const query = "Toma Aerea 15A Leviton";
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
  
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    }
  });
  
  const text = await res.text();
  
  // Bing embeds image data in a class="mimg" or inside "murl"
  const murlRegex = /murl&quot;:&quot;(.*?)&quot;/g;
  let match;
  const urls = [];
  while ((match = murlRegex.exec(text)) !== null) {
    if (urls.length < 8) {
      urls.push(match[1]);
    } else {
      break;
    }
  }
  
  console.log("Found URLs:", urls);
}

testBing();
