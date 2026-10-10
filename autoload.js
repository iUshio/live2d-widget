/*!
 * Live2D Widget — repository-root entry point
 * https://github.com/iUshio/live2d-widget
 */
(() => {
  if (window.__live2dWidgetBootstrap || window.live2dWidgetReady) return;
  const source = document.currentScript?.src;
  if (!source) {
    console.error('[Live2D Widget] Load autoload.js with a regular <script src="…"> tag.');
    return;
  }
  window.__live2dWidgetBootstrap = true;
  const script = document.createElement('script');
  script.src = new URL('dist/autoload.js', source).href;
  script.onerror = () => {
    delete window.__live2dWidgetBootstrap;
    const error = new Error(`Unable to load ${script.src}`);
    console.error('[Live2D Widget]', error);
    window.dispatchEvent(new CustomEvent('live2d:autoload-error', { detail: error }));
  };
  document.head.appendChild(script);
})();
