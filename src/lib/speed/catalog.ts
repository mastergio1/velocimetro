import type { VehicleId } from "./types";

export type GammaId = "calle" | "sport" | "selecta" | "elite" | "mito";

export type Gamma = {
  id: GammaId;
  rank: number;
  name: string;
  rarity: string;
  tag: string;
  blurb: string;
};

export const GAMMAS: Gamma[] = [
  {
    id: "calle",
    rank: 1,
    name: "Gamma Calle",
    rarity: "Común",
    tag: "I",
    blurb: "El tráfico de todos los días. Cualquier marca entra aquí.",
  },
  {
    id: "sport",
    rank: 2,
    name: "Gamma Sport",
    rarity: "Poco frecuente",
    tag: "II",
    blurb: "Picantes y muscle. Se oyen antes de verse.",
  },
  {
    id: "selecta",
    rank: 3,
    name: "Gamma Selecta",
    rarity: "Rara",
    tag: "III",
    blurb: "Prestaciones de fábrica. Pocas en la avenida.",
  },
  {
    id: "elite",
    rank: 4,
    name: "Gamma Élite",
    rarity: "Épica",
    tag: "IV",
    blurb: "Íconos. Quien los maneja, ya eligió.",
  },
  {
    id: "mito",
    rank: 5,
    name: "Gamma Mito",
    rarity: "Mítica",
    tag: "V",
    blurb: "Leyendas. Casi nunca aparecen — y cuando sí, se recuerdan.",
  },
];

export type FleetCar = VehicleId & {
  id: string;
  body: string;
  glass: string;
  widthM: number;
  lengthM: number;
  heightM: number;
};

export type CatalogCar = VehicleId & {
  id: string;
  gamma: GammaId;
  aliases: string[];
};

export type WildEntry = VehicleId & {
  id: string;
  gamma: GammaId;
  at: number;
};

export type CollectionEntry = VehicleId & {
  id: string;
  gamma: GammaId;
  at: number;
  sightings: number;
  lastSpeedKmh: number;
};

export const FLEET: FleetCar[] = [
  {
    id: "corolla",
    make: "Toyota",
    model: "Corolla",
    year: "2022",
    color: "plata",
    body: "#c5c9d0",
    glass: "#1a2430",
    widthM: 1.78,
    lengthM: 4.4,
    heightM: 1.44,
    description: "Sedán compacto fiable, el auto más vendido del mundo en varias décadas.",
    funFact: "El Corolla se fabrica desde 1966 y ya superó los 50 millones de unidades.",
  },
  {
    id: "m3",
    make: "BMW",
    model: "M3",
    year: "2021",
    color: "gris",
    body: "#6b7178",
    glass: "#10151c",
    widthM: 1.9,
    lengthM: 4.8,
    heightM: 1.44,
    description: "Deportivo de altas prestaciones con motor de seis cilindros en línea.",
    funFact: "La M3 original de 1986 nació como auto de carreras de turismo homologado para calle.",
  },
  {
    id: "f150",
    make: "Ford",
    model: "F-150",
    year: "2023",
    color: "oscuro",
    body: "#2a3038",
    glass: "#0e141c",
    widthM: 2.03,
    lengthM: 5.9,
    heightM: 1.92,
    description: "Pickup full-size, el vehículo más vendido de Estados Unidos año tras año.",
    funFact: "Si la F-Series fuese un país, su volumen de ventas rivalizaría con marcas enteras.",
  },
  {
    id: "911",
    make: "Porsche",
    model: "911",
    year: "2020",
    color: "claro",
    body: "#d7dbe0",
    glass: "#151b24",
    widthM: 1.85,
    lengthM: 4.52,
    heightM: 1.3,
    description: "Ícono de motor trasero: equilibrio extraño y adhesión legendaria en curva.",
    funFact: "El 911 lleva el mismo esquema básico desde 1963: motor atrás, dos puertas, silueta inconfundible.",
  },
  {
    id: "tucson",
    make: "Hyundai",
    model: "Tucson",
    year: "2024",
    color: "azul noche",
    body: "#3d4a58",
    glass: "#121820",
    widthM: 1.87,
    lengthM: 4.64,
    heightM: 1.66,
    description: "SUV compacto de diseño paramétrico, muy común en calles de Santiago.",
    funFact: "Hyundai tomó su nombre del hanja que significa “el presente” — literalmente, modernidad.",
  },
  {
    id: "golf",
    make: "Volkswagen",
    model: "Golf GTI",
    year: "2019",
    color: "rojo oscuro",
    body: "#6a3a3a",
    glass: "#141820",
    widthM: 1.79,
    lengthM: 4.28,
    heightM: 1.46,
    description: "El hot hatch que definió la receta: compacto, práctico y rápido en diario.",
    funFact: "El GTI de 1976 se pensó como un proyecto interno pequeño y terminó creando un segmento.",
  },
  {
    id: "ferrari488",
    make: "Ferrari",
    model: "488 GTB",
    year: "2018",
    color: "rojo oscuro",
    body: "#7a3532",
    glass: "#10141a",
    widthM: 1.95,
    lengthM: 4.57,
    heightM: 1.21,
    description: "Berlinetta V8 biturbo: el sucesor del 458, más brutal y todavía analógico al tacto.",
    funFact: "El 488 fue el último V8 Ferrari de motor central con caja de cambios de doble embrague clásica.",
  },
];

export const CATALOG: CatalogCar[] = [
  {
    id: "corolla",
    gamma: "calle",
    make: "Toyota",
    model: "Corolla",
    year: "2022",
    color: "plata",
    aliases: ["corolla hybrid", "corolla se"],
    description: "Sedán compacto fiable, el auto más vendido del mundo en varias décadas.",
    funFact: "El Corolla se fabrica desde 1966 y ya superó los 50 millones de unidades.",
  },
  {
    id: "tucson",
    gamma: "calle",
    make: "Hyundai",
    model: "Tucson",
    year: "2024",
    color: "azul noche",
    aliases: ["tucson hybrid"],
    description: "SUV compacto de diseño paramétrico, muy común en calles de Santiago.",
    funFact: "Hyundai tomó su nombre del hanja que significa “el presente” — literalmente, modernidad.",
  },
  {
    id: "civic",
    gamma: "calle",
    make: "Honda",
    model: "Civic",
    year: "2022",
    color: "blanco",
    aliases: ["civic lx", "civic sport"],
    description: "Compacto japonés de dirección limpia; el estándar silencioso de la calle.",
    funFact: "El Civic se vende desde 1972 y cambió de generación más veces que casi cualquier rival.",
  },
  {
    id: "rav4",
    gamma: "calle",
    make: "Toyota",
    model: "RAV4",
    year: "2023",
    color: "gris",
    aliases: ["rav 4", "rav4 hybrid"],
    description: "SUV que inventó el segmento: alto, práctico y difícil de no ver en la ciudad.",
    funFact: "RAV4 significa Recreational Active Vehicle 4-wheel drive.",
  },
  {
    id: "onix",
    gamma: "calle",
    make: "Chevrolet",
    model: "Onix",
    year: "2023",
    color: "plata",
    aliases: ["onix plus"],
    description: "Subcompacto latinoamericano, pensado para taxi, familia y primer auto.",
    funFact: "El Onix fue el auto más vendido de Brasil varios años seguidos.",
  },
  {
    id: "rio",
    gamma: "calle",
    make: "Kia",
    model: "Rio",
    year: "2021",
    color: "blanco",
    aliases: ["rio 5", "kia rio"],
    description: "Hatch de entrada, barato de mantener y muy presente en flotas urbanas.",
    funFact: "En algunos mercados el Rio se llamó Pride, un nombre que Kia usó durante décadas.",
  },
  {
    id: "versa",
    gamma: "calle",
    make: "Nissan",
    model: "Versa",
    year: "2023",
    color: "gris",
    aliases: ["versa note"],
    description: "Sedán de acceso con maletero grande: el auto de “primera patente” en varios países.",
    funFact: "El Versa se diseñó pensando en mercados emergentes, no en Europa.",
  },
  {
    id: "yaris",
    gamma: "calle",
    make: "Toyota",
    model: "Yaris",
    year: "2021",
    color: "rojo",
    aliases: ["yaris sport", "yaris hatch"],
    description: "Subcompacto mixto ciudad/carretera, famoso por gastar poco y durar mucho.",
    funFact: "Un Yaris ganó el WRC en 2020, 2021 y 2022 — raro para un auto de supermercado.",
  },
  {
    id: "golf",
    gamma: "sport",
    make: "Volkswagen",
    model: "Golf GTI",
    year: "2019",
    color: "rojo oscuro",
    aliases: ["gti", "golf gti mk7", "volkswagen gti"],
    description: "El hot hatch que definió la receta: compacto, práctico y rápido en diario.",
    funFact: "El GTI de 1976 se pensó como un proyecto interno pequeño y terminó creando un segmento.",
  },
  {
    id: "mustang",
    gamma: "sport",
    make: "Ford",
    model: "Mustang",
    year: "2022",
    color: "oscuro",
    aliases: ["mustang gt", "eco boost mustang"],
    description: "Muscle americano de capó largo: ruido, línea y un V8 que todavía se pide.",
    funFact: "El Mustang original de 1964 se presentó en la Feria Mundial de Nueva York.",
  },
  {
    id: "wrx",
    gamma: "sport",
    make: "Subaru",
    model: "WRX",
    year: "2022",
    color: "azul",
    aliases: ["wrx sti", "subaru impreza wrx"],
    description: "Sedán turbo integral, nacido en rally y todavía tosco de la mejor manera.",
    funFact: "WRX significa World Rally eXperimental, un nombre de laboratorio que se quedó.",
  },
  {
    id: "mx5",
    gamma: "sport",
    make: "Mazda",
    model: "MX-5",
    year: "2021",
    color: "rojo",
    aliases: ["miata", "mx5 miata", "mazda miata"],
    description: "Roadster ligero: menos potencia, más sonrisa por kilo que casi cualquier rival.",
    funFact: "El MX-5 es el roadster más vendido de la historia, con más de un millón de unidades.",
  },
  {
    id: "f150",
    gamma: "sport",
    make: "Ford",
    model: "F-150",
    year: "2023",
    color: "oscuro",
    aliases: ["f150", "f 150", "ford f150"],
    description: "Pickup full-size, el vehículo más vendido de Estados Unidos año tras año.",
    funFact: "Si la F-Series fuese un país, su volumen de ventas rivalizaría con marcas enteras.",
  },
  {
    id: "gr86",
    gamma: "sport",
    make: "Toyota",
    model: "GR86",
    year: "2023",
    color: "naranja oscuro",
    aliases: ["gt86", "86", "subaru brz"],
    description: "Cupé de motor bóxer y tracción trasera, hecho para curvas y no para rectas.",
    funFact: "Toyota y Subaru lo desarrollan juntos: un auto, dos insignias, el mismo chasis.",
  },
  {
    id: "m3",
    gamma: "selecta",
    make: "BMW",
    model: "M3",
    year: "2021",
    color: "gris",
    aliases: ["m3 competition", "m3 g80", "bmw m3"],
    description: "Deportivo de altas prestaciones con motor de seis cilindros en línea.",
    funFact: "La M3 original de 1986 nació como auto de carreras de turismo homologado para calle.",
  },
  {
    id: "rs3",
    gamma: "selecta",
    make: "Audi",
    model: "RS 3",
    year: "2022",
    color: "gris",
    aliases: ["rs3", "audi rs3", "rs3 sportback"],
    description: "Compacto de cinco cilindros: el sonido más raro que cabe en un hatch de lujo.",
    funFact: "El 2.5 TFSI de cinco cilindros ganó Motor del Año siete veces consecutivas.",
  },
  {
    id: "typer",
    gamma: "selecta",
    make: "Honda",
    model: "Civic Type R",
    year: "2023",
    color: "blanco",
    aliases: ["type r", "civic type r", "fl5"],
    description: "El hatch más obsesivo de Honda: alerón, asientos cubo y récords en Nürburgring.",
    funFact: "El Type R FL5 bajó de 7:45 en el Infierno Verde, un tiempo de superdeportivo.",
  },
  {
    id: "giulia",
    gamma: "selecta",
    make: "Alfa Romeo",
    model: "Giulia Quadrifoglio",
    year: "2020",
    color: "rojo",
    aliases: ["giulia qv", "quadrifoglio", "giulia"],
    description: "Sedán italiano de V6 biturbo: el rival emocional del M3.",
    funFact: "El Quadrifoglio (trébol de cuatro hojas) es el amuleto de carreras de Alfa desde 1923.",
  },
  {
    id: "cayman",
    gamma: "selecta",
    make: "Porsche",
    model: "718 Cayman",
    year: "2021",
    color: "amarillo pálido",
    aliases: ["cayman", "718", "cayman gts"],
    description: "Motor central, equilibrio de kart. Muchos dicen que es el Porsche más puro.",
    funFact: "El Cayman se llama así por las islas, no por el cocodrilo — aunque el logo no ayuda.",
  },
  {
    id: "911",
    gamma: "elite",
    make: "Porsche",
    model: "911",
    year: "2020",
    color: "claro",
    aliases: ["911 carrera", "911 turbo", "porsche 911", "992"],
    description: "Ícono de motor trasero: equilibrio extraño y adhesión legendaria en curva.",
    funFact: "El 911 lleva el mismo esquema básico desde 1963: motor atrás, dos puertas, silueta inconfundible.",
  },
  {
    id: "gtr",
    gamma: "elite",
    make: "Nissan",
    model: "GT-R",
    year: "2019",
    color: "gris",
    aliases: ["gtr", "gt r", "r35", "godzilla"],
    description: "AWD de ataque: la Godzilla japonesa que humilló a europeos en recta y curva.",
    funFact: "El apodo Godzilla nació en Australia, en 1989, cuando el Skyline GT-R aplastó al touring local.",
  },
  {
    id: "corvette",
    gamma: "elite",
    make: "Chevrolet",
    model: "Corvette",
    year: "2023",
    color: "amarillo pálido",
    aliases: ["c8", "corvette stingray", "c8 stingray"],
    description: "El primer Corvette de motor central: superdeportivo americano a precio de lujo.",
    funFact: "El C8 tardó 67 años en mover el motor detrás del conductor. Chevrolet lo pensó desde los 60.",
  },
  {
    id: "amggt",
    gamma: "elite",
    make: "Mercedes-AMG",
    model: "GT",
    year: "2021",
    color: "plata",
    aliases: ["amg gt", "mercedes gt", "gt c"],
    description: "Gran turismo de capó largo y V8 a la vista: teatro alemán en dos plazas.",
    funFact: "El AMG GT fue el segundo auto desarrollado 100% por AMG, después del SLS.",
  },
  {
    id: "ferrari488",
    gamma: "mito",
    make: "Ferrari",
    model: "488 GTB",
    year: "2018",
    color: "rojo oscuro",
    aliases: ["488", "488 gtb", "ferrari 488"],
    description: "Berlinetta V8 biturbo: el sucesor del 458, más brutal y todavía analógico al tacto.",
    funFact: "El 488 fue el último V8 Ferrari de motor central con caja de cambios de doble embrague clásica.",
  },
  {
    id: "huracan",
    gamma: "mito",
    make: "Lamborghini",
    model: "Huracán",
    year: "2019",
    color: "amarillo",
    aliases: ["huracan evo", "huracan sto", "lambo huracan"],
    description: "V10 atmosférico al límite: la Lamborghini que sí se ve — de vez en cuando — en la calle.",
    funFact: "Huracán toma el nombre de un toro de lidia famoso, tradición de Lamborghini desde el Miura.",
  },
  {
    id: "chiron",
    gamma: "mito",
    make: "Bugatti",
    model: "Chiron",
    year: "2020",
    color: "azul noche",
    aliases: ["chiron super sport", "bugatti chiron"],
    description: "W16 de 1.500 hp: el techo de la velocidad de calle en la década de 2010.",
    funFact: "Un Chiron Super Sport 300+ superó las 490 km/h en 2019, con un piloto de pruebas a bordo.",
  },
  {
    id: "p1",
    gamma: "mito",
    make: "McLaren",
    model: "P1",
    year: "2015",
    color: "naranja oscuro",
    aliases: ["mclaren p1", "p1 gtr"],
    description: "Híbrido de 916 hp, uno de los ‘Holy Trinity’ junto al 918 y el LaFerrari.",
    funFact: "McLaren construyó solo 375 P1 de calle. Cada uno ya era una pieza de museo al salir.",
  },
];

const MITO_RE =
  /ferrari|lamborghini|bugatti|mclaren|pagani|koenigsegg|rimac|chiron|laferrari|aventador|huracan|huracán|revuelto|sf90|la ferrari|p1|senna|veyron|agera|jesko|huayra|zonda|nevera|valkyrie|amg one|918 spyder|carrera gt/i;
const ELITE_RE =
  /911|gt-r|gtr|corvette|amg gt|aston|bentley|rolls|lfa|nsx|continental gt|db11|db12|812|maserati mc|lexus lfa|honda nsx|viper|superleggera|vanquish|ghost|phantom|wraith/i;
const SELECTA_RE =
  /\bm[2-8]\b|rs\s*[3-7]|type r|cayman|boxster|giulia|c63|e63|m3|m4|m5|m2|m8|quadrifoglio|alpina|s3 sportback|golf r|audi r8|rs6|rs7|c63|cls 63|panamera turbo|m340|m440/i;
const SPORT_RE =
  /gti|mustang|wrx|mx-5|miata|cooper s|brz|gr86|camaro|challenger|charger|raptor|cupra|golf r|veloster n|focus st|fiesta st|megane rs|clio rs|swift sport|mazda 3 turbo|civic si|bronco raptor|ranger raptor|hilux|amarok v6|tacoma trd/i;

export function gammaById(id: GammaId): Gamma {
  return GAMMAS.find((g) => g.id === id) ?? GAMMAS[0]!;
}

export function fleetById(id: string): FleetCar | undefined {
  return FLEET.find((c) => c.id === id);
}

export function catalogById(id: string): CatalogCar | undefined {
  return CATALOG.find((c) => c.id === id);
}

export function normName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchCatalog(make: string, model: string): CatalogCar | undefined {
  const nm = normName(make);
  const nd = normName(model);
  const blob = `${nm} ${nd}`;

  const scored = CATALOG.map((car) => {
    const cm = normName(car.make);
    const cd = normName(car.model);
    let score = 0;
    if (nm === cm) score += 4;
    else if (blob.includes(cm)) score += 2;
    if (nd === cd) score += 5;
    else if (nd.includes(cd) || cd.includes(nd)) score += 3;
    for (const alias of car.aliases) {
      const a = normName(alias);
      if (nd === a || blob === a) score += 5;
      else if (nd.includes(a) || blob.includes(a)) score += 2;
    }
    return { car, score };
  })
    .filter((x) => x.score >= 6)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.car;
}

export function inferGamma(make: string, model: string, klass?: string): GammaId {
  const cls = (klass ?? "").toLowerCase();
  if (/hyper|hypercar|prototype|one-off/.test(cls)) return "mito";
  if (/super|supercar|gt3|gt2|gt4/.test(cls)) return "elite";
  if (/hot hatch|sport|coupe|coupé|roadster|muscle/.test(cls)) {
    const blob = `${make} ${model}`;
    if (SELECTA_RE.test(blob) || ELITE_RE.test(blob)) return "selecta";
    return "sport";
  }
  const blob = `${make} ${model}`;
  if (MITO_RE.test(blob) || MITO_RE.test(make)) return "mito";
  if (ELITE_RE.test(blob) || /ferrari|lamborghini|bugatti|mclaren|pagani|koenigsegg/.test(make))
    return "elite";
  if (SELECTA_RE.test(blob)) return "selecta";
  if (SPORT_RE.test(blob)) return "sport";
  if (/ferrari|lamborghini|bugatti|mclaren|pagani|koenigsegg|rimac/.test(make)) return "mito";
  if (/porsche|aston martin|rolls-royce|bentley|maserati/.test(make)) return "elite";
  if (/bmw|mercedes-amg|audi|alfa romeo/.test(make) && /m |amg|rs |type r|quadrifoglio/i.test(model))
    return "selecta";
  return "calle";
}

export function wildId(make: string, model: string): string {
  const slug = normName(`${make}-${model}`).replace(/\s+/g, "-") || "auto";
  return `wild-${slug}`;
}

export function entryKey(make: string, model: string): string {
  return `${normName(make)}|${normName(model)}`;
}

export function toCollectionEntry(
  vehicle: VehicleId,
  speedKmh: number,
  prev?: CollectionEntry,
): CollectionEntry {
  const hit = matchCatalog(vehicle.make, vehicle.model);
  const id = prev?.id ?? hit?.id ?? wildId(vehicle.make, vehicle.model);
  return {
    id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year || hit?.year || prev?.year || "",
    color: vehicle.color || prev?.color || hit?.color || "",
    description: (hit?.description || vehicle.description || prev?.description || "").slice(0, 180),
    funFact: (hit?.funFact || vehicle.funFact || prev?.funFact || "").slice(0, 220),
    klass: vehicle.klass || prev?.klass,
    gamma: hit?.gamma ?? inferGamma(vehicle.make, vehicle.model, vehicle.klass),
    at: Date.now(),
    sightings: (prev?.sightings ?? 0) + 1,
    lastSpeedKmh: speedKmh,
  };
}
