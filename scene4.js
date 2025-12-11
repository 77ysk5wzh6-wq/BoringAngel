class Scene4 {
  constructor(bravuraFont) {

    this.SMILE_EMOJI_START_TIME = 181.1;
    this.EMOJI_DURATION = 1;
    this.GATHER_START_TIME = 174.6; // 중앙으로 모이는 애니메이션 시작 시간
    this.GATHER_END_TIME = 181.1;   // 중앙으로 모이는 애니메이션 종료 시간
    this.GATHER_START_RANDOM_DURATION = 5; // 출발 시간의 무작위 범위 (초)
    this.GATHER_END_RANDOM_DURATION = 3;   // 도착 시간의 무작위 범위 (초)

    // --- Scene3에서 가져온 폰트 리스트 ---
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
    this.video = null; // 비디오 엘리먼트
    this.fft = null; // FFT 분석 객체

    // --- 다국어 문자셋 및 폰트 설정 ---
    this.languageSets = [
      {
        name: 'ASCII',
        font: 'Fira Mono',
        // 밝기 매핑을 위해 밀도가 낮은 문자부터 높은 문자 순으로 정렬합니다.
        glyphs: ".`,-':;~i!lI?rvuno)9EZG%#MW&B@$".split('')
      },
      {
        name: 'Japanese',
        font: 'Shippori Mincho',
        glyphs: "･ . , : ; ° ゛ ゝ ゞ ' ` へ と こ に す れ ね む ぬ め み @ #".split(' ')
      },
      {
        name: 'Chinese',
        font: 'Noto Sans TC',
        glyphs: "･ . , : ; ° ' ` 之 乃 久 小 川 心 光 花 面 重 舞 龍 夢 難 鱗".split(' ')
      },
      {
        name: 'Arabic',
        font: 'Noto Sans Arabic',
        // 아랍어는 오른쪽에서 왼쪽으로 쓰므로, 시각적 밀도에 맞춰 수동으로 정렬합니다.
        glyphs: ". · , : ; ° ' ` ـ ا د ر ل م ن ب ج خ ع غ ف ه ي ش ص ض ط ظ".split(' ')
      },
      {
        name: 'Korean',
        font: 'sans-serif', // 기본 산세리프 폰트 사용
        glyphs: "· . , ; : ㄴ ㄱ ㄷ ㄹ ㅎ 아 가 나 파 화 당 랑 날 홉 칼 말 날 랄 활".split(' ')
      }
    ];
    this.currentAsciiSetIndex = 0; // 현재 사용 중인 문자셋 인덱스

    // --- 그리드 설정 ---
    this.initialCols = 37;
    this.initialRows = 20;

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
    this.morphDelay = 0; // 0.1초
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

    this.randomChars = ".`,-':;~i!lI?rvuno)9EZG%#MW&B@$";


    this.currentScale = 1; // 줌 효과는 사용하지 않으므로 1로 고정
    this.targetScale = 1;
    this.isReady = false; // 에셋 로딩 및 파싱 완료 여부

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
    this.baseJumpProbability = 0.01; // 5%

    this.lastHighlightColorChangeTime = 0; // 하이라이트 색상 변경 마지막 시간
    this.highlightColorChangeInterval = 300; // 0.3초마다 색상 변경

    // --- '7' 키 하이라이트 색상 순환 관련 변수 ---
    this.highlightColorCycle = [
      (alpha) => color(random(70, 170), random(70, 170), random(200, 255), alpha), // Blue-ish
      (alpha) => color(random(200, 255), random(70, 170), random(70, 170), alpha), // Red-ish
      (alpha) => color(random(70, 170), random(200, 255), random(70, 170), alpha), // Green-ish
      (alpha) => color(random(220, 255), random(220, 255), random(50, 100), alpha), // Yellow-ish
      (alpha) => color(random(100, 140), alpha) // Black-ish
    ];
    this.highlightColorIndex = 0;
    
    // --- Arrow Key Sweep Animation ---
    this.arrowSweepActive = false;
    this.arrowSweepDirection = null;
    this.arrowSweepStartTime = 0;
    this.arrowSweepDuration = 400; // 0.3초
    this.arrowSweepColor = color(255, 255, 0, 150); // 반투명 노란색

    // --- 글리치 효과 변수 ---
    this.lastMidValue = 0;
    this.midThreshold = 172;
    this.isGlitching = false;

    // --- '8' 키 사각형 모드 변수 ---
    this.isRectModeActive = false;
    this.rectModeColor = () => color(random(255),random(255),0,50); // 사각형 모드 색상 설정

    // --- '9' 키 원 모드 변수 ---
    this.isCircleModeActive = false;
    this.circleModeColor = () => color(random(255), 0, random(255),50); // 원 모드 색상 설정
  }
  

  // --- 하이라이트 및 점프 확률 계산을 위한 상수 ---
  static get HIGHLIGHT_FADE_START_TIME() { return 168; } // 2분 50초
  static get HIGHLIGHT_FADE_DURATION() { return 9; }     // 4초
  static get HIGHLIGHT_BASE_PROBABILITY() { return 0.3; }
  static get JUMP_BASE_PROBABILITY() { return 0.005; }

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

    // --- FFT 객체 초기화 ---
    this.fft = new p5.FFT(0.8, 512);

    // 최종 그리드(180x101)를 기준으로 셀 크기 계산
    this.cols = this.finalCols;
    this.rows = this.finalRows;
    this.cellSize = width / this.cols;
    this.glyphSize = this.cellSize;

    this.isReady = true;

    console.log("Scene 4 is set up and ready.");
    console.log(`Grid: ${this.cols}x${this.rows}`);
    // 초기 문자셋(ASCII) 정보를 출력하도록 수정합니다.
    console.log(`Using ${this.languageSets[0].glyphs.length} glyphs for initial set: ${this.languageSets[0].glyphs.join('')}`);
  }

  // 씬이 활성화될 때마다 호출됩니다.
  enter(data) {
    if (this.video) {
      this.video.time(0);
      this.video.pause(); // 애니메이션이 끝날 때까지 비디오 정지
    } 
    this.currentScale = 1;
    this.targetScale = 1;
    this.transitionState = 'shrinking'; // 씬4가 시작되면 바로 shrinking 부터 시작
    this.transitionStartTime = millis();
    this.prepareInitialGrid(data ? data.gridData : null);

    // --- 임팩트 상태 리셋 ---
    this.impactActive = false;

    // --- 점프 상태 리셋 ---
    this.highlightColorIndex = 0; // 하이라이트 색상 인덱스 리셋
    this.lastJumpTime = 0;

    // --- 하이라이트 색상 인덱스 리셋 ---
    this.highlightColorIndex = 0;

    // --- 글리치 상태 리셋 ---
    this.lastMidValue = 0;
    this.isGlitching = false;

    // --- 사각형 모드 리셋 ---
    this.isRectModeActive = false;

    // --- 원 모드 리셋 ---
    this.isCircleModeActive = false;

    // --- 문자셋 인덱스 리셋 ---
    this.currentAsciiSetIndex = 0;

    frameRate(30); // 비디오 프레임레이트와 유사하게 설정
  }


  // 메인 스케치의 draw에서 호출됩니다.
  draw() {
    // 이 씬의 모든 그리기 작업을 push/pop으로 감싸서
    // 외부(다른 씬 또는 sketch.js)에 영향을 주지 않도록 격리합니다.
    push();
    // shrinking 상태에서는 잔상 효과를 위해 배경을 그리지 않습니다.
    console.log(this.fft.getEnergy("mid"))

    if (this.transitionState !== 'shrinking') {
      background(255);
    }

    const currentTime = this.song.isPlaying() ? this.song.currentTime() : 0;
    const now = millis();

    // --- FFT 분석 및 글리치 효과 트리거 ---
    if (this.song.isPlaying()) {
      this.fft.analyze();
      const midValue = this.fft.getEnergy("mid");

      if (this.lastMidValue < this.midThreshold && midValue >= this.midThreshold && !this.isGlitching) {
        this.isGlitching = true;
        document.body.classList.add('scene4-glitch-active');

        setTimeout(() => {
          document.body.classList.remove('scene4-glitch-active');
          this.isGlitching = false;
        }, 100); // 0.1초 (CSS 애니메이션 시간과 동일)
      }
      this.lastMidValue = midValue;
    }

    // 자동 하이라이트 색상 변경
    if (currentTime < this.GATHER_START_TIME) {
      // gather 애니메이션이 시작되기 전까지만 0.1초마다 색상을 변경합니다.
      if (now - this.lastHighlightColorChangeTime > this.highlightColorChangeInterval) {
        this.lastHighlightColorChangeTime = now;
        this.highlightColorIndex = (this.highlightColorIndex + 1) % this.highlightColorCycle.length;

        // --- 아스키 문자셋 자동 변경 ---
        if (this.transitionState === 'playing') {
          this.currentAsciiSetIndex = (this.currentAsciiSetIndex + 1) % this.languageSets.length;
          const newSet = this.languageSets[this.currentAsciiSetIndex];
          console.log(`Switched to ${newSet.name} character set.`);
          for (const cell of this.gridData) {
            cell.font = newSet.font;
          }
          this.prepareMorphTarget();
        }
      }
    } else {
      // gather 애니메이션이 시작되면 하이라이트 색상을 파란색 계열(인덱스 0)로 고정합니다.
      this.highlightColorIndex = 0;
      // ASCII 문자셋도 기본(인덱스 0)으로 고정합니다.
      if (this.currentAsciiSetIndex !== 0) {
        this.currentAsciiSetIndex = 0;
        const newSet = this.languageSets[this.currentAsciiSetIndex];
        console.log(`Fixed to ${newSet.name} character set for gathering.`);
        for (const cell of this.gridData) {
          cell.font = newSet.font;
        }
        this.prepareMorphTarget();
      }
    }

    // 스마일 이모지 시간대에는 다른 모든 애니메이션을 중지하고 이모지만 그립니다.
    if (currentTime >= this.SMILE_EMOJI_START_TIME && currentTime <= this.SMILE_EMOJI_START_TIME + this.EMOJI_DURATION) {
      push();
      textAlign(CENTER, CENTER);
      translate(random(-this.shakePixel, this.shakePixel), random(-this.shakePixel, this.shakePixel)); // 떨림 효과 적용
      fill(random(245, 255), 20);
      rectMode(CENTER); // 이모지 뒤 배경 사각형
      rect(width / 2, height / 2, windowWidth, windowHeight);
      const scene4GridSize = 39;
      const emojiSize = min(width / scene4GridSize, height / scene4GridSize) * 0.8;
      textSize(emojiSize);
      text('👴', width / 2, height / 2);
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

    // --- 화살표 키 쓸기 애니메이션 그리기 ---
    this.drawArrowSweep();

    pop(); // push에 대한 pop
  }

  prepareInitialGrid(scene3GridData) {
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
        font: 'Fira Mono', // 기본 폰트
        color: color(0, 0, 255), // 파란색
        isMorphed: false, // morph 애니메이션에서 변환되었는지 여부
        // --- 중앙으로 모이는 애니메이션을 위한 속성 ---
        gatherStartTime: 0,
        gatherEndTime: 0,
        previousChar: ' ', // 이전 프레임의 문자를 저장
        highlightStartTime: 0, // 하이라이트 시작 시간
        lastCharChangeTime: 0, // 문자가 마지막으로 변경된 시간
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
            // Scene3 데이터가 있으면 해당 폰트를 사용, 없으면 기본 폰트 사용
            if (scene3GridData && scene3GridData[sourceIndex]) {
              this.gridData[targetIndex].font = scene3GridData[sourceIndex].font;
            }
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

    background(255, 180);
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
          textFont(cell.font); // 각 셀의 폰트 적용
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
    const highlightProbability = this.getDynamicProbability(Scene4.HIGHLIGHT_BASE_PROBABILITY);

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
        if (random() < highlightProbability) { // 동적 확률 적용
          cell.highlightStartTime = now;
          cell.highlightColor = this.getHighlightColorForCell(gridIdx, 128); // 중간 밝기(128)로 기본값 설정
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

        textFont(cell.font); // 각 셀의 폰트 적용
        const x = offsetX + i * this.cellSize + this.cellSize / 2;
        const y = offsetY + j * this.cellSize + this.cellSize / 2;

        // --- 하이라이트 그리기 ---
        if (cell.highlightStartTime > 0 && now - cell.highlightStartTime < 100) {
          push();
          noStroke();
          rectMode(CENTER);
          fill(cell.highlightColor);
          rect(x, y, this.cellSize, this.cellSize);
          pop();
        } else {
          cell.highlightStartTime = 0;
        }

        if (progress > 0 && random() > 0.988) {
          // 초기 30x18 영역 밖의 셀에만 무작위 문자를 채웁니다.
          cell.char = random(this.randomChars.split(''));
          cell.font = random(this.fonts); // 씬3의 폰트 리스트에서 랜덤하게 선택
          // 문자가 변경되는 순간 하이라이트 트리거
          if (random() < highlightProbability) {
            cell.highlightStartTime = now;
            cell.highlightColor = this.getHighlightColorForCell(j * this.finalCols + i, 128); // 중간 밝기(128)로 기본값 설정
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
    textStyle(BOLD); // morphing 단계부터 볼드 스타일 적용

    const offsetX = (width - this.finalCols * this.cellSize) / 2;
    const offsetY = (height - this.finalRows * this.cellSize) / 2;

    for (let i = 0; i < this.gridData.length; i++) {
      const cell = this.gridData[i];
      const x = offsetX + (i % this.finalCols) * this.cellSize + this.cellSize / 2;
      textFont(cell.font); // 각 셀의 폰트 적용
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
    this.video.loadPixels();
    if (this.video.pixels.length > 0) { const now = millis();
      const highlightProbability = this.getDynamicProbability(Scene4.HIGHLIGHT_BASE_PROBABILITY);

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

        const cell = this.gridData[i];
        const currentGlyphs = this.languageSets[this.currentAsciiSetIndex].glyphs;
        // 밝기 값에 따라 현재 문자셋에서 적절한 문자를 선택합니다. (매핑 반전)
        // 어두울수록(brightness 0) 밀도 높은 문자(배열의 끝), 밝을수록(255) 밀도 낮은 문자(배열의 시작)를 선택합니다.
        const glyphIndex = floor(map(brightness, 0, 255, currentGlyphs.length - 1, 0));
        cell.targetChar = currentGlyphs[glyphIndex];

        // --- 하이라이트 로직: 문자가 변경되었는지 확인 ---
        if (cell.targetChar !== this.gridData[i].previousChar) {
          // 문자가 변경되면, 마지막 변경 시간을 기록하고 하이라이트를 제거합니다.
          cell.lastCharChangeTime = now;
          cell.highlightStartTime = 0;
          this.gridData[i].previousChar = this.gridData[i].targetChar;
        } 
        // 문자가 변경되지 않았을 때, 확률적으로 하이라이트를 적용합니다.
        else if (cell.highlightStartTime === 0 && random() < highlightProbability) {
          cell.highlightStartTime = now;
          cell.highlightColor = this.getHighlightColorForCell(i, brightness);
        }

        this.gridData[i].color = color(0); // 최종 색상은 검정
      }
    }
  }

  updateAndDrawMorphing() {
    const elapsedTime = millis() - this.transitionStartTime;
    const progress = constrain(elapsedTime / this.morphDuration, 0, 1);
    const now = millis();
    const highlightProbability = this.getDynamicProbability(Scene4.HIGHLIGHT_BASE_PROBABILITY);

    background(255);
    textAlign(CENTER, CENTER);
    textSize(this.glyphSize);

    const offsetX = (width - this.finalCols * this.cellSize) / 2;
    const offsetY = (height - this.finalRows * this.cellSize) / 2;

    for (let i = 0; i < this.gridData.length; i++) {
      const cell = this.gridData[i];
      const x = offsetX + (i % this.finalCols) * this.cellSize + this.cellSize / 2;
      textFont(cell.font); // 각 셀의 폰트 적용
      const y = offsetY + floor(i / this.finalCols) * this.cellSize + this.cellSize / 2;

      // --- 하이라이트 그리기 ---
      if (cell.highlightStartTime > 0 && now - cell.highlightStartTime < 100) {
        push();
        noStroke();
        rectMode(CENTER);
        fill(cell.highlightColor);
        rect(x, y, this.cellSize, this.cellSize);
        pop();
      } else {
        cell.highlightStartTime = 0;
      }

      // 아직 변환되지 않은 셀에 대해서만 확률적으로 변환을 시도합니다.
      if (!cell.isMorphed && random() < progress * 0.25) {
        cell.isMorphed = true;
        cell.font = 'Fira Mono'; // morphing될 때 폰트를 Fira Mono로 변경
        // 글자가 변하는 순간, 하이라이트 효과를 트리거합니다.
        if (random() < highlightProbability) {
          cell.highlightStartTime = now;
          cell.highlightColor = this.getHighlightColorForCell(i, 128); // morphing 중에는 밝기 정보가 없으므로 중간값 사용
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
        this.gridData[i].font = 'Fira Mono'; // 모든 폰트를 Fira Mono로 통일
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
    const now = millis();

    // --- '8' 키 사각형 모드 처리 ---
    if (this.isRectModeActive) {
      // 사각형 모드 그리기 로직
      this.video.loadPixels();
      if (this.video.pixels.length > 0) {
        background(255);
        const effectCols = this.finalCols / 2;
        const effectRows = this.finalRows / 2;
        const effectCellSize = width / effectCols;
        const offsetX = (width - effectCols * effectCellSize) / 2;
        const offsetY = (height - effectRows * effectCellSize) / 2;

        rectMode(CENTER);
        noStroke();

        for (let r = 0; r < effectRows; r++) {
          for (let c = 0; c < effectCols; c++) {
            const videoX = floor(map(c + 0.5, 0, effectCols, 0, this.video.width));
            const videoY = floor(map(r + 0.5, 0, effectRows, 0, this.video.height));
            const idx = (videoY * this.video.width + videoX) * 4;
            const brightness = (this.video.pixels[idx] + this.video.pixels[idx + 1] + this.video.pixels[idx + 2]) / 3;

            const rectHeight = map(brightness, 0, 255, effectCellSize, 0);
            const x = offsetX + c * effectCellSize + effectCellSize / 2;
            const y = offsetY + r * effectCellSize + effectCellSize / 2;

            fill(this.rectModeColor());
            rect(x, y, effectCellSize, rectHeight);
          }
        }
      }
      return; // 사각형 모드일 때는 아래의 일반 그리기 로직을 건너뜁니다.
    }

    // --- '9' 키 원 모드 처리 ---
    if (this.isCircleModeActive) {
      // 원 모드 그리기 로직
      this.video.loadPixels();
      if (this.video.pixels.length > 0) {
        background(255);
        const effectCols = this.finalCols / 2;
        const effectRows = this.finalRows / 2;
        const effectCellSize = width / effectCols;
        const offsetX = (width - effectCols * effectCellSize) / 2;
        const offsetY = (height - effectRows * effectCellSize) / 2;

        noStroke();
        for (let r = 0; r < effectRows; r++) {
          for (let c = 0; c < effectCols; c++) {
            const videoX = floor(map(c + 0.5, 0, effectCols, 0, this.video.width));
            const videoY = floor(map(r + 0.5, 0, effectRows, 0, this.video.height));
            const idx = (videoY * this.video.width + videoX) * 4;
            const brightness = (this.video.pixels[idx] + this.video.pixels[idx + 1] + this.video.pixels[idx + 2]) / 3;
            const circleDiameter = map(brightness, 0, 255, effectCellSize, 0);
            const x = offsetX + c * effectCellSize + effectCellSize / 2;
            const y = offsetY + r * effectCellSize + effectCellSize / 2;
            fill(this.circleModeColor());

            // --- X자 모양으로 겹친 두 개의 타원 그리기 ---
            push();
            translate(x, y);
            ellipseMode(CENTER);
            // 첫 번째 타원 (+45도 회전)
            rotate(PI / 4);
            ellipse(0, 0, circleDiameter, circleDiameter / 4);
            // 두 번째 타원 (-45도 회전, 첫 번째 타원에서 90도 더 회전)
            rotate(PI / 2);
            ellipse(0, 0, circleDiameter, circleDiameter / 4);
            pop();
          }
        }
      }
      return; // 원 모드일 때는 아래의 일반 그리기 로직을 건너뜁니다.
    }


    this.prepareMorphTarget();
    if (this.video.pixels.length === 0) return;

    const songTime = song.currentTime(); // 메인 스케치의 전역 song 변수 참조

    // --- 기존 문자 기반 아스키 아트 ---
    // --- 점프 애니메이션 트리거 ---
    if (now - this.lastJumpTime > this.jumpBeatDuration) {
      this.lastJumpTime = now;

      const jumpProbability = this.getDynamicProbability(Scene4.JUMP_BASE_PROBABILITY);
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
    // 개더링이 시작되면 볼드를 해제하고, 그 전까지는 볼드를 유지합니다.
    if (songTime >= this.GATHER_START_TIME) {
      textStyle(NORMAL);
    } else {
      textStyle(BOLD);
    }
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

        // --- 하이라이트 그리기 (gather 애니메이션 중에도 유지) ---
        if (cell.highlightStartTime > 0 && now - cell.highlightStartTime < 100) {
          push();
          noStroke();
          fill(cell.highlightColor);
          rect(currentX, currentY, this.cellSize, this.cellSize);
          pop();
        } else {
          cell.highlightStartTime = 0;
        }

        textFont(cell.font);
        text(cell.targetChar, currentX, currentY);
      }
    } else {
      // gather 애니메이션이 아닐 때의 일반 그리기 로직

    for (let i = 0; i < this.gridData.length; i++) {
      const cell = this.gridData[i];
      let x = offsetX + (i % this.finalCols) * this.cellSize + this.cellSize / 2;
      let y = offsetY + floor(i / this.finalCols) * this.cellSize + this.cellSize / 2;
      textFont(cell.font); // 각 셀의 폰트 적용

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
        rect(x, y, this.cellSize, this.cellSize);
        pop();
      } else {
        // 하이라이트 시간이 지나면 초기화합니다.
        cell.highlightStartTime = 0;
      }

      fill(cell.color);
      textFont(cell.font);
      text(cell.targetChar, x, y);
    }
   }
  }

  getHighlightColorForCell(cellIndex, brightness) {
    // 밝기(0-255)를 알파값(100-20)으로 매핑합니다. 어두울수록(brightness 0) 진하게(alpha 100).
    const alpha = map(brightness, 0, 255, 130, 20);
    const colorFunc = this.highlightColorCycle[this.highlightColorIndex];
    return colorFunc(alpha);
  }


  // 메인 스케치의 keyPressed에서 호출됩니다.
  keyPressed() {
    // '8' 키를 누르면 사각형 모드 활성화
    if (key === '8' && this.transitionState === 'playing') {
      this.isRectModeActive = true;
    } else if (key === '9' && this.transitionState === 'playing') {
      // '9' 키를 누르면 원 모드 활성화
      this.isCircleModeActive = true;
    } else if (key === '6') { // 아스키 아트가 재생 중일 때만 효과 활성화
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
    } else if (!this.arrowSweepActive) { // 다른 쓸기 애니메이션이 진행 중이 아닐 때만
      if (keyCode === RIGHT_ARROW) {
        this.arrowSweepActive = true;
        this.arrowSweepDirection = 'RIGHT';
        this.arrowSweepStartTime = millis();
      } else if (keyCode === LEFT_ARROW) {
        this.arrowSweepActive = true;
        this.arrowSweepDirection = 'LEFT';
        this.arrowSweepStartTime = millis();
      } else if (keyCode === UP_ARROW) {
        this.arrowSweepActive = true;
        this.arrowSweepDirection = 'UP';
        this.arrowSweepStartTime = millis();
      } else if (keyCode === DOWN_ARROW) {
        this.arrowSweepActive = true;
        this.arrowSweepDirection = 'DOWN';
        this.arrowSweepStartTime = millis();
      }
    }
  }

  keyReleased() {
    // '8' 또는 '9' 키에서 손을 떼면 해당 모드를 비활성화합니다.
    if (key === '8') {
      this.isRectModeActive = false;
    }
    if (key === '9') {
      this.isCircleModeActive = false;
    }
  }

  drawArrowSweep() {
    if (!this.arrowSweepActive) return;

    const elapsedTime = millis() - this.arrowSweepStartTime;
    const progress = constrain(elapsedTime / this.arrowSweepDuration, 0, 1);

    const offsetX = (width - this.finalCols * this.cellSize) / 2;
    const offsetY = (height - this.finalRows * this.cellSize) / 2;

    push();
    noStroke();
    rectMode(CORNER); // 셀 좌표에 맞춰 왼쪽 상단 기준으로 사각형을 그립니다.

    if (this.arrowSweepDirection === 'RIGHT' || this.arrowSweepDirection === 'LEFT') {
      // 세로줄 쓸기 (열 단위)
      const totalCols = this.finalCols;
      let currentCol;
      if (this.arrowSweepDirection === 'RIGHT') {
        currentCol = floor(lerp(0, totalCols, progress));
      } else { // LEFT
        currentCol = floor(lerp(totalCols - 1, -1, progress));
      }

      for (let j = 0; j < this.finalRows; j++) {
        const x = offsetX + currentCol * this.cellSize;
        const y = offsetY + j * this.cellSize;
        fill(this.getHighlightColorForCell(j * totalCols + currentCol, 128));
        rect(x, y, this.cellSize, this.cellSize);
      }
    } else if (this.arrowSweepDirection === 'DOWN' || this.arrowSweepDirection === 'UP') {
      // 가로줄 쓸기 (행 단위)
      const totalRows = this.finalRows;
      let currentRow = (this.arrowSweepDirection === 'DOWN') ? floor(lerp(0, totalRows, progress)) : floor(lerp(totalRows - 1, -1, progress));

      for (let i = 0; i < this.finalCols; i++) {
        const x = offsetX + i * this.cellSize;
        const y = offsetY + currentRow * this.cellSize;
        fill(this.getHighlightColorForCell(currentRow * this.finalCols + i, 128));
        rect(x, y, this.cellSize, this.cellSize);
      }
    }

    pop();

    if (progress >= 1) {
      this.arrowSweepActive = false; // 애니메이션 종료
    }
  }


  getDynamicProbability(baseProbability) {
    // 항상 기본 확률을 반환하도록 수정하여, 시간이 지나도 확률이 0이 되지 않도록 합니다.
    return baseProbability;
  }
}