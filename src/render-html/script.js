/* @flow */
import smoothScroll from './smoothScroll.min';
import js from './es3';
import config from '../config';

const errorHandler = `
window.onerror = function (message, source, line, column, error) {
  var obj = JSON.stringify(error);
  var errorStr = ['Message: ' + message + '<br>', 'Line: ' + line + ':' + column + '<br>', 'Error: ' + obj + '<br>'].join('');
  document.getElementById('js-error').innerHTML = errorStr;
  return false;
};
`;

export default (anchor: number): string => `
<script>
window.__forceSmoothScrollPolyfill__ = true;
${config.enableWebViewErrorDisplay ? errorHandler : ''}
${smoothScroll}
document.addEventListener('DOMContentLoaded', function() {
  window.postMessage(JSON.stringify({type: 'debug', a: 'start DOMContentLoaded'}), '*');
  ${js}
  sendMessage({type: 'debug', a: 'DOMContentLoaded'});
  scrollToAnchor(${anchor});
  scrollEventsDisabled = false;
});
</script>
`;
