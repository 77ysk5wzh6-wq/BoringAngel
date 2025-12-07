class Scene2 {
  constructor(song, wingdingsFont, bravuraFont) {
    // --- 시간 기반 상수 ---
    this.FAX_EMOJI_START_TIME = 111.0; // 이 씬의 종료 시간

    this.song = song;
    this.fft = null;

    // --- randomScores.js에서 가져온 변수들 ---
    this.note_width = 16.5;
    this.note_height = this.note_width * 5 / 7;
    this.note_stem = 46;

    this.staff_num = 3;
    this.note_density = 20;
    this.inactive_note_density = 1;
    this.finale_note_density = 300;

    this.CYCLE_DURATION = 449;
    this.FINALE_DURATION = 270;
    this.NUM_STEPS = 6;
    this.STEP_DURATION = this.CYCLE_DURATION / this.NUM_STEPS;
    this.cycleStartTime = 0;
    this.shuffledStaveIndices = [];
    this.currentStaveStep = -1;
    this.lastGeneratedStep = -1;
    this.lastGeneratedQuadrant = -1;

    // --- 이전 사이클 피날레 데이터 저장용 ---
    this.previousFinaleData = null;
    this.previousFinaleStartTime = 0;

    // --- 그리드 시스템 변수 ---
    this.gridMode = 1; // 1x1 그리드만 사용
    this.quadrantData = []; // 각 그리드 칸의 악보 데이터를 저장
    this.quadrantOrder = []; // 그리드 칸을 채우는 순서
    this.currentQuadrantIndex = 0; // 현재 채우고 있는 칸의 인덱스

    this.bravuraFont = bravuraFont;
    this.BRAVURA_SYMBOLS = {
      TREBLE_CLEF: '\uE050', BASS_CLEF: '\uE062',
      WHOLE_REST: '\uE4E3', HALF_REST: '\uE4E4', QUARTER_REST: '\uE4E5', EIGHTH_REST: '\uE4E6', SIXTEENTH_REST: '\uE4E7',
      TIME_4_4: '\uE08A', TIME_3_4: '\uE089', TIME_2_4: '\uE088', TIME_C: '\uE082',
      WHOLE_NOTE: '\uE0A2', HALF_NOTE: '\uE0A3', QUARTER_NOTE: '\uE0A5', EIGHTH_NOTE: '\uE1D7', SIXTEENTH_NOTE: '\uE1D9',
      FLAT: '\uE260', SHARP: '\uE262', NATURAL: '\uE261',
      FERMATA: '\uE4C0', ACCENT: '\uE4A0', STACCATO: '\uE4A2', TENUTO: '\uE4A3',
      TRILL: '\uE566', MORDENT: '\uE56D', TURN: '\uE56C',
      CRESCENDO: '\uE530', DECRESCENDO: '\uE531',
      PEDAL_MARK: '\uE650',
      DOUBLE_BARLINE: '\uE035',
      SFZ: '\uE524',
      ARPEGGIO: '\uE630',
      SEGNO: '\uE4D0'
    };

    this.isSetupComplete = false;

    // --- 줌 아웃 애니메이션 변수 ---
    this.zoomStartTimeTrigger = 61.167;
    this.zoomDuration = 13;
    this.densityAnimationDuration = 13;
    this.zoomState = 'idle';
    this.zoomStartTime = 0;
    this.currentZoom = 1.0;
    this.targetZoom = 0.3;

    // --- 배경 악보 생성 변수 ---
    this.backgroundElements = [];
    this.initialBackgroundDensity = 30;
    this.targetBackgroundDensity = 300;
    this.initialStaffDensity = 1;
    this.targetStaffDensity = 25;

    // --- 피날레 애니메이션 변수 ---
    this.finalFinaleState = 'idle';
    this.finalFinaleStartTime = 0;
    this.finalFinaleDuration = 2200;

    // --- 80.12초 흔들림 애니메이션 변수 ---
    this.shakeAnimationStartTime = 80.12;
    this.shakeBpm = 225;
    this.shakeBeatDuration = 60000 / this.shakeBpm;
    this.lastShakeTime = 0;
    this.allShakeableElements = [];
    this.isStopped = false;

    // --- '5' 키 플래시 효과 변수 ---
    this.flashStartTime = 0;
    this.isFlashing = false;
    this.flashDuration = 200;
    this.flashTriggerTime = 80.12; // 수정: 60.12 -> 80.12
    this.flashRectangles = [];

    // --- 배경 플래시 효과 변수 ---
    this.backgroundFlashTime = 0;

    // --- 색상 반전 효과 변수 ---
    this.isInverting = false;
    this.inversionStartTime = 0;
  }

  setup() {
    this.fft = new p5.FFT(0.8, 512);
    this.amp = new p5.Amplitude();
    this.enter(); // setup 시 enter 호출하여 상태 초기화
    this.isSetupComplete = true;
  }

  enter() {
    this.zoomState = 'idle';
    this.currentZoom = 1.0;
    this.backgroundElements = [];
    this.finalFinaleState = 'idle';
    this.allShakeableElements = [];
    this.isStopped = false;
    this.isFlashing = false;
    this.flashRectangles = [];
    this.isInverting = false;
    this.inversionStartTime = 0;
    this.initializeGrid();
  }

  startNewCycle() {
    this.cycleStartTime = millis();
    this.currentStaveStep = -1;
    this.shuffledStaveIndices = [5, 4, 3, 2, 1, 0];
    this.lastGeneratedStep = -1;
    this.backgroundElements = [];
    if (this.previousFinaleData && (millis() - this.previousFinaleStartTime > this.FINALE_DURATION)) {
      this.previousFinaleData = null;
    }
    this.lastGeneratedQuadrant = -1;
  }

  initializeGrid() {
    this.gridMode = 1;
    this.quadrantData = [];
    const totalQuadrants = this.gridMode * this.gridMode;
    for (let i = 0; i < totalQuadrants; i++) {
      this.quadrantData.push(this.createEmptyQuadrantData());
    }
    this.quadrantOrder = [0];
    this.currentQuadrantIndex = 0;
    this.startNewCycle();
  }

  createEmptyQuadrantData() {
    return {
      savedNotes: [], savedBeamNotes: [], savedRests: [],
      savedTimeSignatures: [], savedClefs: [], savedSymbols: []
    };
  }

  prepareFinale() {
    const data = this.quadrantData[0];
    if (!data) return;

    const allElements = [
      ...data.savedNotes, ...data.savedBeamNotes, ...data.savedRests,
      ...data.savedTimeSignatures, ...data.savedClefs, ...data.savedSymbols
    ];

    for (const element of allElements) {
      element.finale_dx = random(0);
      element.finale_dy = random(-8000, 30);
    }

    for (const element of this.backgroundElements) {
      element.finale_dx = random(0);
      element.finale_dy = random(-8000, 30);
    }
  }

  draw() {
    if (!this.isSetupComplete) return;

    if (this.song.isPlaying()) {
      const currentTime = this.song.currentTime();
      const FADE_START_TIME = 95.0;
      const FADE_DURATION = 3.0;
      const FADE_END_TIME = FADE_START_TIME + FADE_DURATION;

      if (currentTime < FADE_START_TIME) {
        const now = millis();
        if (this.backgroundFlashTime > 0 && now - this.backgroundFlashTime < 100) {
          background(245);
        } else {
          this.backgroundFlashTime = 0;
          background(255);
        }
      } else if (currentTime >= FADE_START_TIME && currentTime < FADE_END_TIME) {
        const alpha = map(currentTime, FADE_START_TIME, FADE_END_TIME, 255, 0);
        background(random(245, 255), alpha);
      }

      if (currentTime >= this.zoomStartTimeTrigger && this.zoomState === 'idle') {
        this.zoomState = 'zooming';
        this.zoomStartTime = millis();
      }

      this.drawRandomScores();

      if (currentTime <= this.FAX_EMOJI_START_TIME + 1.0 && currentTime >= this.FAX_EMOJI_START_TIME) {
        push();
        textAlign(CENTER, CENTER);
        fill(random(245, 255));
        rect(width / 2, height / 2, windowWidth, windowHeight);
        textSize(50);
        textFont("'Apple Color Emoji', 'Segoe UI Emoji', sans-serif");
        text('🔭', width / 2, height / 2);
        pop();
      }

      if (this.isFlashing) {
        let allRectsDone = true;
        push();
        noStroke();
        rectMode(CENTER);

        this.flashRectangles.forEach(rectData => {
          const elapsed = millis() - rectData.startTime;
          const progress = constrain(elapsed / this.flashDuration, 0, 1);

          if (progress < 1) {
            allRectsDone = false;
          }

          const currentWidth = lerp(rectData.initialWidth, 0, progress);
          fill(0, 255);
          rect(rectData.x, height / 2, currentWidth, height);
        });

        if (allRectsDone) {
          this.isFlashing = false;
          this.flashRectangles = [];
        }
        pop();
      }
    }

    if (this.isInverting) {
      if (millis() - this.inversionStartTime < 100) {
        filter(INVERT);
      } else {
        this.isInverting = false;
      }
    }
  }

  drawRandomScores() {
    const currentTime = this.song.currentTime();

    if (this.isStopped) {
      const isShaking = currentTime >= this.shakeAnimationStartTime;
      if (isShaking) {
        const now = millis();
        if (now - this.lastShakeTime > this.shakeBeatDuration) {
          this.lastShakeTime = now;
          this.backgroundFlashTime = now;

          if (this.allShakeableElements.length === 0) {
            if (this.quadrantData[0]) {
              const data = this.quadrantData[0];
              this.allShakeableElements.push(...data.savedNotes, ...data.savedBeamNotes, ...data.savedRests, ...data.savedTimeSignatures, ...data.savedClefs);
            }
            this.allShakeableElements.push(...this.backgroundElements);
            this.allShakeableElements.forEach(el => {
              el.currentShakeOffsetX = 0;
              el.targetShakeOffsetX = 0;
              el.currentShakeOffsetY = 0;
              el.targetShakeOffsetY = 0;
              el.finale_dx = 0;
              el.finale_dy = 0;
            });
          }

          if (this.allShakeableElements.length > 0) {
            const shuffled = shuffle(this.allShakeableElements);
            const numToShake = floor(shuffled.length * 0.5);
            for (let i = 0; i < numToShake; i++) {
              const elementToShake = shuffled[i];
              if (random() < 0.5) {
                elementToShake.targetShakeOffsetX = elementToShake.currentShakeOffsetX + random(-800, 800);
                elementToShake.targetShakeOffsetY = elementToShake.currentShakeOffsetY;
              } else {
                elementToShake.targetShakeOffsetX = elementToShake.currentShakeOffsetX;
                elementToShake.targetShakeOffsetY = elementToShake.currentShakeOffsetY + random(-800, 800);
              }
            }
          }
        }
      }

      this.drawGrid(this.quadrantData, this.gridMode, 0, -1, false, -1, isShaking);
      return;
    }

    if (this.finalFinaleState === 'running') {
      let elapsed = millis() - this.finalFinaleStartTime;
      if (elapsed < this.finalFinaleDuration) {
        let finaleAlpha = map(elapsed, 0, this.finalFinaleDuration, 255, 0);
        this.drawGrid(this.quadrantData, this.gridMode, 0, elapsed, false, finaleAlpha);
      } else {
        this.finalFinaleState = 'done';
      }
      return;
    }

    if (this.finalFinaleState === 'done') {
      this.drawGrid(this.quadrantData, this.gridMode, 0, -1, true);
      return;
    }

    let elapsedTime = millis() - this.cycleStartTime;

    if (elapsedTime >= this.CYCLE_DURATION + 160) {
      this.previousFinaleData = { ...this.quadrantData[0] };
      this.previousFinaleStartTime = this.cycleStartTime + this.CYCLE_DURATION;
      this.startNewCycle();
      elapsedTime = millis() - this.cycleStartTime;
    }

    if (elapsedTime < this.CYCLE_DURATION) {
      let step = floor(elapsedTime / this.STEP_DURATION);
      if (step < this.NUM_STEPS && step !== this.currentStaveStep) {
        this.currentStaveStep = step;
        let staveToDrawOn = this.shuffledStaveIndices[this.currentStaveStep];
        const quadrantIdx = 0;
        if (this.currentStaveStep === 0) {
          this.quadrantData[quadrantIdx] = this.createEmptyQuadrantData();
        }
        this.generateElementsForStave(staveToDrawOn, quadrantIdx);

        if (this.zoomState !== 'idle') {
          this.generateBackgroundElements();
        }

        if (currentTime > 77.5 && step === this.NUM_STEPS - 1) {
          this.isStopped = true;
          this.lastShakeTime = millis();
          this.drawGrid(this.quadrantData, this.gridMode);
          return;
        }
      }
      this.drawGrid(this.quadrantData, this.gridMode);

    } else {
      if (this.currentStaveStep !== -2) {
        this.prepareFinale();
        this.currentStaveStep = -2;

        if (currentTime > 97.292 && this.finalFinaleState === 'idle') {
          this.finalFinaleState = 'running';
          this.finalFinaleStartTime = millis();
          return;
        }
      }

      let finaleElapsedTime = elapsedTime - this.CYCLE_DURATION;
      this.drawGrid(this.quadrantData, this.gridMode, 0, finaleElapsedTime);
    }

    if (this.previousFinaleData) {
      let prevFinaleElapsedTime = millis() - this.previousFinaleStartTime;
      this.drawGrid([this.previousFinaleData], this.gridMode, 0, prevFinaleElapsedTime);
    }
  }

  drawGrid(quadrantData, gridMode, globalXOffset = 0, finaleElapsedTime = -1, staffOnly = false, overrideAlpha = -1, isShaking = false) {
    const scaleFactor = 1.0 / gridMode;
    const sizeMultiplier = scaleFactor;

    const isFinale = finaleElapsedTime >= 0;
    let finaleAlpha = isFinale ? map(finaleElapsedTime, 0, this.FINALE_DURATION, 255, 0) : 255;
    if (overrideAlpha !== -1) finaleAlpha = overrideAlpha;

    if (this.zoomState === 'zooming') {
      let elapsed = (millis() - this.zoomStartTime) / 1000;
      let progress = constrain(elapsed / this.zoomDuration, 0, 1);
      this.currentZoom = lerp(1.0, this.targetZoom, progress);
      if (progress >= 1) {
        this.zoomState = 'done';
        this.currentZoom = this.targetZoom;
      }
    }

    if (!staffOnly) {
      this.drawBackgroundElements(finaleAlpha, this.currentZoom, finaleElapsedTime, isShaking);
    }

    push();
    translate(width / 2, height / 2);
    scale(this.currentZoom);
    translate(-width / 2, -height / 2);

    const data = quadrantData[0];
    if (staffOnly) {
      this.drawScoreElements(null, finaleElapsedTime, finaleAlpha, sizeMultiplier, staffOnly, isShaking);
    } else if (data) {
      this.drawScoreElements(data, finaleElapsedTime, finaleAlpha, sizeMultiplier, staffOnly, isShaking);
    }
    pop();
  }

  generateElementsForStave(staveIndex, quadrantIdx) {
    const data = this.quadrantData[quadrantIdx];

    const staveYPositions = [
      100 + 0 * this.note_height * 25, 100 + this.note_height * 10 + 0 * this.note_height * 25,
      100 + 1 * this.note_height * 25, 100 + this.note_height * 10 + 1 * this.note_height * 25,
      100 + 2 * this.note_height * 25, 100 + this.note_height * 10 + 2 * this.note_height * 25,
    ];
    const currentStaveY = staveYPositions[staveIndex];

    const scene2StartTime = 60.167;
    const currentTime = this.song.currentTime();
    const scene2EndTime = scene2StartTime + this.densityAnimationDuration;
    const progress = constrain(map(currentTime, scene2StartTime, scene2EndTime, 0, 1), 0, 1);
    const density = lerp(this.initialStaffDensity, this.targetStaffDensity, progress);

    for (let i = 0; i < density; i++) {
      data.savedNotes.push({ type: 'whole', x: random(width), y: currentStaveY + random(-3 * this.note_height, 3 * this.note_height), barChance: random(), dotChance: random() });
      data.savedNotes.push({ type: 'half', x: random(width), y: currentStaveY + random(-3 * this.note_height, 3 * this.note_height), isRotated: random() < 0.5, barChance: random(), dotChance: random() });
      data.savedNotes.push({ type: 'quarter', x: random(width), y: currentStaveY + random(-3 * this.note_height, 3 * this.note_height), isRotated: random() < 0.5, barChance: random(), dotChance: random() });

      let beamNote = new BeamNote(0, 0, this.note_height);
      data.savedBeamNotes.push({ beamNote: beamNote, x: random(width), y: currentStaveY + random(-3 * this.note_height, 3 * this.note_height), isRotated: random() >= 0.5 });

      data.savedRests.push({ type: 'whole', x: random(width), y: currentStaveY + random(-3 * this.note_height, 3 * this.note_height) });
      data.savedRests.push({ type: 'half', x: random(width), y: currentStaveY + random(-3 * this.note_height, 3 * this.note_height) });
      data.savedRests.push({ type: 'quarter', x: random(width), y: currentStaveY + random(-3 * this.note_height, 3 * this.note_height) });
      data.savedRests.push({ type: 'eighth', x: random(width), y: currentStaveY + random(-3 * this.note_height, 3 * this.note_height) });
      data.savedRests.push({ type: 'sixteenth', x: random(width), y: currentStaveY + random(-3 * this.note_height, 3 * this.note_height) });

      data.savedTimeSignatures.push({ type: '44', x: random(width), y: currentStaveY + random(-3 * this.note_height, 3 * this.note_height) });
      data.savedTimeSignatures.push({ type: '68', x: random(width), y: currentStaveY + random(-3 * this.note_height, 3 * this.note_height) });

      const symbolTypes = Object.keys(this.BRAVURA_SYMBOLS).filter(key => ![
        'TREBLE_CLEF', 'BASS_CLEF', 'WHOLE_REST', 'HALF_REST', 'QUARTER_REST', 'EIGHTH_REST', 'SIXTEENTH_REST',
        'TIME_4_4', 'TIME_3_4', 'TIME_2_4', 'TIME_C', 'WHOLE_NOTE', 'HALF_NOTE', 'QUARTER_NOTE', 'EIGHTH_NOTE', 'SIXTEENTH_NOTE'
      ].includes(key));

      if (random() < 0.3) {
        const randomSymbolKey = random(symbolTypes);
        data.savedSymbols.push({
          type: randomSymbolKey,
          x: random(width),
          y: currentStaveY + random(-3 * this.note_height, 3 * this.note_height)
        });
      }

      data.savedNotes.push({ type: 'eighth', x: random(width), y: currentStaveY + random(-3 * this.note_height, 3 * this.note_height) });
      data.savedNotes.push({ type: 'sixteenth', x: random(width), y: currentStaveY + random(-3 * this.note_height, 3 * this.note_height) });
    }

    if (density > 0) {
      if (random() < 0.5) {
        data.savedClefs.push({ type: 'treble', x: 63, y: currentStaveY + random(-2 * this.note_height, 2 * this.note_height) });
      } else {
        data.savedClefs.push({ type: 'bass', x: 63, y: currentStaveY + random(-2 * this.note_height, 2 * this.note_height) });
      }
    }
  }

  generateBackgroundElements() {
    const scene2StartTime = 60.167;
    const currentTime = this.song.currentTime();
    const scene2EndTime = scene2StartTime + this.densityAnimationDuration;
    const progress = constrain(map(currentTime, scene2StartTime, scene2EndTime, 0, 1), 0, 1);
    const currentTotalDensity = lerp(this.initialBackgroundDensity, this.targetBackgroundDensity, progress);

    const density = currentTotalDensity / this.NUM_STEPS;
    for (let i = 0; i < density; i++) {
      const x = random(width);
      const y = random(height);
      const typeRoll = random();

      let newElement = { x, y, finale_dx: 0, finale_dy: 0 };

      if (typeRoll < 0.25) {
        const noteTypeRoll = random();
        let noteType;
        if (noteTypeRoll < 0.25) noteType = 'whole';
        else if (noteTypeRoll < 0.5) noteType = 'half';
        else if (noteTypeRoll < 0.75) noteType = 'quarter';
        else if (noteTypeRoll < 0.875) noteType = 'eighth';
        else noteType = 'sixteenth';
        newElement.type = 'note';
        newElement.subType = noteType;
        newElement.isRotated = random() < 0.5;
        newElement.barChance = random();
        newElement.dotChance = random();
      } else if (typeRoll < 0.5) {
        const restTypeRoll = random();
        let restType;
        if (restTypeRoll < 0.25) restType = 'whole';
        else if (restTypeRoll < 0.5) restType = 'half';
        else if (restTypeRoll < 0.75) restType = 'quarter';
        else restType = 'eighth';
        newElement.type = 'rest';
        newElement.subType = restType;
      } else if (typeRoll < 0.65) {
        const clefType = random() < 0.5 ? 'treble' : 'bass';
        newElement.type = 'clef';
        newElement.subType = clefType;
      } else if (typeRoll < 0.8) {
        const symbolTypes = Object.keys(this.BRAVURA_SYMBOLS).filter(key => ![
          'TREBLE_CLEF', 'BASS_CLEF', 'WHOLE_REST', 'HALF_REST', 'QUARTER_REST', 'EIGHTH_REST', 'SIXTEENTH_REST',
          'TIME_4_4', 'TIME_3_4', 'TIME_2_4', 'TIME_C', 'WHOLE_NOTE', 'HALF_NOTE', 'QUARTER_NOTE', 'EIGHTH_NOTE', 'SIXTEENTH_NOTE'
        ].includes(key));
        const randomSymbolKey = random(symbolTypes);
        newElement.type = 'symbol';
        newElement.subType = randomSymbolKey;
      } else {
        newElement.type = 'beam';
        newElement.beamNote = new BeamNote(x, y, this.note_height);
      }
      this.backgroundElements.push(newElement);
    }
  }

  drawBackgroundElements(alpha, zoomFactor = 1.0, finaleElapsedTime = -1, isShaking = false) {
    const isFinale = finaleElapsedTime >= 0;
    const now = millis();

    this.backgroundElements.forEach(el => {
      let x = el.x;
      let y = el.y;
      if (isShaking) {
        el.currentShakeOffsetX = lerp(el.currentShakeOffsetX, el.targetShakeOffsetX, 0.1);
        el.currentShakeOffsetY = lerp(el.currentShakeOffsetY, el.targetShakeOffsetY, 0.1);
        x += el.currentShakeOffsetX;
        y += el.currentShakeOffsetY;
      }

      if (isFinale) {
        const moveProgress = finaleElapsedTime / this.FINALE_DURATION;
        x += el.finale_dx * moveProgress;
        y += el.finale_dy * moveProgress;
      }

      const size = 1.0 * zoomFactor;
      if (el.type === 'note') {
        if (el.subType === 'eighth' || el.subType === 'sixteenth') {
          this['draw' + el.subType.charAt(0).toUpperCase() + el.subType.slice(1) + 'Note'](x, y, 53, alpha, size);
        } else if (el.subType === 'whole') {
          this.wholeNote(x, y, el.barChance, el.dotChance, alpha, size);
        } else {
          this[el.subType + 'Note'](x, y, el.isRotated, el.barChance, el.dotChance, alpha, size);
        }
      } else if (el.type === 'rest') {
        this['draw' + el.subType.charAt(0).toUpperCase() + el.subType.slice(1) + 'Rest'](x, y, 30, alpha, size);
      } else if (el.type === 'clef') {
        this['draw' + el.subType.charAt(0).toUpperCase() + el.subType.slice(1) + 'Clef'](x, y, 50, alpha, size);
      } else if (el.type === 'beam') {
        el.beamNote.display(x, y, alpha, size, this.note_height);
      } else if (el.type === 'symbol') {
        this['draw' + el.subType.charAt(0).toUpperCase() + el.subType.slice(1).toLowerCase()](x, y, 30, alpha, size);
      }
    });
  }

  drawScoreElements(data, finaleElapsedTime, finaleAlpha, sizeMultiplier, staffOnly = false, isShaking = false) {
    const isFinale = finaleElapsedTime >= 0;

    const allStaffYPositions = [];
    for (let j = 0; j < this.staff_num; j++) {
      allStaffYPositions.push(100 + j * this.note_height * 25);
      allStaffYPositions.push(100 + this.note_height * 10 + j * this.note_height * 25);
    }
    allStaffYPositions.forEach(yPos => this.drawStaff(yPos, 255));

    strokeWeight(4);
    stroke(0, 255);
    let startX = 50;
    let endX = width - 50;
    for (let j = 0; j < this.staff_num; j++) {
      let y1_top = 100 + j * this.note_height * 25 - 2 * this.note_height;
      let y2_bottom = 100 + this.note_height * 10 + j * this.note_height * 25 + 2 * this.note_height;
      line(startX, y1_top, startX, y2_bottom);
      line(endX, y1_top, endX, y2_bottom);
    }

    if (staffOnly) return;

    const drawElement = (element, drawFunc) => {
      let x = element.x;
      let y = element.y;
      if (isFinale) {
        const moveProgress = finaleElapsedTime / 1000;
        x += element.finale_dx * moveProgress;
        y += element.finale_dy * moveProgress;
      } else if (isShaking) {
        element.currentShakeOffsetX = lerp(element.currentShakeOffsetX, element.targetShakeOffsetX, 0.1);
        element.currentShakeOffsetY = lerp(element.currentShakeOffsetY, element.targetShakeOffsetY, 0.1);
        x += element.currentShakeOffsetX;
        y += element.currentShakeOffsetY;
      }
      drawFunc(x, y);
    };

    data.savedNotes.forEach(note => drawElement(note, (x, y) => {
      switch (note.type) {
        case 'whole': this.wholeNote(x, y, note.barChance, note.dotChance, finaleAlpha, sizeMultiplier); break;
        case 'half': this.halfNote(x, y, note.isRotated, note.barChance, note.dotChance, finaleAlpha, sizeMultiplier); break;
        case 'quarter': this.quarterNote(x, y, note.isRotated, note.barChance, note.dotChance, finaleAlpha, sizeMultiplier); break;
        case 'eighth': this.drawEighthNote(x, y, 53, finaleAlpha, sizeMultiplier); break;
        case 'sixteenth': this.drawSixteenthNote(x, y, 53, finaleAlpha, sizeMultiplier); break;
      }
    }));

    data.savedBeamNotes.forEach(beamData => drawElement(beamData, (x, y) => {
      if (beamData.isRotated) { push(); translate(x, y); rotate(PI); beamData.beamNote.display(0, 0, finaleAlpha, sizeMultiplier, this.note_height); pop(); }
      else { beamData.beamNote.display(x, y, finaleAlpha, sizeMultiplier, this.note_height); }
    }));

    data.savedRests.forEach(rest => drawElement(rest, (x, y) => {
      this['draw' + rest.type.charAt(0).toUpperCase() + rest.type.slice(1) + 'Rest'](x, y, 30, finaleAlpha, sizeMultiplier);
    }));

    data.savedTimeSignatures.forEach(timeSig => drawElement(timeSig, (x, y) => {
      this['drawTimeSignature' + timeSig.type](x, y, 30, finaleAlpha, sizeMultiplier);
    }));

    data.savedClefs.forEach(clef => drawElement(clef, (x, y) => {
      this['draw' + clef.type.charAt(0).toUpperCase() + clef.type.slice(1) + 'Clef'](x, y, 30, finaleAlpha, sizeMultiplier);
    }));

    data.savedSymbols.forEach(symbol => drawElement(symbol, (x, y) => {
      this['draw' + symbol.type.charAt(0).toUpperCase() + symbol.type.slice(1).toLowerCase()](x, y, 30, finaleAlpha, sizeMultiplier);
    }));
  }

  wholeNote(x, y, barChance, dotChance, alpha = 255, sizeMultiplier = 1.0) {
    this.drawNoteWithBravura(this.BRAVURA_SYMBOLS.WHOLE_NOTE, x, y, 53, alpha, sizeMultiplier);
  }
  halfNote(x, y, isRotated, barChance, dotChance, alpha = 255, sizeMultiplier = 1.0) {
    this.drawNoteWithBravura(this.BRAVURA_SYMBOLS.HALF_NOTE, x, y, 53, alpha, sizeMultiplier);
  }
  quarterNote(x, y, isRotated, barChance, dotChance, alpha = 255, sizeMultiplier = 1.0) {
    this.drawNoteWithBravura(this.BRAVURA_SYMBOLS.QUARTER_NOTE, x, y, 53, alpha, sizeMultiplier);
  }

  drawNoteWithBravura(symbol, x, y, size = 53, alpha = 255, sizeMultiplier = 1.0) {
    if (this.bravuraFont) {
      textFont(this.bravuraFont);
    }
    textAlign(CENTER, CENTER);
    textSize(size * sizeMultiplier);
    noStroke();
    fill(0, alpha);
    text(symbol, x, y);
  }

  drawStaff(y, alpha = 255) { stroke(0, alpha); strokeWeight(1); let startX = 50; let endX = width - 50; let lineSpacing = this.note_height; for (let i = 0; i < 5; i++) { let y1 = y - (2 * lineSpacing) + (i * lineSpacing); line(startX, y1, endX, y1); } }
  drawTrebleClef(x, y, size = 50, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.TREBLE_CLEF, x, y); }
  drawBassClef(x, y, size = 50, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.BASS_CLEF, x, y); }
  drawWholeRest(x, y, size = 20, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.WHOLE_REST, x, y); }
  drawHalfRest(x, y, size = 20, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.HALF_REST, x, y); }
  drawQuarterRest(x, y, size = 20, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.QUARTER_REST, x, y); }
  drawEighthRest(x, y, size = 20, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.EIGHTH_REST, x, y); }
  drawSixteenthRest(x, y, size = 20, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.SIXTEENTH_REST, x, y); }
  drawTimeSignature44(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.TIME_4_4, x, y); }
  drawTimeSignature68(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.TIME_6_8, x, y); }
  drawFlat(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.FLAT, x, y); }
  drawSharp(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.SHARP, x, y); }
  drawNatural(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.NATURAL, x, y); }
  drawFermata(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.FERMATA, x, y); }
  drawAccent(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.ACCENT, x, y); }
  drawStaccato(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.STACCATO, x, y); }
  drawTenuto(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.TENUTO, x, y); }
  drawTrill(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.TRILL, x, y); }
  drawMordent(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.MORDENT, x, y); }
  drawTurn(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.TURN, x, y); }
  drawCrescendo(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.CRESCENDO, x, y); }
  drawDecrescendo(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.DECRESCENDO, x, y); }
  drawPedal_mark(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.PEDAL_MARK, x, y); }
  drawDouble_barline(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.DOUBLE_BARLINE, x, y); }
  drawSfz(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.SFZ, x, y); }
  drawArpeggio(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.ARPEGGIO, x, y); }
  drawSegno(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.SEGNO, x, y); }
  drawTime_c(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.TIME_C, x, y); }
  drawEighthNote(x, y, size = 20, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.EIGHTH_NOTE, x, y); }
  drawSixteenthNote(x, y, size = 20, alpha = 255, sizeMultiplier = 1.0) { if (this.bravuraFont) { textFont(this.bravuraFont); } textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(this.BRAVURA_SYMBOLS.SIXTEENTH_NOTE, x, y); }

  keyPressed() {
    if (key === ' ') {
      if (this.song.isPlaying()) {
        this.pauseStartTime = millis();
        this.song.pause();
      } else {
        if (this.isSetupComplete && this.pauseStartTime) {
          this.cycleStartTime += millis() - this.pauseStartTime;
        }
        this.song.play();
      }
    } else if (key === '5') {
      const currentTime = this.song.currentTime();
      if (currentTime >= this.flashTriggerTime && !this.isFlashing) {
        this.isFlashing = true;
        this.flashStartTime = millis();

        this.flashRectangles = [];
        const numRects = random(200, 290);
        for (let i = 0; i < numRects; i++) {
          const initialWidth = random(0.1, 3);
          const x = random(width);

          this.flashRectangles.push({
            x: x,
            initialWidth: initialWidth,
            startTime: millis(),
          });
        }
      }
    } else if (key === '6') {
      this.isInverting = true;
      this.inversionStartTime = millis();
    }
  }
}

class BeamNote {
  constructor(x = 0, y = 0, note_height) {
    this.x = x;
    this.y = y;
    this.note_height = note_height;
    this.notes = [];
    this.column1Notes = [];
    this.column2Notes = [];
    this.beamCount = 0;
    this.isRotated = false;
    this.columnSpacing = random(30, 150);
    this.generateNotes();
  }

  generateNotes() {
    let noteCount1 = random() < 0.7 ? 1 : 2;
    if (noteCount1 === 1) {
      let noteY = this.y + random(-30, 30);
      this.column1Notes.push({ x: this.x, y: noteY, stemDirection: 1 });
    } else {
      let firstNoteY = this.y + random(-20, 20);
      let secondNoteY = firstNoteY + this.note_height + random(0, 35);
      this.column1Notes.push({ x: this.x, y: firstNoteY, stemDirection: 1 });
      this.column1Notes.push({ x: this.x, y: secondNoteY, stemDirection: 1 });
    }

    let noteCount2 = random() < 0.5 ? 1 : 2;
    if (noteCount2 === 1) {
      let noteY = this.y + random(-40, 40);
      this.column2Notes.push({ x: this.x + this.columnSpacing, y: noteY, stemDirection: 1 });
    } else {
      let firstNoteY = this.y + random(-30, 30);
      let secondNoteY = firstNoteY + this.note_height + random(0, 35);
      this.column2Notes.push({ x: this.x + this.columnSpacing, y: firstNoteY, stemDirection: 1 });
      this.column2Notes.push({ x: this.x + this.columnSpacing, y: secondNoteY, stemDirection: 1 });
    }

    let beamProb = random();
    if (beamProb < 0.5) this.beamCount = 1;
    else if (beamProb < 0.8) this.beamCount = 2;
    else if (beamProb < 1) this.beamCount = 3;
    else this.beamCount = 0;
  }

  display(drawX = this.x, drawY = this.y, alpha = 255, sizeMultiplier = 1.0, note_height) {
    const note_width = 16.5;
    const note_stem = 46;

    stroke(0, alpha);

    push();
    translate(drawX - this.x, drawY - this.y);

    let allNotes = [...this.column1Notes, ...this.column2Notes];
    let column1StemEnds = this.column1Notes.map(note => note.y + (note.stemDirection * note_stem * sizeMultiplier));
    let column2StemEnds = this.column2Notes.map(note => note.y + (note.stemDirection * note_stem * sizeMultiplier));
    let maxStem1 = column1StemEnds.length > 0 ? max(column1StemEnds) : 0;
    let maxStem2 = column2StemEnds.length > 0 ? max(column2StemEnds) : 0;

    [...this.column1Notes, ...this.column2Notes].forEach(note => {
      this.drawNoteHead(note.x, note.y, alpha, sizeMultiplier, note_width, note_height);
    });

    this.column1Notes.forEach(note => {
      this.drawStem(note.x, note.y, note.stemDirection, alpha, sizeMultiplier, note_width, maxStem1);
    });
    this.column2Notes.forEach(note => {
      this.drawStem(note.x, note.y, note.stemDirection, alpha, sizeMultiplier, note_width, maxStem2);
    });

    if (this.beamCount > 0) {
      this.drawBeams(alpha, sizeMultiplier, note_width, maxStem1, maxStem2);
    }

    pop();
  }

  drawNoteHead(x, y, alpha, sizeMultiplier, note_width, note_height) {
    push();
    translate(x, y);
    rotate(-PI / 8);
    fill(0, alpha);
    ellipse(0, 0, note_width * sizeMultiplier * 0.85, note_height * sizeMultiplier * 0.85);
    pop();
  }

  drawStem(x, y, direction, alpha, sizeMultiplier, note_width, beamY) {
    strokeWeight(1.6 * sizeMultiplier);
    stroke(0, alpha);
    line(x - (note_width / 2 * sizeMultiplier) + (0.3 * sizeMultiplier), y, x - (note_width / 2 * sizeMultiplier), beamY);
  }

  drawBeams(alpha, sizeMultiplier, note_width, beamY1, beamY2) {
    let allNotes = [...this.column1Notes, ...this.column2Notes];

    for (let i = 0; i < this.beamCount; i++) {
      let beamStartX = min(allNotes.map(note => note.x)) - (note_width / 2 * sizeMultiplier);
      let beamEndX = max(allNotes.map(note => note.x)) - (note_width / 2 * sizeMultiplier);
      let beamThickness = 3 * sizeMultiplier;
      fill(0, alpha);
      noStroke();
      quad(beamStartX, beamY1, beamStartX, beamY1 + beamThickness, beamEndX, beamY2 + beamThickness, beamEndX, beamY2);
      beamY1 -= 7 * sizeMultiplier;
      beamY2 -= 7 * sizeMultiplier;
    }
  }
}