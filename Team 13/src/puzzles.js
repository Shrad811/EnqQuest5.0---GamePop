/**
 * LAST LIGHT - Interactive Puzzle Engine
 * 1. Celestial Rune Altar Puzzle (Align 3 rotating rune disks)
 * 2. Light Mirror Beam Puzzle (Orient reflective mirrors to strike crystal lock)
 * Note: Lantern fuel continuously drains during puzzles to enforce "Against the Clock"!
 */

window.LastLight = window.LastLight || {};

class PuzzleManager {
  constructor() {
    this.activePuzzle = null;
    this.onSolveCallback = null;

    // Puzzle 1: Rune Altar State
    // Required combination hinted in Lore: [1, 3, 2] (Sun, Eclipse, Void)
    this.runeState = [0, 0, 0];
    this.runeTarget = [1, 3, 2];
    this.runeSymbols = ['🌙 Moon', '☀️ Sun', '🌌 Void', '🌑 Eclipse'];

    // Puzzle 2: Light Mirror State
    // 3 Mirrors that can rotate 0, 90, 180, 270 deg. Target angles: [90, 180, 270]
    this.mirrorAngles = [0, 0, 0];
    this.mirrorTarget = [90, 180, 270];
  }

  openRuneAltar(onSolve) {
    this.activePuzzle = 'RUNE_ALTAR';
    this.onSolveCallback = onSolve;
    this.renderRuneUI();
    const modal = document.getElementById('puzzle-modal');
    if (modal) modal.classList.remove('hidden');
  }

  openLightMirrors(onSolve) {
    this.activePuzzle = 'LIGHT_MIRROR';
    this.onSolveCallback = onSolve;
    this.renderMirrorUI();
    const modal = document.getElementById('puzzle-modal');
    if (modal) modal.classList.remove('hidden');
  }

  close() {
    this.activePuzzle = null;
    this.onSolveCallback = null;
    const modal = document.getElementById('puzzle-modal');
    if (modal) modal.classList.add('hidden');
  }

  // --- RUNE ALTAR UI & LOGIC ---

  rotateRune(index) {
    this.runeState[index] = (this.runeState[index] + 1) % this.runeSymbols.length;
    if (window.LastLight.Audio) {
      window.LastLight.Audio.playPuzzleClick();
    }
    this.renderRuneUI();
    this.checkRuneSolved();
  }

  checkRuneSolved() {
    const isSolved = this.runeState.every((val, idx) => val === this.runeTarget[idx]);
    if (isSolved) {
      if (window.LastLight.Audio) {
        window.LastLight.Audio.playPuzzleSolve();
      }
      if (window.LastLight.Scoring) {
        window.LastLight.Scoring.addPoints(window.LastLight.Constants.POINTS.SOLVE_PUZZLE);
      }
      setTimeout(() => {
        const cb = this.onSolveCallback;
        this.close();
        if (cb) cb();
      }, 700);
    }
  }

  renderRuneUI() {
    const container = document.getElementById('puzzle-content');
    if (!container) return;

    container.innerHTML = `
      <div class="puzzle-wrapper">
        <h2 class="puzzle-title">Ancient Rune Altar</h2>
        <p class="puzzle-hint">
          "When the Sun rises above the Eclipse, only the Void shall endure."<br>
          <span class="puzzle-warning">⚠️ The lantern flame continues to drain!</span>
        </p>
        <div class="rune-disks-container">
          ${this.runeState.map((val, idx) => `
            <div class="rune-disk" onclick="window.LastLight.Puzzles.rotateRune(${idx})">
              <div class="rune-symbol">${this.runeSymbols[val]}</div>
              <button class="btn btn-secondary rune-btn">Rotate [Ring ${idx + 1}]</button>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary" onclick="window.LastLight.Puzzles.close()">Step Away</button>
      </div>
    `;
  }

  // --- LIGHT MIRROR UI & LOGIC ---

  rotateMirror(index) {
    this.mirrorAngles[index] = (this.mirrorAngles[index] + 90) % 360;
    if (window.LastLight.Audio) {
      window.LastLight.Audio.playPuzzleClick();
    }
    this.renderMirrorUI();
    this.checkMirrorSolved();
  }

  checkMirrorSolved() {
    const isSolved = this.mirrorAngles.every((ang, idx) => ang === this.mirrorTarget[idx]);
    if (isSolved) {
      if (window.LastLight.Audio) {
        window.LastLight.Audio.playPuzzleSolve();
      }
      if (window.LastLight.Scoring) {
        window.LastLight.Scoring.addPoints(window.LastLight.Constants.POINTS.SOLVE_PUZZLE);
      }
      setTimeout(() => {
        const cb = this.onSolveCallback;
        this.close();
        if (cb) cb();
      }, 800);
    }
  }

  renderMirrorUI() {
    const container = document.getElementById('puzzle-content');
    if (!container) return;

    container.innerHTML = `
      <div class="puzzle-wrapper">
        <h2 class="puzzle-title">Prismatic Mirror Alignment</h2>
        <p class="puzzle-hint">
          Rotate the brass pedestals to bounce the lantern's beam into the seal crystal.<br>
          <span class="puzzle-warning">⚠️ The lantern flame continues to drain!</span>
        </p>
        <div class="mirror-pedestals-container">
          ${this.mirrorAngles.map((ang, idx) => `
            <div class="mirror-pedestal" onclick="window.LastLight.Puzzles.rotateMirror(${idx})">
              <div class="mirror-icon" style="transform: rotate(${ang}deg)">⤹</div>
              <div class="mirror-angle-label">${ang}°</div>
              <button class="btn btn-secondary rune-btn">Orient [Mirror ${idx + 1}]</button>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary" onclick="window.LastLight.Puzzles.close()">Step Away</button>
      </div>
    `;
  }
}

window.LastLight.Puzzles = new PuzzleManager();
