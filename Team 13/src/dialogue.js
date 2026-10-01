/**
 * LAST LIGHT - Narrative & Dialogue Engine
 * Supports character portraits, typewriter text animations,
 * sound effects, and branching dialogue choices.
 */

window.LastLight = window.LastLight || {};

class DialogueEngine {
  constructor() {
    this.active = false;
    this.currentDialogue = null;
    this.currentStep = 0;
    this.typewriterIndex = 0;
    this.typewriterTimer = 0;
    this.typewriterSpeed = 0.025; // seconds per char
    this.displayedText = '';
    this.isFinishedTyping = false;
    this.onCompleteCallback = null;
  }

  start(dialogueData, onComplete = null) {
    this.active = true;
    this.currentDialogue = dialogueData;
    this.currentStep = 0;
    this.onCompleteCallback = onComplete;
    this.startStep();

    const modal = document.getElementById('dialogue-modal');
    if (modal) modal.classList.remove('hidden');
  }

  startStep() {
    this.typewriterIndex = 0;
    this.typewriterTimer = 0;
    this.displayedText = '';
    this.isFinishedTyping = false;
    this.render();
  }

  update(dt) {
    if (!this.active || !this.currentDialogue) return;

    const step = this.currentDialogue.steps[this.currentStep];
    if (!step) return;

    if (!this.isFinishedTyping) {
      this.typewriterTimer += dt;
      if (this.typewriterTimer >= this.typewriterSpeed) {
        this.typewriterTimer = 0;
        this.typewriterIndex++;
        this.displayedText = step.text.substring(0, this.typewriterIndex);

        if (this.typewriterIndex % 2 === 0 && window.LastLight.Audio) {
          window.LastLight.Audio.playDialogueBlip();
        }

        if (this.typewriterIndex >= step.text.length) {
          this.isFinishedTyping = true;
        }
        this.renderTextOnly();
      }
    }
  }

  next() {
    if (!this.active || !this.currentDialogue) return;

    const step = this.currentDialogue.steps[this.currentStep];
    // If still typing, clicking next finishes current text instantly
    if (!this.isFinishedTyping) {
      this.displayedText = step.text;
      this.isFinishedTyping = true;
      this.renderTextOnly();
      return;
    }

    // If current step has choices, player must select one of the choices
    if (step.choices && step.choices.length > 0) {
      return;
    }

    this.currentStep++;
    if (this.currentStep < this.currentDialogue.steps.length) {
      this.startStep();
    } else {
      this.close();
    }
  }

  selectChoice(choiceIndex) {
    const step = this.currentDialogue.steps[this.currentStep];
    if (!step || !step.choices || !step.choices[choiceIndex]) return;

    const choice = step.choices[choiceIndex];
    if (choice.action) {
      choice.action();
    }
    this.close();
  }

  close() {
    this.active = false;
    const modal = document.getElementById('dialogue-modal');
    if (modal) modal.classList.add('hidden');

    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }

  renderTextOnly() {
    const textEl = document.getElementById('dialogue-text');
    if (textEl) {
      textEl.innerText = this.displayedText;
    }
  }

  render() {
    const step = this.currentDialogue.steps[this.currentStep];
    if (!step) return;

    const speakerEl = document.getElementById('dialogue-speaker');
    const textEl = document.getElementById('dialogue-text');
    const portraitContainer = document.getElementById('dialogue-portrait-canvas');
    const choicesContainer = document.getElementById('dialogue-choices');

    if (speakerEl) speakerEl.innerText = step.speaker || 'Narrator';
    if (textEl) textEl.innerText = this.displayedText;

    // Render character portrait onto portrait canvas
    if (portraitContainer && step.portraitKey) {
      const pCanvas = portraitContainer;
      const pCtx = pCanvas.getContext('2d');
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
      const sprite = window.LastLight.Sprites.get(step.portraitKey);
      if (sprite) {
        pCtx.drawImage(sprite, 0, 0, pCanvas.width, pCanvas.height);
      }
    }

    // Render choices if present
    if (choicesContainer) {
      if (step.choices && step.choices.length > 0) {
        choicesContainer.innerHTML = step.choices.map((c, i) => `
          <button class="dialogue-choice-btn" onclick="window.LastLight.Dialogue.selectChoice(${i})">
            ${c.text}
          </button>
        `).join('');
      } else {
        choicesContainer.innerHTML = `
          <div class="dialogue-prompt">Press [E] or Click to Continue ▾</div>
        `;
      }
    }
  }
}

window.LastLight.Dialogue = new DialogueEngine();
