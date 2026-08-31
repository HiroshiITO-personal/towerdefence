# 🦄 Unicorn Castle Defense: Rainbow Rush 🌈

A tiny rainbow-powered tower defense game created for **js13kGames 2026**.

The theme for this year's competition is:

> **Unicorns and Rainbows**

Defend a magical unicorn castle from an endless storm of colorful creatures. Build enchanted towers, combine their abilities, survive boss waves, and keep the rainbow magic alive for as long as possible.

## js13kGames 2026 Entry

This game was created for the **js13kGames 2026** competition, where the complete playable game must fit inside a ZIP archive no larger than **13,312 bytes**.

The competition build is designed to be:

- Playable directly in a modern web browser
- Fully self-contained
- Free from external libraries
- Free from external images, fonts, and audio files
- Controlled with mouse, touch, or keyboard
- Rendered entirely with HTML5 Canvas
- Accompanied by procedurally generated Web Audio music and sound effects

> The readable source code in this repository may be larger than the compressed competition build.

## Theme Interpretation

The game interprets **“Unicorns and Rainbows”** as a magical defense battle.

The theme appears throughout the game:

- Unicorn-powered defensive towers
- Rainbow bolts and magical projectiles
- A pastel rainbow environment
- A unicorn castle to protect
- Sparkles, stars, moon mist, and colorful particles
- Rainbow-themed boss waves
- Procedurally generated magical music
- Enemies inspired by bright fantasy creatures

Rather than using external artwork, the game builds its visual identity with Canvas drawing, CSS gradients, particles, colors, and emoji characters.

## How to Play

Enemies enter from the tree on the left side of the map and follow the blue path toward the castle on the right.

Your goal is to destroy them before they reach the castle.

### Basic Flow

1. Select a magical tower.
2. Place it on an empty tile outside the path.
3. Press **Start Wave**.
4. Earn Magic by defeating enemies.
5. Build or upgrade your defenses.
6. Prepare for a boss every fifth wave.
7. Survive for as many waves as possible.

## Game Rules

- You begin with **5 Hearts**
- You begin with **150 Magic**
- Towers cost Magic to build
- Defeated enemies reward additional Magic
- A normal enemy reaching the castle removes **1 Heart**
- A boss reaching the castle removes **5 Hearts**
- Defeating a boss restores **1 Heart**, up to the initial maximum
- Boss waves occur every **5 waves**
- The game ends when your Hearts reach zero
- There is no final wave

Enemy count, health, speed, and variety increase as the game progresses.

## Magical Towers

### 🦄 Sparkle

A fast, inexpensive general-purpose tower.

- **Cost:** 60 Magic
- **Base damage:** 20
- **Range:** 3.5 tiles
- **Cooldown:** 15 frames
- **Role:** Early defense and sustained damage

Sparkle fires bright magical projectiles at nearby enemies.

### ✨ Star Trap

A rapid control tower that damages and slows enemies.

- **Cost:** 90 Magic
- **Base damage:** 10
- **Range:** 2.2 tiles
- **Cooldown:** 8 frames
- **Role:** Crowd control

Place Star Trap near stronger towers to keep enemies within their attack range for longer.

Mutant enemies cannot be slowed.

### 🌈 Rainbow Bolt

A long-range tower that delivers powerful rainbow strikes.

- **Cost:** 220 Magic
- **Base damage:** 100
- **Range:** 4.5 tiles
- **Cooldown:** 65 frames
- **Role:** Boss and heavy-enemy damage

Rainbow Bolt automatically prioritizes bosses when they are within range.

### 💫 Moon Mist

An area-of-effect tower that damages every enemy within its magical field.

- **Cost:** 350 Magic
- **Base damage:** 4 per attack
- **Range:** 3 tiles
- **Cooldown:** 5 frames
- **Role:** Large enemy groups

Moon Mist is particularly effective near corners and intersections where several parts of the path pass through its range.

## Tower Upgrades

Select **Boost**, then click or tap an existing tower.

Each upgrade:

- Increases damage by **50%**
- Increases range by **10%**
- Improves Star Trap's slowing effect
- Costs approximately **110% of the tower's original price**

The maximum tower level is **Level 6**.

Towers cannot currently be sold, moved, or downgraded, so placement decisions are permanent.

## Enemies

### 🐞 Spark Bug

A balanced enemy available from the beginning.

- Normal speed
- Normal health
- Rewards 5 Magic

### 🦋 Rain Moth

A faster enemy with slightly increased health.

- Appears from Wave 3
- Fast movement
- Rewards 9 Magic

### 🦇 Cloud Bat

A slow, heavily armored enemy.

- Appears from Wave 6
- High health
- Rewards 14 Magic

### 🪶 Dew Fly

A very fast but fragile enemy.

- Appears from Wave 10
- Very fast movement
- Rewards 7 Magic

### Mutants

After Wave 10, normal enemies have a small chance to become mutants.

Mutant enemies:

- Have a red visual glow
- Cannot be slowed by Star Trap
- Retain the basic statistics of their original enemy type

### Bosses

A boss joins every fifth wave.

Bosses:

- Have greatly increased health
- Are larger than normal enemies
- Move at reduced base speed
- Reward seven times their normal enemy-type value
- Are prioritized by Rainbow Bolt
- Restore one Heart when defeated
- Remove five Hearts if they reach the castle

## Wave Progression

Additional enemy types become available as the wave number increases.

- **Waves 1–2:** Spark Bug
- **Waves 3–5:** Spark Bug and Rain Moth
- **Waves 6–9:** Spark Bug, Rain Moth, and Cloud Bat
- **Wave 10 onward:** All enemy types
- **After Wave 10:** Mutants may appear
- **Every fifth wave:** One boss joins the wave

The size of each wave increases over time, up to a maximum of 80 regular enemies.

Difficulty also scales through:

- Higher enemy health
- Faster enemy movement
- Larger groups
- More enemy varieties
- Mutant appearances
- Recurring boss waves
- Aggressive late-game health scaling

## Controls

### Mouse and Touch

- Select a tower from the control panel
- Click or tap an empty non-path tile to build
- Select **Boost**, then click or tap a tower to upgrade it
- Press **Start Wave** to begin the next wave
- Press **Save** to copy your progress
- Press **Load** to restore saved progress

### Keyboard

- `1`: Select Sparkle
- `2`: Select Star Trap
- `3`: Select Rainbow Bolt
- `4`: Select Moon Mist
- `5`: Toggle Boost mode
- `Left Arrow`: Select the previous tower
- `Right Arrow`: Select the next tower

## Placement Rules

Towers can be placed only on empty tiles outside the blue path.

A tower cannot be placed:

- On an enemy path tile
- On another tower
- Outside the game board
- Without enough Magic

## Strategy Tips

- Build Sparkle towers during the early waves.
- Place towers near bends so enemies remain in range longer.
- Combine Star Trap with Rainbow Bolt or Moon Mist.
- Save Magic before every fifth wave.
- Use Rainbow Bolt to counter bosses and armored enemies.
- Place Moon Mist where its range covers multiple path sections.
- Upgrade towers in strong positions instead of filling every tile.
- Maintain a final defensive line near the castle.
- Remember that mutant enemies ignore slowing effects.

## Saving and Loading

The game uses portable JSON save data instead of persistent browser storage.

### Save

1. Press **Save**.
2. The game copies JSON save data to the clipboard.
3. Paste the data into a text file or notes application.

The save includes:

- Save format version
- Current wave
- Available Magic
- Remaining Hearts
- Generated map
- Start and goal positions
- Tower positions
- Tower types
- Tower levels

Active enemies and their positions are not saved.

Saving during an active wave will therefore reset the current battle state when the save is loaded.

### Load

1. Press **Load**.
2. Paste previously saved JSON data.
3. Submit the prompt.
4. Continue from the restored wave.

Loaded data is validated before it is applied. The validation checks map dimensions, path connectivity, numerical values, tower types, tower positions, tower levels, and save format compatibility.

> Clipboard access may require HTTPS, localhost, or browser permission.

## Procedural Map

A new maze-like path is generated whenever a new game is initialized.

The logical game board contains:

- 20 columns
- 9 rows
- 40-pixel tiles
- One entrance on the left
- One castle destination on the right

Enemy navigation is calculated by building a distance map from the castle through every connected path tile.

Enemies normally prefer the shortest available route. During earlier waves, they may occasionally choose a less efficient direction at an intersection.

## Audio

Music and sound effects are generated at runtime with the Web Audio API.

The game does not use external audio files.

Generated audio includes:

- Procedural background music
- Tower attack sounds
- Building and upgrade effects
- Wave-start effects
- Boss feedback
- Game-over sounds

Browser audio begins after the first user interaction.

## Technical Details

- **Language:** Vanilla JavaScript
- **Rendering:** HTML5 Canvas 2D
- **Interface:** HTML and CSS
- **Audio:** Web Audio API
- **Input:** Mouse, touch, and keyboard
- **Save format:** JSON through the Clipboard API
- **Logical resolution:** 800 × 360
- **Target update rate:** 60 FPS
- **External JavaScript libraries:** None
- **External game assets:** None
- **Build dependencies:** None for the readable version

The game uses compact, browser-native features to keep the competition build small:

- Canvas primitives
- CSS gradients
- Emoji-based characters
- Procedural map generation
- Procedural particle effects
- Synthesized music and sound effects
- A compact object-based entity system
- Built-in browser input and clipboard APIs

## Running the Readable Version

Clone or download the repository, then keep these files in the same directory:

```text
.
├── index.html
├── styles.css
└── game.js
