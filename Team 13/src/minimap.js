/**
 * LAST LIGHT - Dynamic Rotating Mini Map Engine
 * Features:
 * - Dynamic smooth rotation aligned with the player's facing direction
 * - Old Man / Wanderer's location marked with a distinctive pulsing golden beacon
 * - Off-screen edge-clamped pointer toward the Old Man with distance indicator
 * - Rotating compass rose (N, E, S, W)
 * - Safe zone campfires, fuel pickups, and portal exits marked
 * - Player lantern light radius and directional chevron at center
 */

window.LastLight = window.LastLight || {};

class DynamicMinimap {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.size = 120;
    this.radius = 52;
    this.scale = 0.22; // 32px tile = ~7px on minimap

    // Dynamic rotation angle (radians)
    this.currentAngle = 0;
    this.targetAngle = 0;
    this.angleLerpSpeed = 10.0;

    // Beacon pulse timer
    this.pulseTimer = 0;

    // Old Man's fixed location in Map 1 (The Forest Edge)
    this.oldManWorld = {
      mapId: 'forest_edge',
      x: 16 * 32 + 16,
      y: 10 * 32 + 16,
      name: "Old Wanderer"
    };

    // Direction angle lookup
    this.dirAngles = {
      'up': 0,
      'right': Math.PI / 2,
      'down': Math.PI,
      'left': -Math.PI / 2
    };
  }

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
  }

  update(dt, player) {
    if (!player) return;

    // Update target angle based on player facing direction
    this.targetAngle = this.dirAngles[player.direction] || 0;

    // Smooth shortest-arc angle lerp
    let diff = this.targetAngle - this.currentAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.currentAngle += diff * Math.min(1.0, dt * this.angleLerpSpeed);

    // Pulse animation
    this.pulseTimer = (this.pulseTimer + dt * 2.5) % (Math.PI * 2);
  }

  render(player, mapManager) {
    if (!this.ctx || !this.canvas || !player || !mapManager || !mapManager.currentMap) return;

    const ctx = this.ctx;
    const cx = this.size / 2;
    const cy = this.size / 2;
    const r = this.radius;
    const currentMap = mapManager.currentMap;

    ctx.clearRect(0, 0, this.size, this.size);

    // 1. Draw outer bezel / background shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
    ctx.fillStyle = '#080c12';
    ctx.fill();
    ctx.strokeStyle = '#3a4454';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Circular Clipping Mask for Minimap Content
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Dark radar ocean background
    ctx.fillStyle = '#0b111a';
    ctx.fillRect(0, 0, this.size, this.size);

    // 3. Dynamic Rotation Transformation
    ctx.save();
    ctx.translate(cx, cy);
    // Rotate so that player forward heading is UP (subtract currentAngle)
    ctx.rotate(-this.currentAngle);

    // Draw rotated terrain relative to player position
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;

    const tileSize = window.LastLight.Constants.TILE_SIZE;
    const T = window.LastLight.Constants.TILES;
    const C = window.LastLight.Constants.COLLISION;

    const rangeInTiles = Math.ceil((r / this.scale) / tileSize) + 2;
    const pCol = Math.floor(px / tileSize);
    const pRow = Math.floor(py / tileSize);

    const startCol = Math.max(0, pCol - rangeInTiles);
    const endCol = Math.min(currentMap.width - 1, pCol + rangeInTiles);
    const startRow = Math.max(0, pRow - rangeInTiles);
    const endRow = Math.min(currentMap.height - 1, pRow + rangeInTiles);

    // Render Tiles
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const tileType = currentMap.tiles[row * currentMap.width + col];
        const colType = currentMap.collision[row * currentMap.width + col];

        const worldX = col * tileSize;
        const worldY = row * tileSize;

        // Relative coordinate on minimap
        const rx = (worldX - px) * this.scale;
        const ry = (worldY - py) * this.scale;
        const ts = tileSize * this.scale;

        if (colType === C.SOLID) {
          ctx.fillStyle = '#1c2630'; // Solid walls/trees
          ctx.fillRect(rx, ry, ts, ts);
        } else if (tileType === T.WATER_DEEP || colType === C.WATER) {
          ctx.fillStyle = '#0e2b33'; // Water
          ctx.fillRect(rx, ry, ts, ts);
        } else if (tileType === T.MUD) {
          ctx.fillStyle = '#221b16'; // Mud
          ctx.fillRect(rx, ry, ts, ts);
        } else if (tileType === T.DIRT || tileType === T.WOOD_PLANK) {
          ctx.fillStyle = '#3a2d21'; // Path
          ctx.fillRect(rx, ry, ts, ts);
        } else if (colType === C.SAFE_ZONE) {
          ctx.fillStyle = '#2d4533'; // Safe zone ground
          ctx.fillRect(rx, ry, ts, ts);
        } else {
          ctx.fillStyle = '#122318'; // Normal ground
          ctx.fillRect(rx, ry, ts, ts);
        }
      }
    }

    // Render Campfires & Shrines (Safe Zones)
    (currentMap.objects || []).forEach(obj => {
      if (obj.type === 'CAMPFIRE' || obj.type === 'SHRINE') {
        const ox = (obj.x + 16 - px) * this.scale;
        const oy = (obj.y + 16 - py) * this.scale;
        ctx.fillStyle = '#ffaa33';
        ctx.beginPath();
        ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type === 'EMBER_RELIC' && !obj.collected) {
        const ox = (obj.x + 16 - px) * this.scale;
        const oy = (obj.y + 16 - py) * this.scale;
        ctx.fillStyle = '#00f2fe';
        ctx.beginPath();
        ctx.arc(ox, oy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Render Fuel Pickups
    (mapManager.fuelPickups || []).forEach(fuel => {
      const fx = (fuel.x + 12 - px) * this.scale;
      const fy = (fuel.y + 12 - py) * this.scale;
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(fx, fy, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render Portal Exits
    (currentMap.triggers || []).forEach(trig => {
      const tx = (trig.x + trig.w / 2 - px) * this.scale;
      const ty = (trig.y + trig.h / 2 - py) * this.scale;
      ctx.fillStyle = '#74b9ff';
      ctx.fillRect(tx - 2, ty - 2, 4, 4);
    });

    // ==========================================
    // OLD MAN / WANDERER'S MARKED LOCATION
    // ==========================================
    let targetOldManWorldX = null;
    let targetOldManWorldY = null;
    let oldManIsHere = false;

    if (currentMap.id === this.oldManWorld.mapId) {
      targetOldManWorldX = this.oldManWorld.x;
      targetOldManWorldY = this.oldManWorld.y;
      oldManIsHere = true;
    } else {
      // If player is in another map, point toward the exit leading back toward Forest Edge
      const exitTrigger = (currentMap.triggers || []).find(t => 
        t.targetMap === 'forest_edge' || t.targetMap === 'whispering_woods'
      );
      if (exitTrigger) {
        targetOldManWorldX = exitTrigger.x + exitTrigger.w / 2;
        targetOldManWorldY = exitTrigger.y + exitTrigger.h / 2;
      }
    }

    let offscreenOldManAngle = null;
    let oldManDistanceMeters = 0;

    if (targetOldManWorldX !== null && targetOldManWorldY !== null) {
      const dx = targetOldManWorldX - px;
      const dy = targetOldManWorldY - py;
      const distPx = Math.hypot(dx, dy);
      oldManDistanceMeters = Math.max(1, Math.round(distPx / 16));

      const omX = dx * this.scale;
      const omY = dy * this.scale;
      const distFromCenter = Math.hypot(omX, omY);

      if (distFromCenter < (r - 8)) {
        // Render inside minimap with pulsing golden beacon
        this.renderOldManMarker(ctx, omX, omY, oldManIsHere);
      } else {
        // Calculate angle on the rotating minimap rim
        offscreenOldManAngle = Math.atan2(omY, omX);
      }
    }

    // Restore rotation before drawing player center & HUD overlays
    ctx.restore();

    // 4. Render Off-Screen Pointer for Old Man on the Rim (if outside view)
    if (offscreenOldManAngle !== null) {
      this.renderOldManEdgePointer(ctx, cx, cy, r, offscreenOldManAngle, oldManDistanceMeters, oldManIsHere);
    }

    // 5. Draw Player Lantern Illumination Aura & Forward Chevron at Center
    const lanternFuel = player.fuel || 0;
    const lightRadius = Math.max(6, (lanternFuel / 120) * 22);

    // Lantern light circle
    const glowGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, lightRadius);
    glowGrad.addColorStop(0, 'rgba(255, 230, 160, 0.45)');
    glowGrad.addColorStop(0.7, 'rgba(255, 170, 51, 0.18)');
    glowGrad.addColorStop(1, 'rgba(255, 170, 51, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, lightRadius, 0, Math.PI * 2);
    ctx.fill();

    // Player Chevron (pointing straight UP, since minimap rotates)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(4, 4);
    ctx.lineTo(0, 2);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();

    // Center player core
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6. Draw Rotating Compass Rose Cardinals (N, E, S, W) on the Bezel
    ctx.restore(); // Undo clipping

    this.renderCompassRose(ctx, cx, cy, r);

    // 7. Bezel Border & Glass Ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#c29759'; // Antique brass gold
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner tick circle
    ctx.beginPath();
    ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(194, 151, 89, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Update Old Man status in HUD bar
    const distEl = document.getElementById('hud-old-man-dist');
    if (distEl) {
      if (oldManIsHere) {
        distEl.innerHTML = `<span style="color: #f1c40f;">👴 WANDERER: ${oldManDistanceMeters}m</span>`;
      } else {
        distEl.innerHTML = `<span style="color: #c29759;">👴 WANDERER: [Forest Edge]</span>`;
      }
    }
  }

  // Draw Old Man's pulsing beacon inside minimap
  renderOldManMarker(ctx, x, y, isHere) {
    const pulseRadius = 5 + Math.sin(this.pulseTimer) * 4;
    const pulseAlpha = 0.7 - (Math.sin(this.pulseTimer) * 0.3);

    // Expanding beacon wave
    ctx.strokeStyle = `rgba(241, 196, 15, ${pulseAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Solid golden beacon dot
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    // White core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Mini text label above beacon
    ctx.save();
    // Counter-rotate text so it stays horizontally readable!
    ctx.rotate(this.currentAngle);
    // Transform coordinates for counter-rotated label
    const cosA = Math.cos(this.currentAngle);
    const sinA = Math.sin(this.currentAngle);
    const textScreenX = x * cosA - y * sinA;
    const textScreenY = x * sinA + y * cosA - 8;

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 8px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText("OLD MAN", textScreenX, textScreenY);
    ctx.restore();
  }

  // Draw clamped pointer on the rim pointing to Old Man
  renderOldManEdgePointer(ctx, cx, cy, r, angle, distMeters, isHere) {
    const rimX = cx + Math.cos(angle) * (r - 7);
    const rimY = cy + Math.sin(angle) * (r - 7);

    ctx.save();
    ctx.translate(rimX, rimY);
    ctx.rotate(angle);

    // Pulsing golden arrow pointing outward toward Old Man
    const pulseAlpha = 0.75 + Math.sin(this.pulseTimer) * 0.25;
    ctx.fillStyle = `rgba(241, 196, 15, ${pulseAlpha})`;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();

    // Wanderer badge dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw Rotating Compass Rose (N, E, S, W) that accurately reflects world north
  renderCompassRose(ctx, cx, cy, r) {
    const cardinalOffset = r - 1;
    const cardinals = [
      { label: 'N', angle: 0, color: '#e74c3c' },         // North is Red
      { label: 'E', angle: Math.PI / 2, color: '#c29759' },
      { label: 'S', angle: Math.PI, color: '#c29759' },
      { label: 'W', angle: -Math.PI / 2, color: '#c29759' }
    ];

    ctx.save();
    ctx.font = 'bold 8px "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    cardinals.forEach(c => {
      // Rotate cardinal around compass center based on currentAngle
      const rotAngle = c.angle - this.currentAngle - Math.PI / 2;
      const lx = cx + Math.cos(rotAngle) * cardinalOffset;
      const ly = cy + Math.sin(rotAngle) * cardinalOffset;

      // Small background backing for contrast
      ctx.fillStyle = 'rgba(7, 9, 14, 0.85)';
      ctx.beginPath();
      ctx.arc(lx, ly, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Cardinal letter
      ctx.fillStyle = c.color;
      ctx.fillText(c.label, lx, ly);
    });

    ctx.restore();
  }
}

window.LastLight.Minimap = new DynamicMinimap();
