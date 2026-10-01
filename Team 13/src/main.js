/**
 * LAST LIGHT - Main Entry Point & UI Interactivity
 * Connects DOM elements, modal dialogs, audio volume controls,
 * and boots up the game engine.
 */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  // Set internal canvas resolution to 960 x 640
  canvas.width = window.LastLight.Constants.CANVAS_WIDTH;
  canvas.height = window.LastLight.Constants.CANVAS_HEIGHT;

  // Initialize Game
  const game = window.LastLight.Game;
  game.init(canvas);

  // Check if save exists to enable/disable continue button
  const continueBtn = document.getElementById('btn-continue-game');
  if (continueBtn) {
    if (window.LastLight.Save.hasSave()) {
      continueBtn.removeAttribute('disabled');
      continueBtn.classList.remove('disabled');
    } else {
      continueBtn.setAttribute('disabled', 'true');
      continueBtn.classList.add('disabled');
    }
  }

  // --- MENU BUTTONS ---

  document.getElementById('btn-new-game')?.addEventListener('click', () => {
    game.startNewGame();
  });

  document.getElementById('btn-continue-game')?.addEventListener('click', () => {
    game.loadSavedGame();
  });

  document.getElementById('btn-open-map-menu')?.addEventListener('click', () => {
    game.openWorldMap();
  });

  document.getElementById('btn-pause-world-map')?.addEventListener('click', () => {
    game.openWorldMap();
  });

  document.getElementById('btn-how-to-play')?.addEventListener('click', () => {
    document.getElementById('instructions-modal')?.classList.remove('hidden');
  });

  document.getElementById('btn-close-instructions')?.addEventListener('click', () => {
    document.getElementById('instructions-modal')?.classList.add('hidden');
  });

  // --- PAUSE MENU BUTTONS ---

  document.getElementById('btn-resume')?.addEventListener('click', () => {
    game.togglePause();
  });

  document.getElementById('btn-open-journal')?.addEventListener('click', () => {
    game.toggleJournal();
  });

  document.getElementById('btn-save-game')?.addEventListener('click', () => {
    const success = window.LastLight.Save.save({
      currentMapId: game.mapManager.currentMap ? game.mapManager.currentMap.id : 'forest_edge',
      player: game.player,
      inventory: window.LastLight.Inventory,
      journal: window.LastLight.Journal,
      quests: window.LastLight.Quests,
      scoring: window.LastLight.Scoring
    });

    const statusEl = document.getElementById('save-status-msg');
    if (statusEl) {
      statusEl.innerText = success ? "Game Saved Successfully!" : "Save Failed!";
      statusEl.classList.remove('hidden');
      setTimeout(() => statusEl.classList.add('hidden'), 2500);
    }
  });

  document.getElementById('btn-pause-menu-main')?.addEventListener('click', () => {
    game.state = 'MENU';
    game.hideAllModals();
    document.getElementById('main-menu-overlay')?.classList.remove('hidden');
  });

  // --- AUDIO CONTROLS ---

  const muteBtn = document.getElementById('btn-toggle-audio');
  muteBtn?.addEventListener('click', () => {
    if (window.LastLight.Audio) {
      const isMuted = window.LastLight.Audio.toggleMute();
      muteBtn.innerText = isMuted ? '🔇 Audio Muted' : '🔊 Audio Active';
    }
  });

  // --- HUD BUTTONS ---

  document.getElementById('hud-btn-map')?.addEventListener('click', () => {
    game.openWorldMap();
  });

  document.getElementById('hud-btn-journal')?.addEventListener('click', () => {
    game.toggleJournal();
  });

  document.getElementById('btn-close-journal')?.addEventListener('click', () => {
    document.getElementById('journal-modal')?.classList.add('hidden');
  });

  document.getElementById('btn-close-world-map')?.addEventListener('click', () => {
    document.getElementById('world-map-modal')?.classList.add('hidden');
  });

  // --- GAME OVER & ENDING BUTTONS ---

  document.getElementById('btn-gameover-restart')?.addEventListener('click', () => {
    game.startNewGame();
  });

  document.getElementById('btn-gameover-menu')?.addEventListener('click', () => {
    game.state = 'MENU';
    game.hideAllModals();
    document.getElementById('main-menu-overlay')?.classList.remove('hidden');
  });

  document.getElementById('btn-ending-restart')?.addEventListener('click', () => {
    game.startNewGame();
  });

  document.getElementById('btn-ending-menu')?.addEventListener('click', () => {
    game.state = 'MENU';
    game.hideAllModals();
    document.getElementById('main-menu-overlay')?.classList.remove('hidden');
  });

  // Close modals on backdrop click or ESC
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.add('hidden');
      if (game.state === 'PAUSED') game.state = 'PLAYING';
    }
  });
});
