import { getPosProducts } from "./src/actions/pos";

async function test() {
  console.log("Testing getPosProducts...");
  try {
    const p = await getPosProducts("");
    console.log("Products found:", p.length);
  } catch(e) {
    console.error("Failed:", e);
  }
}
test();
