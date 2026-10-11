// 1. 設定色彩參數 (溫暖米黃天空 + 莫蘭迪橄欖綠草地與山脈)
const config = {
  bgColor: 0xe6d5b8,       // 溫暖的米黃/卡其色天空
  fogColor: 0xe6d5b8,      // 霧氣與天空同色，製造無邊際感
  terrainColor: 0x828a5c,  // 莫蘭迪橄欖綠 (草地)
  mountainColor: 0x6e7855, // 稍深一點的莫蘭迪綠 (山脈)
  lightColor: 0xfff9e6,    // 柔和微暖的日光
  ambientColor: 0x5d604b   // 灰綠色的陰影暗部，讓立體感更自然
};

// 2. 場景、霧氣、攝影機初始化
const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);
// 讓霧氣稍微拉近，讓山脈剛好在霧氣邊緣若隱若現
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

// ==========================================
// 4. 【100%安全】使用 JavaScript 生成噪點材質
// ==========================================
// 這個方法不碰底層 Shader，保證任何裝置都能完美顯示顆粒感
function createNoiseTexture() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < data.length; i += 4) {
      // 產生 215~255 之間的隨機亮度
      const noise = Math.floor(Math.random() * 40) + 215; 
      data[i] = noise;     // R
      data[i+1] = noise;   // G
      data[i+2] = noise;   // B
      data[i+3] = 255;     // Alpha
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20); // 讓噪點重複平鋪，顆粒會變得非常細緻
  texture.needsUpdate = true;
  return texture;
}

const noiseMap = createNoiseTexture();

// ==========================================
// 5. 創建「遠方山脈」 (帶有噪點)
// ==========================================
const mountainGeometry = new THREE.PlaneGeometry(300, 100, 60, 20);
const mountainMaterial = new THREE.MeshStandardMaterial({
  color: config.mountainColor,
  roughness: 1.0,
  metalness: 0.0,
  flatShading: true, // 山脈保留稜角分明的 Low-Poly 風格
  map: noiseMap      // 套用噪點材質
});

const mountainPos = mountainGeometry.attributes.position;
for (let i = 0; i < mountainPos.count; i++) {
  const x = mountainPos.getX(i);
  const y = mountainPos.getY(i);
  
  // 透過多重 sine 波疊加，製造高低起伏的山峰
  if (y > 0) {
      const height = Math.sin(x * 0.02) * 15 + Math.sin(x * 0.05) * 8 + Math.sin(x * 0.1) * 3;
      mountainPos.setZ(i, height * (y / 50)); 
  }
}
mountainGeometry.computeVertexNormals();

const mountains = new THREE.Mesh(mountainGeometry, mountainMaterial);
mountains.rotation.x = -Math.PI / 2;
mountains.position.set(0, -6, -80); // 往前推一點，確保不會完全被霧氣吃掉
scene.add(mountains);

// ==========================================
// 6. 創建「近處平滑草皮」 (帶有噪點)
// ==========================================
const terrainWidth = 140;
const terrainLength = 200;
const planeGeometry = new THREE.PlaneGeometry(terrainWidth, terrainLength, 80, 100);

const planeMaterial = new THREE.MeshStandardMaterial({ 
  color: config.terrainColor,
  roughness: 1.0, 
  metalness: 0.0,
  map: noiseMap      // 套用噪點材質
});

const terrain = new THREE.Mesh(planeGeometry, planeMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.position.set(0, -2, -30);
scene.add(terrain);

// ==========================================
// 7. 監聽滑鼠移動 (視角晃動目標運算)
// ==========================================
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
  // 將滑鼠座標標準化為 -1 到 1 之間
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// ==========================================
// 8. 動畫迴圈 
// ==========================================
function animate() {
  requestAnimationFrame(animate);

  const time = performance.now() * 0.0015; 
  
  // A. 草地波浪前進動畫
  const positionAttribute = planeGeometry.attributes.position;
  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const yOffset = y + time * 12;

    const wave1 = Math.sin(x * 0.04) * Math.cos(yOffset * 0.04) * 3;
    const wave2 = Math.sin(x * 0.08) * Math.sin(yOffset * 0.02) * 1.5;
    const edgeFactor = Math.pow(Math.abs(x) / (terrainWidth / 2), 2) * 5;
    
    positionAttribute.setZ(i, wave1 + wave2 + edgeFactor - 2);
  }
  
  positionAttribute.needsUpdate = true;
  planeGeometry.computeVertexNormals(); 

  // B. 攝影機跟隨滑鼠平滑移動 (Sway Effect)
  const targetCamX = mouseX * 6; 
  const targetCamY = 8 + mouseY * 2; 

  camera.position.x += (targetCamX - camera.position.x) * 0.03;
  camera.position.y += (targetCamY - camera.position.y) * 0.03;
  camera.lookAt(0, 2, -10);

  renderer.render(scene, camera);
}
animate();

// ==========================================
// 9. 響應式調整
// ==========================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
