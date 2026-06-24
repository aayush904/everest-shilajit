(function () {
  const INTERACTIVE_SEL = 'a,button,input,select,textarea,label,[role="button"],[data-no-drag]';

  function initOne(slider) {
    if (!slider || slider.dataset.ccInit === '1') return;
    slider.dataset.ccInit = '1';

    const track = slider.querySelector('.ccslider-track');
    const viewport = slider.querySelector('.ccslider-viewport');
    const prevBtn = slider.querySelector('.ccslider-arrow.prev');
    const nextBtn = slider.querySelector('.ccslider-arrow.next');

    if (!track || !viewport) return;

    // If only 0/1 slide, no need to slider-ify
    let realSlides = Array.from(track.children).filter(el => el.classList.contains('cart-xsell__slide'));
    if (realSlides.length <= 1) return;

    // Build clones (only once per init)
    const firstClone = realSlides[0].cloneNode(true);
    const lastClone  = realSlides[realSlides.length - 1].cloneNode(true);
    firstClone.dataset.clone = '1';
    lastClone.dataset.clone = '1';
    track.appendChild(firstClone);
    track.insertBefore(lastClone, track.firstElementChild);

    const realCount = realSlides.length;
    let index = 1;
    let isAnimating = false;

    // Drag state
    let isDown = false;
    let startX = 0;
    let startTranslate = 0;
    let currentTranslate = 0;
    let rafId = 0;
    let moved = 0;
    let didDrag = false;

    function width() {
      return viewport.getBoundingClientRect().width || 1;
    }
    function setTranslate(x, withTransition) {
      track.style.transition = withTransition ? 'transform 0.32s ease' : 'none';
      track.style.transform = `translateX(${x}px)`;
    }
    function snapToIndex(withTransition) {
      currentTranslate = -width() * index;
      setTranslate(currentTranslate, withTransition);
    }

    // Start position
    snapToIndex(false);

    function goTo(newIndex) {
      if (isAnimating || isDown) return;
      isAnimating = true;
      index = newIndex;
      snapToIndex(true);
    }

    // Fix the clone jump
    track.addEventListener('transitionend', () => {
      if (index === 0) {
        index = realCount;
        snapToIndex(false);
      } else if (index === realCount + 1) {
        index = 1;
        snapToIndex(false);
      }
      requestAnimationFrame(() => { isAnimating = false; });
    });

    // Arrows
    prevBtn && prevBtn.addEventListener('click', () => goTo(index - 1));
    nextBtn && nextBtn.addEventListener('click', () => goTo(index + 1));

    // --- DRAG ---
    function render() {
      setTranslate(currentTranslate, false);
      if (isDown) rafId = requestAnimationFrame(render);
    }

    track.addEventListener('pointerdown', (e) => {
      // ✅ If user is clicking a button/link/form control, DO NOT start drag
      if (e.target && e.target.closest(INTERACTIVE_SEL)) return;
      if (isAnimating) return;

      isDown = true;
      didDrag = false;
      moved = 0;

      track.classList.add('dragging');
      startX = e.clientX;
      startTranslate = currentTranslate;

      // Only capture pointer for non-interactive drags
      if (track.setPointerCapture) track.setPointerCapture(e.pointerId);

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(render);
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      moved = Math.abs(dx);
      if (moved > 6) didDrag = true; // ✅ treat as drag only after small movement
      currentTranslate = startTranslate + dx;
    }, { passive: true });

    function endDrag() {
      if (!isDown) return;

      cancelAnimationFrame(rafId);
      isDown = false;
      track.classList.remove('dragging');

      // If it wasn't a real drag, don't change slide (and allow clicks to work normally)
      if (!didDrag) {
        snapToIndex(false);
        return;
      }

      const dx = currentTranslate - startTranslate;
      const th = Math.max(60, width() * 0.15);

      if (dx < -th) index += 1;
      else if (dx > th) index -= 1;

      isAnimating = true;
      snapToIndex(true);
    }

    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // ✅ If a drag happened, prevent accidental click on links/buttons inside slides
    slider.addEventListener('click', (e) => {
      if (!didDrag) return;
      const t = e.target && e.target.closest(INTERACTIVE_SEL);
      if (t) {
        e.preventDefault();
        e.stopPropagation();
      }
      didDrag = false;
    }, true);

    // Resize keep alignment
    window.addEventListener('resize', () => snapToIndex(false));
  }

  function initAll(root) {
    (root || document).querySelectorAll('.infinite-ccslider').forEach(initOne);
  }

  // 1) Initial
  initAll();

  // 2) Re-init when cart drawer content changes (Dawn re-renders DOM on add-to-cart)
  const cartDrawer = document.querySelector('cart-drawer') || document.querySelector('#CartDrawer') || document.body;
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.matches && n.matches('.infinite-ccslider')) initOne(n);
        if (n.querySelector) initAll(n);
      }
    }
  });
  mo.observe(cartDrawer, { childList: true, subtree: true });
})();
