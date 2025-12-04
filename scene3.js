class Scene3 {
  constructor(bravuraFont) {

    this.SMILE_EMOJI_START_TIME = 180.6;
    this.EMOJI_DURATION = 1.5;
    this.GATHER_START_TIME = 174; // 중앙으로 모이는 애니메이션 시작 시간
    this.GATHER_END_TIME = 180.6;   // 중앙으로 모이는 애니메이션 종료 시간
    this.GATHER_START_RANDOM_DURATION = 5; // 출발 시간의 무작위 범위 (초)
    this.GATHER_END_RANDOM_DURATION = 3;   // 도착 시간의 무작위 범위 (초)

    this.song = song;
    this.video = null; // 비디오 엘리먼트
    this.asciiGlyphs = [];

    // --- 그리드 설정 ---
    this.initialCols = 37;
    this.initialRows = 20;
    // this.finalCols = 56;
    // this.finalRows = 32;

    this.finalCols = 112;
    this.finalRows = 64;

    this.cols = 0;
    this.rows = 0;
    this.cellSize = 0;
    this.glyphSize = 0;

    // --- 전환 애니메이션 상태 ---
    this.transitionState = 'idle'; // 'idle', 'shrinking', 'expanding', 'expansion_done', 'morphing', 'playing'
    this.transitionStartTime = 0;
    this.shrinkDuration = 3000; // 3초
    this.expansionDuration = 6000; // 6초
    this.morphDelay = 100; // 0.1초
    this.morphDuration = 3200; // 3.2초

    this.gridData = []; // 그리드 셀의 정보를 담는 배열

    // --- 색상 변경 애니메이션 (후반부) ---
    this.lastColorChangeTime = 0;
    this.colorChangeInterval = 60000 / 48; // 48 BPM
    this.sweepStartTime = 0;
    this.sweepDuration = 400; // 0.4초
    this.bgHoldDuration = 100; // 0.3초 (배경 검은색 유지)
    this.bgFadeDuration = 400; // 0.4초 (배경 흰색으로 복귀)
    this.shuffledCols = []; // 색상 변경을 위해 무작위로 섞인 열 인덱스

    this.randomChars = ".`,-':;~i!lI?rvunogxcyz[]{}1()O0S9EZG%#MW&B@$";
    

    this.currentScale = 1; // 줌 효과는 사용하지 않으므로 1로 고정
    this.targetScale = 1;
    this.isReady = false; // 에셋 로딩 및 파싱 완료 여부
    this.shakePixel = 0.5; // Scene4와 동일한 떨림 강도

    // --- 원 그리기 설정 ---
    this.circleColors = {};
    this.circlePatterns = [];

    // --- '6' 키 임팩트 효과 변수 ---
    this.impactActive = false;
    this.impactCenter = null;
    this.impactStartTime = 0;
    this.impactExpandDuration = 10; // 0.1초
    this.impactContractDuration = 200; // 0.5초
    this.impactMaxDisplacement = 400; // 최대 이동 거리 (픽셀)

    // --- '점프' 애니메이션 변수 ---
    this.jumpBpm = 225;
    this.jumpBeatDuration = 60000 / this.jumpBpm;
    this.lastJumpTime = 0;
    this.jumpAnimationDuration = 200; // 0.2초
    this.baseJumpProbability = 0.005; // 5%
  }

  preload() {
    // 폰트는 외부에서 전달받으므로, 이 씬에서는 preload할 것이 없습니다.
    // 비디오 에셋을 preload에서 로드하여 setup 이전에 로딩을 보장합니다.
    this.video = createVideo(['assets/footage2.mp4']);
  }

  
  // 메인 스케치의 setup에서 호출됩니다.
  setup() {
    // --- 비디오 설정 ---
    this.video.volume(0); // 비디오 소리 끄기
    this.video.hide(); // 비디오 엘리먼트를 화면에 표시하지 않음
    this.video.loop(); // 비디오 반복 재생

    // 최종 그리드(180x101)를 기준으로 셀 크기 계산
    this.cols = this.finalCols;
    this.rows = this.finalRows;
    this.cellSize = width / this.cols;
    this.glyphSize = this.cellSize;

    // 제공된 문자열은 밀도가 낮은 순서(. -> @)로 정렬되어 있습니다.
    const densityString = ".`,-':;~i!lI?rvunogxcyz[]{}1()O0S9EZG%#MW&B@$";
    
    // 밝기 매핑을 위해 배열을 뒤집어, 어두울수록 밀도 높은 문자가 선택되도록 합니다.
    this.asciiGlyphs = densityString.split('').reverse();

    this.isReady = true;

    // --- 원 그리기 색상 및 패턴 정의 ---
    this.circleColors = {
      color1: color(255, 0, 0),       // 빨강
      color2: color(172, 198, 246), // 연한 하늘색
      color3: color(95, 20, 18),        // 자주색
      color4: color(115, 70, 142),    // 보라색
      color5: color(69, 151, 239),    // 파란색
      color6: color(113, 219, 246), // 형광 하늘색
      color7: color(39, 38, 43)        // 검정
    };

    // 밝기가 어두운 순서대로 패턴 정의
    const cellD = this.cellSize;
    this.circlePatterns = [
      [{ color: 'color7', size: cellD / 1.2 }, { color: 'color3', size: cellD / 2 }],
      [{ color: 'color7', size: cellD / 1.2 }, { color: 'color4', size: cellD / 1.6 }, { color: 'color3', size: cellD / 2.6 }],
      [{ color: 'color4', size: cellD / 1.2 }, { color: 'color7', size: cellD / 2 }],
      [{ color: 'color7', size: cellD / 1.2 }, { color: 'color2', size: cellD / 1.6 }, { color: 'color5', size: cellD / 2 }],
      [{ color: 'color5', size: cellD / 1.2 }, { color: 'color1', size: cellD / 1.6 }],
      [{ color: 'color2', size: cellD / 1.2 }, { color: 'color6', size: cellD / 1.4 }, { color: 'color5', size: cellD / 2.3 }],
      [{ color: 'color2', size: cellD / 1.2 }, { color: 'color6', size: cellD / 2 }]
    ];
    
    console.log("Scene 3 is set up and ready.");
    console.log(`Grid: ${this.cols}x${this.rows}`);
    console.log(`Using ${this.asciiGlyphs.length} glyphs: ${this.asciiGlyphs.join('')}`);
  }

  // 씬이 활성화될 때마다 호출됩니다.
  enter() {
    if (this.video) {
      this.video.time(0);
      this.video.pause(); // 애니메이션이 끝날 때까지 비디오 정지
    }
    this.currentScale = 1;
    this.targetScale = 1;
    this.transitionState = 'shrinking';
    this.transitionStartTime = millis();
    this.prepareInitialGrid();

    // --- 임팩트 상태 리셋 ---
    this.impactActive = false;

    // --- 점프 상태 리셋 ---
    this.lastJumpTime = 0;

    frameRate(30); // 비디오 프레임레이트와 유사하게 설정
  }

  // 메인 스케치의 draw에서 호출됩니다.
  draw() {
    // 이 씬의 모든 그리기 작업을 push/pop으로 감싸서
    // 외부(다른 씬 또는 sketch.js)에 영향을 주지 않도록 격리합니다.
    push();
    background(255);
    
    const currentTime = this.song.isPlaying() ? this.song.currentTime() : 0;

    // 스마일 이모지 시간대에는 다른 모든 애니메이션을 중지하고 이모지만 그립니다.
    if (currentTime >= this.SMILE_EMOJI_START_TIME && currentTime <= this.SMILE_EMOJI_START_TIME + this.EMOJI_DURATION) {
      push();
      textAlign(CENTER, CENTER);
      translate(random(-this.shakePixel, this.shakePixel), random(-this.shakePixel, this.shakePixel)); // 떨림 효과 적용
      fill(random(245, 255), 20);
      rectMode(CENTER);
      rect(width / 2, height / 2, windowWidth, windowHeight);
      const scene4GridSize = 39;
      const emojiSize = min(width / scene4GridSize, height / scene4GridSize) * 0.8;
      textSize(emojiSize);
      text('😄', width / 2, height / 2);
      pop();
      pop(); // draw() 시작의 push()에 대한 pop
      return; // 이모지를 그린 후, 나머지 draw 로직을 실행하지 않고 종료합니다.
    }

    if (!this.isReady || this.video.width === 0) {
      textAlign(CENTER, CENTER);
      fill(0);
      textSize(32);
      text("Loading Scene 3 Assets...", width / 2, height / 2);
      pop(); // push에 대한 pop
      return;
    }

    if (this.transitionState === 'shrinking') {
      this.updateAndDrawShrinking();
    } else if (this.transitionState === 'expanding') {
      this.updateAndDrawExpansion();
    } else if (this.transitionState === 'expansion_done') {
      this.handleExpansionDone();
    } else if (this.transitionState === 'morphing') {
      this.updateAndDrawMorphing();
    } else if (this.transitionState === 'playing') {
      this.drawAsciiArt();
    }

    pop(); // push에 대한 pop
  }

  prepareInitialGrid() {
    this.gridData = [];
    const poem = `Look again at that dot.
    That's here. That's home. That's us.
    On it everyone you love, everyone you know,
    everyone you ever heard of, every human being who ever was,
    lived out their lives. The aggregate of our joy and suffering,
    thousands of confident religions, ideologies, and economic doctrines,
    every hunter and forager, every hero and coward,
    every creator and destroyer of civilization, every king and peasant,
    every young couple in love, every mother and father, hopeful child,
    inventor and explorer, every teacher of morals, every corrupt politician,
    every "superstar," every "supreme leader," every saint and sinner in the
    history of our species lived there--on a mote of dust suspended in a sunbeam.`;
    
    const poemChars = poem.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    for (let i = 0; i < this.finalCols * this.finalRows; i++) {
      this.gridData.push({
        char: ' ',
        targetChar: ' ',
        color: color(0, 0, 255), // 파란색
        isMorphed: false, // morph 애니메이션에서 변환되었는지 여부
        // --- 중앙으로 모이는 애니메이션을 위한 속성 ---
        gatherStartTime: 0,
        gatherEndTime: 0,
        previousChar: ' ', // 이전 프레임의 문자를 저장
        highlightStartTime: 0, // 하이라이트 시작 시간
        highlightColor: null, // 하이라이트 색상
        impactRandomFactor: 1.0, // '6'키 임팩트 효과의 랜덤 계수
        // --- 점프 애니메이션 속성 ---
        isJumping: false,
        jumpStartTime: 0,
        jumpDirection: -1, // -1: up, 1: down
      });
    }

    // 초기 37x20 그리드에 시 글귀를 채웁니다.
    // 글자들이 그리드의 중앙에 위치하도록 시작점을 계산합니다.
    const centerCol = floor(this.finalCols / 2);
    const centerRow = floor(this.finalRows / 2);
    const startCol = floor(centerCol - this.initialCols / 2);
    const startRow = floor(centerRow - this.initialRows / 2);

    for (let j = 0; j < this.initialRows; j++) {
      for (let i = 0; i < this.initialCols; i++) {
        const sourceIndex = j * this.initialCols + i;
        const targetIndex = (startRow + j) * this.finalCols + (startCol + i);
        if (this.gridData[targetIndex]) {
          // 인용문 길이 내에서만 글자를 채우고, 나머지는 공백으로 둡니다.
          if (sourceIndex < poemChars.length) {
            this.gridData[targetIndex].char = poemChars[sourceIndex];
          }
          // sourceIndex가 poemChars.length 이상이면, 초기값인 ' '가 유지됩니다.
        }
      }
    }
  }

  updateAndDrawShrinking() {
    const elapsedTime = millis() - this.transitionStartTime;
    const progress = constrain(elapsedTime / this.shrinkDuration, 0, 1);

    // 최종 그리드(180x111) 기준, 30x18 영역의 크기
    const targetGridWidth = this.initialCols * this.cellSize;
    const targetGridHeight = this.initialRows * this.cellSize;

    // 현재 그리드의 크기와 위치를 lerp로 계산
    const currentGridWidth = lerp(width, targetGridWidth, progress);
    const currentGridHeight = lerp(height, targetGridHeight, progress);
    const currentX = lerp(0, (width - targetGridWidth) / 2, progress);
    const currentY = lerp(0, (height - targetGridHeight) / 2, progress);

    // 현재 셀과 글자 크기 계산
    const currentCellWidth = currentGridWidth / this.initialCols;
    const currentCellHeight = currentGridHeight / this.initialRows;
    const currentTextSize = min(currentCellWidth, currentCellHeight);

    background(255);
    textAlign(CENTER, CENTER);
    textSize(currentTextSize);
    fill(0, 0, 255); // Scene2와 동일하게 파란색

    // 글자들이 그리드의 중앙에 위치하도록 시작점을 계산
    const centerCol = floor(this.finalCols / 2);
    const centerRow = floor(this.finalRows / 2);
    const startCol = floor(centerCol - this.initialCols / 2);
    const startRow = floor(centerRow - this.initialRows / 2);

    for (let j = 0; j < this.initialRows; j++) {
      for (let i = 0; i < this.initialCols; i++) {
        // 중앙에 위치한 글자 데이터를 가져옵니다.
        const targetIndex = (startRow + j) * this.finalCols + (startCol + i);
        if (this.gridData[targetIndex]) {
          const cell = this.gridData[targetIndex];
          const x = currentX + i * currentCellWidth + currentCellWidth / 2;
          const y = currentY + j * currentCellHeight + currentCellHeight / 2;
          text(cell.char, x, y);
        }
      }
    }

    if (progress >= 1) {
      this.transitionState = 'expanding';
      this.transitionStartTime = millis();
    }
  }

  updateAndDrawExpansion() {
    const elapsedTime = millis() - this.transitionStartTime;
    const progress = constrain(elapsedTime / this.expansionDuration, 0, 1);
    const now = millis();

    // 현재 진행률에 따라 보여줄 그리드 크기 계산
    const currentCols = floor(lerp(this.initialCols, this.finalCols, progress));
    const currentRows = floor(lerp(this.initialRows, this.finalRows, progress));

    // 색상 변경
    const numToBlacken = floor(progress * this.gridData.length);
    let blueIndices = [];
    this.gridData.forEach((cell, i) => {
      if (cell.color.levels[2] === 255) blueIndices.push(i);
    });
    for (let i = 0; i < numToBlacken - (this.gridData.length - blueIndices.length); i++) {
      if (blueIndices.length > 0) {
        const randIdx = floor(random(blueIndices.length));
        const gridIdx = blueIndices.splice(randIdx, 1)[0];
        const cell = this.gridData[gridIdx];
        cell.color = color(0); // 검은색으로 변경
        // 색상이 변경되는 순간 하이라이트 트리거
        if (random() < 0.3) { // 30% 확률
          cell.highlightStartTime = now;
          cell.highlightColor = color(random(130, 255), random(50, 200), random(200, 255), 40);
        }
      }
    }

    // 그리기
    background(255);
    textAlign(CENTER, CENTER);
    textSize(this.glyphSize);

    // 최종 그리드를 화면 중앙에 위치시키기 위한 오프셋
    const offsetX = (width - this.finalCols * this.cellSize) / 2;
    const offsetY = (height - this.finalRows * this.cellSize) / 2;

    // 중앙에서부터 상하좌우로 확장되도록 그릴 범위를 계산합니다.
    const centerCol = floor(this.finalCols / 2);
    const centerRow = floor(this.finalRows / 2);
    const startCol = floor(centerCol - currentCols / 2);
    const endCol = floor(centerCol + currentCols / 2);
    const startRow = floor(centerRow - currentRows / 2);
    const endRow = floor(centerRow + currentRows / 2);

    for (let j = startRow; j < endRow; j++) {
      for (let i = startCol; i < endCol; i++) {
        const cell = this.gridData[j * this.finalCols + i];
        if (!cell) continue;

        const x = offsetX + i * this.cellSize + this.cellSize / 2;
        const y = offsetY + j * this.cellSize + this.cellSize / 2;

        // --- 하이라이트 그리기 ---
        if (cell.highlightStartTime > 0 && now - cell.highlightStartTime < 100) {
          push();
          noStroke();
          fill(cell.highlightColor);
          rect(x - this.cellSize / 2, y - this.cellSize / 2, this.cellSize, this.cellSize);
          pop();
        } else {
          cell.highlightStartTime = 0;
        }

        if (progress > 0 && random() > 0.988) {
          // 초기 30x18 영역 밖의 셀에만 무작위 문자를 채웁니다.
          cell.char = random(this.randomChars.split(''));
          // 문자가 변경되는 순간 하이라이트 트리거
          if (random() < 0.3) { // 30% 확률
            cell.highlightStartTime = now;
            cell.highlightColor = color(random(130, 255), random(50, 200), random(200, 255), 40);
          }
        }
        fill(cell.color);
        text(cell.char, x, y);
      }
    }

    if (progress >= 1) {
      // expansion이 끝나면 'expansion_done' 상태로 전환하고, 현재 시간을 기록합니다.
      this.transitionState = 'expansion_done';
      this.transitionStartTime = millis();
    }
  }

  handleExpansionDone() {
    // expansion의 마지막 프레임을 계속 그립니다.
    background(255);
    textAlign(CENTER, CENTER);
    textSize(this.glyphSize);

    const offsetX = (width - this.finalCols * this.cellSize) / 2;
    const offsetY = (height - this.finalRows * this.cellSize) / 2;

    for (let i = 0; i < this.gridData.length; i++) {
      const cell = this.gridData[i];
      const x = offsetX + (i % this.finalCols) * this.cellSize + this.cellSize / 2;
      const y = offsetY + floor(i / this.finalCols) * this.cellSize + this.cellSize / 2;
      fill(cell.color);
      text(cell.char, x, y);
    }

    // 0.5초(500ms)가 지났는지 확인합니다.
    const elapsedTime = millis() - this.transitionStartTime;
    if (elapsedTime >= this.morphDelay) {
      // 0.5초가 지나면 morphing 상태로 전환하고, 애니메이션을 준비합니다.
      console.log("Starting morphing after 0.5s delay.");
      this.transitionState = 'morphing';
      this.transitionStartTime = millis(); // morphing 애니메이션 시작 시간 재설정
      this.prepareMorphTarget(); // morphing 목표 프레임 준비
    }
  }

  prepareMorphTarget() {
    const songTime = this.song.currentTime();
    const HIGHLIGHT_FADE_START_TIME = 170; // 2분 50초
    const HIGHLIGHT_FADE_DURATION = 4;     // 4초
    const HIGHLIGHT_FADE_END_TIME = HIGHLIGHT_FADE_START_TIME + HIGHLIGHT_FADE_DURATION;

    let highlightProbability = 0.3; // 기본 확률

    if (songTime >= HIGHLIGHT_FADE_START_TIME && songTime < HIGHLIGHT_FADE_END_TIME) {
      // 170초부터 174초까지 확률을 0.5에서 0으로 점차 줄입니다.
      highlightProbability = map(songTime, HIGHLIGHT_FADE_START_TIME, HIGHLIGHT_FADE_END_TIME, 0.5, 0);
    } else if (songTime >= HIGHLIGHT_FADE_END_TIME) {
      highlightProbability = 0; // 174초 이후에는 확률을 0으로 고정합니다.
    }

    this.video.loadPixels();
    if (this.video.pixels.length > 0) {
      for (let i = 0; i < this.gridData.length; i++) {
        const col = i % this.finalCols;
        const row = floor(i / this.finalCols);
        const videoX = floor(map(col + 0.5, 0, this.finalCols, 0, this.video.width));
        const videoY = floor(map(row + 0.5, 0, this.finalRows, 0, this.video.height));
        const idx = (videoY * this.video.width + videoX) * 4;
        const r = this.video.pixels[idx];
        const g = this.video.pixels[idx + 1];
        const b = this.video.pixels[idx + 2];
        const brightness = (r + g + b) / 3;
        const glyphIndex = floor((brightness / 255) * (this.asciiGlyphs.length - 1));
        this.gridData[i].targetChar = this.asciiGlyphs[glyphIndex];

        // --- 하이라이트 로직: 문자가 변경되었는지 확인 ---
        // 문자가 변경되었고, 50% 확률을 통과하면 하이라이트
        if (this.gridData[i].targetChar !== this.gridData[i].previousChar && random() < highlightProbability) {
          this.gridData[i].highlightStartTime = millis();
          // 하이라이트 색상 설정: (random(200,255), 0, 0, 20)
          this.gridData[i].highlightColor = color(random(130, 255), random(50, 200), random(200, 255),40);
          // 이전 문자를 현재 문자로 업데이트
          this.gridData[i].previousChar = this.gridData[i].targetChar;
        }
        this.gridData[i].color = color(0); // 최종 색상은 검정
      }
    }
  }

  updateAndDrawMorphing() {
    const elapsedTime = millis() - this.transitionStartTime;
    const progress = constrain(elapsedTime / this.morphDuration, 0, 1);
    const now = millis();

    background(255);
    textAlign(CENTER, CENTER);
    textSize(this.glyphSize);

    const offsetX = (width - this.finalCols * this.cellSize) / 2;
    const offsetY = (height - this.finalRows * this.cellSize) / 2;

    for (let i = 0; i < this.gridData.length; i++) {
      const cell = this.gridData[i];
      const x = offsetX + (i % this.finalCols) * this.cellSize + this.cellSize / 2;
      const y = offsetY + floor(i / this.finalCols) * this.cellSize + this.cellSize / 2;

      // --- 하이라이트 그리기 ---
      if (cell.highlightStartTime > 0 && now - cell.highlightStartTime < 100) {
        push();
        noStroke();
        fill(cell.highlightColor);
        rect(x - this.cellSize / 2, y - this.cellSize / 2, this.cellSize, this.cellSize);
        pop();
      } else {
        cell.highlightStartTime = 0;
      }

      // 아직 변환되지 않은 셀에 대해서만 확률적으로 변환을 시도합니다.
      if (!cell.isMorphed && random() < progress * 0.25) {
        cell.isMorphed = true;
        // 글자가 변하는 순간, 30% 확률로 하이라이트 효과를 트리거합니다.
        if (random() < 0.3) {
          cell.highlightStartTime = now;
          cell.highlightColor = color(random(130, 255), random(50, 200), random(200, 255), 40);
        }
      }
      fill(0); // 글자 색상은 검정
      // isMorphed 상태에 따라 그릴 문자를 결정합니다.
      text(cell.isMorphed ? cell.targetChar : cell.char, x, y);
    }

    if (progress >= 1) {
      // 애니메이션이 끝나면 모든 셀을 morphed 상태로 만듭니다.
      for (let i = 0; i < this.gridData.length; i++) {
        this.gridData[i].isMorphed = true;
      }

      this.transitionState = 'playing';
      // --- 중앙으로 모이는 애니메이션 준비 ---
      for (const cell of this.gridData) {
        const startTime = this.GATHER_START_TIME + random(this.GATHER_START_RANDOM_DURATION);
        const endTime = this.GATHER_END_TIME - random(this.GATHER_END_RANDOM_DURATION);

        // 시작 시간이 종료 시간보다 늦어지는 경우를 방지합니다.
        // 만약 startTime이 endTime보다 크면, endTime을 startTime 바로 다음으로 설정하여
        // 애니메이션이 즉시 끝나도록 보장합니다.
        cell.gatherStartTime = startTime;
        cell.gatherEndTime = max(startTime + 0.1, endTime); // 최소 0.1초의 애니메이션 시간 보장
      }

      this.video.play();
    }
  }
  
  drawAsciiArt() {
    // 먼저 비디오의 현재 프레임을 기반으로 목표 문자를 업데이트합니다.
    this.prepareMorphTarget();

    if (this.video.pixels.length === 0) return;

    const now = millis();
    const songTime = song.currentTime(); // 메인 스케치의 전역 song 변수 참조

    // --- 기존 문자 기반 아스키 아트 ---
    // --- 점프 애니메이션 트리거 ---
    if (now - this.lastJumpTime > this.jumpBeatDuration) {
      this.lastJumpTime = now;

      // 하이라이트 확률과 동일한 로직으로 점프 확률 계산
      let jumpProbability = this.baseJumpProbability;
      const FADE_START_TIME = 170; // 2분 50초
      const FADE_DURATION = 4;     // 4초
      const FADE_END_TIME = FADE_START_TIME + FADE_DURATION;

      if (songTime >= FADE_START_TIME && songTime < FADE_END_TIME) {
        jumpProbability = map(songTime, FADE_START_TIME, FADE_END_TIME, this.baseJumpProbability, 0);
      } else if (songTime >= FADE_END_TIME) {
        jumpProbability = 0;
      }

      if (jumpProbability > 0) {
        const numToJump = floor(this.gridData.length * jumpProbability);
        const shuffledIndices = shuffle(Array.from({ length: this.gridData.length }, (_, i) => i));

        for (let i = 0; i < numToJump; i++) {
          const cellIndex = shuffledIndices[i];
          const cell = this.gridData[cellIndex];
          if (!cell.isJumping) {
            cell.isJumping = true;
            cell.jumpStartTime = now;
            cell.jumpDirection = (floor(cellIndex / this.finalCols) === 0) ? 1 : -1; // 최상단 행이면 아래로, 아니면 위로
          }
        }
      }
    }
    let bgColor = 255;
    const bgAnimElapsedTime = now - this.sweepStartTime;
    if (bgAnimElapsedTime >= 0) {
      if (bgAnimElapsedTime < this.bgHoldDuration) {
        bgColor = 180;
      } else if (bgAnimElapsedTime < this.bgHoldDuration + this.bgFadeDuration) {
        bgColor = map(bgAnimElapsedTime - this.bgHoldDuration, 0, this.bgFadeDuration, 150, 255);
      }
    }
    background(bgColor);

    textAlign(CENTER, CENTER);
    textSize(this.glyphSize);
    fill(0);

    const offsetX = (width - this.finalCols * this.cellSize) / 2;
    const offsetY = (height - this.finalRows * this.cellSize) / 2;

    if (songTime > 190.5 && now - this.lastColorChangeTime > this.colorChangeInterval) {
      this.lastColorChangeTime = now;
      this.sweepStartTime = now;
      this.shuffledCols = shuffle(Array.from({ length: this.finalCols }, (_, i) => i));
      const newTargetColor = color(random(255), random(255), random(255));
      for (const cell of this.gridData) {
        cell.targetColor = newTargetColor;
      }
    }

    const sweepProgress = constrain((now - this.sweepStartTime) / this.sweepDuration, 0, 1);
    const numColsToColor = floor(sweepProgress * this.finalCols);
    const colsToColorSet = new Set(this.shuffledCols.slice(0, numColsToColor));

    // --- 175초부터 180초까지 중앙으로 모이는 애니메이션 ---
    // 모든 글자가 도착할 충분한 시간을 주기 위해, 애니메이션 종료 시간을 GATHER_END_TIME보다 넉넉하게 줍니다.
    // (예: GATHER_END_TIME + 1초)
    if (songTime >= this.GATHER_START_TIME && songTime < this.GATHER_END_TIME + 1) {
      const gatherProgress = map(songTime, this.GATHER_START_TIME, this.GATHER_END_TIME, 0, 1);
      const screenCenterX = width / 2;
      const screenCenterY = height / 2;
      const shakeAmount = 1.5; // 미세한 떨림의 강도 (픽셀 단위)

      for (let i = 0; i < this.gridData.length; i++) {
        const cell = this.gridData[i];
        const originalX = offsetX + (i % this.finalCols) * this.cellSize + this.cellSize / 2;
        const originalY = offsetY + floor(i / this.finalCols) * this.cellSize + this.cellSize / 2;

        let currentX = originalX;
        let currentY = originalY;

        if (songTime >= cell.gatherStartTime) {
          // 선형 진행률(0 to 1)을 계산합니다.
          // constrain을 사용하여 진행률이 1을 초과하지 않도록 제한합니다.
          const linearProgress = constrain(map(songTime, cell.gatherStartTime, cell.gatherEndTime, 0, 1), 0, 1);
          // 진행률을 제곱하여 ease-in 효과를 적용합니다 (시작은 느리게, 끝은 빠르게).
          const easedProgress = linearProgress * linearProgress;
          currentX = lerp(originalX, screenCenterX, easedProgress);
          currentY = lerp(originalY, screenCenterY, easedProgress);
          // 미세한 떨림 효과 추가
          currentX += random(-shakeAmount, shakeAmount);
          currentY += random(-shakeAmount, shakeAmount);
        }
        text(cell.targetChar, currentX, currentY);
      }
      return; // 아래의 일반 그리기 로직을 건너뜁니다.
    }

    for (let i = 0; i < this.gridData.length; i++) {
      const cell = this.gridData[i];
      let x = offsetX + (i % this.finalCols) * this.cellSize + this.cellSize / 2;
      let y = offsetY + floor(i / this.finalCols) * this.cellSize + this.cellSize / 2;

      // --- 점프 애니메이션 y좌표 계산 ---
      if (cell.isJumping) {
        const jumpElapsed = now - cell.jumpStartTime;
        if (jumpElapsed < this.jumpAnimationDuration) {
          const jumpProgress = jumpElapsed / this.jumpAnimationDuration;
          // sin 함수를 이용해 부드럽게 올라갔다 내려오는 움직임 구현 (0 -> 1 -> 0)
          const jumpOffset = sin(jumpProgress * PI) * this.cellSize * cell.jumpDirection;
          y -= jumpOffset;
        } else {
          cell.isJumping = false; // 애니메이션 종료
        }
      }


      // --- 임팩트 효과 계산 ---
      if (this.impactActive) {
        const elapsed = millis() - this.impactStartTime;
        const totalDuration = this.impactExpandDuration + this.impactContractDuration;

        if (elapsed < totalDuration) {
          const glyphPos = createVector(x, y);
          const direction = p5.Vector.sub(glyphPos, this.impactCenter);
          const distance = direction.mag();
          direction.normalize();

          // 거리에 반비례하는 이동량 (가까울수록 많이 움직임)
          const baseDisplacement = map(distance, 0, width, this.impactMaxDisplacement, 10);
          const displacement = baseDisplacement * cell.impactRandomFactor; // 각 글자의 고유 랜덤 계수 적용

          const moveAmount = (elapsed < this.impactExpandDuration)
            ? lerp(0, displacement, elapsed / this.impactExpandDuration) // 확장
            : lerp(displacement, 0, (elapsed - this.impactExpandDuration) / this.impactContractDuration); // 수축

          x += direction.x * moveAmount;
          y += direction.y * moveAmount;
        } else {
          this.impactActive = false; // 애니메이션 종료
        }
      }
      const currentCol = i % this.finalCols;
      if (cell.targetColor && colsToColorSet.has(currentCol)) {
        cell.color = cell.targetColor;
      }

      // --- 하이라이트 그리기 ---
      // 0.1초 동안 하이라이트 효과를 적용합니다.
      if (cell.highlightStartTime > 0 && now - cell.highlightStartTime < 100) {
        push();
        noStroke();
        fill(cell.highlightColor);
        // 셀 배경에 사각형을 그려 하이라이트 효과를 줍니다.
        rect(x - this.cellSize / 2, y - this.cellSize / 2, this.cellSize, this.cellSize);
        pop();
      } else {
        // 하이라이트 시간이 지나면 초기화합니다.
        cell.highlightStartTime = 0;
      }

      // 2분 42초(162초) 이후에는 원을 그립니다.
      if (songTime > 192) {
        // 비디오 픽셀에서 직접 밝기 정보를 가져옵니다.
        // cell.color는 다른 애니메이션(색상 쓸기)에 사용되므로,
        // 원 패턴의 밝기 기준으로는 비디오의 원본 밝기를 사용해야 합니다.
        const videoX = floor(map(currentCol + 0.5, 0, this.finalCols, 0, this.video.width));
        const videoY = floor(map(floor(i / this.finalCols) + 0.5, 0, this.finalRows, 0, this.video.height));
        const pixelIndex = (videoY * this.video.width + videoX) * 4;
        const r = this.video.pixels[pixelIndex];
        const g = this.video.pixels[pixelIndex + 1];
        const b = this.video.pixels[pixelIndex + 2];
        const brightness = (r + g + b) / 3;

        const patternIndex = floor(map(brightness, 0, 255, this.circlePatterns.length - 1, 0));
        const pattern = this.circlePatterns[constrain(patternIndex, 0, this.circlePatterns.length - 1)];
        
        this.drawCirclePattern(x, y, pattern);
      } else {
        fill(cell.color);
        text(cell.targetChar, x, y);
      }
    }
  }

  drawCirclePattern(x, y, pattern) {
    noStroke();
    // 패턴에 따라 여러 개의 원을 겹쳐 그립니다.
    // 큰 원부터 그려야 작은 원이 위에 그려집니다.
    for (const circleInfo of pattern) {
      fill(this.circleColors[circleInfo.color]);
      ellipse(x, y, circleInfo.size, circleInfo.size);
    }
  }

  // 메인 스케치의 keyPressed에서 호출됩니다.
  keyPressed() {
    if (key === '6') {
      // 아스키 아트가 재생 중일 때만 효과 활성화
      if (this.transitionState === 'playing' && !this.impactActive) {
        this.impactActive = true;
        this.impactStartTime = millis();
        // 화면 내 랜덤한 좌표를 임팩트 중심으로 설정
        this.impactCenter = createVector(random(width), random(height));
        // 각 글자에 대해 랜덤 이동 계수를 미리 계산하여 저장
        for (const cell of this.gridData) {
          cell.impactRandomFactor = random(0.5, 1.5); // 50% ~ 150% 사이의 랜덤한 이동 비율
        }
      }
    }
  }
}
