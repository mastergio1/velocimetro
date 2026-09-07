# VELOX

Pistola de velocidad para **cualquier teléfono** (iPhone, Android, tablet): apunta la cámara a un auto, lee **su** velocidad, identifica marca y modelo y guarda una ficha con una descripción breve y un dato curioso.

No es exclusivo del iPhone 14 Pro Max. Cualquier dispositivo con cámara trasera y un navegador moderno (Safari o Chrome) sirve. En iPhone: Safari → Compartir → Añadir a pantalla de inicio.

Repo: [mastergio1/velocimetro](https://github.com/mastergio1/velocimetro)

## Qué hace

- Bloquea el auto en el retículo y estima su velocidad (óptica + flujo óptico, no es un radar de tráfico).
- En demo, los autos de la calle se identifican al bloquearlos.
- Con cámara, al mantener el auto se identifica (cualquier marca) y entra al catálogo.
- **Catálogo**: archivo abierto por gammas (Calle, Sport, Selecta, Élite, Mito). Exportable a JSON.
- **Memoria** y **modo incógnito** (medir sin guardar) viven en este dispositivo.

## Cómo se bloquea un auto

1. Cada fotograma se reduce y se busca movimiento (manchas que se desplazan).
2. El retículo se queda con el blanco más cercano al centro; si el anterior sigue a la vista, no salta.
3. La distancia sale del ancho aparente (~1,8 m, calibrable).
4. La velocidad fusiona el cambio de distancia (pinhole) con el flujo óptico dentro del recuadre.
5. Teléfono quieto = se mide el auto, no tú.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre `http://localhost:8080`.

- Demo: ya hay autos en la calle; el retículo bloquea uno y muestra ficha.
- Cámara: concede permiso, apunta a un auto en movimiento. En iOS, si Safari niega la cámara: Ajustes → Safari → Cámara → Permitir.

Identificación con IA usa `XAI_API_KEY` en el servidor. Sin esa clave, la demo y la medición óptica siguen funcionando.

```bash
npm run build
npm run typecheck
npm test
```

## Notas

- Estimación óptica, no homologada. Mejor con el teléfono quieto y el auto centrado.
- El dial abre hasta 500 km/h si el blanco lo pide.
- Las fichas IA reconocen cualquier marca. Tope de servidor para no gastar cuota de más.
- Sin cuentas ni base de datos: memoria y catálogo viven en el dispositivo.
