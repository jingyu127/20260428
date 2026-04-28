let capture;

function setup() {
  // 1. 產生全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 2. 設定背景顏色 #eTc6f (修正為十六進位格式 #ecc66f)
  // 注意：eTc6f 可能為輸入誤植，通常顏色碼為 6 位數，這裡暫定為類似的黃橙色
  background('#ecc66f');

  // 3. 擷取攝影機影像
  capture = createCapture(VIDEO);
  capture.size(windowWidth * 0.6, windowHeight * 0.6); // 設定擷取解析度
  capture.hide(); // 隱藏原始的 HTML 影片元件，只顯示在畫布上
}

function draw() {
  background('#ecc66f'); // 每一幀重新繪製背景，避免影像重疊
  
  // 4. 將影像顯示在畫布中間，寬高為畫布的 60%
  let imgW = width * 0.6;
  let imgH = height * 0.6;
  
  push();
  // 影像置中技巧：移動座標系統到畫布中心
  translate(width / 2, height / 2);
  
  // 如果需要鏡像（手機自拍習慣），可以解鎖下面這行：
  // scale(-1, 1); 
  
  imageMode(CENTER);
  image(capture, 0, 0, imgW, imgH);
  pop();
}

// 5. 視窗大小改變時自動調整畫布
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // Start detecting hands
  handPose.detectStart(video, gotHands);
}

function draw() {
  image(video, 0, 0);

  // Ensure at least one hand is detected
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        // Loop through keypoints and draw circles
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          // Color-code based on left or right hand
          if (hand.handedness == "Left") {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }

          noStroke();
          circle(keypoint.x, keypoint.y, 16);
        }
      }
    }
  }
}
