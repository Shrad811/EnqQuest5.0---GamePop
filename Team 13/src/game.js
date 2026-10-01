/**
 * LAST LIGHT - Main Game Engine
 * Orchestrates game states (MENU, PLAYING, PAUSED, EXTINGUISHING, GAMEOVER, ENDING),
 * game loop, dramatic death sequences, and climactic endings.
 */

window.LastLight = window.LastLight || {};

class GameEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'EXTINGUISHING', 'GAMEOVER', 'ENDING'
    
    this.player = null;
    this.camera = null;
    this.lighting = null;
    this.mapManager = null;
    this.currentMapId = 'forest_edge';

    this.lastTime = 0;
    this.extinguishSequenceTimer = 0;
    this.activeEnding = null;

    // Input state
    this.input = {
      keys: {},
      justPressed: {}
    };
  }

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    const C = window.LastLight.Constants;
    this.player = new window.LastLight.Player(100, 100);
    this.camera = new window.LastLight.Camera(C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    this.lighting = new window.LastLight.Lighting(C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    this.mapManager = window.LastLight.MapManager;

    const minimapCanvas = document.getElementById('minimap-canvas');
    if (minimapCanvas && window.LastLight.Minimap) {
      window.LastLight.Minimap.init(minimapCanvas);
    }

    this.bindInputs();
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      if (!this.input.keys[e.code]) {
        this.input.justPressed[e.code] = true;
      }
      this.input.keys[e.code] = true;

      // Handle key shortcuts based on state
      if (this.state === 'PLAYING') {
        if (e.code === 'KeyE') {
          // If dialogue is active, advance dialogue
          if (window.LastLight.Dialogue && window.LastLight.Dialogue.active) {
            window.LastLight.Dialogue.next();
          } else {
            // Otherwise interact with world
            this.mapManager.handleInteraction(this.player);
          }
        } else if (e.code === 'Space') {
          // Pulse lantern flare
          if (this.player.useLanternPulse()) {
            this.lighting.triggerPulse();
            this.camera.shake(4, 0.2);
            // Stun nearby enemies
            this.mapManager.enemies.forEach(en => {
              const dist = Math.hypot(en.x - this.player.x, en.y - this.player.y);
              if (dist < 180) en.stun(2.5);
            });
          }
        } else if (e.code === 'Escape') {
          const mapModal = document.getElementById('world-map-modal');
          const journalModal = document.getElementById('journal-modal');
          if (mapModal && !mapModal.classList.contains('hidden')) {
            mapModal.classList.add('hidden');
          } else if (journalModal && !journalModal.classList.contains('hidden')) {
            journalModal.classList.add('hidden');
          } else {
            this.togglePause();
          }
        } else if (e.code === 'KeyJ' || e.code === 'Tab') {
          e.preventDefault();
          this.toggleJournal();
        } else if (e.code === 'KeyM') {
          e.preventDefault();
          this.toggleWorldMap();
        }
      } else if (this.state === 'PAUSED') {
        if (e.code === 'Escape') {
          this.togglePause();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });

    // Advance dialogue on canvas click if active
    this.canvas.addEventListener('click', () => {
      if (window.LastLight.Audio) {
        window.LastLight.Audio.ensureContext();
      }
      if (window.LastLight.Dialogue && window.LastLight.Dialogue.active) {
        window.LastLight.Dialogue.next();
      }
    });
  }

  startNewGame() {
    if (window.LastLight.Audio) {
      window.LastLight.Audio.ensureContext();
    }
    if (window.LastLight.Scoring) {
      window.LastLight.Scoring.reset();
    }

    this.currentMapId = 'forest_edge';
    this.player.reset(16 * 32, 12 * 32);
    this.mapManager.loadMap('forest_edge', 16 * 32, 12 * 32, this.player, this.camera);
    this.camera.follow(this.player);

    if (window.LastLight.Inventory) {
      window.LastLight.Inventory.items = [];
    }
    if (window.LastLight.Journal) {
      window.LastLight.Journal.discoveredLore = new Set();
    }
    if (window.LastLight.Quests) {
      window.LastLight.Quests.currentObjective = "Speak with Old Wanderer Kaelen at the Crossroads campfire.";
      window.LastLight.Quests.renderHUD();
    }

    this.state = 'PLAYING';
    this.hideAllModals();
    this.updateHUD();

    this.showRegionDiscovery('forest_edge', "The Open World Unfolds. Four paths diverge from the Crossroads.");
  }

  loadSavedGame() {
    const data = window.LastLight.Save.load();
    if (!data) {
      this.startNewGame();
      return;
    }

    if (window.LastLight.Audio) {
      window.LastLight.Audio.ensureContext();
    }

    this.currentMapId = data.mapId || 'forest_edge';
    this.player.reset(data.player.x, data.player.y);
    this.player.health = data.player.health;
    this.player.fuel = data.player.fuel;
    this.player.direction = data.player.direction;

    this.mapManager.loadMap(this.currentMapId, data.player.x, data.player.y, this.player, this.camera);
    this.camera.follow(this.player);

    if (window.LastLight.Inventory && data.inventory) {
      window.LastLight.Inventory.items = data.inventory;
    }
    if (window.LastLight.Journal && data.journal) {
      window.LastLight.Journal.discoveredLore = new Set(data.journal);
    }
    if (window.LastLight.Quests && data.quests) {
      window.LastLight.Quests.currentObjective = data.quests.currentObjective || "";
      if (data.quests.embers) window.LastLight.Quests.embers = data.quests.embers;
      if (data.quests.optional) window.LastLight.Quests.optionalObjectives = data.quests.optional;
      window.LastLight.Quests.renderHUD();
    }
    if (window.LastLight.Scoring && data.scoring) {
      window.LastLight.Scoring.score = data.scoring.score || 0;
      window.LastLight.Scoring.timeSurvived = data.scoring.timeSurvived || 0;
      window.LastLight.Scoring.areasExplored = new Set(data.scoring.areasExplored || []);
      window.LastLight.Scoring.renderHUD();
    }

    this.state = 'PLAYING';
    this.hideAllModals();
    this.updateHUD();

    this.showRegionDiscovery(this.currentMapId, "Journey Resumed.");
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      const menu = document.getElementById('pause-modal');
      if (menu) menu.classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      const menu = document.getElementById('pause-modal');
      if (menu) menu.classList.add('hidden');
    }
  }

  toggleJournal() {
    const modal = document.getElementById('journal-modal');
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
      if (window.LastLight.Journal) window.LastLight.Journal.renderUI();
      if (window.LastLight.Inventory) window.LastLight.Inventory.renderUI();
      if (window.LastLight.Quests) window.LastLight.Quests.renderQuestLog();
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  }

  toggleWorldMap() {
    const modal = document.getElementById('world-map-modal');
    if (!modal) return;

    if (modal.classList.contains('hidden')) {
      const container = document.getElementById('dedicated-world-map-content');
      if (container && window.LastLight.Journal) {
        window.LastLight.Journal.renderWorldMap(container);
      }
      modal.classList.remove('hidden');
      if (window.LastLight.Audio) {
        window.LastLight.Audio.playPuzzleClick();
      }
    } else {
      modal.classList.add('hidden');
    }
  }

  openWorldMap() {
    this.toggleWorldMap();
  }

  hideAllModals() {
    const modals = [
      'main-menu-overlay', 'pause-modal', 'journal-modal', 'world-map-modal',
      'puzzle-modal', 'dialogue-modal', 'game-over-modal', 'ending-modal'
    ];
    modals.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  handleMapTrigger(trig, player, camera) {
    // Seamless open-world map transition
    this.currentMapId = trig.targetMap;
    this.mapManager.loadMap(trig.targetMap, trig.targetX, trig.targetY, player, camera);
    camera.follow(player);

    if (window.LastLight.Audio) {
      window.LastLight.Audio.playFootstep();
    }

    this.showRegionDiscovery(trig.targetMap, trig.message);
  }

  showRegionDiscovery(mapId, customMsg) {
    const regionNames = {
      'forest_edge': {
        title: 'THE FOREST CROSSROADS',
        sub: 'Sanctuary of Oakhaven • Campfire Safe Zone',
        quote: 'Four paths diverge beneath the dying twilight...'
      },
      'whispering_woods': {
        title: 'WHISPERING WOODS',
        sub: 'The Weeping Canopy • Fuel Drain: 1.25x',
        quote: 'Listen closely to what you call monsters...'
      },
      'black_marsh': {
        title: 'THE BLACK MARSH',
        sub: 'The Sunken Sanctuary • Cursed Mire: 1.5x Drain',
        quote: 'Without night, the weary earth cannot rest...'
      },
      'forgotten_ruins': {
        title: 'THE FORGOTTEN RUINS',
        sub: 'The Solar Vault • Ancient Masonry: 1.0x Drain',
        quote: 'The locks were forged to keep devouring fire out...'
      },
      'heart_of_darkness': {
        title: 'THE HEART OF DARKNESS',
        sub: 'The Loom of Night • Void Abyss: 2.0x Drain',
        quote: 'When the final light meets eternal shade...'
      }
    };

    const info = regionNames[mapId] || { title: mapId.toUpperCase(), sub: 'Uncharted Realm', quote: '' };

    const banner = document.getElementById('region-discovery-banner');
    if (banner) {
      const titleEl = document.getElementById('region-disc-title');
      const subEl = document.getElementById('region-disc-sub');
      const quoteEl = document.getElementById('region-disc-quote');

      if (titleEl) titleEl.innerText = info.title;
      if (subEl) subEl.innerText = info.sub;
      if (quoteEl) quoteEl.innerText = info.quote ? `"${info.quote}"` : '';

      banner.classList.remove('hidden');
      banner.classList.remove('fade-out');
      banner.classList.add('visible');

      clearTimeout(this.regionBannerTimer);
      this.regionBannerTimer = setTimeout(() => {
        banner.classList.add('fade-out');
        setTimeout(() => {
          banner.classList.remove('visible');
          banner.classList.remove('fade-out');
          banner.classList.add('hidden');
        }, 600);
      }, 3400);
    }

    if (window.LastLight.Audio) {
      window.LastLight.Audio.playLoreDiscovery();
    }

    if (window.LastLight.Scoring) {
      window.LastLight.Scoring.discoverArea(mapId);
    }

    if (window.LastLight.Quests && customMsg) {
      window.LastLight.Quests.showNotification(customMsg);
    }
  }

  // Section 27: Dramatic Extinction Sequence when fuel hits zero or health hits zero
  startExtinctionSequence() {
    this.state = 'EXTINGUISHING';
    this.extinguishSequenceTimer = 0;
    this.camera.shake(8, 2.5);

    if (window.LastLight.Audio) {
      window.LastLight.Audio.playExtinguished();
    }

    const overlay = document.getElementById('extinguish-screen');
    if (overlay) {
      overlay.classList.remove('hidden');
      const textEl = document.getElementById('extinguish-text');
      if (textEl) {
        textEl.innerHTML = `
          <div class="extinguish-line">The lantern flickers...</div>
          <div class="extinguish-line">The forest disappears...</div>
          <div class="extinguish-line">You hear footsteps in the black...</div>
          <div class="extinguish-title">THE LIGHT HAS GONE OUT.</div>
        `;
      }
    }
  }

  triggerGameOver() {
    this.state = 'GAMEOVER';
    const extScreen = document.getElementById('extinguish-screen');
    if (extScreen) extScreen.classList.add('hidden');

    const modal = document.getElementById('game-over-modal');
    if (modal) modal.classList.remove('hidden');

    const scoreData = window.LastLight.Scoring.calculateFinalScore(this.player.fuel);
    const summary = document.getElementById('game-over-stats');
    if (summary) {
      summary.innerHTML = `
        <div class="stat-row"><span>Time Survived:</span> <strong>${scoreData.timeSurvived}s</strong></div>
        <div class="stat-row"><span>Clues Discovered:</span> <strong>${scoreData.cluesFound} / 8</strong></div>
        <div class="stat-row"><span>Score:</span> <strong>${scoreData.totalScore.toLocaleString()}</strong></div>
        <div class="stat-row rank-row"><span>Rank:</span> <strong>${scoreData.rank}</strong></div>
      `;
    }
  }

  // Section 16 & 17: Multiple Endings
  triggerEnding(endingType) {
    this.state = 'ENDING';
    this.activeEnding = endingType;

    if (window.LastLight.Audio) {
      window.LastLight.Audio.playEndingMusic(endingType);
    }

    const modal = document.getElementById('ending-modal');
    if (modal) modal.classList.remove('hidden');

    let title = "";
    let desc = "";
    let quote = "";

    if (endingType === 'DESTROY') {
      title = "ENDING 1 — THE BURNING FOREST";
      quote = `"The fire was freed, and with it, the sky learned how to burn."`;
      desc = `You shatter the dark crystal core with the ancient lantern. Instantly, an apocalyptic wave of blinding white flame erupts from the roots! The supernatural darkness vaporizes—but with the ward broken, the devouring celestial star awakens above the world. The trees burn without twilight, rivers boil into steam, and you realize too late: the darkness was never the monster. It was the only shield humanity had left.`;
    } else if (endingType === 'EXTINGUISH') {
      title = "ENDING 2 — THE SILENT SANCTUARY";
      quote = `"In the cool embrace of night, the earth found its peaceful breath."`;
      desc = `You take a deep breath and close the lantern’s vents. The final flame flickers and dies into cold ash. The entities of the dark bow their crowned heads in reverence. The biting chill fades into a serene, tranquil twilight. Protected beneath the cosmic veil, the forest settles into silent harmony, spared forever from the scorching fires of the ancient star.`;
    } else {
      title = "ENDING 3 — THE LIGHT KEEPER";
      quote = `"Neither sun nor abyss, but the eternal bridge between."`;
      desc = `You kneel at the roots of the ancient tree and hold the lantern aloft, not in wrath, but in solemn communion. The devouring fire and the protective shadow flow into your heart, coalescing into an iridescent cosmic equilibrium. You take your place as the new Light Keeper—an eternal guardian ensuring the light warms without burning, and the darkness shields without blinding. The world is saved.`;
    }

    const scoreData = window.LastLight.Scoring.calculateFinalScore(this.player.fuel);

    const titleEl = document.getElementById('ending-title');
    const quoteEl = document.getElementById('ending-quote');
    const descEl = document.getElementById('ending-desc');
    const scoreEl = document.getElementById('ending-score-card');

    if (titleEl) titleEl.innerText = title;
    if (quoteEl) quoteEl.innerText = quote;
    if (descEl) descEl.innerText = desc;
    if (scoreEl) {
      scoreEl.innerHTML = `
        <div class="score-grid">
          <div><span>Exploration & Discoveries:</span> <strong>${scoreData.baseScore} pts</strong></div>
          <div><span>Remaining Light Bonus:</span> <strong>+${scoreData.fuelBonus} pts</strong></div>
          <div><span>Total Score:</span> <strong>${scoreData.totalScore.toLocaleString()} pts</strong></div>
          <div><span>Final Honor:</span> <strong>${scoreData.rank}</strong></div>
        </div>
      `;
    }
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // clamp delta time
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    // Reset justPressed keys
    this.input.justPressed = {};

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.state === 'PLAYING') {
      // 1. Update Player
      this.player.update(dt, this.input, this.mapManager.currentMap);

      // Check Death / Extinction conditions
      if (this.player.fuel <= 0 || this.player.isDead) {
        this.startExtinctionSequence();
        return;
      }

      // 2. Update Map & Enemies
      this.mapManager.update(dt, this.player, this.lighting, this.camera);

      // 3. Update Camera
      this.camera.follow(this.player);
      this.camera.update(dt);

      // 4. Update Lighting & Particles
      this.lighting.update(dt, this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, this.player.fuel);

      // 5. Update Dialogue typing
      if (window.LastLight.Dialogue && window.LastLight.Dialogue.active) {
        window.LastLight.Dialogue.update(dt);
      }

      // 6. Update Quests & Scoring
      if (window.LastLight.Quests) window.LastLight.Quests.update(dt);
      if (window.LastLight.Scoring) window.LastLight.Scoring.updateTime(dt);

      // 7. Update Dynamic Minimap
      if (window.LastLight.Minimap) {
        window.LastLight.Minimap.update(dt, this.player);
      }

      this.updateHUD();
    } else if (this.state === 'EXTINGUISHING') {
      this.extinguishSequenceTimer += dt;
      this.camera.update(dt);
      if (this.extinguishSequenceTimer >= 4.0) {
        this.triggerGameOver();
      }
    }
  }

  updateHUD() {
    // 1. Lantern Fuel Bar
    const fuelValEl = document.getElementById('hud-fuel-val');
    const fuelBarEl = document.getElementById('hud-fuel-fill');
    const fuelRateEl = document.getElementById('hud-fuel-rate');

    if (fuelValEl) fuelValEl.innerText = `${Math.ceil(this.player.fuel)}s`;
    if (fuelBarEl) {
      const pct = Math.max(0, Math.min(100, (this.player.fuel / window.LastLight.Constants.STARTING_FUEL) * 100));
      fuelBarEl.style.width = `${pct}%`;

      if (this.player.fuel <= 10) {
        fuelBarEl.className = 'fuel-fill critical';
      } else if (this.player.fuel <= 30) {
        fuelBarEl.className = 'fuel-fill severe';
      } else if (this.player.fuel <= 60) {
        fuelBarEl.className = 'fuel-fill warning';
      } else {
        fuelBarEl.className = 'fuel-fill normal';
      }
    }

    if (fuelRateEl) {
      if (this.player.inSafeZone) {
        fuelRateEl.innerText = "SAFE ZONE (0.0x)";
        fuelRateEl.className = "fuel-rate safe";
      } else {
        const rate = (this.player.zoneDrainRate + (this.player.isSprinting ? 0.5 : 0)).toFixed(1);
        fuelRateEl.innerText = `DRAIN: ${rate}x`;
        fuelRateEl.className = "fuel-rate danger";
      }
    }

    // 2. Health Hearts
    const heartsEl = document.getElementById('hud-hearts');
    if (heartsEl) {
      let heartsHtml = '';
      for (let i = 0; i < window.LastLight.Constants.MAX_HEALTH; i++) {
        heartsHtml += (i < this.player.health) ? '❤️ ' : '🖤 ';
      }
      heartsEl.innerText = heartsHtml.trim();
    }

    // 3. Minimap / Area Name
    const areaNameEl = document.getElementById('hud-area-name');
    if (areaNameEl && this.mapManager.currentMap) {
      areaNameEl.innerText = this.mapManager.currentMap.name;
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'EXTINGUISHING') {
      // 1. Render World & Entities
      this.mapManager.render(this.ctx, this.camera, this.player);

      // 2. Render Darkness Mask & Lantern Light
      const lightSources = this.mapManager.currentMap ? this.mapManager.currentMap.lightSources : [];
      this.lighting.render(this.ctx, this.camera, this.player, this.player.fuel, lightSources);

      // 3. Render Dynamic Rotating Minimap in Top Left Corner
      if (window.LastLight.Minimap) {
        window.LastLight.Minimap.render(this.player, this.mapManager);
      }
    }
  }
}

window.LastLight.Game = new GameEngine();
