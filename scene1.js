class Scene1 {
  constructor(song) {
    // =================================================
    // Global Variables
    // =================================================

    // --- Audio ---
    this.song = song;
    this.amp;
    this.fft;

    // --- Visual Settings ---
    // Scene2와 동기화를 위한 변수
    this.note_width = 16.5;
    this.note_height = this.note_width * 5 / 7;

    this.steps = 20; // 사각형 중첩 개수
    this.bpm = 700;
    this.beatDuration = 60000 / this.bpm; // 1비트당 밀리초
    this.back_col;

    // --- Canvas & Outer Squares Animation --- 
    this.animationStartTimeTrigger = 5.5; // 애니메이션 시작 시간 (초)
    this.animationDuration = 30; // 애니메이션 지속 시간 (초)
    this.animationStartTime;
    this.pauseStartTime; // 음악이 일시정지된 시간을 기록
    this.initialWidth;
    this.initialHeight;
    this.targetWidth;
    this.targetHeight;
    this.maxRect_w;
    this.maxRect_h;
    this.square_X;
    this.square_Y;
    this.initialSquareX;
    this.targetSquareX;

    // --- Inner Square (minRect) Animation --- 안쪽 사각형 점점커지다가 블랙으로 뒤덮는
    this.minRectAnimationStartTimeTrigger = 35.45; // 애니메이션 시작 시간 (초)
    this.minRectAnimationDuration = 15; // 애니메이션 지속 시간 (초)
    this.minRectAnimationStartTime;
    this.minRectPauseStartTime; // minRect 애니메이션 일시정지 시간 기록
    this.minRect_w;
    this.minRect_h;
    this.initialMinRectW;
    this.initialMinRectH;
    this.targetMinRectW;
    this.targetMinRectH;

    // --- Center Circle Animation --- (시작 트리거)왼쪽에서 시작해서 중앙으로 이동
    this.centerCircleAnimationStartTimeTrigger = 0; // 애니메이션 시작 시간 (초)
    this.centerCircleAnimationDuration = 3.6; // 애니메이션 지속 시간 (초)
    this.centerCircleAnimationStartTime;
    this.centerCirclePauseStartTime; // centerCircle 애니메이션 일시정지 시간 기록
    this.centerCircle_y;
    this.inCenterCircle_y;
    this.targetCircleY;
    this.centerCircleDiameter = 61; // 시작할때 날아오는 원의 지름
 
    // --- Squares Color Animation --- (시작 트리거가 날아와서  부딪혔을때 계단식 색 변화)
    this.colorAnimationStartTime;
    this.colorAnimationDuration = 2; // 색상 변경 애니메이션 지속 시간 (초) - setup에서 계산됨

    // --- Center Circle Stretch Animation --- (51초부터 원 세개가 늘어지며 사각형으로 변화)
    this.stretchAnimationStartTimeTrigger = 51.4 // 애니메이션 시작 시간 (초)
    this.stretchAnimationDuration = 3; // 애니메이션 지속 시간 (초)
    this.stretchAnimationStartTime;
    this.stretchAnimationPauseStartTime;
    this.stretchedWidth = this.centerCircleDiameter; // 초기 너비는 원의 지름
    this.targetStretchedWidth; // 중앙 사각형 목표 너비
    this.stretchedHeight = this.centerCircleDiameter; // 초기 높이 (원의 지름)
    this.targetStretchedHeight = 1; // 목표 높이 (Scene2 오선지 두께)
    this.sideStretchedWidth = this.centerCircleDiameter; // 양옆 사각형 너비
    this.targetSideStretchedWidth; // 양옆 사각형 목표 너비

    // --- Three Circles Animation --- (하나씩 뜯겨 나가는 원들)
    this.circleA_animationStartTimeTrigger = 19.65; // 원 A 이동 시작 시간
    this.circleA_animationDuration = 7; // 원 A 이동 시간
    this.circleA_animationStartTime;
    this.circleA_pauseStartTime;
    this.circleA_animationState = 'idle';
    this.circleA_x_offset = 0; // 원 A의 x축 오프셋

    this.circleB_animationStartTimeTrigger = 34.7; // 원 B 이동 시작 시간
    this.circleB_animationDuration = 7; // 원 B 이동 시간
    this.circleB_animationStartTime;
    this.circleB_pauseStartTime;
    this.circleB_animationState = 'idle';
    this.circleB_x_offset = 0; // 원 B의 x축 오프셋

    // --- Flash Rectangle Animation ---
    this.flashRectA_state = 'idle';
    this.flashRectA_startTime = 0;
    this.flashRectB_state = 'idle';
    this.flashRectB_startTime = 0;
    this.flashRectDuration = 1500; // 1초

    // --- Flash White Animation (19초) ---
    this.flashWhiteStartTimeTrigger = 18.95;
    this.flashWhiteDuration = 0.7; // 0.5초 동안 진행

    // --- Screen Flash Animation (at 19.5s) ---
    this.screenFlashStartTimeTrigger = 19.65;
    this.screenFlashDuration = 1; // 0.2초 동안 서서히 사라짐

    // --- Second Flash White Animation (34.2초) ---
    this.flashWhite2StartTimeTrigger = 34;
    this.flashWhite2Duration = 0.7;

    // --- Second Screen Flash Animation (at 34.7s) ---
    this.screenFlash2StartTimeTrigger = 34.7;
    this.screenFlash2Duration = 1;

    // --- Staff Lines Animation --- (오선지 그려지는 애니메이션)
    this.staffAnimationState = 'idle';
    this.staffAnimationStartTime = 0;
    this.staffAnimationPauseStartTime = 0;
    this.staffLinesToDraw = 0; // 그려질 오선지 수
    this.totalStaffLines = 30; // 전체 오선지 수
    this.staffBpm = 450; // 오선지 애니메이션을 위한 BPM
    this.staffBeatDuration = 60000 / this.staffBpm;

    // --- Title Animation ---
    this.titleAnimationState = 'idle'; // 'idle', 'animating', 'done'
    this.titleAnimationStartTime = 0;
    this.titleAnimationDuration = 1000; // 1초
    
  }

  setup() {
    rectMode(CENTER);
    ellipseMode(CENTER);
    pixelDensity(displayDensity()); // 디스플레이 해상도에 맞춰 선명하게 렌더링
    this.fft = new p5.FFT(0.8, 512);
    this.amp = new p5.Amplitude(0.9); // 0.0 ~ 1.0 사이의 값으로 스무딩을 적용

    // 비트에 맞춰 중첩 사각형 색이 모두 바뀌는데 걸리는 총 시간(초)을 계산
    // this.colorAnimationDuration = (this.steps * this.beatDuration) / 1000;

    // --- 모든 애니메이션 상태 변수 초기화 ---
    this.animationState = 'idle';
    this.minRectAnimationState = 'idle';
    this.centerCircleAnimationState = 'idle';
    this.colorAnimationState = 'idle';
    this.colorAnimationProgress = 0;
    this.stretchAnimationState = 'idle';

    // Three Circles 애니메이션 상태 초기화
    this.circleA_animationState = 'idle';
    this.circleA_x_offset = 0;
    this.circleB_animationState = 'idle';
    this.circleB_x_offset = 0;
    // Flash Rectangle 애니메이션 상태 초기화
    this.flashRectA_state = 'idle';
    this.flashRectB_state = 'idle';
    // Flash White 애니메이션 상태 초기화
    this.flashWhiteState = 'idle';
    this.flashWhiteAnimationStartTime = 0;
    // Screen Flash 애니메이션 상태 초기화
    this.screenFlashState = 'idle';
    this.screenFlashStartTime = 0;
    // Second Flash White 애니메이션 상태 초기화
    this.flashWhite2State = 'idle';
    this.flashWhite2AnimationStartTime = 0;
    // Second Screen Flash 애니메이션 상태 초기화
    this.screenFlash2State = 'idle';
    this.screenFlash2StartTime = 0;
    // Staff Lines 애니메이션 상태 초기화
    this.staffAnimationState = 'idle';
    this.staffAnimationStartTime = 0;
    this.staffLinesToDraw = 0;

    // Title 애니메이션 상태 초기화
    this.titleAnimationState = 'idle';

    // --- 변수 초기값 설정 ---
    this.initialMinRectW = 50; // 중첩사각형중 제일 작은 것
    this.initialMinRectH = 50; //initialHeight 랑 같게
    this.minRect_w = this.initialMinRectW;
    this.minRect_h = this.initialMinRectH;

    // 애니메이션을 위한 초기값 설정
    this.initialWidth = 60; // 사각형의 시작 크기  (중첩사각형중 최외곽)
    this.initialHeight = 60;
    this.targetWidth = windowWidth;
    this.targetHeight = windowHeight;

    // minRect 애니메이션 목표값 설정
    this.targetMinRectW = windowWidth;
    this.targetMinRectH = windowHeight;

    this.initialSquareX = windowWidth;
    this.targetSquareX = windowWidth / 2;

    this.square_X = this.initialSquareX;
    this.square_Y = windowHeight / 2;

    // center circle 애니매이션 설정값
    this.inCenterCircle_y = 0 - this.centerCircleDiameter / 2;
    this.targetCircleY = width / 2;
    //스트레치 애니매이션 변수
    this.targetStretchedWidth = width - 100; // Scene2의 오선지 너비와 동일하게 설정
    this.targetSideStretchedWidth = width / 4;
  }

  draw() {
    // 배경을 검은색으로 설정
    
    let currentTime = this.song.currentTime();
    if(currentTime <= this.stretchAnimationStartTimeTrigger){
      fill(0);
    }else{
      fill(255);
    }

    // 배경지 사각형
    noStroke();
    rect(width / 2, height / 2, windowWidth, windowHeight);


    // =================================================
    // 1. 시간 및 상태 업데이트 (음악 재생 중)
    // =================================================
    if (this.song.isPlaying()) {
      // 초침 비트에 맞춰 중앙 원 색상 변경
   
      if (floor(millis() / this.beatDuration) % 2 === 0) {
        this.centerSquare_col = color(255);
      } else {
        this.centerSquare_col = color(0);
      }

      // 지정된 시간이 지나고 애니메이션이 아직 시작되지 않았다면 애니메이션 시작
      if (currentTime > this.animationStartTimeTrigger && this.animationState === 'idle') {
        this.animationState = 'animating';
        this.animationStartTime = millis(); // 애니메이션 시작 시간 기록
      }

      // minRect 애니메이션 시작 트리거
      if (currentTime > this.minRectAnimationStartTimeTrigger && this.minRectAnimationState === 'idle') {
        this.minRectAnimationState = 'animating';
        this.minRectAnimationStartTime = millis();
      }
      // centerCircle 애니메이션 시작 트리거
      if (currentTime > this.centerCircleAnimationStartTimeTrigger && this.centerCircleAnimationState === 'idle') {
        this.centerCircleAnimationState = 'animating';
        this.centerCircleAnimationStartTime = millis();
      }
      
      // Stretch 애니메이션 시작 트리거
      if (currentTime > this.stretchAnimationStartTimeTrigger && this.stretchAnimationState === 'idle') {
        this.stretchAnimationState = 'animating';
        this.stretchAnimationStartTime = millis();
      }

      // Circle A 애니메이션 시작 트리거
      if (currentTime > this.circleA_animationStartTimeTrigger && this.circleA_animationState === 'idle') {
        this.circleA_animationState = 'animating';
        this.circleA_animationStartTime = millis();
        this.flashRectA_state = 'animating'; // Flash Rectangle A 애니메이션 시작
        this.flashRectA_startTime = millis();
      }

      // Circle B 애니메이션 시작 트리거
      if (currentTime > this.circleB_animationStartTimeTrigger && this.circleB_animationState === 'idle') {
        this.circleB_animationState = 'animating';
        this.circleB_animationStartTime = millis();
        this.flashRectB_state = 'animating'; // Flash Rectangle B 애니메이션 시작
        this.flashRectB_startTime = millis();
      }

      // Flash White 애니메이션 시작 트리거
      if (currentTime >= this.flashWhiteStartTimeTrigger && currentTime < this.flashWhiteStartTimeTrigger + this.flashWhiteDuration && this.flashWhiteState === 'idle') {
        this.flashWhiteState = 'animating';
        this.flashWhiteAnimationStartTime = millis();
      }

      // Screen Flash 애니메이션 시작 트리거
      if (currentTime >= this.screenFlashStartTimeTrigger && this.screenFlashState === 'idle') {
        this.screenFlashState = 'flashing';
        this.screenFlashStartTime = millis();
      }

      // Second Flash White 애니메이션 시작 트리거
      if (currentTime >= this.flashWhite2StartTimeTrigger && currentTime < this.flashWhite2StartTimeTrigger + this.flashWhite2Duration && this.flashWhite2State === 'idle') {
        this.flashWhite2State = 'animating';
        this.flashWhite2AnimationStartTime = millis();
      }

      // Second Screen Flash 애니메이션 시작 트리거
      if (currentTime >= this.screenFlash2StartTimeTrigger && this.screenFlash2State === 'idle') {
        this.screenFlash2State = 'flashing';
        this.screenFlash2StartTime = millis();
      }

      // Staff Lines 애니메이션 시작 트리거 (stretch 애니메이션이 끝난 후)
      if (this.stretchAnimationState === 'done' && this.staffAnimationState === 'idle') {
        this.staffAnimationState = 'animating';
        this.staffAnimationStartTime = millis();
      }

      // =================================================
      // 2. 애니메이션 진행 (lerp를 사용한 값 계산)
      // =================================================

      // Canvas & Outer Squares 애니메이션 진행
      // 45초 이하일 때만 사각형 관련 애니메이션을 진행합니다.
      if (currentTime <= 48) {
        if (this.animationState === 'animating') {
          let elapsed = (millis() - this.animationStartTime) / 1000; // 경과 시간 (초)
          let progress = constrain(elapsed / this.animationDuration, 0, 1); // 진행률 (0 ~ 1)

          // lerp를 이용해 사각형의 현재 크기를 계산합니다.
          this.maxRect_w = lerp(this.initialWidth, this.targetWidth, progress);
          this.maxRect_h = lerp(this.initialHeight, this.targetHeight, progress);
          this.square_X = lerp(this.initialSquareX, this.targetSquareX, progress);

          if (progress >= 1) {
            this.animationState = 'done'; // 애니메이션 완료
          }
        }

        // Inner Square (minRect) 애니메이션 진행
        if (this.minRectAnimationState === 'animating') {
          let elapsed = (millis() - this.minRectAnimationStartTime) / 1000;
          let progress = constrain(elapsed / this.minRectAnimationDuration, 0, 1);

          this.minRect_w = lerp(this.initialMinRectW, this.targetMinRectW, progress);
          this.minRect_h = lerp(this.initialMinRectH, this.targetMinRectH, progress);

          if (progress >= 1) {
            this.minRectAnimationState = 'done';
          }
        }
      }

      // Center Circle 애니메이션 진행
      if (this.centerCircleAnimationState === 'animating') {
        let elapsed = (millis() - this.centerCircleAnimationStartTime) / 1000;
        let progress = constrain(elapsed / this.centerCircleAnimationDuration, 0, 1);

        this.centerCircle_y = lerp(this.inCenterCircle_y, this.targetCircleY, progress);

        if (progress >= 1) {
          this.centerCircleAnimationState = 'done';
        }
      }

      // Squares Color 애니메이션 시작 및 진행
      if (this.centerCircleAnimationState === 'done' && this.colorAnimationState === 'idle') {
        this.colorAnimationState = 'animating';
        this.colorAnimationStartTime = millis();
      }

      if (this.colorAnimationState === 'animating') {
        let elapsed = (millis() - this.colorAnimationStartTime) / 1000;
        this.colorAnimationProgress = constrain(elapsed / this.colorAnimationDuration, 0, 1);
        if (this.colorAnimationProgress >= 1) {
          this.colorAnimationState = 'done';
        }
      }

      // Stretch 애니메이션 진행
      if (this.stretchAnimationState === 'animating') {
        let elapsed = (millis() - this.stretchAnimationStartTime) / 1000;
        let progress = constrain(elapsed / this.stretchAnimationDuration, 0, 1);
        this.stretchedWidth = lerp(this.centerCircleDiameter, this.targetStretchedWidth, progress);
        this.sideStretchedWidth = lerp(this.centerCircleDiameter, this.targetSideStretchedWidth, progress);
        this.stretchedHeight = lerp(this.centerCircleDiameter, this.targetStretchedHeight, progress);

        if (progress >= 1) {
          this.stretchAnimationState = 'done';
        }
      }

      // Circle A 애니메이션 진행
      if (this.circleA_animationState === 'animating') {
        let elapsed = (millis() - this.circleA_animationStartTime) / 1000;
        let progress = constrain(elapsed / this.circleA_animationDuration, 0, 1);
        this.circleA_x_offset = lerp(0, this.centerCircleDiameter*2, progress);
        if (progress >= 1) {
          this.circleA_animationState = 'done';
        }
      }

      // Circle B 애니메이션 진행
      if (this.circleB_animationState === 'animating') {
        let elapsed = (millis() - this.circleB_animationStartTime) / 1000;
        let progress = constrain(elapsed / this.circleB_animationDuration, 0, 1);
        this.circleB_x_offset = lerp(0, -this.centerCircleDiameter*2, progress);
        if (progress >= 1) {
          this.circleB_animationState = 'done';
        }
      }

      // Staff Lines 애니메이션 진행
      if (this.staffAnimationState === 'animating') {
        let elapsed = millis() - this.staffAnimationStartTime;
        // 비트 수에 따라 그려질 라인 수 계산
        this.staffLinesToDraw = floor(elapsed / this.staffBeatDuration);
        if (this.staffLinesToDraw >= this.totalStaffLines) {
          this.staffAnimationState = 'done';
        }
      }
    }

    // =================================================
    // 3. 최종 값 설정 (애니메이션 상태에 따라)
    // =================================================

    // Canvas & Outer Squares: 애니메이션 상태에 따라 크기를 최종 결정 (음악이 멈춰도 현재 크기 유지)
    if (this.animationState === 'idle') {
      this.maxRect_w = this.initialWidth;
      this.maxRect_h = this.initialHeight;
      this.square_X = this.initialSquareX;
    } else if (this.animationState === 'done') {
      this.maxRect_w = this.targetWidth;
      this.maxRect_h = this.targetHeight;
      this.square_X = this.targetSquareX;
    }

    // Inner Square (minRect): 애니메이션 상태에 따라 크기 최종 결정
    if (this.minRectAnimationState === 'idle') {
      this.minRect_w = this.initialMinRectW;
      this.minRect_h = this.initialMinRectH;
    } else if (this.minRectAnimationState === 'done') {
      this.minRect_w = this.targetMinRectW;
      this.minRect_h = this.targetMinRectH;
    }

    // Center Circle: 애니메이션 상태에 따라 y좌표 최종 결정
    if (this.centerCircleAnimationState === 'idle') {
      this.centerCircle_y = this.inCenterCircle_y;
    } else if (this.centerCircleAnimationState === 'done') {
      this.centerCircle_y = this.targetCircleY;
    }

    // Stretch: 애니메이션 상태에 따라 너비 최종 결정
    if (this.stretchAnimationState === 'idle') {
      this.stretchedWidth = this.centerCircleDiameter;
      this.sideStretchedWidth = this.centerCircleDiameter;
      this.stretchedHeight = this.centerCircleDiameter;
    } else if (this.stretchAnimationState === 'done') {
      this.stretchedWidth = this.targetStretchedWidth;
      this.stretchedHeight = this.targetStretchedHeight;
    }

    // Circle A: 애니메이션 상태에 따라 x 오프셋 최종 결정
    if (this.circleA_animationState === 'idle') {
      this.circleA_x_offset = 0;
    } else if (this.circleA_animationState === 'done') {
      this.circleA_x_offset = this.centerCircleDiameter*2;
    }

    // Circle B: 애니메이션 상태에 따라 x 오프셋 최종 결정
    if (this.circleB_animationState === 'idle') {
      this.circleB_x_offset = 0;
    } else if (this.circleB_animationState === 'done') {
      this.circleB_x_offset = -this.centerCircleDiameter*2;
    }

    // =================================================
    // 4. 시각적 요소 렌더링
    // =================================================

    // --- Flash Rectangles 렌더링 ---
    // 이 부분을 다른 시각 요소보다 먼저 그려서 배경처럼 보이게 합니다.


    let spectrum = this.fft.analyze();
    let vol = this.amp.getLevel();

    stroke(255, 20);
    fill(244, 100, 200);

    // 45초 이하일 때만 중첩된 사각형들을 그립니다.
    if (currentTime <= 45) {
      for (let i = 0; i < this.steps; i++) {
        // 중첩된 사각형들 그리기
        let w = map(i, 0, this.steps, this.maxRect_w, 2 * vol * this.minRect_w + this.minRect_w);
        let h = map(i, 0, this.steps, this.maxRect_h, 2 * vol * this.minRect_h + this.minRect_h);
        let center_x = map(i, 0, this.steps, width / 2, this.square_X)
        let center_y = map(i, 0, this.steps, height / 2, this.square_Y)

        // --- 사각형 색상 결정 로직 ---
        let rectColor;

        // 1. 기본 색상 결정 (계단식으로 드러나는 색)
        let revealedIndex = this.colorAnimationProgress * this.steps; // 0 ~ 20
        if (i >= revealedIndex) {
          rectColor = color(0); // 아직 드러나지 않은 부분은 검은색
        } else {
          rectColor = color(225 - 12 * i); // 드러난 부분은 회색조
        }

        // 2. Flash White 애니메이션 적용 (19초)
        if (this.flashWhiteState === 'animating') {
          let elapsed = (millis() - this.flashWhiteAnimationStartTime) / 1000;
          let progress = elapsed / this.flashWhiteDuration; // 0 ~ 1

          // 가장 작은 사각형(i=19)부터 가장 큰 사각형(i=0) 순서로 하이라이트
          let highlightedIndex = floor(map(progress, 0, 1, this.steps - 1, -1));
          if (i === highlightedIndex) {
            rectColor = color(255); // 현재 하이라이트할 사각형만 흰색으로 덮어씀
          }
        }

        // 3. Second Flash White 애니메이션 적용 (34.2초)
        if (this.flashWhite2State === 'animating') {
          let elapsed = (millis() - this.flashWhite2AnimationStartTime) / 1000;
          let progress = elapsed / this.flashWhite2Duration;

          let highlightedIndex = floor(map(progress, 0, 1, this.steps - 1, -1));
          if (i === highlightedIndex) {
            rectColor = color(255); // 현재 하이라이트할 사각형만 흰색으로 덮어씀
          }
        }

        fill(rectColor);
        noStroke();
        rect(center_x, center_y, w, h)
      }
    } 
    
    // --- Screen Flash 렌더링 ---
    // 이 부분을 다른 시각 요소들 위에, 하지만 이모지보다는 아래에 그립니다.
    if (this.screenFlashState === 'flashing') {
      let elapsed = millis() - this.screenFlashStartTime;
      // 0.2초(200ms) 동안 진행
      if (elapsed < this.screenFlashDuration * 1000) {
        let progress = elapsed / (this.screenFlashDuration * 1000);
        // 처음에는 불투명한 흰색(alpha=255), 서서히 투명하게(alpha=0)
        let alpha = lerp(255, 0, progress);
        fill(255, alpha);
        noStroke();
        rect(width / 2, height / 2, width, height);
      } else {
        this.screenFlashState = 'done';
      }
    }
    // --- Second Screen Flash 렌더링 ---
    if (this.screenFlash2State === 'flashing') {
      let elapsed = millis() - this.screenFlash2StartTime;
      if (elapsed < this.screenFlash2Duration * 1000) {
        let progress = elapsed / (this.screenFlash2Duration * 1000);
        let alpha = lerp(255, 0, progress);
        fill(255, alpha);
        noStroke();
        rect(width / 2, height / 2, width, height);
      } else {
        this.screenFlash2State = 'done';
      }
    }

    // 중앙 사각형 구멍 그리기
    if (this.centerCircleAnimationState !== 'done') {
      push();
      fill(255);
      circle(width / 2, height / 2, this.centerCircleDiameter);
      pop();
    }
    // 플래시 사각형
    if (this.flashRectA_state === 'animating') {
      let elapsed = millis() - this.flashRectA_startTime;
      if (elapsed < this.flashRectDuration) {
        let progress = elapsed / this.flashRectDuration;
        let currentWidth = lerp(10, 0, progress);
        fill(255); // 흰색
        noStroke();
        rect(width / 2, height / 2, currentWidth, height);
      } else {
        this.flashRectA_state = 'done';
      }
    }
    if (this.flashRectB_state === 'animating') {
      let elapsed = millis() - this.flashRectB_startTime;
      if (elapsed < this.flashRectDuration) {
        let progress = elapsed / this.flashRectDuration;
        let currentWidth = lerp(10, 0, progress);
        fill(255); // 흰색
        noStroke();
        rect(width / 2, height / 2, currentWidth, height);
      } else {
        this.flashRectB_state = 'done';
      }
    }
    // 중앙 사각형 그리기 (애니메이션 시작 후)
    // 중앙 사각형 애니메이션이 끝나고 나서야 비트에 맞춰 색이 바뀝니다.
    if (this.centerCircleAnimationState === 'done') {
      fill(this.centerSquare_col);
    } else {
      // 그 전까지는 항상 흰색으로 고정됩니다.
      fill(255);
    }
    if (currentTime <= 60) {
    // --- 3개의 원/사각형 그리기 ---
    // Scene2의 첫 오선지 y좌표와 동일하게 맞춤
    const finalY = 100 - 2 * this.note_height;
    let currentY;

    if (this.stretchAnimationState === 'idle') {
      currentY = height / 2;
    } else if (this.stretchAnimationState === 'animating') {
      let elapsed = (millis() - this.stretchAnimationStartTime) / 1000;
      let progress = constrain(elapsed / this.stretchAnimationDuration, 0, 1);
      currentY = lerp(height / 2, finalY, progress);
    } else { // 'done'
      currentY = finalY;
    }

    // 원 1 (중앙 고정)
      if (this.stretchAnimationState === 'idle') {
        ellipse(this.centerCircle_y, currentY, this.centerCircleDiameter, this.centerCircleDiameter);
      } else {
        rect(width / 2, currentY, this.stretchedWidth, this.stretchedHeight);
      }
    
      // 원 2 (오른쪽으로 이동) - 스트레치 애니메이션 적용
      if (this.stretchAnimationState === 'idle') {
        ellipse(width / 2 + this.circleA_x_offset, currentY, this.centerCircleDiameter, this.centerCircleDiameter);
      } else {
        rect(width / 2 + this.circleA_x_offset, currentY, this.sideStretchedWidth, this.stretchedHeight);
      }
    
      // 원 3 (왼쪽으로 이동) - 스트레치 애니메이션 적용
      if (this.stretchAnimationState === 'idle') {
        ellipse(width / 2 + this.circleB_x_offset, currentY, this.centerCircleDiameter, this.centerCircleDiameter);
      } else {
        rect(width / 2 + this.circleB_x_offset, currentY, this.sideStretchedWidth, this.stretchedHeight);
      }
    }

    // --- 오선지 그리기 ---
    if (this.staffAnimationState === 'animating' || this.staffAnimationState === 'done') {
      const numLines = (this.staffAnimationState === 'done') ? this.totalStaffLines : this.staffLinesToDraw;

      // Scene2와 동일한 너비로 설정
      const startX = 50;
      const endX = width - 50;

      let lastLineY = 0; // 마지막으로 그려진 가로선의 y좌표

      // --- BPM에 맞춰 오선지 색상 결정 ---
      let staffColor;
      if (floor(millis() / this.beatDuration) % 2 === 0) {
        staffColor = color(255); // 짝수 비트: 흰색
      } else {
        staffColor = color(0);   // 홀수 비트: 검은색
      }

      // --- 5선지 그리기 ---
      stroke(staffColor);
      strokeWeight(1);
      for (let i = 0; i < numLines; i++) {
        const staveIndex = floor(i / 5); // 0부터 5까지 (총 6개 오선지 묶음)
        const lineInStaveIndex = i % 5;  // 0부터 4까지 (묶음 내 라인 번호)
  
        const staffGroupIndex = floor(staveIndex / 2); // 0, 1, 2 (두 묶음씩 그룹)
        const staffInGroupIndex = staveIndex % 2;      // 0, 1 (그룹 내 인덱스)
        const staveCenterY = 100 + (staffGroupIndex * this.note_height * 25) + (staffInGroupIndex * this.note_height * 10);
        const lineY = staveCenterY - (2 * this.note_height) + (lineInStaveIndex * this.note_height);
  
        line(startX, lineY, endX, lineY); // 오선지 한 줄 그리기
        lastLineY = lineY; // 마지막 y좌표 업데이트
      }
  
      // --- 5선지 두 개씩 묶는 세로선 그리기 ---
      // 세로선은 가로선이 그려진 만큼만 점진적으로 길어집니다.
      const numStaffGroups = floor(numLines / 10);
      strokeWeight(4);
      stroke(staffColor);

      // 이미 완성된 그룹은 전체 길이를 그립니다.
      for (let j = 0; j < numStaffGroups; j++) {
        const y1_top = 100 + j * this.note_height * 25 - 2 * this.note_height;
        const y2_bottom = 100 + this.note_height * 10 + j * this.note_height * 25 + 2 * this.note_height;
        line(startX, y1_top, startX, y2_bottom);
        line(endX, y1_top, endX, y2_bottom);
      }

      // 현재 그려지고 있는 그룹은 마지막 가로선까지만 그립니다.
      if (numLines > 0 && numLines < this.totalStaffLines) {
        const currentGroupIndex = floor((numLines - 1) / 10);
        const y1_top = 100 + currentGroupIndex * this.note_height * 25 - 2 * this.note_height;
        line(startX, y1_top, startX, lastLineY);
        line(endX, y1_top, endX, lastLineY);
      }
    }
    if(currentTime <= 1){
      push();
      textAlign(CENTER, CENTER);
      fill(random(245, 255));
      rect(width/2, height/2, windowWidth, windowHeight);
      textSize(63);
      text('❤️',width/2, height/2);
      pop();
    }
    if(currentTime < 60.167 && currentTime > 59.167){
      background(random(245, 255))
      push();
      textAlign(CENTER, CENTER);
      fill(random(245, 255));
      rect(width/2, height/2, windowWidth, windowHeight);
      textSize(50);
      text('👶',width/2, height/2);
      pop();
    }

    // --- "Boring Angel" 제목 ---
    // 애니메이션이 끝나기 전까지 제목을 그립니다.
    if (this.titleAnimationState !== 'done') {
      push();
      textAlign(CENTER, CENTER);

      let title1 = "Synthetic";
      let title2 = "Sublime";
      let padding = 10;
      let initialSize = 350;
      let baseSize = initialSize;
      let textW = textWidth(title1);
      if (textW > width - padding) {
        baseSize = initialSize * ((width - padding) / textW);
      }

      let currentSize = baseSize;
      let currentAlpha = 255;

      if (this.titleAnimationState === 'animating') {
        const elapsed = millis() - this.titleAnimationStartTime;
        const progress = constrain(elapsed / this.titleAnimationDuration, 0, 1);
        const easedProgress = progress * progress; // Ease-in

        // 크기는 화면의 5배까지, 알파는 0으로
        currentSize = lerp(baseSize, width * 5, easedProgress);
        currentAlpha = lerp(255, 0, easedProgress);

        if (progress >= 1) {
          this.titleAnimationState = 'done';
        }
      }

      fill(0, 0, 255, currentAlpha);
      textSize(currentSize);

      // 애니메이션 중이 아닐 때만 깜빡임 효과 적용
      if (this.titleAnimationState === 'idle') {
        if (floor(millis() / 500) % 2 === 0) {
          text(title1, width / 2, height / 2 - currentSize / 1.5);
          text(title2, width / 2, height / 2 + currentSize / 1.5);
        }
      } else { // 애니메이션 중에는 항상 표시
        text(title1, width / 2, height / 2 - currentSize / 1.5);
        text(title2, width / 2, height / 2 + currentSize / 1.5);
      }

      pop();
    }
  }

  // 재생/일시정지 로직을 별도 함수로 분리
  togglePlay() {
    if (this.song.isPlaying()) {
      this.pauseStartTime = millis(); // maxRect 애니메이션 멈춘 시간 기록
      this.minRectPauseStartTime = millis(); // minRect 애니메이션 멈춘 시간 기록
      this.centerCirclePauseStartTime = millis(); // centerCircle 애니메이션 멈춘 시간 기록
      this.stretchAnimationPauseStartTime = millis(); // stretch 애니메이션 멈춘 시간 기록
      this.circleA_pauseStartTime = millis();
      this.circleB_pauseStartTime = millis();
      this.staffAnimationPauseStartTime = millis();
      // flashRect 애니메이션은 멈추지 않고 계속 진행되도록 둡니다.
      this.song.pause();
    } else {
      // --- 타이틀 애니메이션 시작 ---
      if (this.titleAnimationState === 'idle') {
        this.titleAnimationState = 'animating';
        this.titleAnimationStartTime = millis();
      }
      // 멈춘 상태에서 다시 재생할 때, 멈춰있던 시간만큼 애니메이션 시작 시간을 보정
      if (this.animationState === 'animating' && this.pauseStartTime) {
        this.animationStartTime += millis() - this.pauseStartTime;
      }
      if (this.minRectAnimationState === 'animating' && this.minRectPauseStartTime) {
        this.minRectAnimationStartTime += millis() - this.minRectPauseStartTime;
      }
      if (this.centerCircleAnimationState === 'animating' && this.centerCirclePauseStartTime) {
        this.centerCircleAnimationStartTime += millis() - this.centerCirclePauseStartTime;
      }
      if (this.stretchAnimationState === 'animating' && this.stretchAnimationPauseStartTime) {
        this.stretchAnimationStartTime += millis() - this.stretchAnimationPauseStartTime;
      }
      if (this.circleA_animationState === 'animating' && this.circleA_pauseStartTime) {
        this.circleA_animationStartTime += millis() - this.circleA_pauseStartTime;
      }
      if (this.circleB_animationState === 'animating' && this.circleB_pauseStartTime) {
        this.circleB_animationStartTime += millis() - this.circleB_pauseStartTime;
      }
      if (this.staffAnimationState === 'animating' && this.staffAnimationPauseStartTime) {
        this.staffAnimationStartTime += millis() - this.staffAnimationPauseStartTime;
      }
      if (this.flashWhiteState === 'animating') {
        // flashWhite는 짧아서 일시정지 보정 로직을 생략합니다.
      }
      if (this.screenFlashState === 'flashing') {
        this.screenFlashStartTime += millis() - this.pauseStartTime;
      }
      if (this.flashWhite2State === 'animating') {
        // 짧아서 생략
      }
      if (this.screenFlash2State === 'flashing') {
        this.screenFlash2StartTime += millis() - this.pauseStartTime;
      }
      this.song.play();
      this.song.setVolume(0.8);
    }
  }

  // 스페이스바를 누르면 재생/일시정지 토글
  keyPressed() {
    if (keyCode === 32) { // 32 is the keycode for SPACEBAR
      this.togglePlay();
    }
  }

  // 화면을 터치(클릭)하면 재생/일시정지 토글
  mousePressed() {
    this.togglePlay();
  }
}