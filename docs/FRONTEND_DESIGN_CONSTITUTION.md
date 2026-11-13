# FRONTEND DESIGN CONSTITUTION — HYBRID SOFT UI DESIGN SYSTEM

> **Status:** Authoritative source text, supplied by the user (2026-11-12; §3 revised by the user on 2026-11-13, revisions 2 and 2.1, A-16 and A-17) and recorded verbatim below. It is a **permanent rule**: changes need an approved design-system revision recorded in [DECISION_LOG.md](DECISION_LOG.md).
>
> **How it is implemented:**
> - [05-design-system/FRONTEND_DESIGN_CONSTITUTION.md](05-design-system/FRONTEND_DESIGN_CONSTITUTION.md): operational rules and measurable checks.
> - [COLOR_SYSTEM.md](05-design-system/COLOR_SYSTEM.md): contrast-validated refinements of the revision-2 palette (derived values D-26).
> - [DESIGN_TOKENS.md](05-design-system/DESIGN_TOKENS.md).
> - [DESIGN_SYSTEM.md](05-design-system/DESIGN_SYSTEM.md).
> - [COMPONENT_GUIDELINES.md](05-design-system/COMPONENT_GUIDELINES.md).
> - Foundation CSS: [`design-system/`](../design-system/README.md).
>
> Where a refinement differs from a value below (for example, accessible "strong" variants of the accent colours), the refinement was made under §3 ("The palette may be refined when necessary, but changes must preserve the visual identity") and §8 ("Never sacrifice usability or accessibility to achieve a visual effect").

---

## 1. OBJECTIVE

Before beginning any frontend development, establish and adopt a unified visual design system for this platform.

The platform must use a carefully balanced combination of three design philosophies:

- **40% Neumorphism**
- **30% Glassmorphism**
- **30% Minimalism**

This combination is the platform's official frontend visual identity and must guide all future interface design and implementation.

These percentages represent the overall visual influence of each design philosophy, not literal measurements of screen area.

Do not treat these styles as separate themes or randomly combine them. They must work together as one cohesive design language.

The objective is to create a sophisticated, premium, visually engaging creative platform that feels modern, interactive, elegant and professionally designed.

## 2. THE THREE DESIGN PILLARS

### A. NEUMORPHISM — 40% (PRIMARY DESIGN LANGUAGE)

Neumorphism must be the dominant visual influence.

Use soft, realistic depth to make interactive elements feel tactile and physically connected to their background.

Apply neumorphic styling to:
- Search fields and input elements.
- Filter buttons and category selectors.
- Interactive navigation controls.
- Toggle switches and selection controls.
- Floating action buttons.
- Secondary action buttons.
- Selected and active interface states.
- Small interactive widgets and controls.

Implementation principles:
- Use backgrounds that closely match their parent surfaces.
- Create depth using carefully balanced light and dark shadows.
- Use subtle inset shadows for pressed or recessed elements.
- Use raised shadows for interactive elements.
- Maintain consistent corner radii.
- Avoid excessively strong or unrealistic shadows.
- Ensure that interactive elements remain visually distinguishable.

Neumorphism should feel refined and premium, not inflated, cartoonish or excessively soft.

### B. GLASSMORPHISM — 30% (SECONDARY DESIGN LANGUAGE)

Glassmorphism must introduce transparency, layering and visual depth.

Apply it to:
- Floating navigation panels.
- Dropdown menus and popovers.
- Modal windows.
- Featured content overlays.
- Floating notifications.
- Profile overlays.
- Contextual toolbars.
- Special promotional or highlighted sections.

Implementation principles:
- Use translucent backgrounds.
- Apply controlled backdrop blur.
- Use subtle borders to define glass surfaces.
- Introduce gentle highlights and transparency.
- Ensure sufficient contrast between text and the background.
- Avoid excessive blur and overlapping translucent elements.
- Keep glass effects purposeful rather than decorative.

Glass elements should feel like refined translucent surfaces floating above the interface.

### C. MINIMALISM — 30% (STRUCTURAL DESIGN LANGUAGE)

Minimalism must control the overall layout, content presentation and visual hierarchy.

Apply it to:
- Page layouts.
- Design showcase galleries.
- Typography.
- Content organization.
- Designer profiles.
- Spacing systems.
- Responsive layouts.
- Information hierarchy.

Implementation principles:
- Use generous whitespace.
- Maintain consistent alignment.
- Use clear typographic hierarchy.
- Avoid unnecessary decorative elements.
- Prioritize content readability.
- Avoid excessive borders and containers.
- Keep navigation intuitive.
- Let creative content remain the visual focus.

The platform must never feel cluttered or visually overwhelming.

## 3. OFFICIAL COLOR SYSTEM

> **Revision 2 (2026-11-13, A-16).** The user finalised the visual identity. The text of this section is the user's directive of 2026-11-13, recorded verbatim (headings demoted one level). It replaces the revision-1 colour system, which is kept in [Appendix A](#appendix-a--superseded-colour-system-revision-1-2026-11-12) for traceability. Contrast-validated refinements and derived values are in [COLOR_SYSTEM.md](05-design-system/COLOR_SYSTEM.md) (D-26).

### 3.1 Visual identity

The application's primary visual identity is:

**Premium Crimson + Warm White + Soft Grey + Charcoal.**

The design must feel:
- Premium and professionally crafted.
- Modern and visually distinctive.
- Creative, expressive and welcoming.
- Clean, elegant and easy to navigate.
- Suitable for a professional creative inspiration and discovery platform.

### 3.2 Approved primary colour palette

> **Revision 2.1 (2026-11-13, A-17, user directive):** "remove any gradient colors", change primary light, primary border, background and hover tint, and "increase the brightness of the red by 30%". The user chose the brightest red that keeps white text accessible (+24.5%, `#DF2F4D`) and tints re-derived from it. Values below are updated accordingly; the previous values are noted in brackets. "Warm white" below now means pure white `#FFFFFF`.

| Token | Hex |
|---|---|
| Primary | #DF2F4D (was #B3263E) |
| Primary hover | #B3263E (was #941D33; #941D33 is now the pressed state) |
| Primary light | #FCEEF1 (was #FBECEF) |
| Primary border | #F5C1CA (was #E9C5CC) |
| Background | #FFFFFF (was #FFFCFA) |
| Surface | #FFFFFF |
| Secondary surface | #F2F0F0 |
| Tertiary surface | #EAE7E8 |
| Primary text | #252326 |
| Secondary text | #706A70 |
| Muted text | #969096 |
| Border | #E7E1E3 |

Supporting accents:

- Muted lavender: #8D7AB8
- Muted sage: #829889
- Antique gold: #C69A55

These supporting colours must remain secondary to crimson.

### 3.3 Colour application

Use crimson for:
- Primary actions.
- Brand elements.
- Active navigation indicators.
- Selected filters and categories.
- Important interactive states.
- Relevant highlights and notifications.

Use warm white for:
- Main page backgrounds.
- Content areas.
- Gallery sections.
- Elevated surfaces.

Use soft grey for:
- Neumorphic controls.
- Inset search fields.
- Secondary interactive surfaces.
- Subtle visual separation.

Use charcoal for readable typography and strong visual hierarchy.

### 3.4 Design philosophy

Preserve the established design influence:

- 40% Neumorphism.
- 30% Glassmorphism.
- 30% Minimalism.

Neumorphism should create tactile interactions, not make every element look embossed.

Glassmorphism should be used for appropriate floating and layered interface elements.

Minimalism should preserve clean layouts, generous whitespace and strong content hierarchy.

### 3.5 Component requirements

Define consistent styling for:
- Primary and secondary buttons.
- Search fields.
- Navigation.
- Gallery thumbnails.
- Cards and content containers.
- Category filters.
- Dropdowns.
- Modals.
- Forms and inputs.
- Notifications.
- User profiles.
- Interactive icons and controls.

Keep creative artwork visually independent of the interface colour palette. Do not force crimson borders, backgrounds or filters onto every gallery item.

### 3.6 Accessibility and responsiveness

- Validate colour contrast, especially text on crimson backgrounds.
- Provide visible keyboard focus states.
- Maintain accessible interaction sizes.
- Define hover, active, disabled, loading, success and error states.
- Ensure the colour system works across desktop, tablet and mobile.
- Do not use colour alone to communicate status.

### 3.7 No gradients (revision 2.1)

No gradient colours anywhere in the interface: surfaces, controls, skeletons, backdrops and placeholders use flat colours (user directive 2026-11-13, A-17).

## 4. TYPOGRAPHY AND SPACING

Establish a consistent typography system.

Recommended font direction:
- Primary: Inter, Geist or a similarly refined modern sans-serif.
- Use clear distinctions between headings, body text, labels and metadata.
- Avoid unnecessary font-weight variations.
- Maintain excellent readability across screen sizes.

Spacing:
- Adopt a consistent 4px-based spacing scale.
- Use generous spacing between major content sections.
- Keep related interface elements visually grouped.
- Maintain consistent padding within components.

Corner radii:
- Small controls: 10–14px.
- Standard components: 16–20px.
- Large panels: 22–28px.
- Pills: fully rounded where appropriate.

These values are starting guidelines and should be adjusted according to component context.

## 5. COMPONENT DESIGN RULES

Build reusable components around the hybrid design system.

Every reusable component must follow the established visual language.

Examples include:
- Neumorphic search input.
- Neumorphic filter selector.
- Glass navigation panel.
- Glass dropdown.
- Glass modal.
- Minimalist design showcase card.
- Neumorphic toggle.
- Glass notification.
- Minimalist profile component.
- Neumorphic floating action button.

Avoid implementing the same visual component differently across multiple pages without a deliberate reason.

Create reusable design tokens for:
- Colors.
- Shadows.
- Surface treatments.
- Border radii.
- Typography.
- Spacing.
- Blur levels.
- Transitions.

Use CSS variables or the project's existing design-token architecture.

## 6. INTERACTION AND ANIMATION

Interactions should reinforce the tactile nature of the design.

Use:
- Subtle hover elevation.
- Soft pressed/inset states.
- Smooth transitions.
- Gentle opacity changes.
- Refined dropdown and modal animations.
- Subtle glass panel transitions.
- Clear active and selected states.

Avoid:
- Excessive bouncing.
- Distracting animations.
- Heavy shadow transitions.
- Unnecessary animation on every element.

Prioritize responsiveness and performance.

## 7. DESIGN SHOWCASE PRIORITY

This platform is a creative discovery and inspiration platform.

The actual designs, artwork, illustrations and portfolios displayed on the platform must remain the primary visual attraction.

Therefore:
- Do not apply neumorphic effects to every design thumbnail.
- Do not wrap every gallery item in a heavily styled container.
- Keep showcase imagery visually independent.
- Use minimal framing around creative work.
- Apply glass and neumorphic effects primarily to the platform's own interface elements.

The platform's interface must complement the creative content, not compete with it.

## 8. RESPONSIVENESS AND ACCESSIBILITY

The design system must work consistently across:
- Desktop.
- Laptop.
- Tablet.
- Mobile.

Maintain:
- Readable typography.
- Adequate contrast.
- Accessible interactive controls.
- Visible focus states.
- Touch-friendly controls.
- Reduced-motion support.

Never sacrifice usability or accessibility to achieve a visual effect.

## 9. IMPLEMENTATION REQUIREMENTS

Before developing the first frontend screen:

1. Inspect the existing project structure and identify its frontend framework, styling approach and component architecture.
2. Create a centralized design-token system.
3. Define reusable neumorphic surface styles.
4. Define reusable glassmorphic surface styles.
5. Establish typography, spacing, radii and animation standards.
6. Create a small set of reusable foundational UI components.
7. Document the design system so future development can reference it.

Suggested documentation file:

`docs/FRONTEND_DESIGN_CONSTITUTION.md`

Suggested supporting files, adapted to the existing project architecture:

- `design-tokens.css`
- `neumorphism.css`
- `glassmorphism.css`
- `components/`

Do not unnecessarily restructure the existing project or introduce new dependencies when existing tools can accomplish the same objectives.

## 10. DESIGN QUALITY CONTROL

Before implementing any new page or component, evaluate it against these questions:

1. Does it follow the 40/30/30 visual philosophy?
2. Is the neumorphic treatment subtle and intentional?
3. Is glassmorphism used only where layering adds value?
4. Does minimalism preserve a clean layout and clear hierarchy?
5. Does the component use the established color palette?
6. Does it remain consistent with existing components?
7. Is the content easy to read?
8. Does the design work on mobile and desktop?
9. Does it maintain accessibility?
10. Does the interface complement rather than compete with the creative content?

If a design violates these principles, refine it before considering it complete.

## 11. FINAL DIRECTIVE

This is a permanent frontend design rule, not a temporary design suggestion.

All future frontend development must follow this constitution unless an explicit design-system revision is approved.

Do not begin frontend page development immediately.

First establish the design foundation, document the rules, and prepare the reusable components and tokens that will govern the entire frontend.

The final experience should communicate:

**40% tactile elegance + 30% translucent sophistication + 30% clean simplicity.**

The result must feel like a premium creative technology platform with a recognizable visual identity, rather than a generic website using three fashionable design trends.

---

## Appendix A — Superseded colour system (revision 1, 2026-11-12)

> Superseded on 2026-11-13 by revision 2 (A-16). Kept verbatim for traceability; do not apply.

### A.1 OFFICIAL COLOR SYSTEM (revision 1)

Use the following palette as the initial design foundation.

#### Primary surfaces

- Main background: #E9EDF3
- Secondary background: #F1F3F7
- Card surfaces: #F8FAFC
- Elevated surfaces: #FFFFFF
- Border color: #DDE1E9

#### Neumorphic shadow colors

- Light highlight: #FFFFFF
- Dark shadow: #C5CFDC
- Deeper shadow: #B5C2D1

#### Typography

- Primary text: #252B36
- Secondary text: #647184
- Muted text: #929BA9

#### Accent colors

- Primary accent: #9273C7 (Lavender/Purple)
- Secondary accent: #EA78A5 (Soft Pink)
- Supporting accent: #A5B5CA (Muted Blue)

Color usage rules:
- Lavender should be the primary brand interaction color.
- Pink should be used selectively for likes, highlights, special actions and emphasis.
- Muted blue should support secondary visual elements.
- Neutral colors should dominate the overall interface.
- Never introduce additional accent colors without a clear design reason.

The palette may be refined when necessary, but changes must preserve the visual identity.
