# Neon Invader

Neon Invader is a browser-only arcade shooter MVP built with Phaser 3, TypeScript, and Vite. It uses runtime-generated textures and procedural retro sound so the game is playable without external art or audio assets.

## Run

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Controls

- `Left Arrow` / `Right Arrow`: move the ship
- `Space`: hold to fire
- `M`: toggle audio
- `Enter` or `Space` on the title screen: start
- `Space` or `Enter` on the end screen: restart
- `Esc` on the end screen: return to the title screen

## Gameplay

- Survive 5 escalating waves of enemy formations.
- Enemies move horizontally, step downward, and fire back.
- Score increases by enemy rank.
- You begin with 3 lives.
- Clear all enemies in a wave to advance.
- Lose if your lives reach 0 or the formation breaches the defense line.

## Power-Ups

- `Rapid Fire`: temporarily reduces shot cooldown.
- `Double Shot`: temporarily fires two angled projectiles.
- `Shield`: blocks one hit and then expires.

Power-ups can randomly drop from destroyed enemies and are shown in the HUD while active.

## Architecture Notes

- `src/scenes`: Boot, title, gameplay, and end-state flow.
- `src/entities`: Player, enemy, bullet, and power-up objects.
- `src/systems`: Background rendering and enemy formation movement.
- `src/ui`: HUD rendering and status banners.
- `src/audio`: Modular procedural sound manager with stable sound keys.
- `src/assets`: Runtime texture keys and generation helpers.
- `src/config`: Phaser config, balance tuning, palette, and app constants.
- `src/utils`: Formatting and weighted random helpers.

## Tunable Balance

Most gameplay tuning is centralized in `src/config/balance.ts`, including:

- wave composition and difficulty
- movement and fire cadence
- player firing behavior
- power-up duration and drop weights
- transition and effect timings
