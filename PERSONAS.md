# PERSONAS.md - Axiom Reader

## Overview

These personas represent stakeholders who "review" the product. Each brings a different lens. When making decisions, consider: *What would [Persona] say about this?*

---

## 🛡️ Security Sam

**Role:** Security & Privacy Advocate  
**Mindset:** "Trust no input. Protect user data. Assume breach."

### Concerns
- No user accounts initially (static reader), but plan for future auth
- If adding highlights/notes, store client-side (localStorage) first
- No analytics tracking without consent
- Content is proprietary — prevent easy scraping
- PDF downloads should be watermarked if user-specific

### Review Questions
- Is user data stored? Where? Encrypted?
- Are there any XSS vectors in content rendering?
- Is the math renderer sandboxed appropriately?
- Could malformed JSON content cause issues?

### Current Score: 8/10
*Low risk for static reader. Watch for future features.*

---

## 🎨 UX Uma

**Role:** User Experience Designer  
**Mindset:** "Every interaction should feel effortless and delightful."

### Concerns
- Reading experience must be comfortable for long study sessions
- Math must be readable (proper sizing, not cramped)
- Navigation between sections should be instant
- Mobile experience matters (students study on phones)
- Accessibility isn't optional — it's core UX

### Review Questions
- Can a student study for 2 hours without eye strain?
- Is the sidebar intuitive? Can users find their place quickly?
- Do content blocks (definitions, theorems) stand out appropriately?
- Is the text size adjustable? Line height comfortable?
- Does it work well on tablet/phone?

### Priorities
1. Clean, distraction-free reading
2. Clear visual hierarchy (headings, boxes, math)
3. Responsive design (works on all devices)
4. Fast navigation (no waiting for page loads)
5. Accessible to all users

### Current Score: —/10
*Not yet built. This is the primary focus.*

---

## 📚 Professor Pete

**Role:** Mathematics Educator  
**Mindset:** "Content accuracy and pedagogical clarity are paramount."

### Concerns
- Math must render correctly — no broken equations
- Theorem/definition numbering must be consistent
- Cross-references (see Theorem 2.3) should work
- Examples must clearly separate problem from solution
- Figures must be high quality and properly captioned

### Review Questions
- Are all LaTeX commands rendering properly?
- Is the theorem numbering matching the print edition?
- Are solutions hidden by default (to encourage attempt)?
- Do figures have proper alt text for accessibility?
- Is the content searchable by theorem/definition number?

### Priorities
1. Mathematical accuracy
2. Consistent numbering
3. Clear problem/solution separation
4. Working cross-references
5. Quality figures with context

### Current Score: —/10
*Content exists, renderer not yet built.*

---

## ⚡ Performance Pat

**Role:** Performance Engineer  
**Mindset:** "Fast is a feature. Slow is a bug."

### Concerns
- Initial page load should be <2s on 3G
- Math rendering shouldn't block the main thread
- Large chapters shouldn't cause jank
- Images should be lazy-loaded and optimized
- Search should be instant (<100ms)

### Review Questions
- What's the Lighthouse score?
- Is MathJax loaded efficiently (async, deferred)?
- Are images optimized (WebP, proper sizing)?
- Is there unnecessary JavaScript on static pages?
- Does the sidebar cause layout shift?

### Targets
| Metric | Target |
|--------|--------|
| First Contentful Paint | <1.5s |
| Largest Contentful Paint | <2.5s |
| Time to Interactive | <3.0s |
| Cumulative Layout Shift | <0.1 |

### Current Score: —/10
*Not yet measurable.*

---

## 🏛️ Compliance Carl

**Role:** Accessibility & Legal Compliance  
**Mindset:** "We serve everyone. No exceptions."

### Concerns
- Section 508 compliance for government/school contracts
- WCAG 2.1 AA minimum
- Math must be accessible to screen readers
- Keyboard navigation must be complete
- Color contrast must meet ratios

### Review Questions
- Does MathJax have a11y extensions enabled?
- Can a blind user navigate and understand the content?
- Are all interactive elements keyboard accessible?
- Do colors meet contrast requirements?
- Is there a skip-to-content link?
- Can PDFs be generated with proper tagging?

### Requirements
- [ ] Screen reader announces math correctly
- [ ] All images have alt text
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Headings in proper hierarchy
- [ ] ARIA landmarks present

### Current Score: —/10
*Critical for government contracts. Must be addressed.*

---

## 📖 Student Sarah

**Role:** End User (College Math Student)  
**Mindset:** "I just want to learn calculus without fighting the interface."

### Concerns
- Easy to find where I left off
- Can I highlight and take notes?
- Does it work offline for studying without WiFi?
- Can I search for specific topics?
- Is it less annoying than my current PDF textbook?

### Review Questions
- Is there a "continue reading" feature?
- Can I bookmark sections?
- Does search find definitions and theorems?
- Is the mobile experience good for bus/transit studying?
- Are exercises interactive or just static?

### Wishlist
1. Remember my place
2. Highlight and annotate
3. Search everything
4. Work offline
5. Practice problems with feedback

### Current Score: —/10
*Core user. Build for Sarah first.*

---

## Persona Scorecard

| Persona | Area | Score | Priority |
|---------|------|-------|----------|
| Security Sam | Security | 8/10 | Low (static) |
| UX Uma | Experience | —/10 | **HIGH** |
| Professor Pete | Content | —/10 | **HIGH** |
| Performance Pat | Speed | —/10 | Medium |
| Compliance Carl | Accessibility | —/10 | **HIGH** |
| Student Sarah | Usability | —/10 | **HIGH** |

---

## Using Personas

When reviewing features or making decisions:

1. **New feature?** Ask: "What would Uma think of this UX? Would Carl approve the accessibility?"
2. **Performance concern?** Check with Pat's targets.
3. **Content rendering?** Get Pete's sign-off.
4. **Adding user data?** Run it by Sam.
5. **Is it useful?** Ask Sarah.

Update scores as we build and improve.
