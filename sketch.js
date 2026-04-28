// Hand Pose Detection with ml5.js
// 調整版：全螢幕畫布、置中顯示、50% 比例

let video;
let handPose;
let hands = [];

// 定義影像顯示的變數，方便後續座標換算
let displayW, displayH, offsetX, offsetY;

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  // 1. 產生全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // 計算 50% 的影像寬高與置中偏移量
  updateDisplayMetrics();

  handPose.detectStart(video, gotHands);
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
  // 2. 設定畫布背景顏色 #e7c6ff
  background('#e7c6ff');

  // 3. 將攝影機影像顯示在視窗中間，寬高為畫布的 50%
  image(video, offsetX, offsetY, displayW, displayH);

  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          // 4. 重要：將辨識點的座標從原始影像尺寸 映射(map) 到畫布上的實際顯示區域
          // 原影片尺寸預設通常是 640x480，或以 video.width/height 為準
          let mappedX = map(keypoint.x, 0, video.width, offsetX, offsetX + displayW);
          let mappedY = map(keypoint.y, 0, video.height, offsetY, offsetY + displayH);

          if (hand.handedness == "Left") {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }

          noStroke();
          circle(mappedX, mappedY, 16 * (displayW / video.width)); // 圓點也依比例縮放
        }
      }
    }
  }
}

// 額外處理：當瀏覽器視窗大小改變時，重新調整畫布與參數
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateDisplayMetrics();
}