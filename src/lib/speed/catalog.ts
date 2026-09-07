import type { VehicleId } from "./types";

export type FleetCar = VehicleId & {
  id: string;
  body: string;
  glass: string;
  widthM: number;
  lengthM: number;
  heightM: number;
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
];

export function fleetById(id: string): FleetCar | undefined {
  return FLEET.find((c) => c.id === id);
}
