let video;
let handPose;
let hands = [];
let displayW, displayH, offsetX, offsetY;
let statusMsg = "正在初始化系統...";
let isModelLoaded = false;
let webGLSupported = true;

// 水泡粒子陣列
let bubbles = [];

function preload() {
  // 檢查 WebGL 支援
  let canvas = document.createElement('canvas');
  let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    webGLSupported = false;
    statusMsg = "錯誤：您的裝置不支援 WebGL。";
  } else {
    // 初始化 HandPose 模型 (不需要在 preload 翻轉)
    handPose = ml5.handPose(modelLoaded);
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
    // 建立攝影機擷取，設定為翻轉 (水平鏡像)，符合自拍視角
    video = createCapture(VIDEO, { flipped: true });
    video.hide();
    updateDisplayMetrics();
    
    // 開始偵測手指 (ml5 會自動處理 video {flipped:true} 的座標)
    handPose.detectStart(video, gotHands);
  }
}

function updateDisplayMetrics() {
  // 影像顯示為畫布的 50%
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

  // 1. [新增] 畫布置中上方加上文字
  fill(0);
  noStroke();
  textSize(32); // 加大文字
  textAlign(CENTER, TOP);
  text("123456789陳OO文字", width / 2, 20);

  // 顯示狀態訊息 (左上角)
  textSize(16);
  textAlign(LEFT, TOP);
  text(`狀態: ${statusMsg}`, 20, height - 30);

  if (!webGLSupported || !isModelLoaded) return; 

  // 2. [修正] 置中顯示影像 (修正顛倒問題)
  // 因為 setup 的 capture 已經 flipped，這裡直接畫出即可
  image(video, offsetX, offsetY, displayW, displayH);

  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        
        // 設定線條樣式
        strokeWeight(3);
        if (hand.handedness == "Left") {
          stroke(255, 0, 255); // 左手粉色線
          fill(255, 0, 255, 200); // 半透明關節
        } else {
          stroke(255, 255, 0); // 右手黃色線
          fill(255, 255, 0, 200);
        }

        // 3. [保留並修正] 繪製手指連線 
        // 使用修正後的映射邏輯
        drawFingerLines(hand.keypoints, [0, 1, 2, 3, 4]);    // 大拇指
        drawFingerLines(hand.keypoints, [5, 6, 7, 8]);       // 食指
        drawFingerLines(hand.keypoints, [9, 10, 11, 12]);    // 中指
        drawFingerLines(hand.keypoints, [13, 14, 15, 16]);   // 無名指
        drawFingerLines(hand.keypoints, [17, 18, 19, 20]);   // 小妞妞

        // 4. [保留] 繪製手指關節小圓圈
        noStroke();
        for (let kp of hand.keypoints) {
          let mx = map(kp.x, 0, video.width, offsetX, offsetX + displayW);
          let my = map(kp.y, 0, video.height, offsetY, offsetY + displayH);
          circle(mx, my, 8); // 稍微縮小圓點
        }

        // 5. [新增] 在特定指尖產生水泡 (4, 8, 12, 16, 20)
        let tipIndices = [4, 8, 12, 16, 20];
        for (let index of tipIndices) {
          let tip = hand.keypoints[index];
          let mx = map(tip.x, 0, video.width, offsetX, offsetX + displayW);
          let my = map(tip.y, 0, video.height, offsetY, offsetY + displayH);
          
          // 每幀有一定機率產生新水泡，避免太多
          if (random(1) < 0.1) {
            bubbles.push(new Bubble(mx, my));
          }
        }
      }
    }
  }

  // 6. [新增] 處理水泡更新與繪製
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].display();
    if (bubbles[i].isPopped) {
      bubbles.splice(i, 1); // 移除破掉的水泡
    }
  }
}

/**
 * 輔助函式：根據索引陣列繪製連線 (修正映射)
 */
function drawFingerLines(keypoints, indexArray) {
  for (let i = 0; i < indexArray.length - 1; i++) {
    let p1 = keypoints[indexArray[i]];
    let p2 = keypoints[indexArray[i+1]];

    // 關鍵修正：這裡的映射必須與 draw 中的 image/circle 保持一致
    let x1 = map(p1.x, 0, video.width, offsetX, offsetX + displayW);
    let y1 = map(p1.y, 0, video.height, offsetY, offsetY + displayH);
    let x2 = map(p2.x, 0, video.width, offsetX, offsetX + displayW);
    let y2 = map(p2.y, 0, video.height, offsetY, offsetY + displayH);

    line(x1, y1, x2, y2);
  }
}

/**
 * [新增] 水泡粒子類別
 */
class Bubble {
  constructor(x, y) {
    this.x = x + random(-5, 5); // 初始位置加點隨機，比較自然
    this.y = y;
    this.speedY = random(-1, -4); // 往上爬升的速度
    this.size = random(10, 20); // 初始大小
    this.maxSize = random(30, 50); // 生長的最大尺寸，到達後破掉
    this.isPopped = false;
    // 水泡顏色：半透明白色
    this.col = color(255, 255, 255, 150);
  }

  update() {
    this.y += this.speedY; // 往上移動
    this.x += sin(frameCount * 0.1 + this.y * 0.05) * 0.5; // 加上一點左右晃動
    
    // 水泡上升時會慢慢變大
    this.size += 0.2;

    // 破掉條件：
    // 1. 超過最大尺寸
    // 2. 移動到畫面最上方 (考慮到文字區域)
    if (this.size > this.maxSize || this.y < 80) {
      this.isPopped = true;
    }
  }

  display() {
    push();
    noFill();
    stroke(this.col);
    strokeWeight(1.5);
    // 繪製水泡主體
    circle(this.x, this.y, this.size);
    
    // 加上一點反光，看起來更像水泡
    noStroke();
    fill(255, 255, 255, 200);
    circle(this.x - this.size*0.2, this.y - this.size*0.2, this.size*0.3);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateDisplayMetrics();
}