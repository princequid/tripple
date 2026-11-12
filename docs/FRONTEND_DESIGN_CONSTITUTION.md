# FRONTEND DESIGN CONSTITUTION — HYBRID SOFT UI DESIGN SYSTEM

> **Status:** Authoritative source text, supplied by the user (2026-11-12) and recorded verbatim below. It is a **permanent rule**: changes need an approved design-system revision recorded in [DECISION_LOG.md](DECISION_LOG.md).
>
> **How it is implemented:**
> - [05-design-system/FRONTEND_DESIGN_CONSTITUTION.md](05-design-system/FRONTEND_DESIGN_CONSTITUTION.md): operational rules and measurable checks.
> - [COLOR_SYSTEM.md](05-design-system/COLOR_SYSTEM.md): contrast-validated refinements, approved as D-05; D-23 pending.
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

Use the following palette as the initial design foundation.

### Primary surfaces

- Main background: #E9EDF3
- Secondary background: #F1F3F7
- Card surfaces: #F8FAFC
- Elevated surfaces: #FFFFFF
- Border color: #DDE1E9

### Neumorphic shadow colors

- Light highlight: #FFFFFF
- Dark shadow: #C5CFDC
- Deeper shadow: #B5C2D1

### Typography

- Primary text: #252B36
- Secondary text: #647184
- Muted text: #929BA9

### Accent colors

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
