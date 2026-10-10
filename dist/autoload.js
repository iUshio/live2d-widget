/*!
 * Live2D Widget
 * https://github.com/iUshio/live2d-widget
 */
(() => {
  // Capture currentScript synchronously: it is null after an await.
  // Keep every widget asset on the same repository/ref as this script.
  const source = document.currentScript?.src;
  if (window.live2dWidgetReady) return;
  if (!source) {
    console.error('[Live2D Widget] Load autoload.js with a regular <script src="…"> tag.');
    return;
  }
  const live2dPath = new URL('./', source);
  const config = {
    waifuPath: new URL('waifu-tips.json', live2dPath).href,
    cubism2Path: new URL('live2d.min.js', live2dPath).href,
    cubism5Path: 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js',
    tools: ['hitokoto', 'asteroids', 'switch-model', 'switch-texture', 'photo', 'info', 'quit'],
    logLevel: 'warn',
    drag: false,
    // Optional overrides must be set before the autoload script is included.
    ...window.live2dWidgetConfig,
  };

  function loadResource(url, type) {
    return new Promise((resolve, reject) => {
      const tag = document.createElement(type === 'css' ? 'link' : 'script');
      if (type === 'css') {
        tag.rel = 'stylesheet';
        tag.href = url;
      } else {
        tag.type = 'module';
        tag.src = url;
      }
      tag.onload = () => resolve(url);
      tag.onerror = () => reject(new Error(`Unable to load ${url}`));
      document.head.appendChild(tag);
    });
  }

  // This promise covers the autoloader, not completion of model rendering.
  window.live2dWidgetReady = (async () => {
    // Retain upstream's cross-origin image handling for Cubism 5 textures.
    const OriginalImage = window.Image;
    window.Image = function (...args) {
      const img = new OriginalImage(...args);
      img.crossOrigin = 'anonymous';
      return img;
    };
    window.Image.prototype = OriginalImage.prototype;

    await Promise.all([
      loadResource(new URL('waifu.css', live2dPath).href, 'css'),
      loadResource(new URL('waifu-tips.js', live2dPath).href, 'js'),
      new Promise((resolve) => {
        if (document.readyState !== 'loading') resolve();
        else document.addEventListener('DOMContentLoaded', resolve, { once: true });
      }),
    ]);
    if (typeof window.initWidget !== 'function') {
      throw new Error('waifu-tips.js did not register window.initWidget.');
    }
    window.initWidget(config);
    window.dispatchEvent(new CustomEvent('live2d:autoload-ready', { detail: config }));
    return config;
  })();
  window.live2dWidgetReady.catch((error) => {
    console.error('[Live2D Widget] Autoload failed:', error);
    window.dispatchEvent(new CustomEvent('live2d:autoload-error', { detail: error }));
  });
})();
