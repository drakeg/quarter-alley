# Quarter Alley · To Do

The running roadmap for the arcade. Check items off as they ship. Games are original designs inspired by arcade classics: their own names, characters and art.

## Games

### On the floor
- [x] **Stack Shack** – burger-stacking platformer
- [x] **Prairie Schooner** – 1849 wagon-trail survival
- [x] **Ashfall** – one-on-one elemental fighter
- [x] **Glitch Grid** – neon maze chase
- [x] **Sunset Circuit** – pseudo-3D racer
- [x] **Spore Storm** – firefly shooter vs a splitting crawler
- [x] **Rascal Road** – raccoon crossing traffic and a creek
- [x] **Iron Treads** – top-down tank battles and 2-player duel
- [x] **Starfall** – defend six towns from a meteor shower
- [x] **Ridgeline** – first-person 3D tank battle with radar
- [x] **Driftrock** – drifting ship blasting space rocks that break apart (Asteroids-style)

### Up next
- [ ] **Hive Swarm** – fixed shooter vs diving formations of mechanical bugs (Galaga-style)
- [ ] **Brickwave** – paddle, ball and bricks with power-ups (Breakout-style)
- [ ] **Girder Gang** – climb girders and dodge barrels to the top (Donkey Kong-style)
- [ ] **Flipside** – full pinball table with flippers, bumpers, ramps and multiball (pinball)
- [ ] **Roll Alley** – roll balls up the lane into scoring rings, win prize tickets (skee-ball)

### Later
- [ ] **Burrow Bash** – tunnel through a garden and pop pests (Dig Dug-style)
- [ ] **Cube Hop** – hop a pyramid of cubes to change their colors (Q*bert-style)
- [ ] **Skyknights** – flying jousts, great for two players (Joust-style)
- [ ] **Soft Landing** – land a craft gently with limited fuel (Lunar Lander-style)
- [ ] **Lightline** – light-trail duels for 2–4 players (light cycles / Snake)
- [ ] **Blast Block** – bomb-maze party game for up to 4 gamepads (Bomberman-style)
- [ ] **Overwatch** – side-scrolling rescue shooter (Defender-style)
- [ ] **Twin Fury** – twin-stick arena survival (Robotron-style)
- [ ] **Tube Rider** – shoot down a 3D tube (Tempest-style)

## Platform

### Accounts and tokens
- [x] Token wallet with 10 free tokens a day (local, per browser)
- [x] Insert-token coin slot on every game
- [x] Sign-in with email link, Google or GitHub (Supabase), guest play still works
- [x] Tokens stored on the server for signed-in players (spending happens server-side)
- [x] High scores saved to the player's account
- [x] Leaderboards page
- [ ] Turn on sign-in: create the Supabase project and paste its URL and key into `assets/arcade.js` (see `docs/LOGIN.md`)
- [ ] Profile page: display name, avatar color, play history
- [ ] Weekly leaderboards and "score of the day"

### Making money (later)
- [ ] Token packs through Stripe Checkout (needs a small server function to credit tokens)
- [ ] Optional "watch a short ad for 5 tokens"
- [ ] Sponsor slots: Sunset Circuit billboards, cabinet marquees
- [ ] Supporter tier: unlimited play, cosmetic skins

### Site
- [x] Report-a-bug button that opens a prefilled GitHub issue
- [ ] Bug reports without a GitHub account (form service or Supabase table)
- [ ] Custom domain
- [ ] Install as an app (PWA) and offline play
- [ ] Global settings: sound volume, key remapping, reduce motion
- [ ] Privacy-friendly visit counts per game
- [ ] Shared sprite and sound helpers to keep new games small

## Polish backlog
- [ ] Balance pass on Ashfall (damage, CPU blocking, special cooldowns)
- [ ] Ashfall: arcade-mode score (damage, time, flawless bonus) so it can join the leaderboards
- [ ] Glitch Grid: short intermission scenes between levels
- [ ] Sunset Circuit: second track and night mode
- [ ] Iron Treads: more stages and a stage editor
- [ ] Prairie Schooner: more river and trail events, illustrated landmark scenes
- [ ] Touch controls review on small phones for every game
