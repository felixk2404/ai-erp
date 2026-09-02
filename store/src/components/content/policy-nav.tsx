"use client";

import { useEffect, useState } from "react";

/**
 * ניווט צדדי דביק עם מצב פעיל אמיתי: IntersectionObserver עוקב אחרי הסקשן
 * הכי גבוה שגלוי, ומדגיש את הקישור התואם ב-beam (טקסט + קו תחתון) ו-aria-current.
 */
export function PolicyNav({ items }: { items: { id: string; title: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px" },
    );
    for (const { id } of items) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <ul className="sticky top-24 flex flex-col gap-1 border-s border-rule ps-4">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            aria-current={active === item.id ? "true" : undefined}
            className={`flex h-9 items-center text-sm transition-colors ${
              active === item.id
                ? "text-beam underline decoration-2 underline-offset-4"
                : "text-glow-2 hover:text-glow"
            }`}
          >
            {item.title}
          </a>
        </li>
      ))}
    </ul>
  );
}
