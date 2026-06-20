---
title: Physics Experiments
icon: flask
created: 2026-04-23
modified: 2026-04-26
tags: [physics, experiments, simulations]
---

# Physics Experiments

Interactive, self-contained simulations of classic physics experiments. Each folder is an embedded web app — open it from the sidebar to launch full-screen.

## Mechanics — how things move

- **Galileo's Inclined Plane** (`inclined-plane/`) — The 1604 experiment that broke Aristotle. Roll a ball down a tilted ramp, time the segments, watch distance grow as t² — proving constant acceleration before clocks could measure it directly.
- **Brachistochrone** (`brachistochrone/`) — Race three balls down straight, circular, and cycloid paths. The cycloid wins — every time. Bernoulli's 1696 puzzle.
- **Projectile Motion** (`projectile-motion/`) — Classical ballistics. Tune angle, velocity, and gravity; trace the parabola.
- **Foucault Pendulum** (`foucault-pendulum/`) — Paris, 1851. A 28 kg pendulum swings in the Panthéon and its plane appears to rotate — but it's the Earth turning underneath. Adjust latitude and watch the rotation period change.
- **Pendulum Wave** (`pendulum-wave/`) — 15 pendulums tuned to subtly different periods. Pull them in unison, watch chaos resolve into a standing wave, then back into chaos. Pure math, made visible.

## Waves & light

- **Double-Slit** (`double-slit/`) — Wave-particle duality. Fire one photon at a time and watch an interference pattern emerge from individual hits. The experiment Feynman called "the only mystery."
- **Wave Interference** (`wave-interference/`) — Two coherent point sources on a ripple tank. Adjust separation and wavelength to reshape the pattern.

## Quantum

- **Stern-Gerlach Lab** (`stern-gerlach/`) — Frankfurt, 1922. Send silver atoms through a non-uniform magnetic field. Classical physics predicts a smear; the screen shows two discrete spots. Spin is quantized. Now stack analyzers to discover the non-commutativity that built quantum mechanics.
- **Quantum Tunneling** (`quantum-tunneling/`) — A live Schrödinger solver. Launch a Gaussian wave packet at a potential barrier taller than its own energy — classically forbidden — and watch part of it leak straight through. Tune energy, barrier height, and thickness; the measured transmission tracks the textbook tunneling formula in real time.
- **Millikan Oil Drop** (`millikan-oil-drop/`) — Chicago, 1909. Suspend tiny charged oil droplets between charged plates, balance gravity against electric force, measure the charge. Find that every drop is an integer multiple of one number: e ≈ 1.602×10⁻¹⁹ C. Charge is quantized too.

## Solid state

- **Bragg X-ray Diffraction** (`bragg-diffraction/`) — Cambridge, 1913 (Nobel 1915). Aim X-rays at a crystal, sweep the angle θ, watch peaks erupt only where 2d sin θ = nλ. The experiment that proved crystals are periodic lattices and gave us every structural-biology and materials-science result since. Toggle simple-cubic / BCC / FCC and see how the structure factor kills certain peaks.

## Implementation notes

Each experiment is a directory with an `index.html` file plus a `.app` marker so Cabinet renders it full-screen. Built with vanilla JS + Canvas 2D — zero build step, zero external libs. Open any HTML file directly in a browser if you want to hack on it.

## Why these eleven

They cover the five moments physics changed:

1. **Mechanics is mathematical** (Galileo, Bernoulli, Newton via projectile motion)
2. **The Earth moves** (Foucault — physics confirms cosmology by direct demo)
3. **Light is weirder than waves OR particles** (double-slit, wave interference)
4. **Reality is quantized** (Stern-Gerlach for spin, Millikan for charge)
5. **Matter obeys a wave equation** (quantum tunneling — barriers leak, and once you know that, the scanning tunneling microscope and flash memory follow)
6. **Matter is periodic** (Bragg — and once you know that, every transistor follows)

Read the cabinet top-to-bottom and you've toured 350 years of physics in the order it actually happened.
