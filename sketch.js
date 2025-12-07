let sceneManager;
let song;
let wingdingsFont; // 폰트를 담을 전역 변수
let fft; // FFT 객체를 전역으로 이동
let amp; // 볼륨 측정을 위한 Amplitude 객체
let bravuraFont;
let timer = 0;
let isMobile; // 모바일 기기 여부 확인용 변수
let FONT_URL = 'https://raw.githubusercontent.com/77ysk5wzh6-wq/BravuraFont/main/Bravura.otf';


function preload() {
  song = loadSound("assets/boringAngel_2.mp3"); // 오디오 파일 로드
  wingdingsFont = loadFont("assets/wingding.ttf"); // Wingdings 폰트 로드
  bravuraFont = loadFont(FONT_URL);

  // SceneManager를 생성하고 각 씬의 preload를 호출합니다.
  // preload() 내에서 씬을 생성해야 각 씬의 preload()가 정상적으로 호출됩니다.
  sceneManager = new SceneManager();
  sceneManager.addScene(new Scene1(song)); // Scene1 추가 (인덱스 0)
  sceneManager.addScene(new Scene2(song, wingdingsFont, bravuraFont)); // Scene2 (구 Scene1_5) 추가 (인덱스 1)
  sceneManager.addScene(new Scene3(song, wingdingsFont, bravuraFont)); // Scene3 (구 Scene2) 추가 (인덱스 2)
  sceneManager.addScene(new Scene4()); // Scene4 (구 Scene3) 추가 (인덱스 3)
  sceneManager.addScene(new Scene5()); // Scene5 (구 Scene4) 추가 (인덱스 4)
  sceneManager.preload();
}

function setup() {
  createCanvas(windowWidth - 10, windowHeight - 10); // 캔버스를 창 크기로 설정

  // 사용자 에이전트를 확인하여 모바일 기기인지 판별합니다.
  isMobile = /Mobi|Android/i.test(navigator.userAgent);

  fft = new p5.FFT(0.8, 512); // FFT 객체 초기화
  amp = new p5.Amplitude(); // Amplitude 객체 초기화

  // 모든 씬의 setup()을 호출합니다.
  sceneManager.setup();
  sceneManager.showScene(0); // 첫 번째 씬으로 시작
}

function draw() {
  // push()와 pop()으로 감싸서 translate 효과가 누적되지 않도록 합니다.
  push();
  // console.log(amp.getLevel());
  // --- 볼륨 기반 캔버스 떨림 로직 ---
  if (song.isPlaying()) {
    let vol = amp.getLevel(); // 현재 볼륨값 (0.0 ~ 1.0)
    // 볼륨값을 -2 ~ 2 범위로 매핑하여 떨림 강도 결정
    let shake = map(vol, 0, 1, 0, 4);
    // 캔버스 좌표계를 무작위로 이동시켜 떨림 효과를 줍니다.
    translate(random(-shake, shake), random(-shake, shake));
  }

  // 현재 활성화된 씬의 draw() 함수를 실행합니다.
  sceneManager.draw();




  // --- 타이머 표시 ---
  // 분:초:밀리초 형식으로 변환
  let minutes = floor(timer / 60);
  let seconds = floor(timer % 60);
  let millis = floor((timer * 1000) % 1000);

  // nf() 함수로 숫자를 두 자리 또는 세 자리 문자열로 포맷팅 (예: 5 -> "05")
  let timeString = nf(minutes, 2) + ':' + nf(seconds, 2) + ':' + nf(millis, 3);

  // 타이머 위치 설정
  let timerX = width / 2;
  let timerY = height - 30;

  // 3.5초가 지나고 음악이 재생 중일 때만 타이머를 떨리게 합니다.
  if (timer > 3.5 && song.isPlaying()) {
    // x축으로 매 프레임 떨림
    timerX += random(-3, 3);
    // y축으로 20프레임마다 떨림
    if (frameCount % 40 === 0) {
      timerY += random(-2, 2);
    }
  }


  // 화면 하단 중앙에 텍스트로 타이머 표시
  // Scene2에서는 배경이 흰색이므로 타이머를 검정으로 표시
  if (sceneManager.sceneIndex === 1 || sceneManager.sceneIndex === 2 || sceneManager.sceneIndex === 3) {
    fill(0);
  } else {
    fill(255); // 흰색
  }
  noStroke();
  textSize(24);
  // 타이머는 항상 기본 폰트로 표시되도록 설정합니다.
  textFont('sans-serif');
  textAlign(CENTER, CENTER);
  text(timeString, timerX, timerY);

  // push()로 저장했던 좌표계를 복원합니다.
  pop();
}

function keyPressed() {
  // 숫자 '1' 키를 누르면 Scene1으로 전환
  if (key === '1') {
    timer = 0; // 타이머를 0으로 리셋
    song.stop();
    sceneManager.showScene(0); // Scene1(인덱스 0) 표시
  }
  // 숫자 '2' 키를 누르면 Scene2로 전환
  else if (key === '2') {
    // Scene2로 전환하고, 음원을 60초로 점프시킨 후 재생합니다.
    sceneManager.showScene(1);
    timer = 60.167; // 타이머 변수도 즉시 60.167로 설정
    song.jump(60.167); // 음원 재생 위치를 60.167초로 즉시 이동
  }
  // 숫자 '3' 키를 누르면 Scene3로 전환
  else if (key === '3') {
    sceneManager.showScene(2);
    timer = 111.0;
    song.jump(111.0);
  }
  // 숫자 '4' 키를 누르면 Scene4로 전환
  else if (key === '4') {
    sceneManager.showScene(3);
    timer = 144.03;
    song.jump(144.03);
  }
  // 숫자 '5' 키를 누르면 Scene5로 전환
  else if (key === '5') {
    sceneManager.showScene(4);
    timer = 182.1;
    song.jump(182.1);
  }
  // 엔터 키를 누르면 씬을 리셋하고 처음부터 다시 시작
  else if (keyCode === ENTER) {
    // 현재 씬에 따라 다른 리셋 로직을 실행합니다.
    if (sceneManager.sceneIndex === 0) {
      timer = 0;
      song.stop();
      sceneManager.showScene(0); // Scene1 리셋
    } else if (sceneManager.sceneIndex === 1) {
      sceneManager.currentScene.enter(); // Scene2 리셋
    } else if (sceneManager.sceneIndex === 2) {
      sceneManager.currentScene.reset(); // Scene3 리셋
    } else if (sceneManager.sceneIndex === 3) {
      sceneManager.showScene(3); // Scene4 리셋
    } else if (sceneManager.sceneIndex === 4) {
      sceneManager.showScene(4); // Scene5 리셋
    }
  }

  // 그 외의 키(스페이스바 등)가 눌렸을 때만 현재 씬의 keyPressed() 함수를 실행
  else {
    sceneManager.keyPressed();
  }
}

function mousePressed() {
  // 모든 환경(PC, 모바일)에서 터치/클릭으로 시작/일시정지
  if (sceneManager.currentScene && sceneManager.currentScene.mousePressed) {
    sceneManager.currentScene.mousePressed();
  }
}

// 여러 씬을 관리하는 클래스
class SceneManager {
  constructor() {
    this.scenes = [];
    this.currentScene = null;
    this.sceneIndex = -1;
  }

  addScene(scene) {
    this.scenes.push(scene);
  }

  preload() {
    for (let scene of this.scenes) {
      if (scene.preload) {
        scene.preload();
      }
    }
  }

  showScene(index, callback) {
    if (index < this.scenes.length) {
      this.sceneIndex = index;
      this.currentScene = this.scenes[index];
      // 씬 전환 시에는 setup() 대신 enter()를 호출하여 상태를 리셋합니다.
      if (this.currentScene.enter) {
        this.currentScene.enter();
      }
      if (callback) callback();
    }
  }

  setup() {
    for (let scene of this.scenes) {
      if (scene.setup) {
        scene.setup();
      }
    }
  }

  showNextScene() {
    let nextSceneIndex = (this.sceneIndex + 1) % this.scenes.length;
    if (this.sceneIndex !== nextSceneIndex) { // 씬이 실제로 변경될 때만 setup() 호출
      this.showScene(nextSceneIndex);
    }
  }


  draw() {
    if (this.currentScene) {
      // 음악이 재생 중일 때만 타이머 업데이트
      // 씬 전환 직후 timer가 0으로 돌아가는 것을 방지하기 위해,
      // song.currentTime()이 timer보다 현저히 작으면 업데이트하지 않음.
      if (song.isPlaying() && song.currentTime() > 0.1) {
        // --- 씬 전환 로직을 SceneManager 내부로 이동 ---
        const currentTime = song.currentTime();
        
        // 211초에 엔딩 시퀀스 시작 (Scene5에서)
        if (currentTime >= 211 && this.sceneIndex === 4 && this.currentScene instanceof Scene5) {
          this.currentScene.startEndingSequence();
        }
        else if (currentTime >= 182.1 && this.sceneIndex < 4) { // Scene5로 전환
          this.showScene(4);
        } else if (currentTime >= 144.03 && this.sceneIndex < 3) { // Scene4로 전환
          this.showScene(3);
        } else if (currentTime >= 111.0 && this.sceneIndex < 2) { // Scene3로 전환
          this.showScene(2);
        } else if (currentTime >= 60.167 && this.sceneIndex < 1) { // Scene2로 전환
          this.showScene(1);
        }

        timer = song.currentTime();
      }
      this.currentScene.draw();
    }
  }

  keyPressed() {
    if (this.currentScene) {
      this.currentScene.keyPressed();
    }
  }

  mousePressed() {
    if (this.currentScene && this.currentScene.mousePressed) {
      this.currentScene.mousePressed();
    }
  }
}