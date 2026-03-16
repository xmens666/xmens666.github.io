/**
 * img-loader.js — Lightweight image loading animation
 * Adds a blur-to-clear transition + shimmer placeholder for all <img> elements.
 * Usage: Just include this script. Works automatically via MutationObserver.
 */
(function () {
  // Inject styles once
  const style = document.createElement('style');
  style.textContent = `
    .img-loading-wrap {
      position: relative;
      overflow: hidden;
      background: rgba(255,255,255,0.03);
    }
    .img-loading-wrap::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 2;
      background: linear-gradient(
        105deg,
        transparent 30%,
        rgba(255,255,255,0.06) 50%,
        transparent 70%
      );
      background-size: 200% 100%;
      animation: img-shimmer 1.8s ease-in-out infinite;
    }
    .img-loading-wrap::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      background: rgba(0,0,0,0.15);
      transition: opacity 0.6s ease;
    }
    .img-loading-wrap.img-loaded::before,
    .img-loading-wrap.img-loaded::after {
      opacity: 0;
      pointer-events: none;
    }
    .img-loading-wrap img {
      transition: filter 0.6s ease, opacity 0.6s ease;
    }
    .img-loading-wrap:not(.img-loaded) img {
      filter: blur(8px) saturate(1.2);
      opacity: 0.6;
    }
    .img-loading-wrap.img-loaded img {
      filter: blur(0) saturate(1);
      opacity: 1;
    }
    @keyframes img-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);

  // Skip tiny images (icons, avatars < 40px) and SVG data URIs
  function shouldWrap(img) {
    if (!img.src && !img.getAttribute(':src') && !img.getAttribute('x-bind:src')) return false;
    if (img.src && img.src.startsWith('data:')) return false;
    if (img.closest('.img-loading-wrap')) return false;
    if (img.dataset.noLoader === 'true') return false;
    // Skip logos and very small inline icons
    const w = img.getAttribute('width');
    const h = img.getAttribute('height');
    if ((w && parseInt(w) < 40) || (h && parseInt(h) < 40)) return false;
    return true;
  }

  function wrapImage(img) {
    if (!shouldWrap(img)) return;

    // If already loaded (cached), skip animation
    if (img.complete && img.naturalWidth > 0) return;

    const parent = img.parentElement;
    // If parent is already a tight wrapper (like a sized div), use it directly
    const useParent = parent &&
      parent.children.length === 1 &&
      getComputedStyle(parent).overflow === 'hidden' &&
      !parent.classList.contains('img-loading-wrap');

    const wrap = useParent ? parent : document.createElement('div');

    if (!useParent) {
      // Copy display style from image context
      wrap.style.display = img.style.display || 'inline-block';
      wrap.style.width = img.style.width || '100%';
      wrap.style.lineHeight = '0';
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
    }

    wrap.classList.add('img-loading-wrap');

    function onLoaded() {
      wrap.classList.add('img-loaded');
      // Clean up pseudo-elements after transition
      setTimeout(() => {
        wrap.classList.remove('img-loading-wrap');
        wrap.classList.remove('img-loaded');
      }, 800);
    }

    if (img.complete && img.naturalWidth > 0) {
      onLoaded();
    } else {
      img.addEventListener('load', onLoaded, { once: true });
      img.addEventListener('error', onLoaded, { once: true });
    }
  }

  // Process existing images
  function init() {
    document.querySelectorAll('img').forEach(wrapImage);
  }

  // Watch for dynamically added images (Alpine.js, lazy load, etc.)
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.tagName === 'IMG') wrapImage(node);
        else if (node.querySelectorAll) {
          node.querySelectorAll('img').forEach(wrapImage);
        }
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      observer.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    init();
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
