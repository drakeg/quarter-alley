# Quarter Alley · To Do

The running roadmap for the arcade. Check items off as they ship. Every game is an original design with its own name, characters and art. Never use the names, characters or catchphrases of existing games, films, shows or brands anywhere in the code or documentation.

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
- [x] **Driftrock** – drifting ship blasting space rocks that break apart
- [x] **Lifeline** – side-scrolling rescue shooter with a world scanner
- [x] **Canopy Run** – jungle explorer: vines, tar pits, crocodiles, tunnels and treasure

### Up next
- [ ] **Hive Swarm** – fixed shooter vs diving formations of mechanical bugs
- [ ] **Brickwave** – paddle, ball and bricks with power-ups
- [ ] **Girder Gang** – climb girders and dodge rolling barrels to reach the top
- [ ] **Flipside** – full pinball table with flippers, bumpers, ramps and multiball
- [ ] **Roll Alley** – roll balls up an inclined lane into scoring rings and win prize tickets

### Inspired by movies and TV (original stories, no licensed names)
- [ ] **Tower Siege** – one off-duty hero, one skyscraper taken over on a holiday night; fight floor by floor to the roof (action-movie siege)
- [ ] **Trench Runner** – 3D space-fighter run down a fortress trench to hit a single exhaust port (1983 sit-down space-battle style)
- [ ] **Leapwise** – wake up in a stranger's life in a different decade; put one thing right before you leap again (time-hop adventure)

### Later
- [ ] **Burrow Bash** – tunnel through a garden and pop pests
- [ ] **Cube Hop** – hop a pyramid of cubes to change their colors
- [ ] **Skyknights** – riders on flying mounts clash in the air, great for two players
- [ ] **Soft Landing** – land a craft gently with limited fuel
- [ ] **Lightline** – light-trail duels for 2–4 players
- [ ] **Blast Block** – bomb-maze party game for up to 4 gamepads
- [ ] **Twin Fury** – twin-stick arena survival
- [ ] **Tube Rider** – shoot your way down a 3D tube

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
