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
    this.targetBackgroundDensity = 200;
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
    this.flashTriggerTime = 60.12; // 수정: 60.12 -> 80.12
    this.flashRectangles = [];

    // --- 배경 플래시 효과 변수 ---
    this.backgroundFlashTime = 0;

    // --- highMid 기반 배경 분할 플래시 효과 변수 ---
    this.highMidThreshold = 70;
    this.lastHighMidValue = 0;
    this.splitFlashes = []; // { side, startTime, duration, color }
    this.splitFlashDuration1 = 50; // 왼쪽 플래시 지속 시간 (0.1초)
    this.splitFlashDuration2 = 50; // 오른쪽 플래시 지속 시간 (0.1초)
    this.lastSplitFlashTime = 0; // 마지막 플래시 트리거 시간
    this.splitFlashCooldown = 200; // 플래시 간 최소 간격 (0.2초)

    this.clickedSymbols = []; // { x, y, symbol, size, alpha, color, isSoaring, soarStartTime }
    this.soarDuration = 700; // 솟구치는 애니메이션 지속 시간 (1.5초)
    this.soarDistance = 800; // 솟구치는 거리
    this.soarAllTriggered = false; // 80.12초에 모든 기호를 솟구치게 하는 트리거 플래그
    this.scoreBuffer = null; // 오프스크린 버퍼

    // --- 오선지 색상 변경 효과 변수 ---
    this.staffColorChangeActive = false;
    this.staffColorChangeStartTime = 0;
    this.staffColorChangeDuration = 200; // 0.2초
    this.randomStaffColor = null;
  }

  setup() {
    this.fft = new p5.FFT(0.8, 512);
    this.amp = new p5.Amplitude();
    this.scoreBuffer = createGraphics(width, height); // 버퍼 생성
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
    this.lastHighMidValue = 0;
    this.splitFlashes = [];
    this.lastSplitFlashTime = 0;
    this.initializeGrid();
    this.clickedSymbols = []; // 씬 진입 시 클릭된 기호 배열 초기화
    this.soarAllTriggered = false; // 씬 진입 시 트리거 플래그 리셋
    this.staffColorChangeActive = false; // 씬 진입 시 색상 변경 상태 리셋

    if (this.scoreBuffer) {
      this.scoreBuffer.clear();
    }
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
      element.finale_dy = random(-5000, 30);
    }

    for (const element of this.backgroundElements) {
      element.finale_dx = random(0);
      element.finale_dy = random(-5000, 30);
    }

    // 피날레가 시작될 때 필터 효과를 트리거합니다.
    document.body.classList.add('scene2-filter-active');
    // 100ms 후에 클래스를 제거하여 효과를 해제합니다.
    setTimeout(() => {
      document.body.classList.remove('scene2-filter-active');
    }, 100);
  }

  updateScoreBuffer(quadrantIdx) {
    if (!this.scoreBuffer) return;
    this.scoreBuffer.clear();
    // 1x1 mode assumes quadrantIdx 0
    const data = this.quadrantData[quadrantIdx];
    if (data) {
      this.drawScoreElements(data, -1, 255, 1.0, false, false, this.scoreBuffer);
    }
  }

  draw() {
    console.log(this.fft.getEnergy("highMid"));
    if (!this.isSetupComplete) return;

    if (this.song.isPlaying()) {
      const currentTime = this.song.currentTime();
      this.fft.analyze();
      const highMidValue = this.fft.getEnergy("highMid");

      // --- 80.12초에 모든 기호 솟구침 트리거 ---
      if (currentTime >= 80.12 && !this.soarAllTriggered) {
        const now = millis();
        this.clickedSymbols.forEach(symbol => {
          if (!symbol.isSoaring) {
            symbol.isSoaring = true;
            symbol.soarStartTime = now;
          }
        });
        this.soarAllTriggered = true; // 한 번만 실행되도록 플래그 설정
      }


      // --- highMid 기반 배경 분할 플래시 트리거 ---
      if (currentTime < 80.12) {
        const now = millis();
        if (this.lastHighMidValue < this.highMidThreshold && highMidValue >= this.highMidThreshold && now - this.lastSplitFlashTime > this.splitFlashCooldown) {
          this.lastSplitFlashTime = now; // 마지막 트리거 시간 업데이트

          // 왼쪽 플래시
          this.splitFlashes.push({
            side: 'left',
            startTime: now,
            duration: this.splitFlashDuration1,
            color: color(random(255), random(255), random(255))
          });
          // 0.1초 후 오른쪽 플래시
          this.splitFlashes.push({
            side: 'right',
            startTime: now + this.splitFlashDuration1,
            duration: this.splitFlashDuration2,
            color: color(random(255), random(255), random(255))
          });

          // --- 클릭된 기호 솟구침 트리거 ---
          this.clickedSymbols.forEach(symbol => {
            if (!symbol.isSoaring) {
              symbol.isSoaring = true;
              symbol.soarStartTime = now;
            }
          });
        }
      }
      this.lastHighMidValue = highMidValue;
      const FADE_START_TIME = 96.0;
      const FADE_DURATION = 6.0;
      const FADE_END_TIME = FADE_START_TIME + FADE_DURATION;

      if (currentTime < FADE_START_TIME) {
        const now = millis();
        if (this.backgroundFlashTime > 0 && now - this.backgroundFlashTime < 100) {
          background(240);
        } else {
          this.backgroundFlashTime = 0;
          background(255);
        }
      } else if (currentTime >= FADE_START_TIME && currentTime < FADE_END_TIME) {
        const alpha = map(currentTime, FADE_START_TIME, FADE_END_TIME, 255, 0);
        background(random(245, 255), alpha);
      }

      // --- 배경 분할 플래시 그리기 ---
      if (this.splitFlashes.length > 0) {
        const now = millis();
        this.splitFlashes = this.splitFlashes.filter(flash => now < flash.startTime + flash.duration);

        push();
        noStroke();
        rectMode(CORNER);
        this.splitFlashes.forEach(flash => {
          if (now >= flash.startTime) {
            fill(flash.color);
            if (flash.side === 'left') {
              rect(0, random(height), width, height / random(5, 40));
            } else { // 'right'
              rect(0, random(height), width, height / random(20, 100));
            }
          }
        });
        pop();
      }

      if (currentTime >= this.zoomStartTimeTrigger && this.zoomState === 'idle') {
        this.zoomState = 'zooming';
        this.zoomStartTime = millis();
      }

      this.drawRandomScores();

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

      // --- 클릭으로 생성된 기호 그리기 및 애니메이션 ---
      if (this.clickedSymbols.length > 0) {
        const now = millis();
        push();
        textFont(this.bravuraFont);
        textAlign(CENTER, CENTER);

        // 사라진 기호들을 배열에서 제거합니다.
        this.clickedSymbols = this.clickedSymbols.filter(symbol => {
          if (symbol.isSoaring) {
            return now - symbol.soarStartTime < this.soarDuration;
          }
          return true; // 아직 솟구치지 않은 기호는 유지
        });

        this.clickedSymbols.forEach(symbol => {
          let currentY = symbol.y;
          let currentAlpha = symbol.alpha;

          if (symbol.isSoaring) {
            const elapsed = now - symbol.soarStartTime;
            const progress = constrain(elapsed / this.soarDuration, 0, 1);
            const easedProgress = 1 - pow(1 - progress, 3); // Ease-Out Cubic

            // y좌표는 위로, 알파는 0으로
            currentY = lerp(symbol.y, symbol.y - this.soarDistance, easedProgress);
            currentAlpha = lerp(255, 0, progress);
          }

          // 저장된 랜덤 색상에 계산된 투명도를 적용합니다.
          symbol.color.setAlpha(currentAlpha);
          fill(symbol.color);
          textSize(symbol.size);
          text(symbol.symbol, symbol.x, currentY);
        });
        pop();
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
              if (this.shakeAxisIsX) {
                elementToShake.targetShakeOffsetX = elementToShake.currentShakeOffsetX + random(-700, 700);
                elementToShake.targetShakeOffsetY = elementToShake.currentShakeOffsetY;
              } else {
                elementToShake.targetShakeOffsetX = elementToShake.currentShakeOffsetX;
                elementToShake.targetShakeOffsetY = elementToShake.currentShakeOffsetY + random(-700, 700);
              }
            }
            // 다음 비트를 위해 축을 토글합니다.
            this.shakeAxisIsX = !this.shakeAxisIsX;
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

        // --- Update Buffer Here ---
        this.updateScoreBuffer(quadrantIdx);

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
      let originalX = el.x;
      let originalY = el.y;
      let x = originalX;
      let y = originalY;

      // --- 줌 아웃 효과 적용 ---
      // 줌 배율에 따라 화면 중앙을 기준으로 좌표를 보정합니다.
      if (zoomFactor !== 1.0) {
        x = lerp(width / 2, originalX, zoomFactor);
        y = lerp(height / 2, originalY, zoomFactor);
      }

      if (isShaking) {
        el.currentShakeOffsetX = lerp(el.currentShakeOffsetX, el.targetShakeOffsetX, 0.1);
        el.currentShakeOffsetY = lerp(el.currentShakeOffsetY, el.targetShakeOffsetY, 0.1);
        x += el.currentShakeOffsetX;
        y += el.currentShakeOffsetY;
      }

      if (isFinale) {
        // 첫 80ms 동안 y축으로 -50px 이동
        if (finaleElapsedTime < 80) {
          const progress = finaleElapsedTime / 80;
          y += 400 * progress; // 80ms에 걸쳐 -50px까지 이동
        } else {
          // 80ms 이후: -50px 위치에서부터 기존 finale 애니메이션 시작
          y += 400; // -50px 위치 고정
          // 남은 시간 동안 finale 애니메이션 진행
          const remainingDuration = this.FINALE_DURATION - 80;
          const moveProgress = (finaleElapsedTime - 80) / remainingDuration;
          x += el.finale_dx * moveProgress;
          y += el.finale_dy * moveProgress;
        }
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

  drawScoreElements(data, finaleElapsedTime, finaleAlpha, sizeMultiplier, staffOnly = false, isShaking = false, pg = null) {
    const isFinale = finaleElapsedTime >= 0;

    // --- 오선지 색상 결정 로직 ---
    let staffColor = color(0, finaleAlpha); // 기본 검은색
    if (this.staffColorChangeActive) {
      const elapsed = millis() - this.staffColorChangeStartTime;
      if (elapsed < this.staffColorChangeDuration) {
        staffColor = this.randomStaffColor;
        staffColor.setAlpha(finaleAlpha); // 투명도 적용
      } else {
        this.staffColorChangeActive = false; // 0.2초 지나면 비활성화
      }
    }
    const allStaffYPositions = [];
    for (let j = 0; j < this.staff_num; j++) {
      allStaffYPositions.push(100 + j * this.note_height * 25);
      allStaffYPositions.push(100 + this.note_height * 10 + j * this.note_height * 25);
    }
    allStaffYPositions.forEach(yPos => this.drawStaff(yPos, staffColor, pg));

    // Staves lines logic
    if (pg) { pg.strokeWeight(4); pg.stroke(staffColor); } else { strokeWeight(4); stroke(staffColor); }
    let startX = 50;
    let endX = width - 50;
    for (let j = 0; j < this.staff_num; j++) {
      let y1_top = 100 + j * this.note_height * 25 - 2 * this.note_height;
      let y2_bottom = 100 + this.note_height * 10 + j * this.note_height * 25 + 2 * this.note_height;
      if (pg) { pg.line(startX, y1_top, startX, y2_bottom); pg.line(endX, y1_top, endX, y2_bottom); }
      else { line(startX, y1_top, startX, y2_bottom); line(endX, y1_top, endX, y2_bottom); }
    }

    if (staffOnly) return;
    if (!data) return; // Guard clause

    const drawElement = (element, drawFunc) => {
      let x = element.x, y = element.y;

      if (isFinale) {
        // 첫 80ms 동안 y축으로 -50px 이동
        if (finaleElapsedTime < 80) {
          const progress = finaleElapsedTime / 80;
          y += 400 * progress; // 80ms에 걸쳐 -50px까지 이동
        } else {
          // 80ms 이후: -50px 위치에서부터 기존 finale 애니메이션 시작
          y += 400; // -50px 위치 고정
          const moveProgress = (finaleElapsedTime - 80) / (this.FINALE_DURATION - 80);
          x += element.finale_dx * moveProgress;
          y += element.finale_dy * moveProgress;
        }
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
        case 'whole': this.wholeNote(x, y, note.barChance, note.dotChance, finaleAlpha, sizeMultiplier, pg); break;
        case 'half': this.halfNote(x, y, note.isRotated, note.barChance, note.dotChance, finaleAlpha, sizeMultiplier, pg); break;
        case 'quarter': this.quarterNote(x, y, note.isRotated, note.barChance, note.dotChance, finaleAlpha, sizeMultiplier, pg); break;
        case 'eighth': this.drawEighthNote(x, y, 53, finaleAlpha, sizeMultiplier, pg); break;
        case 'sixteenth': this.drawSixteenthNote(x, y, 53, finaleAlpha, sizeMultiplier, pg); break;
      }
    }));

    data.savedBeamNotes.forEach(beamData => drawElement(beamData, (x, y) => {
      if (beamData.isRotated) {
        if (pg) { pg.push(); pg.translate(x, y); pg.rotate(PI); beamData.beamNote.display(0, 0, finaleAlpha, sizeMultiplier, this.note_height, pg); pg.pop(); }
        else { push(); translate(x, y); rotate(PI); beamData.beamNote.display(0, 0, finaleAlpha, sizeMultiplier, this.note_height, pg); pop(); }
      }
      else { beamData.beamNote.display(x, y, finaleAlpha, sizeMultiplier, this.note_height, pg); }
    }));

    data.savedRests.forEach(rest => drawElement(rest, (x, y) => {
      this['draw' + rest.type.charAt(0).toUpperCase() + rest.type.slice(1) + 'Rest'](x, y, 30, finaleAlpha, sizeMultiplier, pg);
    }));

    data.savedTimeSignatures.forEach(timeSig => drawElement(timeSig, (x, y) => {
      this['drawTimeSignature' + timeSig.type](x, y, 30, finaleAlpha, sizeMultiplier, pg);
    }));

    data.savedClefs.forEach(clef => drawElement(clef, (x, y) => {
      this['draw' + clef.type.charAt(0).toUpperCase() + clef.type.slice(1) + 'Clef'](x, y, 30, finaleAlpha, sizeMultiplier, pg);
    }));

    data.savedSymbols.forEach(symbol => drawElement(symbol, (x, y) => {
      this['draw' + symbol.type.charAt(0).toUpperCase() + symbol.type.slice(1).toLowerCase()](x, y, 30, finaleAlpha, sizeMultiplier, pg);
    }));
  }

  wholeNote(x, y, barChance, dotChance, alpha = 255, sizeMultiplier = 1.0, pg = null) {
    this.drawNoteWithBravura(this.BRAVURA_SYMBOLS.WHOLE_NOTE, x, y, 53, alpha, sizeMultiplier, pg);
  }
  halfNote(x, y, isRotated, barChance, dotChance, alpha = 255, sizeMultiplier = 1.0, pg = null) {
    this.drawNoteWithBravura(this.BRAVURA_SYMBOLS.HALF_NOTE, x, y, 53, alpha, sizeMultiplier, pg);
  }
  quarterNote(x, y, isRotated, barChance, dotChance, alpha = 255, sizeMultiplier = 1.0, pg = null) {
    this.drawNoteWithBravura(this.BRAVURA_SYMBOLS.QUARTER_NOTE, x, y, 53, alpha, sizeMultiplier, pg);
  }

  drawNoteWithBravura(symbol, x, y, size = 53, alpha = 255, sizeMultiplier = 1.0, pg = null) {
    const ctx = pg || this; // Use global scope (this in instance/mixed) if pg not provided. Actually for global p5, just use global functions.
    // Correct way for global mode mixed with pg:
    // If pg is null, call global functions.

    if (pg) {
      if (this.bravuraFont) pg.textFont(this.bravuraFont);
      pg.textAlign(CENTER, CENTER);
      pg.textSize(size * sizeMultiplier * 0.9);
      pg.noStroke();
      pg.fill(0, alpha);
      pg.text(symbol, x, y);
    } else {
      if (this.bravuraFont) textFont(this.bravuraFont);
      textAlign(CENTER, CENTER);
      textSize(size * sizeMultiplier * 0.9);
      noStroke();
      fill(0, alpha);
      text(symbol, x, y);
    }
  }

  drawStaff(y, staffColor, pg = null) {
    if (pg) {
      pg.stroke(staffColor); pg.strokeWeight(1);
      let startX = 50; let endX = width - 50; let lineSpacing = this.note_height;
      for (let i = 0; i < 5; i++) { let y1 = y - (2 * lineSpacing) + (i * lineSpacing); pg.line(startX, y1, endX, y1); }
    } else {
      stroke(staffColor); strokeWeight(1);
      let startX = 50; let endX = width - 50; let lineSpacing = this.note_height;
      for (let i = 0; i < 5; i++) { let y1 = y - (2 * lineSpacing) + (i * lineSpacing); line(startX, y1, endX, y1); }
    }
  }

  drawTrebleClef(x, y, size = 50, alpha = 255, sizeMultiplier = 1.0, pg = null) {
    this.drawSymbolHelper(this.BRAVURA_SYMBOLS.TREBLE_CLEF, x, y, size, alpha, sizeMultiplier, pg);
  }
  drawBassClef(x, y, size = 50, alpha = 255, sizeMultiplier = 1.0, pg = null) {
    this.drawSymbolHelper(this.BRAVURA_SYMBOLS.BASS_CLEF, x, y, size * 0.9, alpha, sizeMultiplier, pg);
  }
  drawWholeRest(x, y, size = 20, alpha = 255, sizeMultiplier = 1.0, pg = null) {
    this.drawSymbolHelper(this.BRAVURA_SYMBOLS.WHOLE_REST, x, y, size * 0.9, alpha, sizeMultiplier, pg);
  }

  // Helper to reduce duplication for simple symbols
  drawSymbolHelper(symbol, x, y, size, alpha, sizeMultiplier, pg) {
    if (pg) {
      if (this.bravuraFont) pg.textFont(this.bravuraFont);
      pg.textAlign(CENTER, CENTER); pg.textSize(size * sizeMultiplier); pg.noStroke(); pg.fill(0, alpha); pg.text(symbol, x, y);
    } else {
      if (this.bravuraFont) textFont(this.bravuraFont);
      textAlign(CENTER, CENTER); textSize(size * sizeMultiplier); noStroke(); fill(0, alpha); text(symbol, x, y);
    }
  }
  drawHalfRest(x, y, size = 20, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.HALF_REST, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawQuarterRest(x, y, size = 20, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.QUARTER_REST, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawEighthRest(x, y, size = 20, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.EIGHTH_REST, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawSixteenthRest(x, y, size = 20, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.SIXTEENTH_REST, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawTimeSignature44(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.TIME_4_4, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawTimeSignature68(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.TIME_6_8, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawFlat(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.FLAT, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawSharp(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.SHARP, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawNatural(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.NATURAL, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawFermata(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.FERMATA, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawAccent(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.ACCENT, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawStaccato(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.STACCATO, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawTenuto(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.TENUTO, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawTrill(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.TRILL, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawMordent(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.MORDENT, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawTurn(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.TURN, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawCrescendo(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.CRESCENDO, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawDecrescendo(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.DECRESCENDO, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawPedal_mark(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.PEDAL_MARK, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawDouble_barline(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.DOUBLE_BARLINE, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawSfz(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.SFZ, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawArpeggio(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.ARPEGGIO, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawSegno(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.SEGNO, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawTime_c(x, y, size = 30, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.TIME_C, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawEighthNote(x, y, size = 20, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.EIGHTH_NOTE, x, y, size * 0.9, alpha, sizeMultiplier, pg); }
  drawSixteenthNote(x, y, size = 20, alpha = 255, sizeMultiplier = 1.0, pg = null) { this.drawSymbolHelper(this.BRAVURA_SYMBOLS.SIXTEENTH_NOTE, x, y, size * 0.9, alpha, sizeMultiplier, pg); }

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
    } else if (key === '6') { // '6' 키는 80.12초 이후부터 아무 동작도 하지 않습니다.
      // 요청에 따라 '6' 키를 눌러도 아무 일도 일어나지 않도록 합니다.
    }
  }

  mousePressed() {
    // BRAVURA_SYMBOLS 객체의 값들만 추출하여 배열로 만듭니다.
    const symbolsArray = Object.values(this.BRAVURA_SYMBOLS);
    // 랜덤 기호 선택
    const currentTime = this.song.currentTime();

    if (currentTime >= 80.12) {
      // 80.12초부터는 마우스 클릭 시 '6' 키 애니메이션 발생
      this.triggerFlashRectangles();
    } else {
      // 80.12초 이전에는 오선지 색상 변경 효과를 트리거합니다.
      if (!this.staffColorChangeActive) {
        this.staffColorChangeActive = true;
        this.staffColorChangeStartTime = millis();
        this.randomStaffColor = color(random(255), random(255), random(255));
      }
    }
  }

  // '6' 키를 눌렀을 때 발생하던 플래시 애니메이션 로직을 별도 함수로 분리
  triggerFlashRectangles() {
    if (!this.isFlashing) { // 이미 플래시 중이 아닐 때만 트리거
      this.isFlashing = true;
      this.flashStartTime = millis();
      this.flashRectangles = [];
      const numRects = random(2, 190);
      for (let i = 0; i < numRects; i++) {
        this.flashRectangles.push({ x: random(width), initialWidth: random(0.01, 1), startTime: millis() });
      }
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

  display(drawX = this.x, drawY = this.y, alpha = 255, sizeMultiplier = 1.0, note_height, pg = null) {
    const note_width = 16.5;
    const note_stem = 46;

    if (pg) pg.stroke(0, alpha); else stroke(0, alpha);

    if (pg) pg.push(); else push();
    if (pg) pg.translate(drawX - this.x, drawY - this.y); else translate(drawX - this.x, drawY - this.y);

    let allNotes = [...this.column1Notes, ...this.column2Notes];
    let column1StemEnds = this.column1Notes.map(note => note.y + (note.stemDirection * note_stem * sizeMultiplier));
    let column2StemEnds = this.column2Notes.map(note => note.y + (note.stemDirection * note_stem * sizeMultiplier));
    let maxStem1 = column1StemEnds.length > 0 ? max(column1StemEnds) : 0;
    let maxStem2 = column2StemEnds.length > 0 ? max(column2StemEnds) : 0;

    this.column1Notes.forEach(note => {
      this.drawStem(note.x, note.y, note.stemDirection, alpha, sizeMultiplier, note_width, maxStem1, pg);
    });
    this.column2Notes.forEach(note => {
      this.drawStem(note.x, note.y, note.stemDirection, alpha, sizeMultiplier, note_width, maxStem2, pg);
    });

    if (this.beamCount > 0) {
      this.drawBeams(alpha, sizeMultiplier, note_width, maxStem1, maxStem2, pg);
    }

    [...this.column1Notes, ...this.column2Notes].forEach(note => {
      this.drawNoteHead(note.x, note.y, alpha, sizeMultiplier, note_width, note_height, pg);
    });

    if (pg) pg.pop(); else pop();
  }

  drawNoteHead(x, y, alpha, sizeMultiplier, note_width, note_height, pg = null) {
    if (pg) pg.push(); else push();
    if (pg) pg.translate(x, y); else translate(x, y);
    if (pg) pg.rotate(-PI / 8); else rotate(-PI / 8);
    if (pg) pg.fill(0, alpha); else fill(0, alpha);
    if (pg) pg.ellipse(0, 0, note_width * sizeMultiplier * 1.1, note_height * sizeMultiplier); else ellipse(0, 0, note_width * sizeMultiplier * 1.1, note_height * sizeMultiplier);
    if (pg) pg.pop(); else pop();
  }

  drawStem(x, y, direction, alpha, sizeMultiplier, note_width, beamY, pg = null) {
    if (pg) pg.strokeWeight(1.6 * sizeMultiplier); else strokeWeight(1.6 * sizeMultiplier);
    if (pg) pg.stroke(0, alpha); else stroke(0, alpha);
    if (pg) pg.line(x - (note_width / 2 * sizeMultiplier) + (0.3 * sizeMultiplier), y, x - (note_width / 2 * sizeMultiplier), beamY);
    else line(x - (note_width / 2 * sizeMultiplier) + (0.3 * sizeMultiplier), y, x - (note_width / 2 * sizeMultiplier), beamY);
  }

  drawBeams(alpha, sizeMultiplier, note_width, beamY1, beamY2, pg = null) {
    let allNotes = [...this.column1Notes, ...this.column2Notes];

    for (let i = 0; i < this.beamCount; i++) {
      let beamStartX = min(allNotes.map(note => note.x)) - (note_width / 2 * sizeMultiplier);
      let beamEndX = max(allNotes.map(note => note.x)) - (note_width / 2 * sizeMultiplier);
      let beamThickness = 3 * sizeMultiplier;

      if (pg) pg.fill(0, alpha); else fill(0, alpha);
      if (pg) pg.noStroke(); else noStroke();
      if (pg) pg.quad(beamStartX, beamY1, beamStartX, beamY1 + beamThickness, beamEndX, beamY2 + beamThickness, beamEndX, beamY2);
      else quad(beamStartX, beamY1, beamStartX, beamY1 + beamThickness, beamEndX, beamY2 + beamThickness, beamEndX, beamY2);

      beamY1 -= 7 * sizeMultiplier;
      beamY2 -= 7 * sizeMultiplier;
    }
  }
}