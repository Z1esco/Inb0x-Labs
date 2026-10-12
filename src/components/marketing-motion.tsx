"use client";

import { useEffect } from "react";

/** Progressive enhancement: server content stays visible without JS or motion. */
export function MarketingMotion() {
  useEffect(() => {
    const root = document.querySelector(".product-site");
    if (!root || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          observer.unobserve(target);
          if (preference.matches) return;
          const animation = target.animate(
            [
              { opacity: 0, transform: "translateY(18px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 540, easing: "cubic-bezier(.22,1,.36,1)" },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        });
      },
      { threshold: 0.08 },
    );
    root
      .querySelectorAll("[data-reveal]")
      .forEach((node) => observer.observe(node));
    const cancelMotion = () => {
      if (preference.matches) {
        animations.forEach((animation) => animation.cancel());
        animations.clear();
      }
    };
    preference.addEventListener("change", cancelMotion);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", cancelMotion);
      animations.forEach((animation) => animation.cancel());
    };
  }, []);
  return null;
}
