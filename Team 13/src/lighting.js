/**
 * LAST LIGHT - Dynamic Lighting & Atmospheric FX Engine
 * Implements 2D radial light falloff, dynamic darkness mask,
 * secondary lights (campfires, crystals), rising embers, and drifting mist.
 */

window.LastLight = window.LastLight || {};

class LightingEngine {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    // Offscreen canvas for lighting mask
    this.maskCanvas = document.createElement('canvas');
    this.maskCanvas.width = width;
    this.maskCanvas.height = height;
    this.maskCtx = this.maskCanvas.getContext('2d');

    // Embers & atmospheric particles
    this.embers = [];
    this.maxEmbers = 35;
    this.fogClouds = [];
    this.initFog();

    // Pulse wave effect (when Space is pressed)
    this.pulseActive = false;
    this.pulseRadius = 0;
    this.pulseMaxRadius = 260;
    this.pulseAlpha = 1.0;

    // Flicker accumulator
    this.flickerTimer = 0;
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.maskCanvas.width = w;
    this.maskCanvas.height = h;
  }

  initFog() {
    this.fogClouds = [];
    for (let i = 0; i < 15; i++) {
      this.fogClouds.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 60 + Math.random() * 80,
        vx: 8 + Math.random() * 12,
        alpha: 0.04 + Math.random() * 0.05
      });
    }
  }

  // Calculate base radius from remaining lantern fuel
  getLanternRadius(fuel) {
    if (fuel <= 0) return 0;
    if (fuel >= 120) return 220;
    if (fuel >= 90) return 180 + ((fuel - 90) / 30) * 40;
    if (fuel >= 60) return 140 + ((fuel - 60) / 30) * 40;
    if (fuel >= 30) return 100 + ((fuel - 30) / 30) * 40;
    if (fuel >= 10) return 65 + ((fuel - 10) / 20) * 35;
    // Critical (0 to 10s)
    return 30 + (fuel / 10) * 35;
  }

  triggerPulse() {
    this.pulseActive = true;
    this.pulseRadius = 20;
    this.pulseAlpha = 1.0;
  }

  update(dt, playerWorldX, playerWorldY, fuel) {
    this.flickerTimer += dt * 8;

    // Update rising lantern embers
    if (fuel > 0 && Math.random() < 0.6) {
      this.embers.push({
        x: playerWorldX + (Math.random() * 12 - 6),
        y: playerWorldY + (Math.random() * 8 - 4),
        vx: (Math.random() * 14 - 7),
        vy: -25 - Math.random() * 35,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1.1,
        size: 1.5 + Math.random() * 2
      });
    }

    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.life -= dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.life <= 0) {
        this.embers.splice(i, 1);
      }
    }

    // Update fog
    this.fogClouds.forEach(fog => {
      fog.x += fog.vx * dt;
      if (fog.x - fog.radius > this.width) {
        fog.x = -fog.radius;
        fog.y = Math.random() * this.height;
      }
    });

    // Update lantern pulse wave
    if (this.pulseActive) {
      this.pulseRadius += dt * 450;
      this.pulseAlpha -= dt * 2.2;
      if (this.pulseAlpha <= 0 || this.pulseRadius >= this.pulseMaxRadius) {
        this.pulseActive = false;
      }
    }
  }

  // Render darkness mask over the main game canvas
  render(targetCtx, camera, player, fuel, lightSources = []) {
    const ctx = this.maskCtx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Fill mask with deep supernatural darkness
    // Base opacity: 0.97 in danger zones, so environment isn't completely opaque pitch
    const baseDarknessAlpha = fuel <= 10 ? 0.985 : 0.965;
    ctx.fillStyle = `rgba(5, 7, 11, ${baseDarknessAlpha})`;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Cut out light shapes with destination-out
    ctx.globalCompositeOperation = 'destination-out';

    // Player Lantern Light
    const playerScreenX = camera.toScreenX(player.x + player.width / 2);
    const playerScreenY = camera.toScreenY(player.y + player.height / 2);

    let baseRadius = this.getLanternRadius(fuel);
    // Subtle organic flame flicker
    const flicker = Math.sin(this.flickerTimer) * 3 + Math.cos(this.flickerTimer * 1.7) * 2;
    let radius = Math.max(0, baseRadius + flicker);

    if (radius > 5) {
      const grad = ctx.createRadialGradient(
        playerScreenX, playerScreenY, radius * 0.15,
        playerScreenX, playerScreenY, radius
      );
      grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(0.85, 'rgba(0, 0, 0, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Secondary lights (Campfires, shrines, crystals)
    lightSources.forEach(src => {
      const sx = camera.toScreenX(src.x);
      const sy = camera.toScreenY(src.y);
      const sRadius = src.radius || 120;

      // Only draw if on screen
      if (sx + sRadius >= 0 && sx - sRadius <= this.width &&
          sy + sRadius >= 0 && sy - sRadius <= this.height) {
        const sGrad = ctx.createRadialGradient(
          sx, sy, sRadius * 0.1,
          sx, sy, sRadius
        );
        sGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
        sGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');
        sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Lantern Pulse wave cutout
    if (this.pulseActive) {
      const pGrad = ctx.createRadialGradient(
        playerScreenX, playerScreenY, 0,
        playerScreenX, playerScreenY, this.pulseRadius
      );
      pGrad.addColorStop(0, `rgba(0, 0, 0, ${this.pulseAlpha})`);
      pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY, this.pulseRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Reset composite operation for warm tint overlays
    ctx.globalCompositeOperation = 'source-over';

    // 3. Draw warm amber lantern aura on the cut edges
    if (radius > 5) {
      const warmGrad = ctx.createRadialGradient(
        playerScreenX, playerScreenY, radius * 0.1,
        playerScreenX, playerScreenY, radius
      );
      warmGrad.addColorStop(0, 'rgba(255, 235, 170, 0.12)');
      warmGrad.addColorStop(0.5, 'rgba(255, 170, 51, 0.08)');
      warmGrad.addColorStop(0.85, 'rgba(230, 92, 0, 0.12)');
      warmGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = warmGrad;
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Low-fuel Critical Red / Vignette Pulse (<10s)
    if (fuel <= 10 && fuel > 0) {
      const pulseSpeed = (11 - fuel) * 2;
      const redAlpha = 0.15 + Math.sin(Date.now() / 200 * pulseSpeed) * 0.12;
      const critGrad = ctx.createRadialGradient(
        this.width / 2, this.height / 2, this.width * 0.2,
        this.width / 2, this.height / 2, this.width * 0.65
      );
      critGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      critGrad.addColorStop(1, `rgba(180, 20, 20, ${redAlpha})`);

      ctx.fillStyle = critGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 5. Draw the compiled darkness mask onto main screen
    targetCtx.drawImage(this.maskCanvas, 0, 0);

    // 6. Render Drifting Fog particles on top of world
    this.renderFog(targetCtx);

    // 7. Render Rising Embers
    this.renderEmbers(targetCtx, camera);
  }

  renderFog(targetCtx) {
    this.fogClouds.forEach(fog => {
      const grad = targetCtx.createRadialGradient(
        fog.x, fog.y, 0,
        fog.x, fog.y, fog.radius
      );
      grad.addColorStop(0, `rgba(180, 200, 215, ${fog.alpha})`);
      grad.addColorStop(1, 'rgba(180, 200, 215, 0)');
      targetCtx.fillStyle = grad;
      targetCtx.beginPath();
      targetCtx.arc(fog.x, fog.y, fog.radius, 0, Math.PI * 2);
      targetCtx.fill();
    });
  }

  renderEmbers(targetCtx, camera) {
    this.embers.forEach(e => {
      const sx = camera.toScreenX(e.x);
      const sy = camera.toScreenY(e.y);
      const progress = e.life / e.maxLife;
      const alpha = Math.min(1, progress * 1.5);
      
      targetCtx.fillStyle = `rgba(255, 180, 50, ${alpha})`;
      targetCtx.fillRect(sx, sy, e.size, e.size);
    });
  }
}

window.LastLight.Lighting = LightingEngine;
