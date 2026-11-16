"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Optics = require("./geometry.js");

function closeTo(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} should be near ${expected}`);
}

test("full-frame and APS-C field of view use the actual sensor dimensions", () => {
  const full = Optics.fieldOfView(50, { width: 36, height: 24 }, 5);
  const aps = Optics.fieldOfView(50, { width: 23.6, height: 15.7 }, 5);

  closeTo(full.horizontal, 39.597752709049864);
  closeTo(full.vertical, 26.991466561591622);
  closeTo(full.cropFactor, 1);
  closeTo(full.equivalent, 50);
  closeTo(aps.width, 2.36);
  closeTo(aps.height, 1.57);
  assert.ok(aps.horizontal < full.horizontal);
  assert.ok(aps.equivalent > 75 && aps.equivalent < 77);
});

test("equivalent focal length preserves diagonal, not necessarily horizontal, angle", () => {
  const fourThirds = Optics.fieldOfView(35, { width: 17.3, height: 13 }, 5);
  const equivalent = Optics.fieldOfView(fourThirds.equivalent, Optics.fullFrame, 5);

  closeTo(fourThirds.diagonal, equivalent.diagonal);
  assert.ok(Math.abs(fourThirds.horizontal - equivalent.horizontal) > 1);
});

test("distance changes the captured area without changing the angle of view", () => {
  const near = Optics.fieldOfView(14, Optics.fullFrame, 1);
  const far = Optics.fieldOfView(14, Optics.fullFrame, 50);
  const telephoto = Optics.fieldOfView(200, Optics.fullFrame, 1);

  closeTo(near.horizontal, far.horizontal);
  closeTo(far.width, near.width * 50);
  closeTo(far.height, near.height * 50);
  assert.ok(near.horizontal > 100 && telephoto.horizontal < 11);
});

test("keeping the subject framing fixed changes perspective as the camera moves", () => {
  const sameLens = Optics.perspective(24, 8, true);
  const telephoto = Optics.perspective(85, 8, true);
  const distantBackground = Optics.perspective(85, 20, true);

  closeTo(sameLens.relativeSize, 1);
  closeTo(telephoto.reference.subjectFraction, 0.55);
  closeTo(telephoto.current.subjectFraction, 0.55);
  closeTo(telephoto.current.distance / telephoto.reference.distance, 85 / 24);
  assert.ok(telephoto.relativeSize > 2);
  assert.ok(distantBackground.relativeSize > telephoto.relativeSize);
});

test("changing focal length at a fixed camera position does not change perspective", () => {
  const zoomed = Optics.perspective(200, 8, false);

  closeTo(zoomed.current.distance, zoomed.reference.distance);
  closeTo(zoomed.relativeSize, 1);
  closeTo(zoomed.current.subjectFraction / zoomed.reference.subjectFraction, 200 / 24);
  closeTo(zoomed.current.backgroundFraction / zoomed.reference.backgroundFraction, 200 / 24);
});
