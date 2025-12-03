class Scene4 {
  constructor() {
    // --- 이모지 배열 ---
    this.faceEmojis = []; // 중앙에 표시될 얼굴 모양 이모지들을 담는 배열
    this.nonFaceEmojis = []; // 그리드의 나머지 부분을 채울 얼굴 이외의 이모지들을 담는 배열

    // --- 상수 정의 ---
    this.INITIAL_GRID_SIZE = 39; // 애니메이션 시작 시 그리드의 크기 (39x39)
    this.GRID_FILL_DURATION = 10000; // 그리드가 채워지는 데 걸리는 시간 (10초)
    this.ANIMATION_DURATION = 20000; // 전체 줌/속도 애니메이션이 지속되는 시간 (20초)
    this.ZOOM_SCALE = 12.3; // 최종 줌 배율 (12.3배 확대)

    // --- 그리드 관련 변수 ---
    this.emojiGrid = []; // 그리드 각 셀의 이모지 정보를 저장하는 2차원 배열
    this.gridSize = this.INITIAL_GRID_SIZE; // 현재 그리드의 크기. 여기서는 초기값으로 고정됨
    this.emptyCellIndices = []; // 그리드에서 아직 비어있는 셀들의 인덱스를 저장하는 배열

    // --- 이모지 업데이트 타이머 관련 변수 ---
    this.SLOW_UPDATE_INTERVAL = 1000; // 애니메이션 초반부의 느린 이모지 업데이트 간격 (1초)
    this.FAST_CENTER_UPDATE_INTERVAL = 0; // 애니메이션 후반부의 중앙 이모지 업데이트 간격 (매 프레임)
    this.FAST_NONFACE_UPDATE_INTERVAL = 200; // 애니메이션 후반부의 주변 이모지 업데이트 간격 (0.2초)
    this.currentCenterEmojiUpdateInterval = this.SLOW_UPDATE_INTERVAL; // 현재 중앙 이모지의 업데이트 간격. 애니메이션에 따라 변함
    this.currentNonFaceEmojiUpdateInterval = this.SLOW_UPDATE_INTERVAL; // 현재 주변 이모지의 업데이트 간격. 애니메이션에 따라 변함
    this.lastCenterEmojiUpdateTime = 0; // 마지막으로 중앙 이모지가 업데이트된 시간을 기록
    this.lastNonFaceEmojiUpdateTime = 0; // 마지막으로 주변 이모지가 업데이트된 시간을 기록

    // --- 효과 관련 변수 ---
    this.shakePixel = 0.5; // 화면 전체에 적용되는 미세한 떨림 효과의 강도
    this.currentZoom = 1.0; // 현재 줌 배율. 애니메이션에 따라 1.0에서 ZOOM_SCALE까지 변함

    // --- 애니메이션 상태 관리 ---
    this.animationPhase = 'INITIAL'; // 애니메이션의 현재 단계를 나타냄 ('INITIAL', 'ANIMATING', 'FINAL', 'ANGEL_MODE')
    this.animationStartTime = 0; // 'ANIMATING' 단계가 시작된 시간을 기록
    this.finalStateStartTime = 0; // 'FINAL' 단계가 시작된 시간을 기록

    this.isReady = false; // setup() 함수가 완료되었는지 여부를 나타내는 플래그
  }

  preload() {
    // 이 씬에서 개별적으로 로드할 에셋은 없습니다.
  }

  setup() {
    textAlign(CENTER, CENTER);
    // 얼굴 이모지 배열 초기화
    this.faceEmojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '🤡'];

    // 얼굴을 제외한 이모지 배열 초기화 (일부만 표시)
    this.nonFaceEmojis = [ // (이모지 목록은 매우 길어서 생략합니다)
        // 동물 및 자연
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔', '🐾', '🐉', '🐲', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎', '🌍', '🌏', '💫', '⭐️', '🌟', '✨', '⚡️', '☄️', '💥', '🔥', '🌪', '🌈', '☀️', '🌤', '⛅️', '🌥', '☁️', '🌦', '🌧', '⛈', '🌩', '🌨', '❄️', '☃️', '⛄️', '🌬', '💨', '💧', '💦', '🌊', '🌫',
        // 음식 및 음료
        '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🥝', '🍅', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕️', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧃', '🧉', '🧊', '🥢', '🍽', '🍴', '🥄', '🔪', '🏺',
        // 활동
        '⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳️', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️‍♀️', '🏋️‍♂️', '🤼‍♀️', '🤼‍♂️', '🤸‍♀️', '🤸‍♂️', '⛹️‍♀️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🤾‍♂️', '🏌️‍♀️', '🏌️‍♂️', '🏇', '🧘‍♀️', '🧘‍♂️', '🏄‍♀️', '🏄‍♂️', '🏊‍♀️', '🏊‍♂️', '🤽‍♀️', '🤽‍♂️', '🚣‍♀️', '🚣‍♂️', '🧗‍♀️', '🧗‍♂️', '🚵‍♀️', '🚵‍♂️', '🚴‍♀️', '🚴‍♂️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '🎗', '🎫', '🎟', '🎪', '🤹‍♀️', '🤹‍♂️', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩',
        // 여행 및 장소
        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩', '💺', '🛰', '🚀', '🛸', '🚁', '🛶', '⛵️', '🚤', '🛥', '🛳', '⛴', '🚢', '⚓️', '⛽️', '🚧', '🚦', '🚥', '🚏', '🗺', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟', '🎡', '🎢', '🎠', '⛲️', '⛱', '🏖', '🏝', '🏜', '🌋', '⛰', '🏔', '🗻', '🏕', '⛺️', '🏠', '🏡', '🏘', '🏚', '🏗', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛', '⛪️', '🕌', '🕍', '🛕', '🕋', '⛩', '🛤', '🛣', '🗾', '🎑', '🏞', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙', '🌃', '🌌', '🌉', '🌁',
        // 사물
        '⌚️', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛️', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🔧', '🔨', '⚒', '🛠', '⛏', '🔩', '⚙️', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🧴', '🛎', '🔑', '🗝', '🚪', '🪑', '🛋', '🛏', '🛌', '🧸', '🖼', '🛍', '🛒', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📮', '📪', '📫', '📬', '📭', '📦', '🏷', '🔖', '🗒', '📄', '📃', '📑', '🧾', '📊', '📈', '📉', '📜', '📋', '📌', '📍', '📎', '🖇', '📏', '📐', '✂️', '🗃', '🗄', '🗑', '🔒', '🔓', '🔏', '🔐',
        // 기호
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓️', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕️', '🛑', '⛔️', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜', '🔰', '♻️', '✅', '🈯️', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿️', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸', '⏯', '⏹', '⏺', '⏭', '⏮', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔜', '🔝', '☑️', '✔️',
        // 국기
        // '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇨', '🇦🇩', '🇦🇪', '🇦🇫', '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲', '🇦🇴', '🇦🇶', '🇦🇷', '🇦🇸', '🇦🇹', '🇦🇺', '🇦🇼', '🇦🇽', '🇦🇿', '🇧🇦', '🇧🇧', '🇧🇩', '🇧🇪', '🇧🇫', '🇧🇬', '🇧🇭', '🇧🇮', '🇧🇯', '🇧🇱', '🇧🇲', '🇧🇳', '🇧🇴', '🇧🇶', '🇧🇷', '🇧🇸', '🇧🇹', '🇧🇻', '🇧🇼', '🇧🇾', '🇧🇿', '🇨🇦', '🇨🇨', '🇨🇩', '🇨🇫', '🇨🇬', '🇨🇭', '🇨🇮', '🇨🇰', '🇨🇱', '🇨🇲', '🇨🇳', '🇨🇴', '🇨🇵', '🇨🇷', '🇨🇺', '🇨🇻', '🇨🇼', '🇨🇽', '🇨🇾', '🇨🇿', '🇩🇪', '🇩🇬', '🇩🇯', '🇩🇰', '🇩🇲', '🇩🇴', '🇩🇿', '🇪🇦', '🇪🇨', '🇪🇪', '🇪🇬', '🇪🇭', '🇪🇷', '🇪🇸', '🇪🇹', '🇪🇺', '🇫🇮', '🇫🇯', '🇫🇰', '🇫🇲', '🇫🇴', '🇫🇷', '🇬🇦', '🇬🇧', '🇬🇩', '🇬🇪', '🇬🇫', '🇬🇬', '🇬🇭', '🇬🇮', '🇬🇱', '🇬🇲', '🇬🇳', '🇬🇵', '🇬🇶', '🇬🇷', '🇬🇸', '🇬🇹', '🇬🇺', '🇬🇼', '🇬🇾', '🇭🇰', '🇭🇲', '🇭🇳', '🇭🇷', '🇭🇹', '🇭🇺', '🇮🇨', '🇮🇩', '🇮🇪', '🇮🇱', '🇮🇲', '🇮🇳', '🇮🇴', '🇮🇶', '🇮🇷', '🇮🇸', '🇮🇹', '🇯🇪', '🇯🇲', '🇯🇴', '🇯🇵', '🇰🇪', '🇰🇬', '🇰🇭', '🇰🇮', '🇰🇲', '🇰🇳', '🇰🇵', '🇰🇷', '🇰🇼', '🇰🇾', '🇰🇿', '🇱🇦', '🇱🇧', '🇱🇨', '🇱🇮', '🇱🇰', '🇱🇷', '🇱🇸', '🇱🇹', '🇱🇺', '🇱🇻', '🇱🇾', '🇲🇦', '🇲🇨', '🇲🇩', '🇲🇪', '🇲🇫', '🇲🇬', '🇲🇭', '🇲🇰', '🇲🇱', '🇲🇲', '🇲🇳', '🇲🇴', '🇲🇵', '🇲🇶', '🇲🇷', '🇲🇸', '🇲🇹', '🇲🇺', '🇲🇻', '🇲🇼', '🇲🇽', '🇲🇾', '🇲🇿', '🇳🇦', '🇳🇨', '🇳🇪', '🇳🇫', '🇳🇬', '🇳🇮', '🇳🇱', '🇳🇴', '🇳🇵', '🇳🇷', '🇳🇺', '🇳🇿', '🇴🇲', '🇵🇦', '🇵🇪', '🇵🇫', '🇵🇬', '🇵🇭', '🇵🇰', '🇵🇱', '🇵🇲', '🇵🇳', '🇵🇷', '🇵🇸', '🇵🇹', '🇵🇼', '🇵🇾', '🇶🇦', '🇷🇪', '🇷🇴', '🇷🇸', '🇷🇺', '🇷🇼', '🇸🇦', '🇸🇧', '🇸🇨', '🇸🇩', '🇸🇪', '🇸🇬', '🇸🇭', '🇸🇮', '🇸🇯', '🇸🇰', '🇸🇱', '🇸🇲', '🇸🇳', '🇸🇴', '🇸🇷', '🇸🇸', '🇸🇹', '🇸🇻', '🇸🇽', '🇸🇾', '🇸🇿', '🇹🇦', '🇹🇨', '🇹🇩', '🇹🇫', '🇹🇬', '🇹🇭', '🇹🇯', '🇹🇰', '🇹🇱', '🇹🇲', '🇹🇳', '🇹🇴', '🇹🇷', '🇹🇹', '🇹🇻', '🇹🇼', '🇹🇿', '🇺🇦', '🇺🇬', '🇺🇲', '🇺🇳', '🇺🇸', '🇺🇾', '🇺🇿', '🇻🇦', '🇻🇨', '🇻🇪', '🇻🇬', '🇻🇮', '🇻🇳', '🇻🇺', '🇼🇫', '🇼🇸', '🇽🇰', '🇾🇪', '🇾🇹', '🇿🇦', '🇿🇲', '🇿🇼', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁷󠁬󠁳󠁿'
      ];

    this.isReady = true;
    console.log("Scene 4 is set up and ready.");
  }

  enter() {
    console.log("Entering Scene 4");
    // sketch.js의 떨림 효과(translate)가 적용된 상태에서 enter()가 호출될 수 있으므로,

    frameRate(60);
    textAlign(CENTER, CENTER);

    // --- 상태 초기화 (emoji.js의 setup과 keyPressed 로직을 합침) ---
    this.animationPhase = 'ANIMATING';
    this.animationStartTime = millis();
    this.finalStateStartTime = 0;

    this.currentZoom = 1.0;
    this.currentCenterEmojiUpdateInterval = this.SLOW_UPDATE_INTERVAL;
    this.currentNonFaceEmojiUpdateInterval = this.SLOW_UPDATE_INTERVAL;

    this.prepareInitialGrid();
    this.lastNonFaceEmojiUpdateTime = millis();
    this.lastCenterEmojiUpdateTime = millis();
  }

  draw() {
    if (!this.isReady) return;

    // push/pop을 사용하여 이 씬의 그리기가 외부(sketch.js)의 좌표계에 영향을 주지 않도록 격리합니다.
    push();

    const now = millis();
    background(random(245, 255),20); // 배경을 불투명하게 하여 잔상을 없앱니다.

    // --- 상태별 애니메이션 처리 ---
    if (this.animationPhase === 'ANIMATING') {
      let elapsed = now - this.animationStartTime;

      let animationProgress = constrain(elapsed / this.ANIMATION_DURATION, 0, 1);
      let gridFillProgress = constrain(elapsed / this.GRID_FILL_DURATION, 0, 1);

      const zoomEasedProgress = animationProgress * animationProgress;
      const emojiEasedProgress = 1 - (1 - animationProgress) * (1 - animationProgress); // Ease-Out
      // 그리드 채우기 속도를 처음에는 느리게, 나중에는 빠르게 하기 위한 Ease-In 함수 적용
      const gridFillEasedProgress = gridFillProgress * gridFillProgress;

      // 1. 그리드 채우기
      const targetFilledCount = floor(gridFillEasedProgress * (this.gridSize * this.gridSize - 1));
      const currentFilledCount = (this.gridSize * this.gridSize - 1) - this.emptyCellIndices.length; // 현재 채워진 셀 개수
      const cellsToFill = targetFilledCount - currentFilledCount;

      for (let i = 0; i < cellsToFill; i++) {
        if (this.emptyCellIndices.length > 0) {
          const randomIndex = floor(random(this.emptyCellIndices.length));
          const cellIndex = this.emptyCellIndices.splice(randomIndex, 1)[0];
          const r = floor(cellIndex / this.gridSize);
          const c = cellIndex % this.gridSize;
          this.emojiGrid[r][c] = random(this.nonFaceEmojis);
        }
      }

      // 2. 줌 인 & 속도 가속
      this.currentZoom = lerp(1.0, this.ZOOM_SCALE, zoomEasedProgress);
      this.currentCenterEmojiUpdateInterval = lerp(this.SLOW_UPDATE_INTERVAL, this.FAST_CENTER_UPDATE_INTERVAL, emojiEasedProgress);
      this.currentNonFaceEmojiUpdateInterval = lerp(this.SLOW_UPDATE_INTERVAL, this.FAST_NONFACE_UPDATE_INTERVAL, emojiEasedProgress);

      // 3. 애니메이션 종료 처리
      if (animationProgress >= 1) {
        if (this.animationPhase !== 'FINAL') {
          this.animationPhase = 'FINAL';
          this.finalStateStartTime = now;
        }
      }
    } else if (this.animationPhase === 'FINAL') {
      if (now - this.finalStateStartTime > 4000) { // 4초 후
        this.animationPhase = 'ANGEL_MODE';
      }
    }

    push();
    translate(width / 2, height / 2);
    scale(this.currentZoom);
    translate(-width / 2, -height / 2);
    translate(random(-this.shakePixel, this.shakePixel), random(-this.shakePixel, this.shakePixel));

    // 중앙 얼굴 이모지 업데이트
    if (now - this.lastCenterEmojiUpdateTime > this.currentCenterEmojiUpdateInterval) {
      const centerIndex = floor(this.gridSize / 2);
      if (this.emojiGrid[centerIndex] && this.emojiGrid[centerIndex][centerIndex]) {
        this.emojiGrid[centerIndex][centerIndex] = random(this.faceEmojis);
      }
      this.lastCenterEmojiUpdateTime = now;
    }

    // 주변 이모지 업데이트
    if ((this.animationPhase === 'ANIMATING' || this.animationPhase === 'FINAL') && now - this.lastNonFaceEmojiUpdateTime > this.currentNonFaceEmojiUpdateInterval) {
      this.updateNonFaceEmojis();
      this.lastNonFaceEmojiUpdateTime = now;
    }

    this.drawGrid();
    pop();

    // pop()을 호출한 후, sketch.js의 좌표계로 돌아온 상태이므로,
    // 이 씬의 그리기가 끝났음을 명시적으로 알리기 위해 다시 pop()을 호출합니다.
    pop();
  }

  keyPressed() {
    // 이 씬에서는 키 입력에 따른 동작이 없습니다.
  }

  prepareInitialGrid() {
    this.emojiGrid = [];
    this.emptyCellIndices = [];
    const centerIndex = floor(this.gridSize / 2);

    for (let r = 0; r < this.gridSize; r++) {
      const row = [];
      for (let c = 0; c < this.gridSize; c++) {
        if (r === centerIndex && c === centerIndex) {
          row.push(random(this.faceEmojis));
        } else {
          row.push(' ');
          this.emptyCellIndices.push(r * this.gridSize + c);
        }
      }
      this.emojiGrid.push(row);
    }
    shuffle(this.emptyCellIndices, true);
  }

  updateNonFaceEmojis() {
    const centerIndex = floor(this.gridSize / 2);
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if ((r !== centerIndex || c !== centerIndex) && this.emojiGrid[r][c] !== ' ') {
          if (this.emojiGrid[r] && this.emojiGrid[r][c]) {
            this.emojiGrid[r][c] = random(this.nonFaceEmojis);
          }
        }
      }
    }
  }

  drawGrid() {
    const cellWidth = width / this.gridSize;
    const cellHeight = height / this.gridSize;
    textSize(min(cellWidth, cellHeight) * 0.8);

    const viewX = (width / 2) - (width / 2 / this.currentZoom);
    const viewY = (height / 2) - (height / 2 / this.currentZoom);
    const viewWidth = width / this.currentZoom;
    const viewHeight = height / this.currentZoom;

    const startCol = floor(viewX / cellWidth);
    const endCol = ceil((viewX + viewWidth) / cellWidth);
    const startRow = floor(viewY / cellHeight);
    const endRow = ceil((viewY + viewHeight) / cellHeight);

    const centerIndex = floor(this.gridSize / 2);

    for (let r = constrain(startRow, 0, this.gridSize - 1); r <= constrain(endRow, 0, this.gridSize - 1); r++) {
      for (let c = constrain(startCol, 0, this.gridSize - 1); c <= constrain(endCol, 0, this.gridSize - 1); c++) {
        let emojiToDraw;
        if (this.animationPhase === 'ANGEL_MODE') {
          emojiToDraw = (r === centerIndex && c === centerIndex) ? '😇' : '👼';
        } else {
          if (this.emojiGrid[r] && this.emojiGrid[r][c]) {
            emojiToDraw = this.emojiGrid[r][c];
          } else {
            emojiToDraw = ' '; // 혹시 모를 오류 방지
          }
        }
        const x = c * cellWidth + cellWidth / 2;
        const y = r * cellHeight + cellHeight / 2;
        text(emojiToDraw, x, y);
      }
    }
  }
}
