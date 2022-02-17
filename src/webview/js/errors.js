// @flow strict-local

import sendMessage from './sendMessage';

const escapeHtml = (text: string): string => {
  const element = document.createElement('div');
  element.innerText = text;
  return element.innerHTML;
};

export const reportError = (
  message: string,
  source: string,
  line: number,
  column: number,
  error: Error,
): boolean => {
  if (isDevelopment) {
    // In development, show a detailed error banner for debugging.
    const elementJsError = document.getElementById('js-error-detailed');
    if (elementJsError) {
      elementJsError.innerHTML = [
        `Message: ${message}`,
        `Source: ${source}`,
        `Line: ${line}:${column}`,
        `Error: ${JSON.stringify(error)}`,
        '',
      ]
        .map(escapeHtml)
        .join('<br>');
    }
  } else {
    // In a release build published for normal use, just show a short,
    // friendly, generic error message.  We'll report the error details
    // via Sentry, below.
    const elementJsError = document.getElementById('js-error-plain');
    const elementSheetGenerated = document.getElementById('generated-styles');
    const elementSheetHide = document.getElementById('style-hide-js-error-plain');
    if (
      elementJsError
      && elementSheetGenerated
      && elementSheetHide
      && elementSheetHide instanceof HTMLStyleElement
      && elementSheetHide.sheet
      && elementSheetGenerated instanceof HTMLStyleElement
      && elementSheetGenerated.sheet
    ) {
      elementSheetHide.sheet.disabled = true;
      const height = elementJsError.offsetHeight;
      elementSheetGenerated.sheet.insertRule(`.header-wrapper { top: ${height}px; }`, 0);
    }
  }

  const userAgent = window.navigator.userAgent;
  sendMessage({
    type: 'error',
    details: {
      message,
      source,
      line,
      column,
      userAgent,
      error,
    },
  });

  return true;
};
