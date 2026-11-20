const requestTimeout = 25000;

async function fetchModel(url, retry) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeout);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: retry ? 'reload' : 'default' });
    if (response.ok) return await response.arrayBuffer();

    response.body?.cancel().catch(() => {});
    const error = new Error(`${url.pathname} returned HTTP ${response.status}`);
    error.retryable = response.status >= 500 || response.status === 408 || response.status === 429;
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function createModelLoader(loader) {
  const foreground = [];
  const background = [];
  let active = 0;

  async function read(url) {
    let bytes;
    try {
      bytes = await fetchModel(url, false);
    } catch (error) {
      if (!error.retryable && !(error instanceof TypeError) && error.name !== 'AbortError') throw error;
      bytes = await fetchModel(url, true);
    }
    return (await loader.parseAsync(bytes, new URL('.', url).href)).scene;
  }

  function drain() {
    while (active < 3 && (foreground.length || background.length)) {
      const { url, resolve, reject } = foreground.shift() || background.shift();
      active++;
      read(url).then(resolve, reject).finally(() => { active--; drain(); });
    }
  }

  function load(source, { prefetch = false } = {}) {
    const url = new URL(source, document.baseURI);
    const queue = prefetch ? background : foreground;
    return new Promise((resolve, reject) => {
      queue.push({ url, resolve, reject });
      drain();
    });
  }

  function prioritize(source) {
    const href = new URL(source, document.baseURI).href;
    const index = background.findIndex(job => job.url.href === href);
    if (index >= 0) foreground.unshift(...background.splice(index, 1));
  }

  return { load, prioritize };
}
