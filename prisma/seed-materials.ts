import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding 30 electrical products...');

  // Categories
  const catCables = await prisma.category.upsert({ where: { name: 'Cables y Conductores' }, update: {}, create: { name: 'Cables y Conductores' }});
  const catIlum = await prisma.category.upsert({ where: { name: 'Iluminación' }, update: {}, create: { name: 'Iluminación' }});
  const catProt = await prisma.category.upsert({ where: { name: 'Protecciones' }, update: {}, create: { name: 'Protecciones' }});
  const catTub = await prisma.category.upsert({ where: { name: 'Tubería y Accesorios' }, update: {}, create: { name: 'Tubería y Accesorios' }});
  const catApar = await prisma.category.upsert({ where: { name: 'Aparamenta' }, update: {}, create: { name: 'Aparamenta' }});

  // Suppliers
  const supCentelsa = await prisma.supplier.findFirst({ where: { name: { contains: 'Centelsa' } } }) 
    || await prisma.supplier.create({ data: { name: 'Centelsa', email: 'ventas@centelsa.com' } });
  
  const supSchneider = await prisma.supplier.findFirst({ where: { name: { contains: 'Schneider' } } }) 
    || await prisma.supplier.create({ data: { name: 'Schneider Electric', email: 'ventas@schneider.com' } });

  const supLegrand = await prisma.supplier.create({ data: { name: 'Legrand', email: 'pedidos@legrand.com' } });
  const supSylvania = await prisma.supplier.create({ data: { name: 'Sylvania', email: 'iluminacion@sylvania.com' } });
  const supPavco = await prisma.supplier.create({ data: { name: 'Pavco', email: 'tuberia@pavco.com' } });

  const products = [
    // Cables
    { sku: 'CAB-THHN-12-BL', name: 'Cable THHN/THWN-2 12 AWG Blanco', brand: 'Centelsa', unit: 'Mtr', cost: 1200, profitMargin: 35, tax: 19, categoryId: catCables.id, supplierId: supCentelsa.id },
    { sku: 'CAB-THHN-12-NG', name: 'Cable THHN/THWN-2 12 AWG Negro', brand: 'Centelsa', unit: 'Mtr', cost: 1200, profitMargin: 35, tax: 19, categoryId: catCables.id, supplierId: supCentelsa.id },
    { sku: 'CAB-THHN-10-BL', name: 'Cable THHN/THWN-2 10 AWG Blanco', brand: 'Centelsa', unit: 'Mtr', cost: 1800, profitMargin: 30, tax: 19, categoryId: catCables.id, supplierId: supCentelsa.id },
    { sku: 'CAB-THHN-10-NG', name: 'Cable THHN/THWN-2 10 AWG Negro', brand: 'Centelsa', unit: 'Mtr', cost: 1800, profitMargin: 30, tax: 19, categoryId: catCables.id, supplierId: supCentelsa.id },
    { sku: 'CAB-THHN-8-VR', name: 'Cable THHN/THWN-2 8 AWG Verde', brand: 'Centelsa', unit: 'Mtr', cost: 3000, profitMargin: 30, tax: 19, categoryId: catCables.id, supplierId: supCentelsa.id },
    { sku: 'CAB-ENC-3X12', name: 'Cable Encauchetado 3x12 AWG', brand: 'Centelsa', unit: 'Mtr', cost: 4500, profitMargin: 40, tax: 19, categoryId: catCables.id, supplierId: supCentelsa.id },
    
    // Iluminacion
    { sku: 'ILU-PNL-18W-BL', name: 'Panel LED Sobreponer 18W Blanco', brand: 'Sylvania', unit: 'Und', cost: 15000, profitMargin: 45, tax: 19, categoryId: catIlum.id, supplierId: supSylvania.id },
    { sku: 'ILU-PNL-18W-CL', name: 'Panel LED Sobreponer 18W Cálido', brand: 'Sylvania', unit: 'Und', cost: 15000, profitMargin: 45, tax: 19, categoryId: catIlum.id, supplierId: supSylvania.id },
    { sku: 'ILU-BOM-9W-BL', name: 'Bombillo LED 9W E27 Blanco', brand: 'Sylvania', unit: 'Und', cost: 3500, profitMargin: 50, tax: 19, categoryId: catIlum.id, supplierId: supSylvania.id },
    { sku: 'ILU-BOM-12W-BL', name: 'Bombillo LED 12W E27 Blanco', brand: 'Sylvania', unit: 'Und', cost: 4800, profitMargin: 50, tax: 19, categoryId: catIlum.id, supplierId: supSylvania.id },
    { sku: 'ILU-REF-50W', name: 'Reflector LED 50W Exterior IP65', brand: 'Sylvania', unit: 'Und', cost: 45000, profitMargin: 40, tax: 19, categoryId: catIlum.id, supplierId: supSylvania.id },
    { sku: 'ILU-TUB-T8-18W', name: 'Tubo LED T8 18W Vidrio', brand: 'Sylvania', unit: 'Und', cost: 8000, profitMargin: 45, tax: 19, categoryId: catIlum.id, supplierId: supSylvania.id },

    // Protecciones
    { sku: 'PRO-BRK-1X15', name: 'Breaker Termomagnético 1x15A', brand: 'Schneider', unit: 'Und', cost: 12000, profitMargin: 35, tax: 19, categoryId: catProt.id, supplierId: supSchneider.id },
    { sku: 'PRO-BRK-1X20', name: 'Breaker Termomagnético 1x20A', brand: 'Schneider', unit: 'Und', cost: 12000, profitMargin: 35, tax: 19, categoryId: catProt.id, supplierId: supSchneider.id },
    { sku: 'PRO-BRK-2X20', name: 'Breaker Termomagnético 2x20A', brand: 'Schneider', unit: 'Und', cost: 25000, profitMargin: 35, tax: 19, categoryId: catProt.id, supplierId: supSchneider.id },
    { sku: 'PRO-BRK-2X30', name: 'Breaker Termomagnético 2x30A', brand: 'Schneider', unit: 'Und', cost: 25000, profitMargin: 35, tax: 19, categoryId: catProt.id, supplierId: supSchneider.id },
    { sku: 'PRO-BRK-3X50', name: 'Breaker Termomagnético 3x50A', brand: 'Schneider', unit: 'Und', cost: 55000, profitMargin: 30, tax: 19, categoryId: catProt.id, supplierId: supSchneider.id },
    { sku: 'PRO-TOT-100A', name: 'Totalizador Caja Moldeada 100A', brand: 'Schneider', unit: 'Und', cost: 180000, profitMargin: 25, tax: 19, categoryId: catProt.id, supplierId: supSchneider.id },

    // Tubería
    { sku: 'TUB-PVC-1/2', name: 'Tubo PVC Conduit 1/2"', brand: 'Pavco', unit: 'Mtr', cost: 2500, profitMargin: 40, tax: 19, categoryId: catTub.id, supplierId: supPavco.id },
    { sku: 'TUB-PVC-3/4', name: 'Tubo PVC Conduit 3/4"', brand: 'Pavco', unit: 'Mtr', cost: 3500, profitMargin: 40, tax: 19, categoryId: catTub.id, supplierId: supPavco.id },
    { sku: 'TUB-CUR-1/2', name: 'Curva PVC Conduit 1/2"', brand: 'Pavco', unit: 'Und', cost: 800, profitMargin: 50, tax: 19, categoryId: catTub.id, supplierId: supPavco.id },
    { sku: 'TUB-ADA-1/2', name: 'Adaptador Terminal PVC 1/2"', brand: 'Pavco', unit: 'Und', cost: 600, profitMargin: 50, tax: 19, categoryId: catTub.id, supplierId: supPavco.id },
    { sku: 'TUB-CAJ-OCT', name: 'Caja Octogonal PVC', brand: 'Pavco', unit: 'Und', cost: 1200, profitMargin: 45, tax: 19, categoryId: catTub.id, supplierId: supPavco.id },
    { sku: 'TUB-CAJ-2X4', name: 'Caja Rectangular 2x4 PVC', brand: 'Pavco', unit: 'Und', cost: 1100, profitMargin: 45, tax: 19, categoryId: catTub.id, supplierId: supPavco.id },

    // Aparamenta (Interruptores y Tomacorrientes)
    { sku: 'APA-TOM-DOB-BL', name: 'Tomacorriente Doble con Polo a Tierra', brand: 'Legrand', unit: 'Und', cost: 8500, profitMargin: 35, tax: 19, categoryId: catApar.id, supplierId: supLegrand.id },
    { sku: 'APA-TOM-GFCI', name: 'Tomacorriente GFCI Falla a Tierra', brand: 'Legrand', unit: 'Und', cost: 45000, profitMargin: 30, tax: 19, categoryId: catApar.id, supplierId: supLegrand.id },
    { sku: 'APA-INT-SEN-BL', name: 'Interruptor Sencillo', brand: 'Legrand', unit: 'Und', cost: 6500, profitMargin: 35, tax: 19, categoryId: catApar.id, supplierId: supLegrand.id },
    { sku: 'APA-INT-DOB-BL', name: 'Interruptor Doble', brand: 'Legrand', unit: 'Und', cost: 9500, profitMargin: 35, tax: 19, categoryId: catApar.id, supplierId: supLegrand.id },
    { sku: 'APA-INT-CON-BL', name: 'Interruptor Conmutable', brand: 'Legrand', unit: 'Und', cost: 8000, profitMargin: 35, tax: 19, categoryId: catApar.id, supplierId: supLegrand.id },
    { sku: 'APA-PLA-CIE-BL', name: 'Placa Ciega', brand: 'Legrand', unit: 'Und', cost: 2500, profitMargin: 50, tax: 19, categoryId: catApar.id, supplierId: supLegrand.id },
  ];

  let count = 0;
  for (const p of products) {
    const pvp = p.cost * (1 + (p.profitMargin / 100)) * (1 + (p.tax / 100)); // Calculo del PVP sugerido
    const stock = Math.floor(Math.random() * 50) + 10; // Stock aleatorio entre 10 y 60
    
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        cost: p.cost,
        profitMargin: p.profitMargin,
        tax: p.tax,
        price: pvp,
        brand: p.brand,
        unit: p.unit,
        supplierId: p.supplierId,
      },
      create: {
        sku: p.sku,
        name: p.name,
        price: pvp,
        stock: stock,
        minStockLimit: 15,
        maxStockLimit: 100,
        cost: p.cost,
        profitMargin: p.profitMargin,
        tax: p.tax,
        brand: p.brand,
        unit: p.unit,
        categoryId: p.categoryId,
        supplierId: p.supplierId,
      }
    });
    count++;
  }

  console.log(`Successfully seeded ${count} advanced products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
