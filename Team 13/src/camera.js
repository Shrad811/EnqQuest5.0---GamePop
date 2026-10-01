/**
 * LAST LIGHT - Smooth Camera System
 * Handles player tracking, boundary constraints, screen shaking, and coordinate transformation.
 */

window.LastLight = window.LastLight || {};

class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.lerpSpeed = 0.08; // Smooth cinematic catch-up

    // Bounds
    this.minX = 0;
    this.minY = 0;
    this.maxX = 0;
    this.maxY = 0;

    // Shake effect
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  setBounds(mapWidthPx, mapHeightPx) {
    this.minX = 0;
    this.minY = 0;
    this.maxX = Math.max(0, mapWidthPx - this.viewportWidth);
    this.maxY = Math.max(0, mapHeightPx - this.viewportHeight);
  }

  follow(target) {
    this.targetX = target.x + target.width / 2 - this.viewportWidth / 2;
    this.targetY = target.y + target.height / 2 - this.viewportHeight / 2;
  }

  shake(intensity = 6, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  update(dt) {
    // Smooth lerp follow
    this.x += (this.targetX - this.x) * (1 - Math.pow(1 - this.lerpSpeed, dt * 60));
    this.y += (this.targetY - this.y) * (1 - Math.pow(1 - this.lerpSpeed, dt * 60));

    // Clamp to map boundaries
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));

    // Shake update
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  // Convert world coordinates to screen coordinates
  toScreenX(worldX) {
    return Math.floor(worldX - this.x + this.shakeOffsetX);
  }

  toScreenY(worldY) {
    return Math.floor(worldY - this.y + this.shakeOffsetY);
  }

  // Convert screen coordinates to world coordinates
  toWorldX(screenX) {
    return screenX + this.x - this.shakeOffsetX;
  }

  toWorldY(screenY) {
    return screenY + this.y - this.shakeOffsetY;
  }
}

window.LastLight.Camera = Camera;
