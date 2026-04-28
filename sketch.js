let video;
let handPose;
let hands = [];
let displayW, displayH, offsetX, offsetY;
let statusMsg = "正在初始化系統...";
let isModelLoaded = false;
let webGLSupported = true;

function preload() {
  // 檢查 WebGL 支援
  let canvas = document.createElement('canvas');
  let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    webGLSupported = false;
    statusMsg = "錯誤：您的裝置不支援 WebGL，無法執行影像辨識。";
  } else {
    // 初始化 HandPose 模型
    handPose = ml5.handPose({ flipped: true }, modelLoaded);
  }
}

function modelLoaded() {
  console.log("HandPose Model Loaded!");
  isModelLoaded = true;
  statusMsg = "系統就緒：模型載入成功";
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  if (webGLSupported) {
    video = createCapture(VIDEO, { flipped: true });
    video.hide();
    updateDisplayMetrics();
    // 開始偵測
    handPose.detectStart(video, gotHands);
  }
}

function updateDisplayMetrics() {
  displayW = width * 0.5;
  displayH = height * 0.5;
  offsetX = (width - displayW) / 2;
  offsetY = (height - displayH) / 2;
}

function gotHands(results) {
  hands = results;
}

function draw() {
  background('#e7c6ff');

  // 1. 顯示狀態訊息
  fill(0);
  noStroke();
  textSize(16);
  text(`狀態: ${statusMsg}`, 20, 30);

  if (!webGLSupported) return; // 如果不支援 WebGL 就停止後續繪製

  // 2. 置中顯示影像
  image(video, offsetX, offsetY, displayW, displayH);

  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        
        // 設定線條樣式
        strokeWeight(3);
        if (hand.handedness == "Left") {
          stroke(255, 0, 255); // 左手粉色線
          fill(255, 0, 255);
        } else {
          stroke(255, 255, 0); // 右手黃色線
          fill(255, 255, 0);
        }

        // 3. 繪製手指連線 (0-4, 5-8, 9-12, 13-16, 17-20)
        drawFingerLines(hand.keypoints, [0, 1, 2, 3, 4]);    // 大拇指
        drawFingerLines(hand.keypoints, [5, 6, 7, 8]);       // 食指
        drawFingerLines(hand.keypoints, [9, 10, 11, 12]);    // 中指
        drawFingerLines(hand.keypoints, [13, 14, 15, 16]);   // 無名指
        drawFingerLines(hand.keypoints, [17, 18, 19, 20]);   // 小妞妞

        // 繪製關節點
        noStroke();
        for (let kp of hand.keypoints) {
          let mx = map(kp.x, 0, video.width, offsetX, offsetX + displayW);
          let my = map(kp.y, 0, video.height, offsetY, offsetY + displayH);
          circle(mx, my, 10);
        }
      }
    }
  }
}

/**
 * 輔助函式：根據索引陣列繪製連線
 */
function drawFingerLines(keypoints, indexArray) {
  for (let i = 0; i < indexArray.length - 1; i++) {
    let p1 = keypoints[indexArray[i]];
    let p2 = keypoints[indexArray[i+1]];

    let x1 = map(p1.x, 0, video.width, offsetX, offsetX + displayW);
    let y1 = map(p1.y, 0, video.height, offsetY, offsetY + displayH);
    let x2 = map(p2.x, 0, video.width, offsetX, offsetX + displayW);
    let y2 = map(p2.y, 0, video.height, offsetY, offsetY + displayH);

    line(x1, y1, x2, y2);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateDisplayMetrics();
}