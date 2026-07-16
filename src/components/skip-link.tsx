"use client";

export function SkipLink() {
  return (
    <a
      className="skip-link"
      href="#main-content"
      onClick={() => {
        requestAnimationFrame(() =>
          document.getElementById("main-content")?.focus(),
        );
      }}
    >
      Skip to content
    </a>
  );
}
