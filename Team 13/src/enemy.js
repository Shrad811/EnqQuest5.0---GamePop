/**
 * LAST LIGHT - Enemy Entities & AI Engine
 * Implements 4 distinct creature types:
 * 1. Shadow Stalker (chaser, light-fearing)
 * 2. Whisper (flying spectral siphon)
 * 3. Root Beast (gargantuan tank guardian)
 * 4. The Hollow (teleporting invincible dark pursuer)
 */

window.LastLight = window.LastLight || {};

class BaseEnemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.type = type;
    this.width = 24;
    this.height = 24;
    this.vx = 0;
    this.vy = 0;

    // AI State Machine
    this.state = 'PATROL'; // 'IDLE', 'PATROL', 'DETECT', 'CHASE', 'ATTACK', 'STUNNED', 'FLEE', 'DEAD'
    this.stateTimer = 0;

    // Patrol waypoints / bounds
    this.patrolRadius = 80;
    this.patrolTargetX = x;
    this.patrolTargetY = y;

    // Combat Stats
    this.health = 2;
    this.maxHealth = 2;
    this.damage = 1;
    this.speed = 60;
    this.attackCooldown = 0;
    this.stunTimer = 0;
    this.fleeTimer = 0;

    // Visuals
    this.animFrame = 0;
    this.animTimer = 0;
    this.isDead = false;
  }

  takeDamage(amount = 1) {
    if (this.isDead) return;
    this.health -= amount;
    this.stun(0.8);

    if (this.health <= 0) {
      this.isDead = true;
      this.state = 'DEAD';
      if (window.LastLight.Audio) {
        window.LastLight.Audio.playCreatureDefeated();
      }
      if (window.LastLight.Scoring) {
        window.LastLight.Scoring.addPoints(window.LastLight.Constants.POINTS.DEFEAT_CREATURE);
      }
    }
  }

  stun(duration = 2.0) {
    this.state = 'STUNNED';
    this.stunTimer = duration;
    this.vx = 0;
    this.vy = 0;
  }

  fleeFrom(targetX, targetY, duration = 3.0) {
    this.state = 'FLEE';
    this.fleeTimer = duration;
    const dx = this.x - targetX;
    const dy = this.y - targetY;
    const len = Math.hypot(dx, dy) || 1;
    this.vx = (dx / len) * (this.speed * 1.3);
    this.vy = (dy / len) * (this.speed * 1.3);

    if (window.LastLight.Audio) {
      window.LastLight.Audio.playCreatureGrowl(this.type);
    }
  }

  checkPlayerLightExposure(player, lightingEngine) {
    const lightRadius = lightingEngine.getLanternRadius(player.fuel);
    const distToPlayer = Math.hypot(
      (this.x + this.width / 2) - (player.x + player.width / 2),
      (this.y + this.height / 2) - (player.y + player.height / 2)
    );

    // If within lantern light radius and fuel is healthy
    const isExposed = distToPlayer < (lightRadius * 0.75) && player.fuel > 30;
    return { isExposed, distToPlayer, lightRadius };
  }

  updateMovementAndCollision(dt, map) {
    const newX = this.x + this.vx * dt;
    const boxX = { x: newX, y: this.y + 4, w: this.width, h: this.height - 4 };
    if (!window.LastLight.Collision.checkTileCollision(boxX, map).collided) {
      this.x = newX;
    } else {
      this.vx = -this.vx * 0.5;
    }

    const newY = this.y + this.vy * dt;
    const boxY = { x: this.x, y: newY + 4, w: this.width, h: this.height - 4 };
    if (!window.LastLight.Collision.checkTileCollision(boxY, map).collided) {
      this.y = newY;
    } else {
      this.vy = -this.vy * 0.5;
    }
  }
}

// 1. Shadow Stalker (chaser, prowls dark paths, flees bright light)
class ShadowStalker extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'STALKER');
    this.speed = 75;
    this.health = 2;
  }

  update(dt, player, map, lightingEngine) {
    if (this.isDead) return;

    this.animTimer += dt;
    if (this.animTimer > 0.25) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    const { isExposed, distToPlayer } = this.checkPlayerLightExposure(player, lightingEngine);

    // AI State logic
    if (this.state === 'STUNNED') {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.state = 'PATROL';
      return;
    }

    if (this.state === 'FLEE') {
      this.fleeTimer -= dt;
      this.updateMovementAndCollision(dt, map);
      if (this.fleeTimer <= 0) this.state = 'PATROL';
      return;
    }

    // Reaction to bright lantern
    if (isExposed && player.fuel > 50) {
      this.fleeFrom(player.x, player.y, 2.5);
      return;
    }

    // Detection range scales UP when lantern fuel is low (creatures become aggressive in darkness)
    const detectionRadius = player.fuel <= 30 ? 220 : 140;

    if (distToPlayer < detectionRadius) {
      this.state = 'CHASE';
      const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
      const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
      const dist = Math.hypot(dx, dy) || 1;

      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;

      // Attack if touching player
      if (dist < 26 && this.attackCooldown <= 0) {
        player.takeDamage(this.damage);
        this.attackCooldown = 1.2;
      }
    } else {
      // Return to patrol
      this.state = 'PATROL';
      this.stateTimer += dt;
      if (this.stateTimer > 3.0) {
        this.stateTimer = 0;
        const angle = Math.random() * Math.PI * 2;
        this.patrolTargetX = this.startX + Math.cos(angle) * (Math.random() * this.patrolRadius);
        this.patrolTargetY = this.startY + Math.sin(angle) * (Math.random() * this.patrolRadius);
      }

      const pdx = this.patrolTargetX - this.x;
      const pdy = this.patrolTargetY - this.y;
      const pdist = Math.hypot(pdx, pdy) || 1;
      if (pdist > 5) {
        this.vx = (pdx / pdist) * (this.speed * 0.4);
        this.vy = (pdy / pdist) * (this.speed * 0.4);
      } else {
        this.vx = 0;
        this.vy = 0;
      }
    }

    this.updateMovementAndCollision(dt, map);
  }

  render(ctx, camera) {
    if (this.isDead) return;
    const sx = camera.toScreenX(this.x);
    const sy = camera.toScreenY(this.y);
    const sprite = window.LastLight.Sprites.get(`enemy_stalker_${this.animFrame}`);
    if (sprite) {
      ctx.drawImage(sprite, sx - 4, sy - 4);
    }
  }
}

// 2. Whisper (flying spirit, circles player, siphons lantern fuel)
class Whisper extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'WHISPER');
    this.speed = 85;
    this.health = 1;
    this.angle = Math.random() * Math.PI * 2;
    this.circleDist = 70;
  }

  update(dt, player, map, lightingEngine) {
    if (this.isDead) return;

    this.animTimer += dt;
    if (this.animTimer > 0.18) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    const { isExposed, distToPlayer } = this.checkPlayerLightExposure(player, lightingEngine);

    if (this.state === 'STUNNED') {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.state = 'PATROL';
      return;
    }

    if (this.state === 'FLEE') {
      this.fleeTimer -= dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.fleeTimer <= 0) this.state = 'PATROL';
      return;
    }

    // Flee from strong light
    if (isExposed && player.fuel > 70) {
      this.fleeFrom(player.x, player.y, 2.0);
      return;
    }

    if (distToPlayer < 180) {
      // Circle player and occasionally swoop in to drain lantern
      this.angle += dt * 2.2;
      const targetX = player.x + Math.cos(this.angle) * this.circleDist;
      const targetY = player.y + Math.sin(this.angle) * this.circleDist;

      this.x += (targetX - this.x) * dt * 3;
      this.y += (targetY - this.y) * dt * 3;

      // Fuel siphon touch: drains 4s of light!
      if (distToPlayer < 30 && this.attackCooldown <= 0) {
        player.fuel = Math.max(0, player.fuel - 4);
        this.attackCooldown = 2.5;
        if (window.LastLight.Audio) {
          window.LastLight.Audio.playCreatureGrowl('WHISPER');
        }
      }
    } else {
      // Float lazily around start
      this.angle += dt * 0.8;
      this.x = this.startX + Math.cos(this.angle) * 30;
      this.y = this.startY + Math.sin(this.angle) * 30;
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;
    const sx = camera.toScreenX(this.x);
    const sy = camera.toScreenY(this.y);
    const sprite = window.LastLight.Sprites.get(`enemy_whisper_${this.animFrame}`);
    if (sprite) {
      ctx.drawImage(sprite, sx, sy);
    }
  }
}

// 3. Root Beast (Large slow guardian, high health)
class RootBeast extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'ROOT_BEAST');
    this.width = 40;
    this.height = 40;
    this.speed = 35;
    this.health = 4;
    this.maxHealth = 4;
    this.damage = 1;
  }

  update(dt, player, map, lightingEngine) {
    if (this.isDead) return;

    this.animTimer += dt;
    if (this.animTimer > 0.4) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    if (this.state === 'STUNNED') {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.state = 'PATROL';
      return;
    }

    const distToPlayer = Math.hypot(
      (this.x + this.width / 2) - (player.x + player.width / 2),
      (this.y + this.height / 2) - (player.y + player.height / 2)
    );

    // Root Beast stands firm and guards choke points
    if (distToPlayer < 120) {
      this.state = 'CHASE';
      const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
      const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
      const dist = Math.hypot(dx, dy) || 1;

      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;

      if (dist < 36 && this.attackCooldown <= 0) {
        player.takeDamage(this.damage);
        this.attackCooldown = 1.8;
      }
    } else {
      this.vx = 0;
      this.vy = 0;
    }

    this.updateMovementAndCollision(dt, map);
  }

  render(ctx, camera) {
    if (this.isDead) return;
    const sx = camera.toScreenX(this.x);
    const sy = camera.toScreenY(this.y);
    const sprite = window.LastLight.Sprites.get(`enemy_root_beast_${this.animFrame}`);
    if (sprite) {
      ctx.drawImage(sprite, sx - 4, sy - 4);
    }
    // Health bar above head
    if (this.health < this.maxHealth) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(sx + 4, sy - 8, 32, 4);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(sx + 4, sy - 8, (this.health / this.maxHealth) * 32, 4);
    }
  }
}

// 4. The Hollow (Deep darkness nightmare, teleports, invincible)
class TheHollow extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'HOLLOW');
    this.width = 28;
    this.height = 42;
    this.speed = 50;
    this.health = 999; // Invincible
    this.teleportTimer = 0;
  }

  update(dt, player, map, lightingEngine) {
    this.animTimer += dt;
    if (this.animTimer > 0.3) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    this.teleportTimer += dt;

    const distToPlayer = Math.hypot(
      (this.x + this.width / 2) - (player.x + player.width / 2),
      (this.y + this.height / 2) - (player.y + player.height / 2)
    );

    // Occasional short teleport closer to player
    if (this.teleportTimer > 4.5 && distToPlayer > 80 && distToPlayer < 350) {
      this.teleportTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      this.x = player.x + Math.cos(angle) * 75;
      this.y = player.y + Math.sin(angle) * 75;
      if (window.LastLight.Audio) {
        window.LastLight.Audio.playCreatureGrowl('HOLLOW');
      }
    }

    // Steady, relentless pursuit
    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
    const dist = Math.hypot(dx, dy) || 1;

    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;

    if (dist < 28 && this.attackCooldown <= 0) {
      player.takeDamage(1);
      this.attackCooldown = 2.0;
    }

    this.updateMovementAndCollision(dt, map);
  }

  render(ctx, camera) {
    const sx = camera.toScreenX(this.x);
    const sy = camera.toScreenY(this.y);
    const sprite = window.LastLight.Sprites.get(`enemy_hollow_${this.animFrame}`);
    if (sprite) {
      ctx.drawImage(sprite, sx - 2, sy - 3);
    }
  }
}

window.LastLight.Enemies = {
  ShadowStalker,
  Whisper,
  RootBeast,
  TheHollow
};
