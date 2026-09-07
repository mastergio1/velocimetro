# VELOX

Pistola de velocidad para el teléfono: apunta la cámara a un auto, lee **su** velocidad, identifica marca y modelo y guarda una ficha con una descripción breve y un dato curioso.

Repo: [mastergio1/velocimetro](https://github.com/mastergio1/velocimetro)

## Qué hace

- Bloquea el auto en el retículo y estima su velocidad (óptica, no es un radar de tráfico).
- En demo, los autos de la calle se identifican al bloquearlos.
- Con cámara, **Identificar** manda el recuadre a Grok (visión) y arma marca, modelo, color, descripción y dato.
- **Memoria** guarda las fichas en este teléfono (`localStorage`).
- Ajustes: km/h o mph, cámara trasera/frontal, ancho típico del auto, sensibilidad y límite de alerta.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre `http://localhost:8080`.

- Demo: ya hay autos en la calle; el retículo bloquea uno y muestra ficha.
- Cámara: concede permiso, apunta a un auto en movimiento y pulsa **Identificar**.

Identificación con IA (cámara) usa `XAI_API_KEY` en el servidor. Sin esa clave, la demo y la medición óptica siguen funcionando.

```bash
npm run build
npm run typecheck
```

## Notas

- La velocidad en cámara es una estimación (ancho típico ~1,8 m, calibrable en Ajustes). Mejor con el teléfono quieto y el auto centrado.
- Las fichas IA son bajo demanda (máx. 10 por sesión) para no gastar cuota de más.
- Sin cuentas ni base de datos: la memoria vive en el dispositivo.
