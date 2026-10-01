/**
 * LAST LIGHT - Procedural Pixel Art Sprite Generator & Asset Engine
 * Generates and caches pixel-art sprites with transparent backgrounds,
 * animated frames, tilesets, entities, portraits, and VFX.
 */

window.LastLight = window.LastLight || {};

class SpriteGenerator {
  constructor() {
    this.cache = new Map();
    this.tileSize = 32;
    this.initAllSprites();
  }

  // Create an offscreen canvas of given dimensions
  createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas: c, ctx: ctx };
  }

  initAllSprites() {
    this.generateTiles();
    this.generatePlayerSprites();
    this.generateEnemySprites();
    this.generateObjectSprites();
    this.generatePortraits();
  }

  // Helper to draw a pixel block
  px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  // ==========================================
  // 1. ENVIRONMENT TILES
  // ==========================================
  generateTiles() {
    const S = this.tileSize;

    // Grass (Forest Edge)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      this.px(ctx, 0, 0, S, S, '#183820');
      // Blade details
      for (let i = 0; i < 16; i++) {
        const x = (i * 7) % S;
        const y = (i * 13) % S;
        this.px(ctx, x, y, 2, 3, '#224d2d');
        this.px(ctx, x + 1, y - 1, 1, 2, '#33683f');
      }
      this.cache.set('tile_grass', canvas);
    }

    // Dark Grass (Whispering Woods)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      this.px(ctx, 0, 0, S, S, '#0f2416');
      for (let i = 0; i < 14; i++) {
        const x = (i * 9) % S;
        const y = (i * 11) % S;
        this.px(ctx, x, y, 2, 2, '#15311f');
        this.px(ctx, x, y + 2, 1, 1, '#1b3f27');
      }
      this.cache.set('tile_dark_grass', canvas);
    }

    // Dirt Path
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      this.px(ctx, 0, 0, S, S, '#2b2118');
      for (let i = 0; i < 18; i++) {
        const x = (i * 5) % S;
        const y = (i * 17) % S;
        this.px(ctx, x, y, 2, 2, '#3b2f24');
        if (i % 2 === 0) this.px(ctx, x + 2, y, 1, 1, '#1d150e');
      }
      this.cache.set('tile_dirt', canvas);
    }

    // Deep Mud (Black Marsh - slows down)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      this.px(ctx, 0, 0, S, S, '#1d1915');
      this.px(ctx, 4, 6, 8, 4, '#14110e');
      this.px(ctx, 18, 18, 10, 6, '#14110e');
      this.px(ctx, 6, 8, 4, 2, '#28231e');
      this.px(ctx, 20, 20, 5, 2, '#28231e');
      // Murky puddles
      this.px(ctx, 12, 12, 4, 3, '#101c18');
      this.cache.set('tile_mud', canvas);
    }

    // Ancient Stone Paving (Forgotten Ruins)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      this.px(ctx, 0, 0, S, S, '#363d45');
      // Paver borders
      ctx.strokeStyle = '#252a30';
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, 14, 14);
      ctx.strokeRect(16, 1, 15, 14);
      ctx.strokeRect(1, 16, 14, 15);
      ctx.strokeRect(16, 16, 15, 15);
      // Highlights & cracks
      this.px(ctx, 2, 2, 12, 1, '#475059');
      this.px(ctx, 17, 2, 13, 1, '#475059');
      this.px(ctx, 5, 5, 4, 1, '#1b1e22');
      this.cache.set('tile_stone', canvas);
    }

    // Mossy Ruin Stone
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      ctx.drawImage(this.cache.get('tile_stone'), 0, 0);
      this.px(ctx, 2, 10, 6, 4, '#24452f');
      this.px(ctx, 3, 11, 4, 2, '#386646');
      this.px(ctx, 18, 4, 5, 5, '#24452f');
      this.cache.set('tile_mossy_stone', canvas);
    }

    // Shallow Swamp Water (Animated 2 frames)
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createCanvas(S, S);
      this.px(ctx, 0, 0, S, S, '#13282b');
      // Water wave ripples
      const offset = f * 4;
      this.px(ctx, 4 + offset, 8, 8, 2, '#1b3b40');
      this.px(ctx, 16 - offset, 20, 10, 2, '#1b3b40');
      this.px(ctx, 6 + offset, 9, 4, 1, '#2c5961');
      this.cache.set(`tile_water_shallow_${f}`, canvas);
    }

    // Deep Water
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      this.px(ctx, 0, 0, S, S, '#0a1618');
      this.px(ctx, 2, 10, 12, 3, '#0e2023');
      this.px(ctx, 18, 22, 10, 3, '#0e2023');
      this.cache.set('tile_water_deep', canvas);
    }

    // Wood Plank / Bridge
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      this.px(ctx, 0, 0, S, S, '#3a2b1c');
      // Planks
      for (let y = 0; y < S; y += 8) {
        this.px(ctx, 0, y, S, 1, '#1f160e');
        this.px(ctx, 2, y + 1, S - 4, 1, '#4e3b28');
        // Nail heads
        this.px(ctx, 4, y + 3, 2, 2, '#1f160e');
        this.px(ctx, S - 6, y + 3, 2, 2, '#1f160e');
      }
      this.cache.set('tile_wood_plank', canvas);
    }

    // Void Floor (Heart of Darkness)
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      this.px(ctx, 0, 0, S, S, '#090812');
      // Purple cosmic veins
      this.px(ctx, 4, 6, 8, 1, '#25173b');
      this.px(ctx, 11, 7, 1, 8, '#3d1f63');
      this.px(ctx, 12, 15, 9, 1, '#25173b');
      this.px(ctx, 20, 16, 1, 7, '#4e2880');
      this.px(ctx, 21, 23, 6, 1, '#7a3ebd');
      this.cache.set('tile_void_floor', canvas);
    }

    // Wall / Solid Ruin Pillar
    {
      const { canvas, ctx } = this.createCanvas(S, S);
      this.px(ctx, 0, 0, S, S, '#21262d');
      this.px(ctx, 0, 0, S, 4, '#38414d');
      this.px(ctx, 0, S - 4, S, 4, '#121519');
      this.px(ctx, 4, 8, S - 8, S - 16, '#2a313a');
      this.cache.set('tile_ruin_wall', canvas);
    }
  }

  // ==========================================
  // 2. PLAYER SPRITES
  // 4 Directions x (Idle, Walk 4 frames, Run 4 frames, Hurt, Lantern Hold)
  // ==========================================
  generatePlayerSprites() {
    const W = 32, H = 32;
    const directions = ['down', 'up', 'left', 'right'];

    directions.forEach(dir => {
      // 4 Walk frames (Frame 0 & 2 are idle/contact, 1 & 3 are leg swings)
      for (let f = 0; f < 4; f++) {
        const { canvas, ctx } = this.createCanvas(W, H);
        this.drawPlayerCharacter(ctx, dir, f, false, false);
        this.cache.set(`player_walk_${dir}_${f}`, canvas);

        // Run variant (lean forward slightly)
        const run = this.createCanvas(W, H);
        this.drawPlayerCharacter(run.ctx, dir, f, true, false);
        this.cache.set(`player_run_${dir}_${f}`, run.canvas);
      }

      // Hurt frame
      const hurt = this.createCanvas(W, H);
      this.drawPlayerCharacter(hurt.ctx, dir, 0, false, true);
      this.cache.set(`player_hurt_${dir}`, hurt.canvas);
    });

    // Death frame
    const death = this.createCanvas(W, H);
    // Collapsed figure
    this.px(death.ctx, 8, 20, 16, 6, '#3a4454'); // Fallen cloak
    this.px(death.ctx, 22, 22, 6, 4, '#c89d7c'); // Head
    this.px(death.ctx, 4, 22, 5, 5, '#8c7b58');  // Dropped lantern
    this.px(death.ctx, 6, 23, 2, 2, '#443322');  // Extinguished wick
    this.cache.set('player_death', death.canvas);
  }

  drawPlayerCharacter(ctx, dir, frame, isRunning, isHurt) {
    const W = 32, H = 32;
    const skin = isHurt ? '#ff8888' : '#e6be98';
    const cloak = isHurt ? '#cc3333' : '#2b3a4a';
    const cloakDark = isHurt ? '#881111' : '#1a2430';
    const boots = '#18120c';
    const hair = '#3b2b1e';
    const brassLantern = '#f39c12';
    const flameCore = '#fff6cc';

    // Bobbing offset
    const bob = (frame === 1 || frame === 3) ? 1 : 0;
    const legSwing = (frame === 1) ? 2 : (frame === 3 ? -2 : 0);
    const runLean = isRunning ? (dir === 'right' ? 2 : (dir === 'left' ? -2 : 0)) : 0;

    // Legs / Boots
    if (dir === 'down' || dir === 'up') {
      this.px(ctx, 11 - legSwing, 25 - bob, 4, 5 + bob, boots);
      this.px(ctx, 17 + legSwing, 25 - bob, 4, 5 + bob, boots);
    } else if (dir === 'left') {
      this.px(ctx, 12 - legSwing, 25 - bob, 5, 5 + bob, boots);
      this.px(ctx, 17 + legSwing, 25 - bob, 4, 4 + bob, boots);
    } else if (dir === 'right') {
      this.px(ctx, 11 - legSwing, 25 - bob, 4, 4 + bob, boots);
      this.px(ctx, 15 + legSwing, 25 - bob, 5, 5 + bob, boots);
    }

    // Cloak / Body
    const cx = 10 + runLean;
    const cy = 13 - bob;
    this.px(ctx, cx, cy, 12, 13, cloak);
    this.px(ctx, cx + 2, cy + 2, 8, 11, cloakDark);

    // Traveler Belt & Satchel
    this.px(ctx, cx + 1, cy + 8, 10, 2, '#5a402d');
    this.px(ctx, cx + 8, cy + 9, 3, 4, '#7a553c');

    // Head / Hood / Hair
    const hx = 11 + runLean;
    const hy = 6 - bob;
    this.px(ctx, hx - 1, hy, 12, 8, cloak); // Hood outer

    if (dir === 'down') {
      this.px(ctx, hx + 1, hy + 2, 8, 5, skin); // Face
      this.px(ctx, hx + 2, hy + 3, 2, 2, '#222'); // Left eye
      this.px(ctx, hx + 6, hy + 3, 2, 2, '#222'); // Right eye
      this.px(ctx, hx, hy + 1, 10, 2, hair);      // Bangs
    } else if (dir === 'up') {
      this.px(ctx, hx, hy + 1, 10, 7, hair);      // Back of head
    } else if (dir === 'left') {
      this.px(ctx, hx, hy + 2, 6, 5, skin);       // Side profile
      this.px(ctx, hx + 1, hy + 3, 2, 2, '#222'); // Eye
      this.px(ctx, hx + 2, hy + 1, 7, 4, hair);
    } else if (dir === 'right') {
      this.px(ctx, hx + 4, hy + 2, 6, 5, skin);
      this.px(ctx, hx + 7, hy + 3, 2, 2, '#222');
      this.px(ctx, hx + 1, hy + 1, 7, 4, hair);
    }

    // The Sacred Lantern (Held in hand, casting warm glow)
    let lx = 6, ly = 16 - bob;
    if (dir === 'down') { lx = 20; ly = 16 - bob; }
    else if (dir === 'up') { lx = 7; ly = 14 - bob; }
    else if (dir === 'left') { lx = 5; ly = 16 - bob; }
    else if (dir === 'right') { lx = 22; ly = 16 - bob; }

    // Arm holding lantern
    this.px(ctx, dir === 'right' ? 18 : 9, 14 - bob, 4, 4, cloak);
    this.px(ctx, lx + 1, ly - 2, 2, 3, '#111'); // Lantern handle chain

    // Lantern housing
    this.px(ctx, lx, ly + 1, 5, 6, brassLantern);
    // Glowing flame core inside lantern glass
    this.px(ctx, lx + 1, ly + 2, 3, 4, flameCore);
    this.px(ctx, lx + 2, ly + 3, 1, 2, '#ffaa00');
  }

  // ==========================================
  // 3. CREATURE / ENEMY SPRITES
  // 4 Types: Shadow Stalker, Whisper, Root Beast, The Hollow
  // ==========================================
  generateEnemySprites() {
    // 1. Shadow Stalker (32x32, 2 anim frames)
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createCanvas(32, 32);
      const bob = f === 1 ? 1 : 0;
      // Tendril smoke base
      this.px(ctx, 8, 14 + bob, 16, 10, '#0c0b14');
      this.px(ctx, 6, 16 + bob, 20, 6, '#181424');
      // Claws / Legs
      this.px(ctx, 6, 24 + bob, 3, 5 - bob, '#09080e');
      this.px(ctx, 23, 24 + bob, 3, 5 - bob, '#09080e');
      this.px(ctx, 13, 25, 6, 4, '#09080e');
      // Hunched head
      this.px(ctx, 10, 8 + bob, 12, 8, '#141122');
      // Horn-like wisps
      this.px(ctx, 8, 4 + bob, 3, 5, '#241a38');
      this.px(ctx, 21, 4 + bob, 3, 5, '#241a38');
      // Glowing terrifying eyes
      this.px(ctx, 12, 11 + bob, 2, 2, '#ff3b30');
      this.px(ctx, 18, 11 + bob, 2, 2, '#ff3b30');
      this.px(ctx, 13, 12 + bob, 1, 1, '#fff');
      this.px(ctx, 19, 12 + bob, 1, 1, '#fff');
      this.cache.set(`enemy_stalker_${f}`, canvas);
    }

    // 2. Whisper (24x24, Floating spectral wisp, 2 frames)
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createCanvas(24, 24);
      const pulse = f * 2;
      // Ethereal outer aura
      ctx.fillStyle = 'rgba(78, 40, 128, 0.4)';
      ctx.beginPath();
      ctx.arc(12, 10, 8 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Spectral core
      this.px(ctx, 8, 6, 8, 8, '#2d1547');
      this.px(ctx, 9, 7, 6, 6, '#562e82');
      this.px(ctx, 10, 8, 4, 4, '#8a4ec4');
      // Eerie eyes
      this.px(ctx, 9, 8, 2, 2, '#d6afff');
      this.px(ctx, 13, 8, 2, 2, '#d6afff');
      // Trailing smoke tail
      this.px(ctx, 10, 14, 4, 5, '#3a1b5c');
      this.px(ctx, 11 + (f ? 1 : -1), 18, 2, 4, '#24103a');
      this.cache.set(`enemy_whisper_${f}`, canvas);
    }

    // 3. Root Beast (Large 48x48 Tank golem, 2 frames)
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createCanvas(48, 48);
      const stompH = f === 1 ? 1 : 0;
      // Massive bark body
      this.px(ctx, 10, 12 + stompH, 28, 24, '#2c1e13');
      this.px(ctx, 14, 14 + stompH, 20, 20, '#3d2b1b');
      // Moss & overgrown rocks
      this.px(ctx, 12, 10 + stompH, 10, 6, '#2e4a28');
      this.px(ctx, 28, 12 + stompH, 8, 5, '#3d5c36');
      // Heavy stone fists / roots
      this.px(ctx, 4, 22 - stompH, 8, 16, '#24180f');
      this.px(ctx, 36, 22 + stompH, 8, 16, '#24180f');
      // Glowing ancient sap eyes (deep amber)
      this.px(ctx, 18, 18 + stompH, 3, 3, '#f39c12');
      this.px(ctx, 27, 18 + stompH, 3, 3, '#f39c12');
      // Thorny horns / branches
      this.px(ctx, 8, 4 + stompH, 4, 10, '#1c1209');
      this.px(ctx, 36, 4 + stompH, 4, 10, '#1c1209');
      this.cache.set(`enemy_root_beast_${f}`, canvas);
    }

    // 4. The Hollow (Towering 32x48 Nightmare, 2 frames)
    for (let f = 0; f < 2; f++) {
      const { canvas, ctx } = this.createCanvas(32, 48);
      const drift = f * 2;
      // Void shroud
      this.px(ctx, 8, 8 + drift, 16, 32, '#050308');
      this.px(ctx, 6, 12 + drift, 20, 24, '#0c0714');
      // Faceless void mask (pure stark white porcelain silhouette)
      this.px(ctx, 11, 10 + drift, 10, 11, '#e4e2eb');
      this.px(ctx, 12, 14 + drift, 2, 4, '#0a0512'); // Left hollow tear
      this.px(ctx, 18, 14 + drift, 2, 4, '#0a0512'); // Right hollow tear
      // Spectral elongated fingers
      this.px(ctx, 3, 24 + drift, 3, 14, '#1b1226');
      this.px(ctx, 26, 24 + drift, 3, 14, '#1b1226');
      // Ethereal crown
      this.px(ctx, 9, 4 + drift, 14, 4, '#3e185e');
      this.px(ctx, 15, 2 + drift, 2, 4, '#6c2bb0');
      this.cache.set(`enemy_hollow_${f}`, canvas);
    }
  }

  // ==========================================
  // 4. ENVIRONMENT & INTERACTIVE OBJECTS
  // ==========================================
  generateObjectSprites() {
    // Ancient Pine Tree (48x64)
    {
      const { canvas, ctx } = this.createCanvas(48, 64);
      // Trunk
      this.px(ctx, 20, 44, 8, 18, '#261911');
      this.px(ctx, 22, 44, 4, 16, '#362419');
      // Foliage layers
      const drawNeedles = (y, w, h, c1, c2) => {
        const x = 24 - w / 2;
        ctx.fillStyle = c1;
        ctx.beginPath();
        ctx.moveTo(24, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fill();
        // Inner shadow
        ctx.fillStyle = c2;
        ctx.fillRect(x + 4, y + h - 4, w - 8, 4);
      };
      drawNeedles(24, 42, 24, '#112918', '#0b1a0f');
      drawNeedles(14, 34, 20, '#193d24', '#112918');
      drawNeedles(4, 24, 16, '#235231', '#193d24');
      this.cache.set('obj_pine_tree', canvas);
    }

    // Dead Weeping Tree (Marsh & Ruins)
    {
      const { canvas, ctx } = this.createCanvas(48, 64);
      this.px(ctx, 20, 36, 8, 26, '#1a1614');
      // Gnarled branches
      this.px(ctx, 12, 28, 10, 4, '#1a1614');
      this.px(ctx, 6, 24, 6, 16, '#120f0d');
      this.px(ctx, 26, 24, 12, 4, '#1a1614');
      this.px(ctx, 36, 20, 6, 20, '#120f0d');
      // Hanging moss
      this.px(ctx, 8, 38, 3, 10, '#1c2921');
      this.px(ctx, 38, 34, 3, 12, '#1c2921');
      this.cache.set('obj_dead_tree', canvas);
    }

    // Campfire (Safe Zone, 32x32, 3 frames)
    for (let f = 0; f < 3; f++) {
      const { canvas, ctx } = this.createCanvas(32, 32);
      // Stones ring
      this.px(ctx, 6, 22, 20, 6, '#424852');
      this.px(ctx, 8, 20, 4, 3, '#5c6470');
      this.px(ctx, 20, 20, 4, 3, '#5c6470');
      // Burnt logs
      this.px(ctx, 9, 20, 14, 4, '#24180e');
      // Flame animation
      const fh = 10 + (f === 1 ? 3 : (f === 2 ? -2 : 0));
      const fx = 12 + (f === 2 ? 1 : 0);
      this.px(ctx, fx, 20 - fh, 8, fh, '#e65c00');
      this.px(ctx, fx + 1, 20 - fh + 2, 6, fh - 2, '#ffaa00');
      this.px(ctx, fx + 2, 20 - fh + 4, 4, fh - 4, '#fff2a8');
      this.cache.set(`obj_campfire_${f}`, canvas);
    }

    // Fuel Pickups
    // 1. Small Ember Vial (+10s)
    {
      const { canvas, ctx } = this.createCanvas(24, 24);
      this.px(ctx, 9, 6, 6, 13, '#c29759');
      this.px(ctx, 10, 8, 4, 9, '#ff9900');
      this.px(ctx, 11, 10, 2, 5, '#fff4b8');
      this.px(ctx, 10, 4, 4, 2, '#5e3d1c'); // Cork
      this.cache.set('fuel_small', canvas);
    }
    // 2. Refined Oil Flask (+20s)
    {
      const { canvas, ctx } = this.createCanvas(24, 24);
      this.px(ctx, 7, 8, 10, 12, '#487282');
      this.px(ctx, 8, 10, 8, 9, '#e67e22');
      this.px(ctx, 10, 12, 4, 5, '#ffeaa7');
      this.px(ctx, 10, 5, 4, 3, '#b8860b');
      this.cache.set('fuel_medium', canvas);
    }
    // 3. Luminous Core (+30s)
    {
      const { canvas, ctx } = this.createCanvas(24, 24);
      this.px(ctx, 6, 6, 12, 12, '#8e44ad');
      this.px(ctx, 8, 8, 8, 8, '#e74c3c');
      this.px(ctx, 9, 9, 6, 6, '#f39c12');
      this.px(ctx, 10, 10, 4, 4, '#ffffff');
      this.cache.set('fuel_large', canvas);
    }
    // 4. Ancient Eternal Flame (+45s)
    {
      const { canvas, ctx } = this.createCanvas(28, 28);
      this.px(ctx, 8, 16, 12, 6, '#8c7b58'); // Golden pedestal
      this.px(ctx, 10, 6, 8, 12, '#f1c40f');  // Blazing flame
      this.px(ctx, 12, 8, 4, 8, '#ffffff');
      this.cache.set('fuel_ancient', canvas);
    }

    // Health Moon-Herb
    {
      const { canvas, ctx } = this.createCanvas(24, 24);
      this.px(ctx, 11, 12, 2, 8, '#27ae60');
      this.px(ctx, 6, 10, 6, 4, '#2ecc71');
      this.px(ctx, 12, 8, 6, 4, '#2ecc71');
      // Glowing blossom
      this.px(ctx, 9, 6, 6, 5, '#a29bfe');
      this.px(ctx, 11, 7, 2, 2, '#ffffff');
      this.cache.set('item_herb', canvas);
    }

    // Ancient Chest (Closed & Open, 32x32)
    {
      const closed = this.createCanvas(32, 32);
      this.px(closed.ctx, 6, 12, 20, 14, '#4a3522');
      this.px(closed.ctx, 6, 12, 20, 5, '#694c32'); // Lid
      this.px(closed.ctx, 14, 16, 4, 4, '#f39c12'); // Lock
      this.cache.set('obj_chest_closed', closed.canvas);

      const open = this.createCanvas(32, 32);
      this.px(open.ctx, 6, 14, 20, 12, '#332314');
      this.px(open.ctx, 6, 6, 20, 7, '#694c32'); // Opened lid
      this.px(open.ctx, 10, 16, 12, 6, '#f1c40f'); // Golden treasure glow
      this.cache.set('obj_chest_open', open.canvas);
    }

    // Ancient Lore Tablet / Journal Obelisk (32x32)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      this.px(ctx, 10, 6, 12, 22, '#505a63');
      this.px(ctx, 12, 8, 8, 18, '#616c75');
      // Glowing blue/gold runes
      this.px(ctx, 13, 10, 6, 2, '#74b9ff');
      this.px(ctx, 14, 14, 4, 2, '#74b9ff');
      this.px(ctx, 13, 18, 6, 2, '#74b9ff');
      this.px(ctx, 15, 22, 2, 2, '#ffeaa7');
      this.cache.set('obj_lore_tablet', canvas);
    }

    // Ancient Ruin Gate / Mechanism (32x32)
    {
      const locked = this.createCanvas(32, 32);
      this.px(locked.ctx, 2, 2, 28, 28, '#2a3138');
      this.px(locked.ctx, 6, 6, 20, 20, '#191e23');
      // Iron bars
      for (let x = 8; x < 24; x += 4) {
        this.px(locked.ctx, x, 6, 2, 20, '#4b555e');
      }
      this.px(locked.ctx, 13, 13, 6, 6, '#e74c3c'); // Glowing red seal
      this.cache.set('obj_gate_locked', locked.canvas);

      const open = this.createCanvas(32, 32);
      this.px(open.ctx, 2, 2, 28, 28, '#2a3138');
      this.px(open.ctx, 6, 6, 20, 20, '#0a0d10'); // Open corridor
      this.px(open.ctx, 13, 13, 6, 6, '#2ecc71'); // Green unlocked seal
      this.cache.set('obj_gate_open', open.canvas);
    }

    // Mirror Pedestal (Light Puzzle, 32x32, 4 directions)
    for (let r = 0; r < 4; r++) {
      const { canvas, ctx } = this.createCanvas(32, 32);
      this.px(ctx, 10, 16, 12, 10, '#535c68'); // Pedestal
      this.px(ctx, 14, 10, 4, 8, '#b8860b');   // Brass rod
      // Rotatable mirror blade
      ctx.save();
      ctx.translate(16, 12);
      ctx.rotate((r * Math.PI) / 2);
      this.px(ctx, -6, -2, 12, 4, '#74b9ff'); // Reflective glass
      this.px(ctx, -6, -3, 12, 1, '#dfe6e9'); // Sheen
      ctx.restore();
      this.cache.set(`obj_mirror_${r}`, canvas);
    }

    // Massive Ancient Dark Tree / Core (Heart of Darkness, 96x96)
    {
      const { canvas, ctx } = this.createCanvas(96, 96);
      // Gnarled titanic roots
      this.px(ctx, 36, 40, 24, 48, '#130d17');
      this.px(ctx, 16, 60, 22, 24, '#1b1221');
      this.px(ctx, 58, 60, 24, 24, '#1b1221');
      // Giant Pulsing Dark Crystal Heart embedded in roots
      this.px(ctx, 38, 24, 20, 26, '#3e1663');
      this.px(ctx, 42, 28, 12, 18, '#692db0');
      this.px(ctx, 45, 31, 6, 12, '#9d4edd');
      this.px(ctx, 47, 34, 2, 6, '#ffffff');
      // Tendrils spreading
      for (let i = 0; i < 8; i++) {
        const x = 18 + i * 8;
        const y = 8 + ((i * 5) % 16);
        this.px(ctx, x, y, 4, 20, '#1d0f2b');
      }
      this.cache.set('obj_dark_heart', canvas);
    }
  }

  // ==========================================
  // 5. DIALOGUE PORTRAITS (48x48)
  // ==========================================
  generatePortraits() {
    // 1. Old Traveler (Wise, hooded, weary, lantern scarred)
    {
      const { canvas, ctx } = this.createCanvas(48, 48);
      this.px(ctx, 0, 0, 48, 48, '#12161f'); // Frame bg
      // Hood
      this.px(ctx, 8, 8, 32, 34, '#382f25');
      this.px(ctx, 12, 12, 24, 28, '#261f18');
      // Weathered face
      this.px(ctx, 16, 16, 16, 18, '#c99e7b');
      // Grey beard
      this.px(ctx, 14, 26, 20, 14, '#9e9e9e');
      this.px(ctx, 16, 32, 16, 10, '#cccccc');
      // Weary eyes
      this.px(ctx, 18, 22, 3, 2, '#1a1a1a');
      this.px(ctx, 27, 22, 3, 2, '#1a1a1a');
      // Lantern flame reflection in pupils
      this.px(ctx, 19, 22, 1, 1, '#f39c12');
      this.px(ctx, 28, 22, 1, 1, '#f39c12');
      this.cache.set('portrait_traveler', canvas);
    }

    // 2. Protagonist (Determined, shadowed by hood)
    {
      const { canvas, ctx } = this.createCanvas(48, 48);
      this.px(ctx, 0, 0, 48, 48, '#12161f');
      // Midnight blue cloak
      this.px(ctx, 10, 8, 28, 34, '#243447');
      this.px(ctx, 14, 12, 20, 26, '#141d28');
      // Face
      this.px(ctx, 16, 16, 16, 16, '#e0be9f');
      // Dark hair
      this.px(ctx, 14, 12, 20, 8, '#2b231c');
      // Sharp eyes reflecting lantern
      this.px(ctx, 18, 22, 3, 2, '#202020');
      this.px(ctx, 27, 22, 3, 2, '#202020');
      this.px(ctx, 19, 22, 1, 1, '#ffaa00');
      this.px(ctx, 28, 22, 1, 1, '#ffaa00');
      this.cache.set('portrait_player', canvas);
    }

    // 3. The Entity / Voice of Darkness (Cosmic, eerie, transcendent)
    {
      const { canvas, ctx } = this.createCanvas(48, 48);
      this.px(ctx, 0, 0, 48, 48, '#06030a');
      // Swirling nebula
      for (let i = 0; i < 30; i++) {
        const x = (i * 11) % 48;
        const y = (i * 17) % 48;
        this.px(ctx, x, y, 2, 2, '#381657');
      }
      // Glowing star-eyes of the deep darkness
      this.px(ctx, 16, 18, 5, 5, '#9b59b6');
      this.px(ctx, 17, 19, 3, 3, '#e056fd');
      this.px(ctx, 18, 20, 1, 1, '#ffffff');

      this.px(ctx, 28, 18, 5, 5, '#9b59b6');
      this.px(ctx, 29, 19, 3, 3, '#e056fd');
      this.px(ctx, 30, 20, 1, 1, '#ffffff');
      this.cache.set('portrait_entity', canvas);
    }
  }

  // Get a cached sprite canvas
  get(key) {
    return this.cache.get(key) || null;
  }
}

window.LastLight.Sprites = new SpriteGenerator();
