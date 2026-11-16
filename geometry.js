"use strict";

const Optics = (() => {
  const fullFrame = { width: 36, height: 24 };
  const perspectiveReference = {
    focal: 24,
    subjectHeight: 1.7,
    backgroundHeight: 2.6,
    subjectFraction: 0.55
  };

  function angleOfView(dimension, focalLength) {
    return 2 * Math.atan(dimension / (2 * focalLength)) * 180 / Math.PI;
  }

  function fieldOfView(focalLength, sensor, distance) {
    const diagonal = Math.hypot(sensor.width, sensor.height);
    const cropFactor = Math.hypot(fullFrame.width, fullFrame.height) / diagonal;
    return {
      horizontal: angleOfView(sensor.width, focalLength),
      vertical: angleOfView(sensor.height, focalLength),
      diagonal: angleOfView(diagonal, focalLength),
      cropFactor,
      equivalent: focalLength * cropFactor,
      width: distance * sensor.width / focalLength,
      height: distance * sensor.height / focalLength
    };
  }

  function perspective(focalLength, backgroundDistance, keepFraming) {
    const { focal, subjectHeight, backgroundHeight, subjectFraction } = perspectiveReference;
    const referenceDistance = focal * subjectHeight / (fullFrame.height * subjectFraction);
    const cameraDistance = keepFraming ? referenceDistance * focalLength / focal : referenceDistance;

    function frame(distance, fraction) {
      return {
        distance,
        subjectFraction: fraction,
        backgroundFraction: fraction * backgroundHeight / subjectHeight
          * distance / (distance + backgroundDistance)
      };
    }

    const reference = frame(referenceDistance, subjectFraction);
    const current = frame(
      cameraDistance,
      focalLength * subjectHeight / (fullFrame.height * cameraDistance)
    );
    const relativeSize = (current.backgroundFraction / current.subjectFraction)
      / (reference.backgroundFraction / reference.subjectFraction);

    return { reference, current, relativeSize };
  }

  return { fullFrame, perspectiveReference, angleOfView, fieldOfView, perspective };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Optics;

function formatNumber(value, digits) {
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function setRangeProgress(input) {
  const percent = (Number(input.value) - Number(input.min))
    / (Number(input.max) - Number(input.min)) * 100;
  input.style.setProperty("--progress", `${percent}%`);
}

function setupTips() {
  const slides = Array.from(document.querySelectorAll("[data-tip]"));
  const counter = document.getElementById("tip-counter");
  let index = 0;

  function showTip(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== index; });
    counter.textContent = `${index + 1} / ${slides.length}`;
  }

  document.getElementById("tip-prev").addEventListener("click", () => showTip(index - 1));
  document.getElementById("tip-next").addEventListener("click", () => showTip(index + 1));
  showTip(0);
}
