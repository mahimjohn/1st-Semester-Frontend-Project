function animateNumberPreserveNonNumeric(element, duration = 1500, decimals = 0) {
  const original = element.textContent.trim();
  const match = original.match(/-?\d+(\.\d+)?/); // find first numeric substring
  if (!match) return; // no number found

  const numberText = match[0];
  const startIdx = match.index;
  const prefix = original.slice(0, startIdx);
  const suffix = original.slice(startIdx + numberText.length);

  const finalValue = parseFloat(numberText);
  const startValue = 0;
  const startTime = performance.now();

  function formatValue(val) {
    return decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();
  }

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out (quadratic)
    const eased = 1 - Math.pow(1 - progress, 2);
    const current = startValue + (finalValue - startValue) * eased;
    element.textContent = prefix + formatValue(current) + suffix;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      // ensure final exact value (avoids tiny rounding issues)
      element.textContent = prefix + (decimals > 0 ? finalValue.toFixed(decimals) : Math.round(finalValue)) + suffix;
    }
  }

  requestAnimationFrame(tick);
}

window.addEventListener("DOMContentLoaded", () => {
  // animate all elements with class "number"
  document.querySelectorAll(".number").forEach(el => {
    // if the original contains a decimal, animate with 1 or 2 decimals automatically
    const hasDecimal = /\d+\.\d+/.test(el.textContent);
    const decimals = hasDecimal ? 1 : 0;
    animateNumberPreserveNonNumeric(el, 1500, decimals);
  });
});
