// @flow strict-local

const documentBody = document.body;
if (!documentBody) {
  throw new Error('No document.body element!');
}

/* Cached to avoid re-looking it up all the time. */
// eslint-disable-next-line import/no-mutable-exports
export let viewportHeight: number = documentBody.clientHeight;

window.addEventListener('resize', event => {
  const heightChange = documentBody.clientHeight - viewportHeight;
  viewportHeight = documentBody.clientHeight;

  // Now we try to scroll to keep the bottom edge of the viewport aligned to
  // the same content it was before the resize.  We assume the browser tried
  // to keep the top edge aligned instead.
  //
  // Mostly, that means if the viewport grew, then the bottom edge moved down,
  // so we'll scroll back up by the same amount; vice versa if it shrank.

  // But if we were near the bottom pre-resize, and grew, then there may not
  // have been room for the bottom edge to move that far down, and we
  // shouldn't try to compensate -- if we do, we could end up scrolling up
  // higher than we started.
  //
  // If that happened, we'll be at the very bottom now.
  const maxScrollTop = documentBody.scrollHeight - documentBody.clientHeight;
  if (documentBody.scrollTop >= maxScrollTop - 1) {
    // We're at (or within a px of, or beyond) the very bottom of the
    // content.  Don't scroll.
    //
    // This does mean if you're near the bottom, and then the viewport grows
    // by more than that distance, you'll wind up at the very bottom instead
    // of where you were.  That's not our ideal behavior.  OTOH it's
    // mitigated by the fact that in this situation everything that was in
    // view is still in view.
    return;
  }

  // Scrolling by a positive `top` scrolls down; negative scrolls up.
  window.scrollBy({ left: 0, top: -heightChange });
});
