/**
 * LAST LIGHT - Player Entity & Mechanics
 * Handles input, movement, animations, health, lantern fuel countdown,
 * sprint consumption, lantern flare pulse, and damage states.
 */

window.LastLight = window.LastLight || {};

class Player {
  constructor(x = 100, y = 100) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 28;
    this.vx = 0;
    this.vy = 0;

    // Movement & Orientation
    this.direction = 'down'; // 'down', 'up', 'left', 'right'
    this.isMoving = false;
    this.isSprinting = false;

    // Animation state
    this.animFrame = 0;
    this.animTimer = 0;
    this.animSpeed = 0.15; // seconds per walk frame

    // Health System
    this.health = window.LastLight.Constants.MAX_HEALTH;
    this.invulnerableTimer = 0;
    this.isDead = false;

    // Lantern Fuel (Core Countdown Mechanic)
    this.fuel = window.LastLight.Constants.STARTING_FUEL;
    this.maxFuel = window.LastLight.Constants.MAX_FUEL;
    this.zoneDrainRate = window.LastLight.Constants.DRAIN_RATES.NORMAL_FOREST;
    this.inSafeZone = false;

    // Lantern Pulse Ability
    this.pulseCooldown = 0;

    // Footstep audio timer
    this.footstepTimer = 0;

    // Interaction target
    this.nearInteractable = null;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.health = window.LastLight.Constants.MAX_HEALTH;
    this.fuel = window.LastLight.Constants.STARTING_FUEL;
    this.isDead = false;
    this.invulnerableTimer = 0;
  }

  takeDamage(amount = 1) {
    if (this.invulnerableTimer > 0 || this.isDead) return;
    this.health -= amount;
    this.invulnerableTimer = window.LastLight.Constants.INVULNERABILITY_TIME;

    if (window.LastLight.Audio) {
      window.LastLight.Audio.playDamage();
    }

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
    }
  }

  heal(amount = 1) {
    this.health = Math.min(window.LastLight.Constants.MAX_HEALTH, this.health + amount);
  }

  addFuel(amount) {
    this.fuel = Math.min(this.maxFuel, this.fuel + amount);
  }

  useLanternPulse() {
    if (this.pulseCooldown > 0 || this.fuel < window.LastLight.Constants.LANTERN_PULSE_COST) return false;
    this.fuel -= window.LastLight.Constants.LANTERN_PULSE_COST;
    this.pulseCooldown = 1.2;

    if (window.LastLight.Audio) {
      window.LastLight.Audio.playLanternPulse();
    }
    return true;
  }

  update(dt, input, map, enemies = []) {
    if (this.isDead) return;

    const C = window.LastLight.Constants;

    // 1. Lantern Fuel Countdown
    let currentDrain = this.inSafeZone ? 0 : this.zoneDrainRate;
    if (this.isSprinting && !this.inSafeZone && (this.vx !== 0 || this.vy !== 0)) {
      currentDrain += C.SPRINT_DRAIN_MODIFIER;
    }

    this.fuel = Math.max(0, this.fuel - currentDrain * dt);

    // Update audio engine tension & heartbeat
    if (window.LastLight.Audio) {
      window.LastLight.Audio.updateLanternState(this.fuel, this.inSafeZone);
    }

    // 2. Pulse Cooldown & Invulnerability
    if (this.pulseCooldown > 0) this.pulseCooldown -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

    // 3. Handle Movement Input
    let moveX = 0;
    let moveY = 0;

    if (input.keys['ArrowUp'] || input.keys['KeyW']) moveY -= 1;
    if (input.keys['ArrowDown'] || input.keys['KeyS']) moveY += 1;
    if (input.keys['ArrowLeft'] || input.keys['KeyA']) moveX -= 1;
    if (input.keys['ArrowRight'] || input.keys['KeyD']) moveX += 1;

    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
      const invSqrt2 = 0.70710678;
      moveX *= invSqrt2;
      moveY *= invSqrt2;
    }

    this.isMoving = (moveX !== 0 || moveY !== 0);
    this.isSprinting = input.keys['ShiftLeft'] || input.keys['ShiftRight'];

    // Update facing direction
    if (moveY > 0) this.direction = 'down';
    else if (moveY < 0) this.direction = 'up';
    else if (moveX > 0) this.direction = 'right';
    else if (moveX < 0) this.direction = 'left';

    // 4. Calculate movement speed based on terrain
    const currentTileType = window.LastLight.Collision.getTileAt(
      this.x + this.width / 2,
      this.y + this.height / 2,
      map
    );

    let speed = C.PLAYER_WALK_SPEED;
    const isMud = (currentTileType === C.COLLISION.SLOW);
    if (isMud) {
      speed = C.PLAYER_MUD_SPEED;
    } else if (this.isSprinting) {
      speed = C.PLAYER_SPRINT_SPEED;
    }

    this.vx = moveX * speed;
    this.vy = moveY * speed;

    // 5. Collision Detection & Movement Application (Separated X and Y for smooth wall sliding)
    const newX = this.x + this.vx * dt;
    const testBoxX = { x: newX, y: this.y + 12, w: this.width, h: this.height - 12 };
    const colX = window.LastLight.Collision.checkTileCollision(testBoxX, map);
    if (!colX.collided) {
      this.x = newX;
    }

    const newY = this.y + this.vy * dt;
    const testBoxY = { x: this.x, y: newY + 12, w: this.width, h: this.height - 12 };
    const colY = window.LastLight.Collision.checkTileCollision(testBoxY, map);
    if (!colY.collided) {
      this.y = newY;
    }

    // Hazard damage tiles (Spikes/Briars)
    if (currentTileType === C.COLLISION.DAMAGE) {
      this.takeDamage(1);
    }

    // 6. Animation Frame Progress
    if (this.isMoving) {
      const speedMult = this.isSprinting ? 1.4 : 1.0;
      this.animTimer += dt * speedMult;
      if (this.animTimer >= this.animSpeed) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }

      // Footstep sounds
      this.footstepTimer += dt * (this.isSprinting ? 1.5 : 1.0);
      if (this.footstepTimer >= 0.35) {
        this.footstepTimer = 0;
        if (window.LastLight.Audio) {
          window.LastLight.Audio.playFootstep(isMud);
        }
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  render(ctx, camera) {
    const sx = camera.toScreenX(this.x);
    const sy = camera.toScreenY(this.y);

    // Damage flash (flicker transparency when invulnerable)
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      return;
    }

    if (this.isDead) {
      const deadSprite = window.LastLight.Sprites.get('player_death');
      if (deadSprite) {
        ctx.drawImage(deadSprite, sx - 4, sy);
      }
      return;
    }

    // Select sprite based on direction and state
    let spriteKey = '';
    if (this.invulnerableTimer > 0) {
      spriteKey = `player_hurt_${this.direction}`;
    } else if (this.isSprinting && this.isMoving) {
      spriteKey = `player_run_${this.direction}_${this.animFrame}`;
    } else {
      spriteKey = `player_walk_${this.direction}_${this.animFrame}`;
    }

    const sprite = window.LastLight.Sprites.get(spriteKey);
    if (sprite) {
      ctx.drawImage(sprite, sx - 4, sy - 4);
    }

    // Subtle drop shadow under character
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(sx + this.width / 2, sy + this.height - 2, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

window.LastLight.Player = Player;
