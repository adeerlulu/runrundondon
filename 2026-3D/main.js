// 1. 設定色彩參數 (溫暖米黃天空 + 莫蘭迪橄欖綠草地與山脈)
const config = {
  bgColor: 0xe6d5b8,       
  fogColor: 0xe6d5b8,      
  terrainColor: 0x828a5c,  
  mountainColor: 0x6e7855, 
  lightColor: 0xfff9e6,    
  ambientColor: 0x5d604b   
};

// 2. 場景、霧氣、攝影機初始化
const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);
scene.fog = new THREE.Fog(config.fogColor, 10, 120);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 25);
camera.lookAt(0, 2, -10);

const canvas = document.querySelector('#bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 3. 建立光源
const ambientLight = new THREE.AmbientLight(config.ambientColor, 1.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(config.lightColor, 2.0);
dirLight.position.set(0, 20, -30);
scene.add(dirLight);

// 4. 【100%安全】使用 JavaScript 生成噪點材質
function createNoiseTexture() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < data.length; i += 4) {
      const noise = Math.floor(Math.random() * 40) + 215; 
      data[i] = noise;     // R
      data[i+1] = noise;   // G
      data[i+2] = noise;   // B
      data[i+3] = 255;     // Alpha
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20); 
  texture.needsUpdate = true;
  return texture;
}

const noiseMap = createNoiseTexture();

// 5. 創建「遠方山脈」 
const mountainGeometry = new THREE.PlaneGeometry(300, 100, 60, 20);
const mountainMaterial = new THREE.MeshStandardMaterial({
  color: config.mountainColor,
  roughness: 1.0,
  metalness: 0.0,
  flatShading: true, 
  map: noiseMap      
});

const mountainPos = mountainGeometry.attributes.position;
for (let i = 0; i < mountainPos.count; i++) {
  const x = mountainPos.getX(i);
  const y = mountainPos.getY(i);
  if (y > 0) {
      const height = Math.sin(x * 0.02) * 15 + Math.sin(x * 0.05) * 8 + Math.sin(x * 0.1) * 3;
      mountainPos.setZ(i, height * (y / 50)); 
  }
}
mountainGeometry.computeVertexNormals();

const mountains = new THREE.Mesh(mountainGeometry, mountainMaterial);
mountains.rotation.x = -Math.PI / 2;
mountains.position.set(0, -6, -80); 
scene.add(mountains);

// 6. 創建「近處平滑草皮」 
const terrainWidth = 140;
const terrainLength = 200;
const planeGeometry = new THREE.PlaneGeometry(terrainWidth, terrainLength, 80, 100);

const planeMaterial = new THREE.MeshStandardMaterial({ 
  color: config.terrainColor,
  roughness: 1.0, 
  metalness: 0.0,
  map: noiseMap      
});

const terrain = new THREE.Mesh(planeGeometry, planeMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.position.set(0, -2, -30);
scene.add(terrain);

// ==========================================
// 7. 載入角色圖片與設定 2D 精靈 (Sprite) 動畫
// ==========================================
const textureLoader = new THREE.TextureLoader();
const walkFrames = [];
const totalFrames = 3; // 總共有 3 張圖片

// 載入 slime_walk_1.png 到 slime_walk_3.png
for (let i = 1; i <= totalFrames; i++) {
  const texture = textureLoader.load(`./character/walk01/slime_walk_${i}.png`);
  // 讓像素圖片保持清晰，不模糊 (如果你是用像素畫的話這行很有用)
  texture.magFilter = THREE.NearestFilter; 
  walkFrames.push(texture);
}

// 建立 Sprite 材質並將第一張圖設定為初始圖
const spriteMaterial = new THREE.SpriteMaterial({ 
  map: walkFrames[0], 
  transparent: true 
});

const characterSprite = new THREE.Sprite(spriteMaterial);
// 設定角色大小 (依據你圖片的比例可自行修改 scale，例如 4, 4, 1)
characterSprite.scale.set(4, 4, 1);
// 將角色放在畫面中央，草地前方
characterSprite.position.set(0, 0, -10); 
scene.add(characterSprite);

// 動畫控制變數
let currentFrame = 0;
let lastFrameTime = 0;
const frameDuration = 150; // 每一幀停留的時間 (毫秒)。越小走越快，越大走越慢。

// ==========================================
// 8. 監聽滑鼠移動 (視角晃動目標運算)
// ==========================================
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// ==========================================
// 9. 動畫迴圈 
// ==========================================
function animate() {
  requestAnimationFrame(animate);

  const time = performance.now(); 
  
  // A. 角色逐格走路動畫切換
  if (time - lastFrameTime > frameDuration) {
    currentFrame = (currentFrame + 1) % totalFrames; // 0, 1, 2 循環
    characterSprite.material.map = walkFrames[currentFrame];
    lastFrameTime = time;
  }

  // B. 草地波浪前進動畫
  const timeSec = time * 0.0015;
  const positionAttribute = planeGeometry.attributes.position;
  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const yOffset = y + timeSec * 12;

    const wave1 = Math.sin(x * 0.04) * Math.cos(yOffset * 0.04) * 3;
    const wave2 = Math.sin(x * 0.08) * Math.sin(yOffset * 0.02) * 1.5;
    const edgeFactor = Math.pow(Math.abs(x) / (terrainWidth / 2), 2) * 5;
    
    positionAttribute.setZ(i, wave1 + wave2 + edgeFactor - 2);
  }
  
  positionAttribute.needsUpdate = true;
  planeGeometry.computeVertexNormals(); 

  // C. 攝影機跟隨滑鼠平滑移動 (Sway Effect)
  const targetCamX = mouseX * 6; 
  const targetCamY = 8 + mouseY * 2; 

  camera.position.x += (targetCamX - camera.position.x) * 0.03;
  camera.position.y += (targetCamY - camera.position.y) * 0.03;
  camera.lookAt(0, 2, -10);

  renderer.render(scene, camera);
}
animate();

// 10. 響應式調整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
