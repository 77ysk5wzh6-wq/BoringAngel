class Scene3 {
  constructor(song, wingdingsFont) {
    // --- 시간 기반 상수 ---
    this.SCENE_START_TIME = 112.0;
    this.HIGHLIGHT_START_TIME = 112.0; // 하이라이트 효과 시작 시간
    this.FAX_EMOJI_START_TIME = 111.0; // 망원경 이모지 시작 시간
    this.YOGA_EMOJI_START_TIME = 141.03;
    this.EMOJI_DURATION = 1.0;

    this.fonts = [
      'Fira Mono',
      'Geom',
      'Bitcount Prop Single',
      'EB Garamond',
      'Cinzel Decorative',
      'Shippori Mincho B1',
      'Work Sans',
      'Ballet'
    ];

    this.song = song;

    // --- Poem Words ---
    const poem = `Look again at that dot.
    That's here. That's home.
    That's us. On it everyone you love, 
    everyone you know, everyone you ever heard of,
    every human being who ever was,
    lived out their lives. The aggregate
of
our joy and suffering,
    thousands of confident religions, ideologies,
    and economic doctrines, every hunter and forager,
    every hero and coward, every creator and destroyer of civilization, every king and peasant, every young couple in love, every mother and father, hopeful child, inventor and explorer, every teacher of morals, every corrupt politician, every "superstar," every "supreme leader," every saint and sinner in the history of our species lived there--on a mote of dust suspended in a sunbeam.`;

    this.rawPoem = poem; // 원본 시 저장
    // 쉼표, 줄바꿈 등을 제거하고 단어 단위로 쪼개 배열에 저장합니다.
    this.words = poem.replace(/\n/g, ' ').split(/\s+/).filter(word => word.length > 0);
    this.wordIndex = 0; // 현재 단어의 인덱스
    this.currentWordFont = null; // 현재 단어에 적용할 폰트를 저장하는 변수

    // 단어 표시용 (HighMid 기반)
    this.isWordVisible = false; // 단어가 화면에 보이는지 여부
    this.wordDisplayStartTime = 0; // 단어가 보이기 시작한 시간
    this.lastWordChangeTime = 0; // 마지막으로 단어가 바뀐 시간 (시간 기반 제어용)
    this.wordDisplayDuration = 60000 / 300; // 225BPM에 맞춰 단어 표시 간격 설정
    this.allWordsDisplayed = false; // 모든 단어가 표시되었는지 여부
    this.fullPoemColor = color(0, 0, 255); // 전체 시 색상 저장 변수

    // 마지막 단어 애니메이션용 변수
    this.lastWordState = 'idle'; // 'idle', 'holding', 'fading', 'done'
    this.lastWordFadeStartTime = 0;
    this.lastWordHoldDuration = 1000; // 1초 유지
    this.lastWordFadeDuration = 1000; // 1초 동안 사라짐

    // 배경 그리드용 변수
    this.gridCols = 37;
    this.gridRows = 20;
    this.finalGridState = []; // 최종 그리드의 상태(문자, 공개 여부)를 저장

    // 하이라이트 효과용 변수
    this.highlightedWords = []; // [{ bounds, startTime }]
    this.lastHighlightTime = 0;
    this.highlightInterval = 60000 / 97; // 96 BPM에 맞는 간격 (ms)
    this.highlightFadeDuration = 400; // 1초
    this.highlightFadeStartTime = 0; // 마지막 단어 페이드 시 하이라이트 비율 감소용
    this.highlightFadeOutDuration = 2000; // 2초
    this.highlightColor = color(0, 255, 0);

    // 볼드 효과용 변수
    this.boldBpm = 228;
    this.boldBeatDuration = 60000 / this.boldBpm;
    this.boldWordIndices = []; // 볼드 처리할 단어의 인덱스 목록
    this.lastBoldSelectionTime = 0;

    // --- 배경 그리드 글자 이동 애니메이션 변수 ---
    this.shiftBpm = 225;
    this.shiftBeatDuration = 60000 / this.shiftBpm;
    this.lastShiftTime = 0;
    this.shiftOutDuration = 10; // 0.1초 동안 이동
    this.shiftInDuration = 100;  // 0.3초 동안 복귀
    this.shiftAnimationDuration = this.shiftOutDuration + this.shiftInDuration; // 총 애니메이션 시간
    this.shiftDirection = 'RIGHT'; // 글자 이동 방향 (UP, DOWN, LEFT, RIGHT)

    this.isSetupComplete = false; // setup 함수가 완료되었는지 확인

    // --- 줌 아웃 애니메이션 변수 ---
    this.amp = null;

    // --- 색상 반전 효과 변수 ---
    this.isInverting = false;
    this.inversionStartTime = 0;

    // --- 색상 플래시 효과 변수 ---
    this.flashes = []; // 플래시 효과를 배열로 관리 [{startTime, duration, fontColor, bgColor}]
    this.activeFlash = null; // 현재 활성화된 플래시 객체
    this.flashDuration = 50; // 각 플래시 지속 시간 (0.09초)

    // mid 값 기반 트리거를 위한 변수
    this.lastMidValue = 0;
    this.midThreshold = 163;
    this.lastFlashTime = 0; // 마지막 플래시 트리거 시간
    this.flashCooldown = 200; // 플래시 간 최소 간격 (0.2초)

    // highMid 값 기반 글리치 효과를 위한 변수
    this.lastHighMidValue = 0;
    this.highMidThreshold = 140;
    this.isGlitching = false; // 글리치 중복 방지 플래그
    this.lastGlitchTime = 0; // 마지막 글리치 발생 시간
    this.glitchCooldown = 200; // 최소 글리치 간격 (0.1초)
  }

  setup() {
    this.fft = new p5.FFT(0.8, 512); // Scene2를 위한 FFT 객체 초기화
    this.amp = new p5.Amplitude(); // 볼륨 분석을 위한 객체 초기화

    // --- 상태 초기화 ---
    this.enter();
    this.isSetupComplete = true;
  }

  enter() {
    this.currentWord = '';
    this.wordIndex = 0;
    this.currentWordFont = this.fonts[0]; // 폰트 초기화
    this.isWordVisible = false;
    this.allWordsDisplayed = false;
    this.lastWordState = 'idle';
    this.lastWordChangeTime = 0;
    this.highlightedWords = [];
    this.boldWordIndices = [];
    this.highlightFadeStartTime = 0; // 리셋 시 초기화
    this.isInverting = false; // 리셋 시 색상 반전 상태 초기화
    this.inversionStartTime = 0;
    this.shiftDirection = 'RIGHT'; // 씬 시작 시 방향 초기화
    this.lastMidValue = 0; // mid 값 초기화
    this.flashes = []; // 플래시 배열 초기화
    this.activeFlash = null; // 활성 플래시 객체 초기화
    this.lastHighMidValue = 0; // highMid 값 초기화
    this.isGlitching = false; // 글리치 상태 초기화
    this.lastFlashTime = 0; // 플래시 시간 초기화
    this.lastGlitchTime = 0; // 글리치 시간 초기화

    // --- 배경 그리드 데이터 생성 ---
    this.finalGridState = [];
    this.gridWordBoundaries = [];

    // 시(poem)를 단어 단위로 분석하여 그리드 내 위치(경계) 정보 생성
    let charIndex = 0;
    const wordsFromPoem = this.rawPoem.replace(/\n/g, ' ').split(/\s+/).filter(w => w.length > 0);

    for (const word of wordsFromPoem) {
      const wordWithSpace = word + ' ';
      const startIndex = charIndex;
      for (const char of wordWithSpace) {
        this.finalGridState.push({
          char: char,
          revealed: false,
          revealDelay: 0,
          isShifting: false, // 글자 이동 애니메이션 상태
          font: random(this.fonts), // 각 글자에 무작위 폰트 할당
          shiftStartTime: 0, // 글자 이동 애니메이션 시작 시간
          // Mouse Push Interaction Data
          pushData: {
            active: false,
            startTime: 0,
            duration: 0,
            targetX: 0,
            targetY: 0
          }
        });
        charIndex++;
      }
      this.gridWordBoundaries.push({ start: startIndex, end: charIndex });
    }
    this.unrevealedWordIndices = Array.from(Array(this.gridWordBoundaries.length).keys());
  }

  draw() {
    if (!this.isSetupComplete) return; // setup이 끝나기 전에는 draw 실행 방지

    if (this.song.isPlaying()) {
      let currentTime = this.song.currentTime();
      const now = millis();

      this.fft.analyze();
      const midValue = this.fft.getEnergy("mid");
      const highMidValue = this.fft.getEnergy("highMid");
      console.log('mid:', midValue); // mid 값 콘솔 출력

      // --- 연속 색상 플래시 트리거 ---
      if (this.lastMidValue < this.midThreshold && midValue >= this.midThreshold && now - this.lastFlashTime > this.flashCooldown) {
        // 첫 번째 플래시
        this.lastFlashTime = now; // 마지막 플래시 시간 업데이트
        this.flashes.push({
          startTime: now,
          duration: this.flashDuration,
          fontColor: color(random(255), random(255), random(255)),
          bgColor: color(random(255), random(255), random(255))
        });
        // 두 번째 플래시 (첫 번째 플래시 직후 시작)
        this.flashes.push({
          startTime: now + this.flashDuration,
          duration: this.flashDuration,
          fontColor: color(random(255), random(255), random(255)),
          bgColor: color(random(255), random(255), random(255))
        });
      }
      this.lastMidValue = midValue; // 현재 mid 값을 다음 프레임을 위해 저장

      // --- 활성화된 플래시 확인 및 색상 업데이트 ---
      this.activeFlash = null;
      this.flashes = this.flashes.filter(flash => now < flash.startTime + flash.duration);
      this.flashes.forEach(flash => { if (now >= flash.startTime) this.activeFlash = flash; });

      // --- 131초 이후 highMid 기반 글리치 효과 ---
      if (currentTime >= 131 && currentTime < 144.03) {
        // highMid 값이 140을 넘는 순간에만 트리거
        if (this.lastHighMidValue < this.highMidThreshold && highMidValue >= this.highMidThreshold && now - this.lastGlitchTime > this.glitchCooldown) {
          this.isGlitching = true;
          this.lastGlitchTime = now; // 마지막 글리치 시간 업데이트
          document.body.classList.add('scene3-glitch-active');

          // 0.1초 후에 클래스를 제거하여 애니메이션을 한 번만 실행
          setTimeout(() => {
            document.body.classList.remove('scene3-glitch-active');
            this.isGlitching = false; // isGlitching은 애니메이션 지속 시간 동안만 유지
          }, 100);
        }
      }
      this.lastHighMidValue = highMidValue; // 현재 highMid 값을 다음 프레임을 위해 저장

      // 활성 플래시가 있으면 배경을 어둡게, 아니면 흰색으로 설정
      if (this.activeFlash) {
        background(this.activeFlash.bgColor); // 플래시의 배경색 사용
      } else {
        background(255);
      }

      // 이 씬은 112초부터 시작
      if (currentTime >= this.SCENE_START_TIME) {
        // 하이라이트를 먼저 그리고, 그 위에 글씨를 겹쳐 그립니다.
        // 요가 이모지가 나오기 전까지만 하이라이트 애니메이션을 실행합니다.
        if (currentTime > this.HIGHLIGHT_START_TIME && currentTime < this.YOGA_EMOJI_START_TIME) {
          this.updateAndDrawHighlight(currentTime);
          if (currentTime < 131) { // 131초까지만 글자 이동 애니메이션 실행
            this.triggerGridShiftAnimation();
          }
          // 볼드 효과도 하이라이트와 동일한 조건에서 실행합니다.
          this.updateBoldWords(currentTime);
          // 배경 그리드를 그릴 때 볼드 처리할 단어 정보를 전달합니다.
          this.drawBackgroundGrid(true);
        }

        // 모든 단어가 표시되었지만, 요가 이모지가 시작되기 전까지는 drawBackgroundGrid가 
        // 인터랙션(클릭시 이동)을 담당하므로 중복해서 그리지 않도록 합니다.
        if (this.allWordsDisplayed && currentTime >= this.YOGA_EMOJI_START_TIME) {
          this.drawFullPoem();
        }
        // 단어 표시가 진행 중일 때
        else {
          // 볼드 효과가 아직 시작되지 않았을 때는 일반 배경 그리드를 그립니다.
          if (currentTime <= this.HIGHLIGHT_START_TIME || currentTime >= this.YOGA_EMOJI_START_TIME) {
            this.drawBackgroundGrid(false);
          }

          // --- 중앙 단어 및 배경 그리드 업데이트 ---
          // 0.15초 간격으로 다음 단어 표시
          if (now - this.lastWordChangeTime > this.wordDisplayDuration) {
            this.lastWordChangeTime = now; // 마지막 변경 시간 업데이트
            // 공개된 글자가 하나도 없을 때 (단어 표시가 처음 시작될 때)
            if (this.wordIndex === 0 && !this.finalGridState.some(cell => cell.revealed)) {
              console.log("Word display starts now. Resetting wordIndex.");
            }

            this.isWordVisible = true; // 단어 표시
            this.wordDisplayStartTime = now; // 단어 표시 시작 시간 기록

            this.currentWord = this.words[this.wordIndex];
            this.currentWordFont = random(this.fonts); // 단어가 바뀔 때 폰트를 한 번만 랜덤으로 선택

            // 배경 그리드: 아직 공개되지 않은 단어 중 하나를 무작위로 선택하여 공개
            if (this.unrevealedWordIndices.length > 0) {
              // 1. 무작위로 단어 인덱스를 선택하고, 리스트에서 제거
              const randomListIndex = floor(random(this.unrevealedWordIndices.length));
              const wordIndexToReveal = this.unrevealedWordIndices.splice(randomListIndex, 1)[0];

              // 2. 해당 단어의 경계 정보를 가져와서 글자들을 공개
              const bounds = this.gridWordBoundaries[wordIndexToReveal];
              for (let i = bounds.start; i < bounds.end; i++) {
                if (this.finalGridState[i]) this.finalGridState[i].revealed = true;
              }
            }

            this.wordIndex++; // 다음 단어로 이동

            // 모든 단어가 표시되었는지 확인
            if (this.wordIndex >= this.words.length) {
              this.lastWordState = 'holding';
              this.lastWordFadeStartTime = now;
              this.allWordsDisplayed = true;
            }
          }

          // --- 중앙 단어 그리기 ---
          if (this.isWordVisible) {
            // wordDisplayDuration이 지나면 단어를 숨김
            if (now - this.wordDisplayStartTime > this.wordDisplayDuration) {
              this.isWordVisible = false;
            } else {
              // 단어가 보이는 시간을 3단계(페이드인, 유지, 페이드아웃)로 나누어 알파값 조절
              const elapsed = now - this.wordDisplayStartTime;
              const fadeInDuration = this.wordDisplayDuration * 0.3;
              const holdDuration = this.wordDisplayDuration * 0.4;

              const fadeInEndTime = fadeInDuration;
              const holdEndTime = fadeInDuration + holdDuration;

              let alpha;
              if (elapsed < fadeInEndTime) {
                // Fade-in: 0 -> 255
                alpha = map(elapsed, 0, fadeInEndTime, 0, 255);
              } else if (elapsed < holdEndTime) {
                // Hold: 255 유지
                alpha = 255;
              } else {
                // Fade-out: 255 -> 0
                alpha = map(elapsed, holdEndTime, this.wordDisplayDuration, 255, 0);
              }
              this.drawWord(alpha);
            }
          }
        }

        // --- 마지막 단어 페이드 아웃 처리 ---
        if (this.lastWordState !== 'idle' && this.lastWordState !== 'done') {
          let animTime = millis() - this.lastWordFadeStartTime;
          let currentAlpha = 255;

          if (this.lastWordState === 'holding') {
            if (animTime > this.lastWordHoldDuration) {
              this.lastWordState = 'fading';
              this.lastWordFadeStartTime = millis(); // 페이드 시작 시간 재설정
              if (this.highlightFadeStartTime === 0) { // 페이드 아웃 시작 시점 기록 (한 번만)
                this.highlightFadeStartTime = millis();
              }
              animTime = 0; // 시간 초기화
            }
          }

          if (this.lastWordState === 'fading') {
            if (animTime < this.lastWordFadeDuration) {
              currentAlpha = map(animTime, 0, this.lastWordFadeDuration, 255, 0);
            } else {
              currentAlpha = 0;
              this.lastWordState = 'done';
            }
          }
          this.drawWord(currentAlpha);
        }
      }
      if (currentTime <= this.FAX_EMOJI_START_TIME + this.EMOJI_DURATION && currentTime >= this.FAX_EMOJI_START_TIME) {
        push();
        textAlign(CENTER, CENTER);
        fill(random(245, 255));
        rect(width / 2, height / 2, windowWidth, windowHeight);
        textSize(50);
        text('🙋‍♂️', width / 2, height / 2);
        pop();
      }
      if (currentTime <= this.YOGA_EMOJI_START_TIME + this.EMOJI_DURATION && currentTime >= this.YOGA_EMOJI_START_TIME) {
        push();
        textAlign(CENTER, CENTER);
        fill(random(245, 255));
        rect(width / 2, height / 2, windowWidth, windowHeight);
        textSize(50);
        text('🧎🏻‍♂️‍➡️', width / 2, height / 2);
        pop();
      }
    }

    // --- 색상 반전 효과 ---
    if (this.isInverting) {
      if (millis() - this.inversionStartTime < 100) { // 0.1초 동안
        filter(INVERT);
      } else {
        this.isInverting = false; // 0.1초가 지나면 효과 비활성화
      }
    }

  }

  drawBackgroundGrid(isBoldEffectActive) {
    const now = millis();
    const cellWidth = width / this.gridCols;
    const cellHeight = height / this.gridRows;
    const textSizeValue = cellHeight;

    // --- 효과를 위한 변수 ---
    let vol = this.amp.getLevel();
    let offset = map(vol, 0, 1, 0, 1.5); // 배경 그리드는 더 작은 오프셋 사용
    let shakeAmt = map(vol, 0, 1, 0, 2); // 배경 그리드는 더 작은 떨림 사용

    push(); // 텍스트 스타일 설정

    // 색상 플래시가 활성화된 경우, 모든 텍스트 색상을 플래시 색상으로 변경
    if (this.activeFlash) {
      fill(this.activeFlash.fontColor);
    }

    textSize(textSizeValue);
    textAlign(CENTER, CENTER);

    // 볼드 효과가 활성화되었고, 현재 비트가 홀수일 때만 볼드 스타일 적용
    const isBoldBeat = isBoldEffectActive && (floor(millis() / this.boldBeatDuration) % 2 !== 0);

    for (let j = 0; j < this.gridRows; j++) {
      for (let i = 0; i < this.gridCols; i++) {
        const gridIndex = j * this.gridCols + i;
        const cell = this.finalGridState[gridIndex];

        if (cell && cell.revealed) {
          let char = cell.char;
          let x = i * cellWidth + cellWidth / 2; // 기본 x, y 좌표
          let y = j * cellHeight + cellHeight / 2;
          textFont(cell.font); // 각 셀에 할당된 폰트 적용

          // 특정 폰트 크기 보정
          if (cell.font === 'Work Sans') {
            textSize(textSizeValue * 0.8);
          } else if (cell.font === 'Ballet') {
            textSize(textSizeValue * 1.3);
          } else {
            textSize(textSizeValue); // 다른 폰트는 기본 크기로 설정
          }

          // --- 글자 이동 애니메이션 계산 ---
          if (cell.isShifting) {
            const elapsed = now - cell.shiftStartTime;
            if (elapsed < this.shiftAnimationDuration) {
              let shiftOffset;
              let moveProgress;
              if (elapsed < this.shiftOutDuration) {
                // 밖으로 나가는 움직임 (Ease-Out)
                let t = elapsed / this.shiftOutDuration;
                moveProgress = t * (2 - t); // Ease-Out Quad
              } else {
                // 원래 위치로 돌아오는 움직임 (Ease-In)
                let t = (elapsed - this.shiftOutDuration) / this.shiftInDuration;
                moveProgress = 1 - (t * t); // Ease-In Quad (1 -> 0)
              }

              // shiftDirection에 따라 x 또는 y 좌표에 오프셋 적용
              if (this.shiftDirection === 'LEFT') {
                x -= moveProgress * cellWidth * 1.5;
              } else if (this.shiftDirection === 'RIGHT') {
                x += moveProgress * cellWidth * 1.5;
              } else if (this.shiftDirection === 'UP') {
                y -= moveProgress * cellHeight * 1.5;
              } else if (this.shiftDirection === 'DOWN') {
                y += moveProgress * cellHeight * 1.5;
              }
            } else {
              cell.isShifting = false;
            }
          }

          // --- 마우스 인터랙션 (밀어내기) 애니메이션 ---
          if (cell.pushData && cell.pushData.active) {
            const elapsed = now - cell.pushData.startTime;
            if (elapsed < cell.pushData.duration) {
              const progress = elapsed / cell.pushData.duration;
              let pushAmount = 0;

              const pushOutTime = 0.2; // 전체 시간의 20% 동안 밀려남

              if (progress < pushOutTime) {
                // 밖으로 밀려남 (Fast Out)
                let t = progress / pushOutTime;
                pushAmount = sin(t * HALF_PI); // 0 -> 1
              } else {
                // 제자리로 돌아옴 (Slow In w/ Elastic feel maybe? or just smooth)
                let t = (progress - pushOutTime) / (1 - pushOutTime);
                // Simple ease out for return
                pushAmount = 1 - t;
                pushAmount = pushAmount * pushAmount; // Ease In (Quadratic) - start slow, end fast? No, we want start fast end slow usually for return? 
                // Let's use Ease Out for return (start fast end slow) -> 1 - (1-t)^2 ?
                // No, '1 -> 0'. 
                // Natural return: Spring-like.
                // Let's just use smoothstep or QuadEaseInOut.
                // Let's stick to simple EaseOut for return: (1-t)^2 is EaseIn. 1 - t^2 is EaseOut?
                // We want 1 -> 0.
                // t goes 0 -> 1.
                // Value goes 1 -> 0.
                // (1-t) goes 1 -> 0.
                // (1-t)^2 goes 1 -> 0 with ease in (starts slow change, speeds up at end? No. gradient 2(1-t)*(-1) = -2(1-t). At t=0, slope -2. At t=1, slope 0. So starts fast, slows down.)
                pushAmount = (1 - t) * (1 - t);
              }

              x += cell.pushData.targetX * pushAmount;
              y += cell.pushData.targetY * pushAmount;

            } else {
              cell.pushData.active = false;
            }
          }

          // 볼드 스타일 설정
          textStyle(NORMAL);
          if (isBoldBeat && this.boldWordIndices.some(bounds => gridIndex >= bounds.start && gridIndex < bounds.end)) {
            textStyle(BOLD);
          }

          if (!this.activeFlash) {
            // CMY Split with shake
            push();
            blendMode(MULTIPLY);

            // Cyan Channel
            fill(0, 255, 255);
            let shakeX_cyan = random(-shakeAmt, shakeAmt);
            let shakeY_cyan = random(-shakeAmt, shakeAmt);
            text(char, x - offset + shakeX_cyan, y - offset + shakeY_cyan);

            // Magenta Channel
            fill(255, 0, 255);
            let shakeX_magenta = random(-shakeAmt, shakeAmt);
            let shakeY_magenta = random(-shakeAmt, shakeAmt);
            text(char, x + offset + shakeX_magenta, y + offset + shakeY_magenta);

            pop();
          } else {
            text(char, x, y); // 플래시 중에는 단색으로 그림
          }
        }
      }
    }
    pop();
  }

  triggerGridShiftAnimation() {
    const now = millis();
    if (now - this.lastShiftTime > this.shiftBeatDuration) {
      this.lastShiftTime = now;

      // 1. 공개된 모든 글자의 인덱스를 수집합니다.
      const revealedCharIndices = [];
      this.finalGridState.forEach((cell, index) => {
        if (cell.revealed && cell.char !== ' ' && !cell.isShifting) {
          revealedCharIndices.push(index);
        }
      });

      // 2. 그 중 10%를 무작위로 선택합니다.
      const numToShift = floor(revealedCharIndices.length * 0.5);
      const shuffledIndices = shuffle(revealedCharIndices);

      for (let i = 0; i < numToShift; i++) {
        const charIndex = shuffledIndices[i];
        this.finalGridState[charIndex].isShifting = true;
        this.finalGridState[charIndex].shiftStartTime = now;
      }
    }
  }

  updateBoldWords(currentTime) {
    const now = millis();

    // 하이라이트와 동일한 간격으로 볼드 처리할 단어를 다시 선택합니다.
    if (now - this.lastBoldSelectionTime > this.highlightInterval) {
      this.lastBoldSelectionTime = now;

      // 공개된 단어들의 인덱스 목록을 만듭니다.
      let revealedWordIndices = [];
      for (let i = 0; i < this.gridWordBoundaries.length; i++) {
        if (!this.unrevealedWordIndices.includes(i)) {
          revealedWordIndices.push(i);
        }
      }

      // 공개된 단어의 30%를 무작위로 선택합니다.
      const numToBold = floor(revealedWordIndices.length * 0.3);
      this.boldWordIndices = []; // 기존 목록 초기화

      // Fisher-Yates shuffle로 목록을 섞고 앞에서부터 선택합니다.
      revealedWordIndices = shuffle(revealedWordIndices);

      for (let i = 0; i < numToBold; i++) {
        this.boldWordIndices.push(this.gridWordBoundaries[revealedWordIndices[i]]);
      }
    }
  }

  updateAndDrawHighlight(currentTime) {
    const now = millis();

    // 95.5초부터 0.4초 동안 하이라이트 생성을 멈춥니다.
    const isHighlightPaused = currentTime >= 94.9 && currentTime < 96;

    // 1. 97BPM에 맞춰 새로운 하이라이트 트리거
    // 일시정지 중이 아닐 때만 새로운 하이라이트를 생성합니다.
    if (!isHighlightPaused && (now - this.lastHighlightTime > this.highlightInterval)) {
      this.lastHighlightTime = now;

      // 공개된 단어들의 인덱스 목록을 만듭니다.
      let revealedWordIndices = [];
      for (let i = 0; i < this.gridWordBoundaries.length; i++) {
        // unrevealedWordIndices에 없는 단어 = 공개된 단어
        if (!this.unrevealedWordIndices.includes(i)) {
          revealedWordIndices.push(i);
        }
      }

      // 공개된 단어의 비율을 무작위로 선택하여 하이라이트 목록에 추가
      // 95.5초 이후에는 50%를, 그 이전에는 30%를 선택합니다.
      let highlightPercentage;
      if (this.highlightFadeStartTime > 0) {
        // 마지막 단어가 사라지기 시작하면, 2초에 걸쳐 하이라이트 비율을 0으로 줄입니다.
        const fadeElapsed = now - this.highlightFadeStartTime;
        const basePercentage = (currentTime >= 95.5) ? 0.4 : 0.2;
        highlightPercentage = lerp(basePercentage, 0, fadeElapsed / this.highlightFadeOutDuration);
      } else {
        // 일반적인 하이라이트 비율 계산
        highlightPercentage = 0.2;
        if (currentTime >= 131.43) {
          highlightPercentage = 1;
        }
      }
      const numToHighlight = floor(revealedWordIndices.length * highlightPercentage);

      this.highlightedWords = []; // 기존 하이라이트 초기화

      // Fisher-Yates shuffle 알고리즘으로 목록을 무작위로 섞음
      // shuffle()이 반환하는 읽기 전용 배열을 쓰기 가능한 배열로 복사합니다.
      revealedWordIndices = shuffle(revealedWordIndices).slice();

      for (let i = 0; i < numToHighlight; i++) {
        if (i >= revealedWordIndices.length) break;
        const wordIndex = revealedWordIndices[i];
        this.highlightedWords.push({
          bounds: this.gridWordBoundaries[wordIndex],
          startTime: now,
        });
      }
    }

    // 2. 현재 활성화된 하이라이트 그리기
    if (this.highlightedWords.length > 0) {
      // 페이드아웃이 끝난 하이라이트는 제거합니다.
      this.highlightedWords = this.highlightedWords.filter(
        wordInfo => now - wordInfo.startTime < this.highlightFadeDuration
      );

      if (this.highlightedWords.length > 0) {
        push();
        rectMode(CENTER); // 사각형을 중앙 기준으로 그리도록 설정
        noStroke(); // 하이라이트 스타일 설정

        // 95.5초 이후에는 색상을 마젠타로 변경합니다.
        if (currentTime >= 131.43) {
          fill(255, 0, 255);
        } else {
          fill(this.highlightColor);
        }

        this.highlightedWords.forEach(wordInfo => {
          this.drawHighlightForWord(wordInfo.bounds, now - wordInfo.startTime);
        });

        pop();
      }
    }
  }

  drawHighlightForWord(bounds, elapsedTime) {
    const cellWidth = width / this.gridCols;
    const cellHeight = height / this.gridRows;
    const now = millis();

    // 단어를 줄(row)별로 그룹화합니다.
    const charsByRow = {};
    for (let i = bounds.start; i < bounds.end; i++) {
      if (this.finalGridState[i] && this.finalGridState[i].char !== ' ') {
        const row = floor(i / this.gridCols); // 글자가 속한 줄(row) 번호
        if (!charsByRow[row]) charsByRow[row] = [];
        charsByRow[row].push(i);
      }
    }

    // 너비가 줄어드는 애니메이션을 위한 진행률 계산
    const progress = constrain(elapsedTime / this.highlightFadeDuration, 0, 1);

    // 각 줄에 대해 글자별로 하이라이트를 그립니다.
    for (const row in charsByRow) {
      const indicesInRow = charsByRow[row];
      if (indicesInRow.length > 0) {

        // 진행률에 따라 표시할 셀의 개수를 불연속적으로 계산 (ceil로 끊어지는 효과)
        const numVisibleChars = ceil((1.0 - progress) * indicesInRow.length);
        if (numVisibleChars <= 0) continue;

        let lastCellX = 0;
        let lastCellY = 0;

        for (let k = 0; k < numVisibleChars; k++) {
          const gridIndex = indicesInRow[k];
          const cell = this.finalGridState[gridIndex];
          const col = gridIndex % this.gridCols;
          const r = floor(gridIndex / this.gridCols);

          let x = col * cellWidth + cellWidth / 2;
          let y = r * cellHeight + cellHeight / 2;

          // --- 글자 이동 애니메이션 적용 (drawBackgroundGrid와 동일한 로직) ---
          if (cell.pushData && cell.pushData.active) {
            const elapsedPush = now - cell.pushData.startTime;
            if (elapsedPush < cell.pushData.duration) {
              const pushProgress = elapsedPush / cell.pushData.duration;
              const pushOutTime = 0.1;
              let pushAmount = 0;
              if (pushProgress < pushOutTime) {
                const t = pushProgress / pushOutTime;
                pushAmount = sin(t * HALF_PI);
              } else {
                const t = (pushProgress - pushOutTime) / (1 - pushOutTime);
                pushAmount = (1 - t) * (1 - t);
              }
              x += cell.pushData.targetX * pushAmount;
              y += cell.pushData.targetY * pushAmount;
            }
          }

          rect(x, y, cellWidth, cellHeight);
          lastCellX = x;
          lastCellY = y;
        }

        // 마지막 글자 옆에 커서 그리기 (함께 움직임)
        push();
        fill(0);
        rect(lastCellX + cellWidth / 2 + 5, lastCellY, 10, cellHeight);
        pop();
      }
    }
  }

  drawWord(alpha = 255) {
    if (!this.isWordVisible && this.lastWordState === 'idle') return; // 보이지 않을 때는 그리지 않음

    textFont(this.currentWordFont); // 저장된 폰트를 사용
    textAlign(CENTER, CENTER);

    if (this.activeFlash) {
      fill(this.activeFlash.fontColor, alpha);
    } else {
      fill(0, 0, 255, alpha);
    }

    // 단어가 화면 너비를 넘지 않도록 텍스트 크기 동적 조절
    let initialSize = 600;
    textSize(initialSize);

    // 'Work Sans' 폰트 크기 보정
    if (this.currentWordFont === 'Work Sans') {
      initialSize *= 0.8;
      textSize(initialSize);
    } else if (this.currentWordFont === 'Ballet') {
      initialSize *= 1.3;
      textSize(initialSize);
    }

    const textW = textWidth(this.currentWord);
    let padding = 100;

    if (textW > width - padding) {
      let newSize = initialSize * ((width - padding) / textW);
      textSize(newSize);
    }

    // --- RGB Delay (CMY Split) Effect ---
    let vol = this.amp.getLevel();
    let offset = map(vol, 0, 1, 0, 3); // 볼륨에 따라 오프셋 조절 (최대 5px)

    // 떨림 효과 추가 (볼륨에 비례)
    let shakeAmt = map(vol, 0, 1, 0, 5);

    if (this.activeFlash) {
      text(this.currentWord, width / 2, height / 2);
    } else {
      push();
      blendMode(MULTIPLY); // 흰색 배경에서는 MULTIPLY 모드 사용

      // Cyan Channel (Red 흡수)
      fill(0, 255, 255, alpha);
      let shakeX_cyan = random(-shakeAmt, shakeAmt);
      let shakeY_cyan = random(-shakeAmt, shakeAmt);
      text(this.currentWord, width / 2 - offset + shakeX_cyan, height / 2 - offset + shakeY_cyan);

      // Magenta Channel (Green 흡수)
      fill(255, 0, 255, alpha);
      let shakeX_magenta = random(-shakeAmt, shakeAmt);
      let shakeY_magenta = random(-shakeAmt, shakeAmt);
      text(this.currentWord, width / 2 + offset + shakeX_magenta, height / 2 + offset + shakeY_magenta);

      pop();
    }
  }

  drawFullPoem() {
    const cols = this.gridCols;
    const rows = this.gridRows;
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    textAlign(CENTER, CENTER);
    if (this.activeFlash) {
      fill(this.activeFlash.fontColor);
    } else {
      fill(this.fullPoemColor);
    }
    textSize(cellHeight);

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const gridIndex = j * cols + i;
        const cell = this.finalGridState[gridIndex];
        if (!cell) continue;

        textFont(cell.font); // 각 셀에 할당된 폰트를 사용하도록 수정

        // 'Work Sans' 폰트 크기 보정
        if (cell.font === 'Work Sans') {
          textSize(cellHeight * 0.8);
        } else if (cell.font === 'Ballet') {
          textSize(cellHeight * 1.3);
        } else {
          textSize(cellHeight);
        }

        const x = i * cellWidth + cellWidth / 2;
        const y = j * cellHeight + cellHeight / 2;
        text(cell.char, x, y);
      }
    }
  }

  keyPressed() {
    // 스페이스바를 누르면 음악을 재생하거나 정지합니다.
    if (key === ' ') {
      if (this.song.isPlaying()) {
        this.pauseStartTime = millis();
        this.song.pause();
      } else {
        // 멈췄다가 다시 재생할 때, 멈춘 시간만큼 애니메이션 타이머 보정
        if (this.isSetupComplete && this.pauseStartTime) {
          this.cycleStartTime += millis() - this.pauseStartTime;
        }
        this.song.play();
      }
    } else if (key === '6') {
      // '6' 키를 누르면 씬2 전체에서 색상 반전 효과 활성화
      this.isInverting = true;
      this.inversionStartTime = millis();
    } else if (keyCode === LEFT_ARROW) {
      this.shiftDirection = 'LEFT';
    } else if (keyCode === RIGHT_ARROW) {
      this.shiftDirection = 'RIGHT';
    } else if (keyCode === UP_ARROW) {
      this.shiftDirection = 'UP';
    } else if (keyCode === DOWN_ARROW) {
      this.shiftDirection = 'DOWN';
    }
  }

  mousePressed() {
    // 씬이 활성화 상태일 때만 반응 (간단히 현재 시간이 씬 시작 시간 이후인지 등으로 판단하거나, 메인에서 호출해준다고 가정)
    // 여기서는 별도 체크 없이 로직 구현 (메인 sketch.js에서 active scene의 mousePressed를 호출한다고 가정)

    if (!this.finalGridState || this.finalGridState.length === 0) return;

    const cellWidth = width / this.gridCols;
    const cellHeight = height / this.gridRows;
    const maxDist = width * 0.8; // 영향 범위

    for (let j = 0; j < this.gridRows; j++) {
      for (let i = 0; i < this.gridCols; i++) {
        const gridIndex = j * this.gridCols + i;
        const cell = this.finalGridState[gridIndex];

        if (!cell) continue;

        // 셀의 중심 좌표
        const cellX = i * cellWidth + cellWidth / 2;
        const cellY = j * cellHeight + cellHeight / 2;

        // 마우스와 셀 사이의 거리 및 각도 계산
        const d = dist(mouseX, mouseY, cellX, cellY);

        if (d < maxDist) {
          const angle = atan2(cellY - mouseY, cellX - mouseX);

          // 거리에 따른 힘 계산 (가까울수록 강하게)
          // 0에서 1 사이의 값
          let force = map(d, 0, maxDist, 1, 0);
          force = constrain(force, 0, 1);

          // Easing을 적용하여 가까운 곳이 훨씬 더 멀리 가도록 (force^2 or force^3)
          force = pow(force, 2);

          // 기본 밀려나는 거리 (화면 크기 비례)
          const maxPushDistance = 200;

          // 랜덤 요소 추가 ("각 셀별 멀어지는 거리는 다 랜덤이어야해")
          const randomFactor = random(0.5, 1.5);

          const pushDistance = maxPushDistance * force * randomFactor;

          cell.pushData.active = true;
          cell.pushData.startTime = millis();
          cell.pushData.duration = random(800, 1200); // 돌아오는 시간도 약간 랜덤하게
          cell.pushData.targetX = cos(angle) * pushDistance;
          cell.pushData.targetY = sin(angle) * pushDistance;
        }
      }
    }
  }

  reset() {
    this.enter();
    timer = this.SCENE_START_TIME;
    song.jump(this.SCENE_START_TIME);
    if (!song.isPlaying()) {
      song.play();
    }
  }
}