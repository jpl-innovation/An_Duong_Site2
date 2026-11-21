const requestTimeout = 120000; // a 13 MB model on a slow phone connection needs well over 25 s
// Bytes received and expected for every model being fetched, read by the loading screens to show a real percentage.
export const progress = new Map();
async function finish(reader, buf, got, value, url) {
  for (;;) {
    if (got + value.length > buf.length) { const g = new Uint8Array((got + value.length) * 2); g.set(buf.subarray(0, got)); buf = g; }
    buf.set(value, got); got += value.length;
    const r = await reader.read(); if (r.done) break; value = r.value;
  }
  progress.set(url.href, [got, got]);
  return buf.buffer.slice(0, got);
}
// Share of the given models already downloaded, 0 to 1 (unknown sizes count once they finish).
export function downloaded(sources) {
  let got = 0, total = 0;
  sources.forEach(s => { const p = progress.get(new URL(s, document.baseURI).href); if (p) { got += p[0]; total += p[1]; } else total += 4e6; });
  return total ? got / total : 1;
}

async function fetchModel(url, retry) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeout);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: retry ? 'reload' : 'default' });
    if (response.ok) {
      const total = +response.headers.get('content-length') || 0;
      if (!response.body || !total) { const buf = await response.arrayBuffer(); progress.set(url.href, [buf.byteLength, buf.byteLength]); return buf; }
      const out = new Uint8Array(total), reader = response.body.getReader();
      let got = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (got + value.length > total) { // a compressed or wrong length header: fall back to collecting chunks
          const grown = new Uint8Array(Math.max(total * 2, got + value.length)); grown.set(out.subarray(0, got)); return finish(reader, grown, got, value, url);
        }
        out.set(value, got); got += value.length;
        progress.set(url.href, [got, total]);
      }
      progress.set(url.href, [got, got]);
      return out.buffer.slice(0, got);
    }

    response.body?.cancel().catch(() => {});
    const error = new Error(`${url.pathname} returned HTTP ${response.status}`);
    error.retryable = response.status >= 500 || response.status === 408 || response.status === 429;
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// Downloads are shared: a model fetched ahead of time (preload) is parsed from the same bytes when a stage asks for it.
const bytes = new Map();
function download(url) {
  if (!bytes.has(url.href)) {
    const job = fetchModel(url, false).catch(error => {
      if (!error.retryable && !(error instanceof TypeError) && error.name !== 'AbortError') throw error;
      return fetchModel(url, true);
    });
    job.catch(() => bytes.delete(url.href));
    bytes.set(url.href, job);
  }
  return bytes.get(url.href);
}
// Fetch a list of models one or two at a time in the background, so they are on the machine before the visitor
// scrolls to them. Only the network is used here; nothing is parsed, so the page never stalls for it.
export function preloadModels(sources) {
  const queue = [...new Set(sources.filter(Boolean))].map(s => new URL(s, document.baseURI));
  let running = 0;
  const next = () => {
    while (running < 2 && queue.length) {
      running++;
      download(queue.shift()).catch(() => {}).finally(() => { running--; next(); });
    }
  };
  next();
}

let parsing = Promise.resolve();
export function createModelLoader(loader) {
  const foreground = [];
  const background = [];
  let active = 0;

  async function read(url) {
    const data = await download(url);
    // Parsing runs on the page's own thread: one model at a time, each after a fresh frame, so several models
    // arriving together never add up to one long freeze.
    const job = parsing
      .then(() => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))))
      .then(() => loader.parseAsync(data, new URL('.', url).href));
    parsing = job.then(() => {}, () => {});
    return (await job).scene;
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
