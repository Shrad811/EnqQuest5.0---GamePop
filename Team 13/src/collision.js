/**
 * LAST LIGHT - Collision & Physics Engine
 * Handles tile-based collision, AABB box intersections, slow zones,
 * hazard damage triggers, and interaction hitboxes.
 */

window.LastLight = window.LastLight || {};

class CollisionSystem {
  constructor() {
    this.COLLISION = window.LastLight.Constants.COLLISION;
    this.TILE_SIZE = window.LastLight.Constants.TILE_SIZE;
  }

  // Check if an AABB rectangle overlaps with any solid tile in the current map
  checkTileCollision(rect, map) {
    if (!map || !map.collision) return { collided: false };

    const tileSize = this.TILE_SIZE;
    const startCol = Math.floor(rect.x / tileSize);
    const endCol = Math.floor((rect.x + rect.w - 0.01) / tileSize);
    const startRow = Math.floor(rect.y / tileSize);
    const endRow = Math.floor((rect.y + rect.h - 0.01) / tileSize);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        // Out of bounds is treated as solid
        if (r < 0 || r >= map.height || c < 0 || c >= map.width) {
          return { collided: true, type: this.COLLISION.SOLID, tileX: c, tileY: r };
        }

        const tileType = map.collision[r * map.width + c];
        if (tileType === this.COLLISION.SOLID || tileType === this.COLLISION.WATER) {
          return { collided: true, type: tileType, tileX: c, tileY: r };
        }
      }
    }

    return { collided: false };
  }

  // Get tile property under a point (e.g. player center for slow/hazard/safe zone)
  getTileAt(x, y, map) {
    if (!map || !map.collision) return this.COLLISION.NONE;
    const col = Math.floor(x / this.TILE_SIZE);
    const row = Math.floor(y / this.TILE_SIZE);
    if (row < 0 || row >= map.height || col < 0 || col >= map.width) {
      return this.COLLISION.SOLID;
    }
    return map.collision[row * map.width + col];
  }

  // Simple AABB Box vs Box overlap
  rectOverlap(r1, r2) {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  }

  // Circle vs Circle distance overlap
  circleOverlap(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const distSq = dx * dx + dy * dy;
    const radiusSum = c1.radius + c2.radius;
    return distSq <= radiusSum * radiusSum;
  }

  // Check if player is near an interactive object
  findInteractable(player, objects, range = 36) {
    let closest = null;
    let minDist = range;

    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;

    for (const obj of objects) {
      if (!obj.interactable) continue;
      const ox = obj.x + (obj.width || this.TILE_SIZE) / 2;
      const oy = obj.y + (obj.height || this.TILE_SIZE) / 2;

      const dist = Math.hypot(px - ox, py - oy);
      if (dist < minDist) {
        minDist = dist;
        closest = obj;
      }
    }

    return closest;
  }
}

window.LastLight.Collision = new CollisionSystem();
