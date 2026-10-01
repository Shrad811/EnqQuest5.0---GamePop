/**
 * LAST LIGHT - Map & World Management Engine
 * Handles tile rendering, depth-sorted entity drawing,
 * interactive objects (chests, campfires, gates, bridges),
 * fuel pickups, and seamless area transitions.
 */

window.LastLight = window.LastLight || {};

class MapManager {
  constructor() {
    this.currentMap = null;
    this.enemies = [];
    this.objects = [];
    this.fuelPickups = [];
    this.itemsOnGround = [];
    this.waterAnimTimer = 0;
    this.waterFrame = 0;
  }

  loadMap(mapId, startX = null, startY = null, player = null, camera = null) {
    const mapData = window.LastLight.Maps[mapId];
    if (!mapData) {
      console.error(`Map '${mapId}' not found!`);
      return false;
    }

    this.currentMap = mapData;

    // Set camera limits
    if (camera) {
      camera.setBounds(mapData.width * 32, mapData.height * 32);
    }

    // Set player position and zone drain rate
    if (player) {
      player.x = startX !== null ? startX : mapData.playerStart.x;
      player.y = startY !== null ? startY : mapData.playerStart.y;
      player.zoneDrainRate = mapData.drainRate;
    }

    // Initialize Objects
    this.objects = JSON.parse(JSON.stringify(mapData.objects || []));

    // Initialize Fuel Pickups
    this.fuelPickups = JSON.parse(JSON.stringify(mapData.fuel || []));

    // Initialize Ground Items
    this.itemsOnGround = JSON.parse(JSON.stringify(mapData.items || []));

    // Spawn Enemies
    this.enemies = [];
    (mapData.enemies || []).forEach(eData => {
      let enemy = null;
      if (eData.type === 'STALKER') {
        enemy = new window.LastLight.Enemies.ShadowStalker(eData.x, eData.y);
      } else if (eData.type === 'WHISPER') {
        enemy = new window.LastLight.Enemies.Whisper(eData.x, eData.y);
      } else if (eData.type === 'ROOT_BEAST') {
        enemy = new window.LastLight.Enemies.RootBeast(eData.x, eData.y);
      } else if (eData.type === 'HOLLOW') {
        enemy = new window.LastLight.Enemies.TheHollow(eData.x, eData.y);
      }
      if (enemy) this.enemies.push(enemy);
    });

    // Record exploration
    if (window.LastLight.Scoring) {
      window.LastLight.Scoring.recordArea(mapId);
    }

    // Notify Quest Engine of chapter
    if (window.LastLight.Quests && mapData.chapter) {
      window.LastLight.Quests.chapter = mapData.chapter;
    }

    return true;
  }

  update(dt, player, lightingEngine, camera) {
    if (!this.currentMap) return;

    // Animate water tiles
    this.waterAnimTimer += dt;
    if (this.waterAnimTimer > 0.4) {
      this.waterAnimTimer = 0;
      this.waterFrame = (this.waterFrame + 1) % 2;
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, player, this.currentMap, lightingEngine);
      if (e.isDead && e.state === 'DEAD' && e.type !== 'HOLLOW') {
        // Remove dead regular enemies
        this.enemies.splice(i, 1);
      }
    }

    // Check Fuel Pickups collision
    for (let i = this.fuelPickups.length - 1; i >= 0; i--) {
      const fuel = this.fuelPickups[i];
      const dist = Math.hypot(
        (player.x + player.width / 2) - (fuel.x + 12),
        (player.y + player.height / 2) - (fuel.y + 12)
      );

      if (dist < 26) {
        player.addFuel(fuel.amount);
        if (window.LastLight.Audio) {
          window.LastLight.Audio.playFuelPickup(fuel.type);
        }
        if (window.LastLight.Scoring) {
          window.LastLight.Scoring.addPoints(window.LastLight.Constants.POINTS.FIND_FUEL);
          window.LastLight.Scoring.fuelCollected++;
        }
        this.fuelPickups.splice(i, 1);
      }
    }

    // Check Ground Items collision
    for (let i = this.itemsOnGround.length - 1; i >= 0; i--) {
      const item = this.itemsOnGround[i];
      const dist = Math.hypot(
        (player.x + player.width / 2) - (item.x + 12),
        (player.y + player.height / 2) - (item.y + 12)
      );

      if (dist < 26) {
        if (window.LastLight.Inventory) {
          window.LastLight.Inventory.addItem({
            id: item.itemId,
            name: item.name,
            icon: item.icon,
            description: item.description,
            usable: true
          });
        }
        this.itemsOnGround.splice(i, 1);
      }
    }

    // Check Safe Zone status
    const currentTileCollision = window.LastLight.Collision.getTileAt(
      player.x + player.width / 2,
      player.y + player.height / 2,
      this.currentMap
    );
    player.inSafeZone = (currentTileCollision === window.LastLight.Constants.COLLISION.SAFE_ZONE);

    // Slowly regenerate health in safe zones (1 heart per 10 seconds)
    if (player.inSafeZone && player.health < window.LastLight.Constants.MAX_HEALTH) {
      if (!this.safeHealTimer) this.safeHealTimer = 0;
      this.safeHealTimer += dt;
      if (this.safeHealTimer >= 10.0) {
        this.safeHealTimer = 0;
        player.heal(1);
      }
    }

    // Check Map Transition Triggers
    const pBox = { x: player.x, y: player.y, w: player.width, h: player.height };
    for (const trig of (this.currentMap.triggers || [])) {
      if (window.LastLight.Collision.rectOverlap(pBox, trig)) {
        if (window.LastLight.Game && window.LastLight.Game.handleMapTrigger) {
          window.LastLight.Game.handleMapTrigger(trig, player, camera);
        } else {
          this.loadMap(trig.targetMap, trig.targetX, trig.targetY, player, camera);
          if (window.LastLight.Quests && trig.message) {
            window.LastLight.Quests.showNotification(trig.message);
          }
        }
        break;
      }
    }

    // Find nearest interactable for HUD prompt
    player.nearInteractable = window.LastLight.Collision.findInteractable(player, this.objects, 44);
  }

  // Handle Player Interaction ([E] Key)
  handleInteraction(player) {
    const obj = player.nearInteractable;
    if (!obj) return false;

    // 1. Dialogue NPC
    if (obj.type === 'NPC' && obj.dialogueId) {
      const dialogueData = window.LastLight.Dialogues[obj.dialogueId];
      if (dialogueData) {
        window.LastLight.Dialogue.start(dialogueData, () => {
          if (obj.dialogueId === 'intro_traveler') {
            obj.dialogueId = 'traveler_advice';
            if (window.LastLight.Quests) {
              window.LastLight.Quests.setObjective("Explore East (Woods), South (Marsh), or North (Ruins) to claim the 3 Celestial Embers.");
            }
          }
        });
        return true;
      }
    }

    // 2. Lore Discovery
    if (obj.type === 'LORE' && obj.loreKey) {
      window.LastLight.Journal.unlock(obj.loreKey);
      if (obj.dialogueId && window.LastLight.Dialogues[obj.dialogueId]) {
        window.LastLight.Dialogue.start(window.LastLight.Dialogues[obj.dialogueId]);
      } else {
        const loreItem = window.LastLight.StoryLoreDB[obj.loreKey];
        if (loreItem) {
          window.LastLight.Dialogue.start({
            steps: [
              {
                speaker: loreItem.title,
                text: loreItem.text,
                portraitKey: 'portrait_traveler'
              }
            ]
          });
        }
      }
      return true;
    }

    // 3. Chest
    if (obj.type === 'CHEST') {
      if (!obj.opened) {
        obj.opened = true;
        if (obj.givesItem && window.LastLight.Inventory) {
          window.LastLight.Inventory.addItem(obj.givesItem);
          window.LastLight.Quests.completeOptional('opt_planks');
          window.LastLight.Quests.showNotification(`Found: ${obj.givesItem.name}`);
        }
      }
      return true;
    }

    // 4. Broken Bridge repair
    if (obj.type === 'BRIDGE_SPOT') {
      if (obj.repaired) return false;
      if (window.LastLight.Inventory.hasItem('marsh_planks')) {
        obj.repaired = true;
        window.LastLight.Inventory.removeItem('marsh_planks', 1);

        // Fix tiles & collision on bridge gap
        const map = this.currentMap;
        const T = window.LastLight.Constants.TILES;
        const C = window.LastLight.Constants.COLLISION;

        map.tiles[11 * map.width + 18] = T.WOOD_PLANK;
        map.tiles[11 * map.width + 19] = T.WOOD_PLANK;
        map.collision[11 * map.width + 18] = C.NONE;
        map.collision[11 * map.width + 19] = C.NONE;

        if (window.LastLight.Audio) {
          window.LastLight.Audio.playPuzzleSolve();
        }
        if (window.LastLight.Quests) {
          window.LastLight.Quests.showNotification("Bridge Repaired! Safe passage secured.");
          window.LastLight.Quests.completeOptional('opt_planks');
        }
        if (window.LastLight.Scoring) {
          window.LastLight.Scoring.addPoints(window.LastLight.Constants.POINTS.SOLVE_PUZZLE);
        }
      } else {
        window.LastLight.Quests.showNotification("The bridge is broken! Look for timber in the abandoned shack.");
      }
      return true;
    }

    // 0. Celestial Ember Relic
    if (obj.type === 'EMBER_RELIC') {
      if (!obj.collected) {
        obj.collected = true;
        if (window.LastLight.Quests) {
          window.LastLight.Quests.collectEmber(obj.emberId);
        }
        if (window.LastLight.Inventory) {
          window.LastLight.Inventory.addItem({
            id: obj.emberId,
            name: obj.name,
            type: 'QUEST',
            icon: '✨',
            description: 'A primordial Celestial Ember. Essential to break the ancient seals on the Celestial Gate.'
          });
        }
        this.checkRuinsGateUnlocked();
      }
      return true;
    }

    // 5. Rune Altar Puzzle
    if (obj.type === 'PUZZLE_ALTAR') {
      if (obj.solved) {
        window.LastLight.Quests.showNotification("The Rune Altar is already harmonized.");
        return true;
      }
      window.LastLight.Puzzles.openRuneAltar(() => {
        obj.solved = true;
        window.LastLight.Quests.completeOptional('opt_altar');
        this.checkRuinsGateUnlocked();
      });
      return true;
    }

    // 6. Light Mirror Puzzle
    if (obj.type === 'PUZZLE_MIRROR') {
      if (obj.solved) {
        window.LastLight.Quests.showNotification("The Prismatic Mirror is already aligned.");
        return true;
      }
      window.LastLight.Puzzles.openLightMirrors(() => {
        obj.solved = true;
        window.LastLight.Quests.completeOptional('opt_mirrors');
        this.checkRuinsGateUnlocked();
      });
      return true;
    }

    // 7. Celestial Gate
    if (obj.type === 'GATE') {
      if (obj.locked) {
        const hasAllEmbers = window.LastLight.Quests && window.LastLight.Quests.hasAllEmbers();
        if (hasAllEmbers) {
          this.checkRuinsGateUnlocked(true);
        } else {
          const count = window.LastLight.Quests ? window.LastLight.Quests.getEmberCount() : 0;
          window.LastLight.Quests.showNotification(`The Celestial Gate is sealed (${count}/3 Embers held). Gather the Three Embers or align the Altars.`);
        }
      }
      return true;
    }

    // 8. Dark Heart Core (Final interaction)
    if (obj.type === 'DARK_HEART') {
      const dialogueData = window.LastLight.Dialogues['final_entity_choice'];
      if (dialogueData) {
        window.LastLight.Dialogue.start(dialogueData);
      }
      return true;
    }

    // Generic Inspect
    if (obj.inspectText) {
      window.LastLight.Quests.showNotification(obj.inspectText);
      return true;
    }

    return false;
  }

  // Check if mechanisms or all 3 Celestial Embers unlock the Celestial Gate
  checkRuinsGateUnlocked(forceUnlock = false) {
    const gate = this.objects.find(o => o.type === 'GATE');
    if (!gate || !gate.locked) return;

    const altar = this.objects.find(o => o.type === 'PUZZLE_ALTAR');
    const mirror = this.objects.find(o => o.type === 'PUZZLE_MIRROR');
    const hasAllEmbers = window.LastLight.Quests && window.LastLight.Quests.hasAllEmbers();
    const puzzlesSolved = altar && altar.solved && mirror && mirror.solved;

    if (hasAllEmbers || puzzlesSolved || forceUnlock) {
      gate.locked = false;
      gate.sprite = 'obj_gate_open';

      // Clear collision on gate tile (x=18, y=8)
      const map = this.currentMap;
      map.collision[8 * map.width + 18] = window.LastLight.Constants.COLLISION.NONE;

      if (window.LastLight.Audio) {
        window.LastLight.Audio.playPuzzleSolve();
      }
      if (window.LastLight.Quests) {
        window.LastLight.Quests.showNotification("✦ THE CELESTIAL GATE UNLOCKS WITH A THUNDEROUS ROAR! ✦");
        window.LastLight.Quests.setObjective("Pass North through the unsealed gate into the Heart of Darkness.");
      }
    }
  }

  // Render Map layers
  render(ctx, camera, player) {
    if (!this.currentMap) return;

    const map = this.currentMap;
    const tileSize = window.LastLight.Constants.TILE_SIZE;
    const T = window.LastLight.Constants.TILES;

    // Viewport tile range for frustum culling
    const startCol = Math.max(0, Math.floor(camera.x / tileSize));
    const endCol = Math.min(map.width - 1, Math.ceil((camera.x + camera.viewportWidth) / tileSize));
    const startRow = Math.max(0, Math.floor(camera.y / tileSize));
    const endRow = Math.min(map.height - 1, Math.ceil((camera.y + camera.viewportHeight) / tileSize));

    // 1. Base Terrain Tiles
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tType = map.tiles[r * map.width + c];
        const sx = camera.toScreenX(c * tileSize);
        const sy = camera.toScreenY(r * tileSize);

        let spriteName = 'tile_grass';
        if (tType === T.DARK_GRASS) spriteName = 'tile_dark_grass';
        else if (tType === T.DIRT) spriteName = 'tile_dirt';
        else if (tType === T.MUD) spriteName = 'tile_mud';
        else if (tType === T.STONE) spriteName = 'tile_stone';
        else if (tType === T.MOSSY_STONE) spriteName = 'tile_mossy_stone';
        else if (tType === T.WATER_SHALLOW) spriteName = `tile_water_shallow_${this.waterFrame}`;
        else if (tType === T.WATER_DEEP) spriteName = 'tile_water_deep';
        else if (tType === T.WOOD_PLANK) spriteName = 'tile_wood_plank';
        else if (tType === T.RUIN_FLOOR) spriteName = 'tile_ruin_wall';
        else if (tType === T.VOID_FLOOR) spriteName = 'tile_void_floor';

        const tileSprite = window.LastLight.Sprites.get(spriteName);
        if (tileSprite) {
          ctx.drawImage(tileSprite, sx, sy);
        }
      }
    }

    // 2. Depth Sorted Rendering of Objects, Enemies, Pickups, and Player
    const renderList = [];

    // Environmental objects
    this.objects.forEach(obj => {
      renderList.push({
        y: obj.y + (obj.height || tileSize),
        render: () => this.renderObject(ctx, camera, obj)
      });
    });

    // Fuel Pickups
    this.fuelPickups.forEach(f => {
      renderList.push({
        y: f.y + 12,
        render: () => {
          const sx = camera.toScreenX(f.x);
          const sy = camera.toScreenY(f.y) + Math.sin(Date.now() / 250) * 3;
          let spriteKey = 'fuel_small';
          if (f.type === 'MEDIUM') spriteKey = 'fuel_medium';
          else if (f.type === 'LARGE') spriteKey = 'fuel_large';
          else if (f.type === 'ANCIENT') spriteKey = 'fuel_ancient';

          const sp = window.LastLight.Sprites.get(spriteKey);
          if (sp) ctx.drawImage(sp, sx, sy);

          // Subtle fuel glow circle
          ctx.fillStyle = 'rgba(255, 170, 0, 0.15)';
          ctx.beginPath();
          ctx.arc(sx + 12, sy + 12, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    // Ground Items
    this.itemsOnGround.forEach(item => {
      renderList.push({
        y: item.y + 12,
        render: () => {
          const sx = camera.toScreenX(item.x);
          const sy = camera.toScreenY(item.y);
          const sp = window.LastLight.Sprites.get(item.type);
          if (sp) ctx.drawImage(sp, sx, sy);
        }
      });
    });

    // Enemies
    this.enemies.forEach(e => {
      renderList.push({
        y: e.y + e.height,
        render: () => e.render(ctx, camera)
      });
    });

    // Player
    renderList.push({
      y: player.y + player.height,
      render: () => player.render(ctx, camera)
    });

    // Sort by Y position for proper isometric/top-down perspective
    renderList.sort((a, b) => a.y - b.y);
    renderList.forEach(item => item.render());

    // 3. Render Interaction Prompt above nearby interactable
    if (player.nearInteractable) {
      const obj = player.nearInteractable;
      const sx = camera.toScreenX(obj.x + (obj.width || tileSize) / 2);
      const sy = camera.toScreenY(obj.y) - 14;

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(sx - 36, sy - 8, 72, 18);
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - 36, sy - 8, 72, 18);

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[E] Interact', sx, sy + 5);
      ctx.restore();
    }
  }

  renderObject(ctx, camera, obj) {
    const sx = camera.toScreenX(obj.x);
    const sy = camera.toScreenY(obj.y);

    if (obj.type === 'CAMPFIRE') {
      const animFrame = Math.floor(Date.now() / 150) % 3;
      const sp = window.LastLight.Sprites.get(`obj_campfire_${animFrame}`);
      if (sp) ctx.drawImage(sp, sx, sy);
    } else if (obj.type === 'CHEST') {
      const sp = window.LastLight.Sprites.get(obj.opened ? 'obj_chest_open' : 'obj_chest_closed');
      if (sp) ctx.drawImage(sp, sx, sy);
    } else if (obj.type === 'LORE') {
      const sp = window.LastLight.Sprites.get('obj_lore_tablet');
      if (sp) ctx.drawImage(sp, sx, sy);
    } else if (obj.type === 'PUZZLE_ALTAR') {
      const sp = window.LastLight.Sprites.get('obj_lore_tablet');
      if (sp) ctx.drawImage(sp, sx, sy);
    } else if (obj.type === 'PUZZLE_MIRROR') {
      const sp = window.LastLight.Sprites.get('obj_mirror_0');
      if (sp) ctx.drawImage(sp, sx, sy);
    } else if (obj.type === 'GATE') {
      const sp = window.LastLight.Sprites.get(obj.sprite || 'obj_gate_locked');
      if (sp) ctx.drawImage(sp, sx, sy);
    } else if (obj.type === 'DARK_HEART') {
      const sp = window.LastLight.Sprites.get('obj_dark_heart');
      if (sp) ctx.drawImage(sp, sx, sy);
    } else if (obj.type === 'NPC') {
      // Draw Old Wanderer character sprite
      const sp = window.LastLight.Sprites.get('player_walk_down_0');
      if (sp) ctx.drawImage(sp, sx, sy);
    } else if (obj.type === 'EMBER_RELIC') {
      if (!obj.collected) {
        const pulse = 1 + 0.25 * Math.sin(Date.now() / 180);
        ctx.save();
        ctx.fillStyle = '#00f2fe';
        ctx.shadowColor = '#4facfe';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(sx + 16, sy + 16, 7 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx + 16, sy + 16, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (obj.sprite) {
      const sp = window.LastLight.Sprites.get(obj.sprite);
      if (sp) ctx.drawImage(sp, sx, sy);
    }
  }
}

window.LastLight.MapManager = new MapManager();
