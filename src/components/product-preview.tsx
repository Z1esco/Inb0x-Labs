"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import briefing from "../../public/product/briefing.png";
import briefingMobile from "../../public/product/briefing-mobile.png";
import thread from "../../public/product/thread.png";
import threadMobile from "../../public/product/thread-mobile.png";
import reply from "../../public/product/reply.png";
import replyMobile from "../../public/product/reply-mobile.png";

const views = [
  {
    name: "Briefing",
    image: briefing,
    mobileImage: briefingMobile,
    alt: "Inb0x briefing in a fictional demo workspace",
    width: 1440,
    height: 1000,
    description:
      "A focused queue of decisions, replies and work you’ve accepted.",
    href: "/dashboard",
  },
  {
    name: "Thread analysis",
    image: thread,
    mobileImage: threadMobile,
    alt: "Inb0x thread analysis in a fictional demo workspace",
    width: 1440,
    height: 1000,
    description:
      "Read the conversation alongside its summary, actions and source evidence.",
    href: "/inbox/proposal-approval",
  },
  {
    name: "Reply Studio",
    image: reply,
    mobileImage: replyMobile,
    alt: "Inb0x reply review in a fictional demo workspace",
    width: 1440,
    height: 1000,
    description:
      "Review the wording, facts and uncertainty. Copy when you’re ready.",
    href: "/drafts",
  },
] as const;

export function ProductPreview() {
  const [selected, setSelected] = useState(0);
  const view = views[selected]!;
  return (
    <figure className="product-preview" id="product">
      <div className="preview-toolbar">
        <div
          className="preview-choices"
          role="group"
          aria-label="Explore the actual Inb0x interface"
        >
          {views.map((item, index) => (
            <button
              key={item.name}
              type="button"
              aria-pressed={selected === index}
              aria-controls="product-image"
              onClick={() => setSelected(index)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <span className="preview-fixture">Fictional demo workspace</span>
      </div>
      <div className="preview-image" id="product-image">
        <picture key={view.image.src} className="preview-frame">
          <source
            media="(max-width: 480px)"
            srcSet={view.mobileImage.src}
            width={390}
            height={844}
          />
          <Image
            src={view.image}
            alt={view.alt}
            width={view.width}
            height={view.height}
            sizes="(max-width: 1300px) 92vw, 1240px"
            loading={selected === 0 ? "eager" : "lazy"}
          />
        </picture>
      </div>
      <figcaption>
        <p aria-live="polite">{view.description}</p>
        <Link href={view.href}>
          Explore {view.name.toLowerCase()} <Icon name="arrow" />
        </Link>
      </figcaption>
    </figure>
  );
}
