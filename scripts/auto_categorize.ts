import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const { prisma } = await import('../src/lib/prisma');

  // Load all categories
  const categories = await prisma.category.findMany();
  
  // Find specific categories by keywords in their names or just use known IDs
  // Since we already listed them, we can find them dynamically to avoid hardcoding UUIDs if they change
  const catIluminacion = categories.find(c => c.name.toLowerCase().includes('iluminaci'));
  const catCables = categories.find(c => c.name.toLowerCase().includes('conductores') || (c.name.toLowerCase().includes('cables') && !c.name.toLowerCase().includes('conductores')));
  // Wait, the rule was "Cables y Conductores"
  const catCablesConductores = categories.find(c => c.name === 'Cables y Conductores') || categories.find(c => c.name === 'Cables');
  const catProtecciones = categories.find(c => c.name.toLowerCase().includes('protecciones'));
  const catTuberia = categories.find(c => c.name.toLowerCase().includes('tuber'));
  const catAparamenta = categories.find(c => c.name.toLowerCase().includes('aparamenta'));
  const catGeneral = categories.find(c => c.name.toLowerCase() === 'general');

  // Keyword rules
  const rules = [
    {
      categoryId: catIluminacion?.id,
      name: "Iluminación",
      keywords: ['bombillo', 'panel', 'led', 'luminaria', 'tubo led', 'reflector', 'bala', 'aplique', 'lampara', 'lámpara', 'cinta', 'socket', 'portalámpara', 'portalampara', 'spot']
    },
    {
      categoryId: catCablesConductores?.id,
      name: "Cables y Conductores",
      keywords: ['cable', 'alambre', 'thhn', 'thw', 'utp', 'coaxial', 'conductor', 'awg', 'mcm', 'encauchetado', 'duplex', 'dúplex', 'trenzado']
    },
    {
      categoryId: catProtecciones?.id,
      name: "Protecciones",
      keywords: ['breaker', 'taco', 'termomagnetico', 'termomagnético', 'dps', 'guardamotor', 'rele', 'relé', 'diferencial', 'contactor', 'totalizador', 'fusible', 'pararrayos', 'tablero']
    },
    {
      categoryId: catTuberia?.id,
      name: "Tubería y Accesorios",
      keywords: ['tubo', 'tuberia', 'tubería', 'pvc', 'emt', 'imc', 'galvanizado', 'conduit', 'curva', 'union', 'unión', 'adaptador', 'caja', 'abrazadera', 'chazo', 'amarre', 'soldadura', 'limpiador', 'coraza', 'canaleta', 'cinta', 'poste', 'herraje', 'tensor', 'grafito', 'perno']
    },
    {
      categoryId: catAparamenta?.id,
      name: "Aparamenta",
      keywords: ['toma', 'tomacorriente', 'clavija', 'enchufe', 'roseta', 'pulsador', 'timbre', 'placa', 'dimmer', 'sensor', 'switch', 'conmutador', 'multitoma', 'interruptor', 'tapa']
    },
    {
      categoryId: catGeneral?.id,
      name: "General",
      keywords: ['flexometro', 'flexómetro', 'alicate', 'destornillador', 'tester', 'multimetro', 'multímetro', 'guantes', 'dotacion', 'dotación', 'taladro', 'pila', 'cautin', 'broca', 'herramienta']
    }
  ];

  // Fetch all products
  const products = await prisma.product.findMany();
  let updatedCount = 0;
  
  const updates: Record<string, number> = {};
  rules.forEach(r => updates[r.name] = 0);
  updates["Sin Cambios"] = 0;
  
  let updatePromises: any[] = [];

  for (const product of products) {
    const nameLower = product.name.toLowerCase();
    let assignedCategoryId = null;
    let assignedCategoryName = "";

    // Find first matching rule
    for (const rule of rules) {
      if (!rule.categoryId) continue;
      
      const matched = rule.keywords.some(keyword => {
        // use word boundaries or just includes if keyword is specific enough
        // Some keywords like "led", "pvc" are safe to use includes if we surround with spaces, but names might not have spaces.
        // Simple includes is mostly fine for these specific words, but let's use regex word boundary for short words
        const regex = new RegExp(`(?:^|\\W)${keyword}(?:$|\\W)`);
        return regex.test(nameLower);
      });

      if (matched) {
        assignedCategoryId = rule.categoryId;
        assignedCategoryName = rule.name;
        break;
      }
    }
    
    // Fallback logic for "caja" which might not have word boundaries if it's "caja," etc. is handled by \W
    // Or if simple includes works better for long words:
    if (!assignedCategoryId) {
      for (const rule of rules) {
        if (!rule.categoryId) continue;
        const matched = rule.keywords.some(keyword => keyword.length > 4 && nameLower.includes(keyword));
        if (matched) {
          assignedCategoryId = rule.categoryId;
          assignedCategoryName = rule.name;
          break;
        }
      }
    }

    if (assignedCategoryId && product.categoryId !== assignedCategoryId) {
      updatePromises.push(
        prisma.product.update({
          where: { id: product.id },
          data: { categoryId: assignedCategoryId }
        })
      );
      updatedCount++;
      updates[assignedCategoryName]++;
    } else {
      updates["Sin Cambios"]++;
    }

    // Process in chunks of 50 to avoid connection pooling limits
    if (updatePromises.length >= 50) {
      await Promise.all(updatePromises);
      updatePromises = [];
    }
  }

  // Await remaining promises
  if (updatePromises.length > 0) {
    await Promise.all(updatePromises);
  }

  console.log(`Categorization complete. Updated ${updatedCount} out of ${products.length} products.`);
  console.log("Summary of updates by category:");
  for (const [catName, count] of Object.entries(updates)) {
    console.log(`- ${catName}: ${count}`);
  }
}

main().catch(e => {
  console.error("Error during categorization:", e);
}).finally(() => {
  console.log("Disconnecting DB...");
  import('../src/lib/prisma').then(({ prisma }) => prisma.$disconnect());
});
