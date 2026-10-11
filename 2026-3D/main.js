// 1. 設定白天色彩參數 (固定為白天)
const config = {
  bgColor: 0xfd9e73,      // 日出/日落暖橘背景
  fogColor: 0xfd9e73,     // 霧氣顏色需與背景相同，無縫融合
  terrainColor: 0x3d8c40, // 翠綠色草皮
  lightColor: 0xffdfb3,   // 日光
  ambientColor: 0x6e5043  // 環境暗部色
};

// 2. 場景、霧氣、攝影機初始化
const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);
scene.fog = new THREE.Fog(config.fogColor, 15, 120);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
// 設定攝影機初始位置
camera.position.set(0, 8, 25);
camera.lookAt(0, 2, -10);

const canvas = document.querySelector('#bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 3. 建立光源
const ambientLight = new THREE.AmbientLight(config.ambientColor, 1.2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(config.lightColor, 2.5);
dirLight.position.set(0, 15, -40);
scene.add(dirLight);

// 4. 創建 3D 起伏草皮地形
const terrainWidth = 140;
const terrainLength = 200;
const planeGeometry = new THREE.PlaneGeometry(terrainWidth, terrainLength, 60, 80);

const planeMaterial = new THREE.MeshStandardMaterial({ 
  color: config.terrainColor,
  roughness: 0.9,
  metalness: 0.1,
  flatShading: true // 保留低多邊形(Low-Poly)的草皮風格
});

const terrain = new THREE.Mesh(planeGeometry, planeMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.position.set(0, -2, -30);
scene.add(terrain);

// 5. 監聽滑鼠移動 (計算視角晃動目標值)
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
  // 將滑鼠座標標準化為 -1 到 1 之間
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// 6. 動畫迴圈 (包含地形推移與滑鼠視角平滑跟隨)
function animate() {
  requestAnimationFrame(animate);

  // A. 地形前進動畫 (動態頂點運算)
  const time = performance.now() * 0.0015; 
  const positionAttribute = planeGeometry.attributes.position;

  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const yOffset = y + time * 12;

    const wave1 = Math.sin(x * 0.05) * Math.cos(yOffset * 0.05) * 4;
    const wave2 = Math.sin(x * 0.1) * Math.sin(yOffset * 0.03) * 2;
    const edgeFactor = Math.pow(Math.abs(x) / (terrainWidth / 2), 2) * 6;
    
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

// 7. 響應式調整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
