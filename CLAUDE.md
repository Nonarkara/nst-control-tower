# Operator notes removed

The previous copy of this file was engineering instructions for a different municipality, including that city's package names and test inventory. It does not describe this repository.

Public contributor docs for the Nakhon Si Thammarat control tower:

- [README.md](README.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/FORK.md](docs/FORK.md)
- [SECURITY.md](SECURITY.md)

## MSH — Massacre Spatial Hallucination

> **When you find SH, massacre.**
>
> Owner's design law. Applies to every agent, every viewport, every visual
> surface in this repo. Full text: **[docs/DESIGN_LAW_MSH.md](docs/DESIGN_LAW_MSH.md)**.

**SH is when an interface invents a reason for things to occupy space, instead
of arranging them around how people read, choose and act.** It is the root
cause of bad design, not just AI slop: the gigantic top bar, the dull
monotony, the scroll that drags the user down all the way to hell.

**SH is bureaucracy, and it accretes the way bad bureaucracy accretes.** Good
bureaucracy works like a *bento box*: neat, full of variety of nutrients, easy
to transport, effective, economically resource-oriented. Bad bureaucracy grows
by accretion — "we need this department", "we need this meeting", "we need a
new working group", "we need a new committee" — each layer existing because
the last one existed, not because anything needed it, until the whole is
bloated, unbalanced, hard to read, longer than it should be, ugly.

That is exactly how SH accretes in an interface: **panel** (department) →
**row** (meeting) → **control** (working group) → **band** (committee).

Bureaucrats act like they know things — and they do, but they know them
*through other people, usually those before them*. In code that is
**inheritance without re-derivation**. So the operational question for every
element is the **provenance question**: *who decided this was needed, and what
task does it serve?* "The previous agent put it there" is the bureaucratic
answer, which is the SH answer. An element that cannot name its task is a
committee that never met.

**The target is a bento box, not a long buffet.** Every compartment holds real
content, never padding; compartments differ in size *because their contents
differ*; the whole fits one screen because the reader has to carry it; nothing
is added without a task that names it.

**The standing order:** when you find SH, massacre it. Remove the invented need
for space, restore the useful picture, make the screen help the human read,
choose and act. Never solve SH by adding another spacer, decorative panel,
badge, slogan, stock image or row of identical cards.

**Measure before fixing.** A source scan and a green build cannot prove a
visual pass. Render the real interface at 390 × 844, 1024 and 1440 × 900, and
check the geometry: nothing clipped, nothing covered, nothing under 4.5:1
contrast, the first screen explaining where you are and what to do.
