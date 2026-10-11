// 1. 設定白天色彩參數 (精準對齊參考圖的莫蘭迪大地色調)
const config = {
  bgColor: 0xdfd3b6,      // 柔和的米黃/卡其色天空
  fogColor: 0xdfd3b6,     // 霧氣與天空同色，製造無邊際感
  terrainColor: 0x8a8e5f, // 莫蘭迪橄欖綠/枯草綠
  lightColor: 0xfff6e5,   // 柔和微暖的日光
  ambientColor: 0x5a5b47  // 帶有灰綠色的陰影暗部，讓草皮立體但不突兀
};

// 2. 場景、霧氣、攝影機初始化
const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);
// 讓霧氣稍微提早出現，營造圖片中那種遠山朦朧的感覺
scene.fog = new THREE.Fog(config.fogColor, 10, 100);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 25);
camera.lookAt(0, 2, -10);

const canvas = document.querySelector('#bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 3. 建立光源
const ambientLight = new THREE.AmbientLight(config.ambientColor, 1.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(config.lightColor, 2.0);
dirLight.position.set(0, 20, -30);
scene.add(dirLight);

// 4. 創建 3D 平滑起伏地形
const terrainWidth = 140;
const terrainLength = 200;
// 增加一點網格細分度，讓平滑曲線更自然
const planeGeometry = new THREE.PlaneGeometry(terrainWidth, terrainLength, 80, 100);

const planeMaterial = new THREE.MeshStandardMaterial({ 
  color: config.terrainColor,
  roughness: 1.0, // 完全粗糙的草皮質感，不反光
  metalness: 0.0
  // 移除 flatShading，恢復預設的平滑著色 (Smooth Shading)
});

const terrain = new THREE.Mesh(planeGeometry, planeMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.position.set(0, -2, -30);
scene.add(terrain);

// 5. 監聽滑鼠移動 (視角晃動)
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// 6. 動畫迴圈 
function animate() {
  requestAnimationFrame(animate);

  const time = performance.now() * 0.0015; 
  const positionAttribute = planeGeometry.attributes.position;

  // 地形平滑起伏波浪
  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const yOffset = y + time * 12;

    // 稍微調整波浪參數，讓它看起來像柔和的丘陵
    const wave1 = Math.sin(x * 0.04) * Math.cos(yOffset * 0.04) * 3;
    const wave2 = Math.sin(x * 0.08) * Math.sin(yOffset * 0.02) * 1.5;
    const edgeFactor = Math.pow(Math.abs(x) / (terrainWidth / 2), 2) * 5;
    
    positionAttribute.setZ(i, wave1 + wave2 + edgeFactor - 2);
  }
  
  positionAttribute.needsUpdate = true;
  // 由於是平滑著色，即時重算法線是維持光影正確的關鍵
  planeGeometry.computeVertexNormals(); 

  // 攝影機跟隨滑鼠平滑移動
  const targetCamX = mouseX * 6; 
  const targetCamY = 8 + mouseY * 2; 

  camera.position.x += (targetCamX - camera.position.x) * 0.03;
  camera.position.y += (targetCamY - camera.position.y) * 0.03;
  camera.lookAt(0, 2, -10);

  renderer.render(scene, camera);
}
animate();

// 7. 響應式調整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
