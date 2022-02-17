// @flow strict-local

const duration = 468;

function easing(fraction) {
  return 0.5 * (1 - Math.cos(Math.PI * fraction));
}

export function windowSmoothScroll(targetX: number, targetY: number) {
  // TODO use built-in version if present

  const startTime = window.performance.now();
  const startX = window.scrollX;
  const startY = window.scrollY;

  function smoothScrollImpl() {
    const timeFraction = (window.performance.now() - startTime) / duration;
    const fractionComplete = easing(timeFraction > 1 ? 1 : timeFraction);
    const curX = startX + (targetX - startX) * fractionComplete;
    const curY = startY + (targetY - startY) * fractionComplete;

    // This line attempts an "instant" scroll to where we want to be right now.
    window.scroll(curX, curY);

    // And then this `requestAnimationFrame` is to let us repeat that until it's done.
    if (!(curX === targetX && curY === targetY)) {
      window.requestAnimationFrame(smoothScrollImpl);
    }
  }

  smoothScrollImpl();
}
