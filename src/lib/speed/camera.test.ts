import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cameraErrorMessage } from "./camera.ts";

describe("cameraErrorMessage", () => {
  it("maps permission denial", () => {
    const err = new Error("denied");
    err.name = "NotAllowedError";
    const msg = cameraErrorMessage(err);
    assert.match(msg, /cámara/i);
    assert.match(msg, /Ajustes|Safari/i);
  });

  it("maps busy camera", () => {
    const err = new Error("busy");
    err.name = "NotReadableError";
    assert.match(cameraErrorMessage(err), /ocupada/i);
  });

  it("maps missing camera", () => {
    const err = new Error("none");
    err.name = "NotFoundError";
    assert.match(cameraErrorMessage(err), /cámara/i);
  });

  it("maps insecure context", () => {
    const err = new Error("https");
    err.name = "SecurityError";
    assert.match(cameraErrorMessage(err), /HTTPS|segura/i);
  });
});
