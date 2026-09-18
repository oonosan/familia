import { useEffect, useRef, useState } from "react";

// Carrusel horizontal de N pantallas: cada una scrollea su propio contenido,
// y al llegar a un borde (arriba/abajo) o al deslizar de costado, pasa a la
// pantalla siguiente/anterior. Portado 1:1 desde el artefacto original.
export function useCarousel(count) {
  const trackRef = useRef(null);
  const paneRefs = useRef([]);
  const [current, setCurrent] = useState(0);
  const lockedRef = useRef(false);
  const LOCK_MS = 700;
  const EDGE = 1;

  function atTop(pane) {
    return pane.scrollTop <= EDGE;
  }
  function atBottom(pane) {
    return pane.scrollTop + pane.clientHeight >= pane.scrollHeight - EDGE;
  }

  function goTo(i) {
    i = Math.max(0, Math.min(count - 1, i));
    setCurrent((cur) => {
      if (i === cur) return cur;
      if (trackRef.current) {
        trackRef.current.style.transform = "translateX(-" + i * (100 / count) + "%)";
      }
      lockedRef.current = true;
      clearTimeout(goTo._t);
      goTo._t = setTimeout(() => {
        lockedRef.current = false;
      }, LOCK_MS);
      const target = paneRefs.current[i];
      setTimeout(() => {
        try {
          target && target.focus({ preventScroll: true });
        } catch (e) {}
      }, LOCK_MS);
      return i;
    });
  }
  function step(dir) {
    if (!lockedRef.current) goTo(current + dir);
  }

  useEffect(() => {
    const carousel = document.getElementById("carousel");
    if (!carousel) return;

    function onWheel(e) {
      if (lockedRef.current) {
        e.preventDefault();
        return;
      }
      const pane = paneRefs.current[current];
      if (!pane) return;
      const absX = Math.abs(e.deltaX),
        absY = Math.abs(e.deltaY);
      if (absX > absY && absX > 4) {
        e.preventDefault();
        if (e.deltaX > 12) step(1);
        else if (e.deltaX < -12) step(-1);
        return;
      }
      if (e.deltaY > 0 && atBottom(pane)) {
        e.preventDefault();
        step(1);
      } else if (e.deltaY < 0 && atTop(pane)) {
        e.preventDefault();
        step(-1);
      }
    }

    let tx0 = 0, ty0 = 0, txL = 0, tyL = 0, axis = null, startTop = false, startBottom = false;

    function onTouchStart(e) {
      if (lockedRef.current || !e.touches.length) return;
      const t = e.touches[0];
      tx0 = txL = t.clientX;
      ty0 = tyL = t.clientY;
      axis = null;
      const pane = paneRefs.current[current];
      if (pane) {
        startTop = atTop(pane);
        startBottom = atBottom(pane);
      }
    }
    function onTouchMove(e) {
      if (lockedRef.current || !e.touches.length) return;
      const t = e.touches[0];
      const dx = t.clientX - tx0, dy = t.clientY - ty0;
      txL = t.clientX;
      tyL = t.clientY;
      if (!axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axis === "x") e.preventDefault();
    }
    function onTouchEnd() {
      if (lockedRef.current) return;
      const dx = txL - tx0, dy = tyL - ty0, TH = 55;
      if (axis === "x") {
        if (dx <= -TH) step(1);
        else if (dx >= TH) step(-1);
      } else if (axis === "y") {
        if (dy <= -TH && startBottom) step(1);
        else if (dy >= TH && startTop) step(-1);
      }
      axis = null;
    }
    function onKeydown(e) {
      if (lockedRef.current) return;
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        step(-1);
      }
    }

    carousel.addEventListener("wheel", onWheel, { passive: false });
    carousel.addEventListener("touchstart", onTouchStart, { passive: true });
    carousel.addEventListener("touchmove", onTouchMove, { passive: false });
    carousel.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("keydown", onKeydown);

    return () => {
      carousel.removeEventListener("wheel", onWheel);
      carousel.removeEventListener("touchstart", onTouchStart);
      carousel.removeEventListener("touchmove", onTouchMove);
      carousel.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("keydown", onKeydown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, count]);

  function registerPane(i) {
    return (el) => {
      paneRefs.current[i] = el;
    };
  }

  return { trackRef, registerPane, current, goTo };
}
