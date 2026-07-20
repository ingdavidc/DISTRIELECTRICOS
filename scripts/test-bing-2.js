async function testBing() {
  const query = "MEDIDOR DIGITAL MONOFASICO 5-100AMP SUMMETER";
  const searchQuery = `${query.trim()}`;
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQuery)}`;
  
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
  
  console.log("Found URLs for exact query:", urls);
  
  const query2 = `${query.trim()} alta calidad producto eléctrico`;
  const url2 = `https://www.bing.com/images/search?q=${encodeURIComponent(query2)}`;
  
  const res2 = await fetch(url2, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    }
  });
  
  const text2 = await res2.text();
  let match2;
  const urls2 = [];
  while ((match2 = murlRegex.exec(text2)) !== null) {
    if (urls2.length < 8) {
      urls2.push(match2[1]);
    } else {
      break;
    }
  }
  
  console.log("Found URLs for appended query:", urls2);
}

testBing();
