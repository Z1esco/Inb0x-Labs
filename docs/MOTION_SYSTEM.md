# Motion system

The current frontend uses CSS transitions and keyframes, avoiding a second animation dependency. Motion
is a product signal: it confirms hierarchy and state without competing with inbox content.

- Micro interaction: 120–180ms.
- Standard state transition: 180–280ms.
- Panels: 240–360ms.
- Use opacity and transform; avoid continuous layout, shadow, blur, or background-position animation.
- The shell remains stable between routes; only content reveals move.
- Skeleton shimmer is subtle and replaced by an instant static state under reduced motion.
- `prefers-reduced-motion: reduce` removes large movement and repeated animation while retaining focus and
  state changes.

The redesign keeps most content still. Motion is reserved for interaction feedback and spatial hierarchy:
the active navigation rail, button lift, mobile navigation reveal, skeleton replacement, and the landing
preview's quiet depth. No continuous background motion, chart animation, automatic page delay, or decorative
stagger was added. The angled landing preview is static composition, not an animation requirement.
