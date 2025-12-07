class Scene3 {
  constructor(song, wingdingsFont, bravuraFont) {
    // --- 시간 기반 상수 ---
    this.SCENE_START_TIME = 112.0;
    this.HIGHLIGHT_START_TIME = 112.0; // 하이라이트 효과 시작 시간
    this.FAX_EMOJI_START_TIME = 111.0; // 망원경 이모지 시작 시간
    this.YOGA_EMOJI_START_TIME = 141.03;
    this.EMOJI_DURATION = 1.0;

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

    this.isSetupComplete = false; // setup 함수가 완료되었는지 확인

    // --- 줌 아웃 애니메이션 변수 ---
    this.amp = null;

    // --- 색상 반전 효과 변수 ---
    this.isInverting = false;
    this.inversionStartTime = 0;
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
    this.isWordVisible = false;
    this.allWordsDisplayed = false;
    this.lastWordState = 'idle';
    this.lastWordChangeTime = 0;
    this.highlightedWords = [];
    this.boldWordIndices = [];
    this.highlightFadeStartTime = 0; // 리셋 시 초기화
    this.isInverting = false; // 리셋 시 색상 반전 상태 초기화
    this.inversionStartTime = 0;

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
          isShifting: false, // 글자 이동 애니메이션 상태
          shiftStartTime: 0, // 글자 이동 애니메이션 시작 시간
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
      background(255);

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

        // 모든 단어가 화면에 표시된 후
        if (this.allWordsDisplayed) {
          this.drawFullPoem();
        }
        // 단어 표시가 진행 중일 때
        else {
          // 볼드 효과가 아직 시작되지 않았을 때는 일반 배경 그리드를 그립니다.
          if (currentTime <= this.HIGHLIGHT_START_TIME || currentTime >= this.YOGA_EMOJI_START_TIME) {
            this.drawBackgroundGrid(false);
          }

          const now = millis();

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
        text('🔭', width / 2, height / 2);
        pop();
      }
      if (currentTime <= this.YOGA_EMOJI_START_TIME + this.EMOJI_DURATION && currentTime >= this.YOGA_EMOJI_START_TIME) {
        push();
        textAlign(CENTER, CENTER);
        fill(random(245, 255));
        rect(width / 2, height / 2, windowWidth, windowHeight);
        textSize(50);
        text('🧘‍♀️', width / 2, height / 2);
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

    // --- RGB Delay (CMY Split) Effect ---
    let vol = this.amp.getLevel();
    let offset = map(vol, 0, 1, 0, 1.5); // 배경 그리드는 더 작은 오프셋 사용
    let shakeAmt = map(vol, 0, 1, 0, 2); // 배경 그리드는 더 작은 떨림 사용

    push(); // 텍스트 스타일 설정
    textFont('sans-serif');
    textSize(textSizeValue);
    textAlign(CENTER, CENTER);

    // 볼드 효과가 활성화되었고, 현재 비트가 홀수일 때만 볼드 스타일 적용
    const isBoldBeat = isBoldEffectActive && (floor(millis() / this.boldBeatDuration) % 2 !== 0);

    for (let j = 0; j < this.gridRows; j++) {
      for (let i = 0; i < this.gridCols; i++) {
        const gridIndex = j * this.gridCols + i;
        const cell = this.finalGridState[gridIndex];

        if (cell && cell.revealed) {
          const char = cell.char;
          let x = i * cellWidth + cellWidth / 2;
          const y = j * cellHeight + cellHeight / 2;

          // --- 글자 이동 애니메이션 계산 ---
          if (cell.isShifting) {
            const elapsed = now - cell.shiftStartTime;
            if (elapsed < this.shiftAnimationDuration) {
              let shiftOffset;
              if (elapsed < this.shiftOutDuration) {
                // 0.1초 동안 오른쪽으로 이동 (Ease-Out)
                let t = elapsed / this.shiftOutDuration;
                let progress = t * (2 - t); // Ease-Out Quad
                shiftOffset = progress * cellWidth;
              } else {
                // 0.3초 동안 원래 위치로 복귀 (Ease-In)
                let t = (elapsed - this.shiftOutDuration) / this.shiftInDuration;
                let progress = t * t; // Ease-In Quad
                shiftOffset = (1 - progress) * cellWidth;
              }
              x += shiftOffset;
            } else {
              cell.isShifting = false; // 애니메이션 종료
            }
          }

          // 볼드 스타일 설정
          textStyle(NORMAL);
          if (isBoldBeat && this.boldWordIndices.some(bounds => gridIndex >= bounds.start && gridIndex < bounds.end)) {
            textStyle(BOLD);
          }

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
      const numToShift = floor(revealedCharIndices.length * 0.3);
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
      revealedWordIndices = shuffle(revealedWordIndices);

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

    // 각 줄에 대해 연속된 하이라이트 사각형을 그립니다.
    for (const row in charsByRow) {
      const indicesInRow = charsByRow[row];
      if (indicesInRow.length > 0) {
        const firstIndex = indicesInRow[0];
        const lastIndex = indicesInRow[indicesInRow.length - 1];

        const startCol = firstIndex % this.gridCols; // 줄의 첫 글자 열
        const endCol = lastIndex % this.gridCols;   // 줄의 마지막 글자 열
        const numCharsInRow = endCol - startCol + 1;

        // 진행률에 따라 표시할 셀의 개수를 불연속적으로 계산 (ceil로 끊어지는 효과)
        const numVisibleChars = ceil((1.0 - progress) * numCharsInRow);
        if (numVisibleChars <= 0) continue; // 그릴 셀이 없으면 건너뜁니다.

        const currentWidth = numVisibleChars * cellWidth;
        const x = startCol * cellWidth + currentWidth / 2; // 중앙 기준 x좌표
        const y = parseInt(row) * cellHeight + cellHeight / 2;
        rect(x, y, currentWidth, cellHeight);
      }
    }
  }

  drawWord(alpha = 255) {
    if (!this.isWordVisible && this.lastWordState === 'idle') return; // 보이지 않을 때는 그리지 않음

    textFont('sans-serif');
    textAlign(CENTER, CENTER);
    fill(0, 0, 255, alpha);

    // 단어가 화면 너비를 넘지 않도록 텍스트 크기 동적 조절
    let initialSize = 600;
    textSize(initialSize);

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

    // Yellow Channel (Blue 흡수) - 선택 사항이지만 더 풍부한 색감을 위해 추가
    // fill(255, 255, 0, alpha);
    // text(this.currentWord, width / 2, height / 2); 

    // 원래 텍스트가 파란색(0,0,255)이므로 Cyan + Magenta가 겹치면 파란색이 됩니다.
    // Yellow를 추가하면 검은색에 가까워지므로, 파란색을 유지하려면 Cyan과 Magenta만 사용합니다.

    pop();
    // text(this.currentWord, width / 2, height / 2); // 기존 코드 제거
  }

  drawFullPoem() {
    const cols = this.gridCols;
    const rows = this.gridRows;
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    const poemChars = this.rawPoem.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    textFont('sans-serif');
    textAlign(CENTER, CENTER);
    fill(this.fullPoemColor);
    textSize(cellHeight);

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const gridIndex = j * cols + i;
        const char = gridIndex < poemChars.length ? poemChars[gridIndex] : ' ';

        // 각 셀의 중앙 위치를 계산합니다.
        const x = i * cellWidth + cellWidth / 2;
        const y = j * cellHeight + cellHeight / 2;
        text(char, x, y);
      }
    }
  }

  // --- randomScores.js에서 가져온 함수들 ---
  drawRandomScores() {
    const currentTime = this.song.currentTime();

    if (this.isStopped) {
      const isShaking = currentTime >= this.shakeAnimationStartTime;
      if (isShaking) {
        const now = millis();
        // 225BPM 비트에 맞춰 매번 새로운 10%의 요소를 선택합니다.
        if (now - this.lastShakeTime > this.shakeBeatDuration) {
          this.lastShakeTime = now;
          this.backgroundFlashTime = now; // 배경 플래시 시작 시간 기록

          // 최적화: 흔들릴 요소 목록이 비어있으면 한 번만 생성
          if (this.allShakeableElements.length === 0) {
            if (this.quadrantData[0]) {
              const data = this.quadrantData[0];
              this.allShakeableElements.push(...data.savedNotes, ...data.savedBeamNotes, ...data.savedRests, ...data.savedTimeSignatures, ...data.savedClefs);
            }
            this.allShakeableElements.push(...this.backgroundElements);
            // 각 요소에 흔들림 속성을 한 번만 초기화
            this.allShakeableElements.forEach(el => {
              el.currentShakeOffsetX = 0;
              el.targetShakeOffsetX = 0;
              el.currentShakeOffsetY = 0;
              el.targetShakeOffsetY = 0;
              // finale 애니메이션의 잔여 속도를 제거하여 대각선 움직임을 방지합니다.
              el.finale_dx = 0;
              el.finale_dy = 0;
            });
          }

          if (this.allShakeableElements.length > 0) {
            const shuffled = shuffle(this.allShakeableElements);
            const numToShake = floor(shuffled.length * 0.5);
            for (let i = 0; i < numToShake; i++) {
              const elementToShake = shuffled[i];
              if (random() < 0.5) { // 50% 확률로 x축으로만 이동
                elementToShake.targetShakeOffsetX = elementToShake.currentShakeOffsetX + random(-800, 800);
                elementToShake.targetShakeOffsetY = elementToShake.currentShakeOffsetY; // y축 움직임 중지
              } else { // 50% 확률로 y축으로만 이동
                elementToShake.targetShakeOffsetX = elementToShake.currentShakeOffsetX; // x축 움직임 중지
                elementToShake.targetShakeOffsetY = elementToShake.currentShakeOffsetY + random(-800, 800);
              }
            }
          }
        }
      }

      this.drawGrid(this.quadrantData, this.gridMode, 0, -1, false, -1, isShaking);
      return;
    }

    // 최종 피날레 진행 중
    if (this.finalFinaleState === 'running') {
      let elapsed = millis() - this.finalFinaleStartTime;
      if (elapsed < this.finalFinaleDuration) {
        // 1초에 걸쳐 투명하게 만듦
        let finaleAlpha = map(elapsed, 0, this.finalFinaleDuration, 255, 0);
        this.drawGrid(this.quadrantData, this.gridMode, 0, elapsed, false, finaleAlpha);
      } else {
        this.finalFinaleState = 'done';
      }
      return; // 다른 악보 생성 로직 실행 방지
    }

    // 최종 피날레가 끝난 후에는 오선지만 그림
    if (this.finalFinaleState === 'done') {
      this.drawGrid(this.quadrantData, this.gridMode, 0, -1, true); // 마지막 인자를 true로 하여 오선지만 그리도록 함
      return;
    }

    let elapsedTime = millis() - this.cycleStartTime;

    // 전체 루프(6단계 + 피날레)가 끝나면 새로운 사이클 시작
    // 피날레 애니메이션이 160ms 진행되었을 때 (겹치기 시작하는 시점) 새 사이클 시작
    if (elapsedTime >= this.CYCLE_DURATION + 160) {
      // 현재 악보 데이터를 이전 피날레 데이터로 옮깁니다.
      this.previousFinaleData = { ...this.quadrantData[0] };
      this.previousFinaleStartTime = this.cycleStartTime + this.CYCLE_DURATION;
      this.startNewCycle();
      elapsedTime = millis() - this.cycleStartTime; // 경과 시간 재계산
    }

    // 6단계 애니메이션 또는 피날레 애니메이션 분기
    if (elapsedTime < this.CYCLE_DURATION) { // --- 6단계 오선 채우기 애니메이션 ---
      let step = floor(elapsedTime / this.STEP_DURATION);
      if (step < this.NUM_STEPS && step !== this.currentStaveStep) {
        this.currentStaveStep = step;
        let staveToDrawOn = this.shuffledStaveIndices[this.currentStaveStep];
        const quadrantIdx = 0;
        if (this.currentStaveStep === 0) {
          this.quadrantData[quadrantIdx] = this.createEmptyQuadrantData();
        }
        this.generateElementsForStave(staveToDrawOn, quadrantIdx);

        // 배경 악보도 단계별로 생성
        if (this.zoomState !== 'idle') {
          this.generateBackgroundElements();
        }

        // 77.5초 이후 마지막 스텝(5)이 완료되면 멈춤 플래그를 설정합니다.
        if (currentTime > 77.5 && step === this.NUM_STEPS - 1) {
          this.isStopped = true;
          this.lastShakeTime = millis(); // 흔들림 시작 시간 초기화
          // 현재 상태를 그리고 즉시 반환하여 finale 애니메이션으로 넘어가지 않도록 함
          this.drawGrid(this.quadrantData, this.gridMode);
          return;
        }
      }
      // 일반 상태: 현재 그리드만 그림
      this.drawGrid(this.quadrantData, this.gridMode);

    } else { // --- 100ms 피날레 애니메이션 ---
      // 피날레 첫 프레임에 각 요소의 이동 방향을 설정
      if (this.currentStaveStep !== -2) { // -2는 피날레가 준비되었음을 나타내는 특별 값
        this.prepareFinale();
        this.currentStaveStep = -2; // 준비 완료로 표시

        // 97.292초가 지났고, 한 사이클이 막 끝난 이 시점에 최종 피날레를 시작합니다.
        if (currentTime > 97.292 && this.finalFinaleState === 'idle') {
          this.finalFinaleState = 'running';
          this.finalFinaleStartTime = millis();
          // prepareFinale()는 이미 호출되었으므로 다시 호출할 필요가 없습니다.
          return; // 최종 피날레 로직으로 넘어갑니다.
        }
      }

      let finaleElapsedTime = elapsedTime - this.CYCLE_DURATION;

      // 피날레 애니메이션과 함께 그리드 그리기
      this.drawGrid(this.quadrantData, this.gridMode, 0, finaleElapsedTime);
    }

    // 이전 사이클의 피날레 애니메이션이 아직 진행 중이라면 함께 그립니다.
    if (this.previousFinaleData) {
      let prevFinaleElapsedTime = millis() - this.previousFinaleStartTime;
      this.drawGrid([this.previousFinaleData], this.gridMode, 0, prevFinaleElapsedTime);
    }
  }

  drawGrid(quadrantData, gridMode, globalXOffset = 0, finaleElapsedTime = -1, staffOnly = false, overrideAlpha = -1, isShaking = false) {
    const scaleFactor = 1.0 / gridMode;
    const sizeMultiplier = scaleFactor;

    // 피날레 애니메이션 중일 경우 알파 값 계산 (255 -> 0)
    const isFinale = finaleElapsedTime >= 0;
    let finaleAlpha = isFinale ? map(finaleElapsedTime, 0, this.FINALE_DURATION, 255, 0) : 255;
    if (overrideAlpha !== -1) finaleAlpha = overrideAlpha; // 77초 피날레의 알파값으로 덮어쓰기

    // 줌 애니메이션 진행
    if (this.zoomState === 'zooming') {
      let elapsed = (millis() - this.zoomStartTime) / 1000;
      let progress = constrain(elapsed / this.zoomDuration, 0, 1);
      this.currentZoom = lerp(1.0, this.targetZoom, progress);
      if (progress >= 1) {
        this.zoomState = 'done';
        this.currentZoom = this.targetZoom;
      }
    }

    // --- 배경 악보 그리기 ---
    if (!staffOnly) {
      this.drawBackgroundElements(finaleAlpha, this.currentZoom, finaleElapsedTime, isShaking);
    }

    // --- 메인 악보 그리기 (줌 적용) ---
    push();
    // 줌의 중심을 화면 중앙으로 맞추기 위해 translate 사용
    translate(width / 2, height / 2);
    scale(this.currentZoom);
    translate(-width / 2, -height / 2);

    const data = quadrantData[0]; // 항상 첫 번째 그리드 데이터 사용
    if (staffOnly) {
      // staffOnly 모드일 때는 악보 데이터가 없어도 오선지를 그립니다.
      this.drawScoreElements(null, finaleElapsedTime, finaleAlpha, sizeMultiplier, staffOnly, isShaking);
    } else if (data) {
      // 일반 모드에서는 데이터가 있을 때만 그립니다.
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

    // --- note_density를 동적으로 계산 ---
    const scene2StartTime = 60.167;
    const currentTime = this.song.currentTime();
    const scene2EndTime = scene2StartTime + this.densityAnimationDuration;
    // 현재 진행률(0.0 ~ 1.0)을 계산합니다.
    const progress = constrain(map(currentTime, scene2StartTime, scene2EndTime, 0, 1), 0, 1);
    // 진행률에 따라 note_density를 30에서 1로 선형 보간합니다.
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

      // 새로 추가된 심볼들 생성
      const symbolTypes = Object.keys(this.BRAVURA_SYMBOLS).filter(key => ![
        'TREBLE_CLEF', 'BASS_CLEF', 'WHOLE_REST', 'HALF_REST', 'QUARTER_REST', 'EIGHTH_REST', 'SIXTEENTH_REST',
        'TIME_4_4', 'TIME_3_4', 'TIME_2_4', 'TIME_C', 'WHOLE_NOTE', 'HALF_NOTE', 'QUARTER_NOTE', 'EIGHTH_NOTE', 'SIXTEENTH_NOTE'
      ].includes(key));

      if (random() < 0.3) { // 30% 확률로 심볼 추가
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
    // --- 배경 악보 밀도를 동적으로 계산 ---
    const scene2StartTime = 60.167;
    const currentTime = this.song.currentTime();
    const scene2EndTime = scene2StartTime + this.densityAnimationDuration;
    const progress = constrain(map(currentTime, scene2StartTime, scene2EndTime, 0, 1), 0, 1);
    // 진행률에 따라 배경 악보의 밀도를 0에서 500으로 선형 보간
    const currentTotalDensity = lerp(this.initialBackgroundDensity, this.targetBackgroundDensity, progress);

    // 전체 밀도를 6단계로 나누어 각 단계마다 생성
    const density = currentTotalDensity / this.NUM_STEPS;
    for (let i = 0; i < density; i++) {
      const x = random(width);
      const y = random(height);
      const typeRoll = random();

      let newElement = { x, y, finale_dx: 0, finale_dy: 0 };

      if (typeRoll < 0.25) { // Note
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

      } else if (typeRoll < 0.5) { // Rest
        const restTypeRoll = random();
        let restType;
        if (restTypeRoll < 0.25) restType = 'whole';
        else if (restTypeRoll < 0.5) restType = 'half';
        else if (restTypeRoll < 0.75) restType = 'quarter';
        else restType = 'eighth';

        newElement.type = 'rest';
        newElement.subType = restType;

      } else if (typeRoll < 0.65) { // Clef
        const clefType = random() < 0.5 ? 'treble' : 'bass';
        newElement.type = 'clef';
        newElement.subType = clefType;

      } else if (typeRoll < 0.8) { // New Symbols
        const symbolTypes = Object.keys(this.BRAVURA_SYMBOLS).filter(key => ![
          'TREBLE_CLEF', 'BASS_CLEF', 'WHOLE_REST', 'HALF_REST', 'QUARTER_REST', 'EIGHTH_REST', 'SIXTEENTH_REST',
          'TIME_4_4', 'TIME_3_4', 'TIME_2_4', 'TIME_C', 'WHOLE_NOTE', 'HALF_NOTE', 'QUARTER_NOTE', 'EIGHTH_NOTE', 'SIXTEENTH_NOTE'
        ].includes(key));

        const randomSymbolKey = random(symbolTypes);
        newElement.type = 'symbol';
        newElement.subType = randomSymbolKey;

      } else { // BeamNote
        newElement.type = 'beam';
        newElement.beamNote = new BeamNote(x, y, this.note_height);
      }
      this.backgroundElements.push(newElement);
    }
  }

  drawBackgroundElements(alpha, zoomFactor = 1.0, finaleElapsedTime = -1, isShaking = false) {
    const isFinale = finaleElapsedTime >= 0;

    const now = millis();
    if (isShaking && now - this.lastShakeTime > this.shakeBeatDuration) {
      // 비트가 업데이트될 때만 lastShakeTime을 갱신합니다.
      // 실제 흔들림은 각 요소에서 개별적으로 적용됩니다.
      this.lastShakeTime = now;
    }

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

    // 오선 그리기
    // 77초 피날레 중에도 오선지는 투명해지지 않도록 항상 alpha 255로 그림
    const allStaffYPositions = [];
    for (let j = 0; j < this.staff_num; j++) {
      allStaffYPositions.push(100 + j * this.note_height * 25);
      allStaffYPositions.push(100 + this.note_height * 10 + j * this.note_height * 25);
    }
    allStaffYPositions.forEach(yPos => this.drawStaff(yPos, 255));

    // 세로선 그리기
    // 77초 피날레 중에도 세로선은 투명해지지 않도록 항상 alpha 255로 그림
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

    // 오선지만 그리는 경우 여기서 함수를 종료합니다.
    if (staffOnly) return;

    // 악보 요소 그리기
    const now = millis();
    if (isShaking && now - this.lastShakeTime > this.shakeBeatDuration) {
      // 메인 악보와 배경 악보의 흔들림을 동기화하기 위해
      // drawBackgroundElements에서 이미 this.lastShakeTime이 업데이트되었을 것입니다.
      // 여기서는 별도 업데이트를 하지 않습니다.
    }

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

  generateElementsForAllScreen() {
    this.savedNotes = []; this.savedBeamNotes = []; this.savedRests = [];
    this.savedTimeSignatures = []; this.savedClefs = [];

    for (let i = 0; i < this.finale_note_density; i++) {
      this.savedNotes.push({ type: 'whole', x: random(width), y: random(height), barChance: random(), dotChance: random() });
      this.savedNotes.push({ type: 'half', x: random(width), y: random(height), isRotated: random() < 0.5, barChance: random(), dotChance: random() });
      this.savedNotes.push({ type: 'quarter', x: random(width), y: random(height), isRotated: random() < 0.5, barChance: random(), dotChance: random() });

      let beamNote = new BeamNote(0, 0, this.note_height);
      this.savedBeamNotes.push({ beamNote: beamNote, x: random(width), y: random(height), isRotated: random() >= 0.5 });

      this.savedRests.push({ type: 'whole', x: random(width), y: random(height) });
      this.savedRests.push({ type: 'half', x: random(width), y: random(height) });
      this.savedRests.push({ type: 'quarter', x: random(width), y: random(height) });
      this.savedRests.push({ type: 'eighth', x: random(width), y: random(height) });
      this.savedRests.push({ type: 'sixteenth', x: random(width), y: random(height) });

      this.savedTimeSignatures.push({ type: '44', x: random(width), y: random(height) });
      this.savedTimeSignatures.push({ type: '68', x: random(width), y: random(height) });

      this.savedNotes.push({ type: 'eighth', x: random(width), y: random(height) });
      this.savedNotes.push({ type: 'sixteenth', x: random(width), y: random(height) });
    }

    for (let i = 0; i < 5; i++) {
      this.savedClefs.push({ type: 'treble', x: 63, y: random(height) });
      this.savedClefs.push({ type: 'bass', x: 63, y: random(height) });
    }
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

  // Bravura 폰트로 음표를 그리는 헬퍼 함수
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
  // --- 새로 추가된 심볼을 그리는 함수들 ---
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
  // --- randomScores.js 함수 끝 ---

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