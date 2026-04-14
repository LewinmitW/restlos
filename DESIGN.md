# Design System Specification: The Living Kitchen

## 1. Overview & Creative North Star

**The Creative North Star: "The Culinary Curator"**
This design system moves away from the sterile, utility-first nature of traditional meal planners. Instead, it adopts a high-end editorial approach—think of a bespoke morning journal or a premium cookbook. The experience is defined by **Soft Minimalism**: a philosophy that prioritizes breathing room, organic warmth, and a rejection of rigid "app-like" containers.

To break the "template" look, we utilize **intentional asymmetry**. Ingredients might overflow their containers slightly, and typography scales are pushed to the extremes to create a rhythmic hierarchy that feels intentional and human, rather than generated.

---

## 2. Colors & Surface Philosophy

The palette is rooted in nature—earthy greens and sun-baked oranges set against a "Warm White" canvas.

### The Palette (Material Design Mapping)

* **Primary (`#316342`):** Forest-depth green for primary actions and brand presence.
* **Secondary (`#914C1A`):** A toasted orange for highlights and secondary "flavor" elements.
* **Tertiary (`#99393B`):** A muted, culinary red for warnings and deletions.
* **Neutral Surfaces:**
  * `surface`: #F9F9F7 (The Canvas)
  * `surface-container-low`: #F4F4F2 (Subtle sectioning)
  * `surface-container-lowest`: #FFFFFF (High-priority cards)

### The "No-Line" Rule

Standard 1px borders are strictly prohibited for sectioning. Structural definition must be achieved through **Tonal Shifts**. To separate a recipe card from the background, we do not draw a line; we place a `surface-container-lowest` (#FFFFFF) element onto a `surface` (#F9F9F7) background.

### Glass & Gradient Depth

To add "soul" to the minimalist interface:

* **Hero CTAs:** Use a subtle linear gradient from `primary` (#316342) to `primary-container` (#4A7C59) at a 135-degree angle.
* **Floating Navigation:** The bottom navigation bar should utilize a **Glassmorphic** effect: `surface` color at 85% opacity with a 12px backdrop-blur. This integrates the UI into the content scrolling beneath it.

---

## 3. Typography: The Editorial Voice

We use **Inter** not as a system font, but as a Swiss-style editorial tool.

* **Display & Headline (Semi-Bold):** Used for "Daily Inspiration" or "Current Plan." These should have a tight letter-spacing (-0.02em) to feel premium and compact.
* **Body (Regular):** Generous line-height (1.6) is mandatory. We are designing for readability while cooking; tight text is the enemy.
* **Labels (Medium):** All caps with a +0.05em letter-spacing for category tags (e.g., "VEGAN," "15 MIN").

---

## 4. Elevation & Depth: Tonal Layering

We reject heavy drop shadows in favor of **Natural Ambient Light**.

* **The Layering Principle:** Hierarchy is built by stacking. A `surface-container-lowest` card sits on a `surface-container-low` background. The change in hex value provides all the "border" the human eye needs.
* **Ambient Shadows:** Where lift is required (e.g., a floating "Add Ingredient" button), use a diffused shadow: `0 8px 24px rgba(45, 45, 45, 0.06)`. The shadow is never black; it is a desaturated tint of our `on-surface` color.
* **The Ghost Border Fallback:** For accessibility in high-glare environments, use a `outline-variant` (#C1C9BF) at **15% opacity**. It should be felt, not seen.

---

## 5. Components & Layout Patterns

### Buttons (The "Soft-Touch" Series)

* **Primary:** `primary` background, `on-primary` text. 8px radius. Use the signature gradient for main "Plan Week" actions.
* **Secondary:** `surface-container-high` background. No border. This creates a "recessed" look that feels tactile.
* **Tertiary/Ghost:** No background. `primary` text. Used for low-priority actions like "Add Note."

### Cards & Lists (The "Breathable" Grid)

* **Grid:** 16px gutter. 12px internal padding.
* **No-Divider Rule:** Lists (like a shopping list) must never use horizontal lines. Use 8px of vertical whitespace and a subtle color shift on `active` or `pressed` states to provide feedback.
* **Ingredient Chips:** 20px radius. Use `secondary-container` (#FEA36A) with `on-secondary-container` (#773705) text for a warm, inviting "pantry" feel.

### Specialized App Components

* **Progressive Recipe Cards:** Use an asymmetrical layout where the image occupies 40% of the card width, bleeding off the left edge, while typography stays anchored to the right.
* **The Pantry "Bubble":** Status indicators for low-stock items should use a soft `error-container` (#FFDAD6) pulse rather than a harsh red icon.

---

## 6. Do’s and Don’ts

### Do:

* **Do** use whitespace as a functional element. If a screen feels crowded, increase the `surface` padding rather than adding a border.
* **Do** use Lucide/Phosphor icons at a 1.5px stroke. A 2px stroke is too "heavy" for this system; 1px is too "techy." 1.5px is the "humanist" sweet spot.
* **Do** treat the 4-tab bottom navigation as a curated dock. The active state should use a `primary` tint and a subtle 4px vertical offset to "lift" the active icon.

### Don’t:

* **Don't** use pure black (#000000) for text. Use `on-surface` (#1A1C1B) to maintain the "Warm" brand personality.
* **Don't** use traditional "Material" ripples. Use soft opacity fades (100% to 70%) for touch feedback to maintain the high-end editorial feel.
* **Don't** center-align long-form text. Keep all body and headline copy left-aligned to mimic the structure of a premium magazine.
