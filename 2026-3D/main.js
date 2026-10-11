// 1. 取得當前時間並判斷日夜
const currentHour = new Date().getHours();
const isDayTime = currentHour >= 6 && currentHour < 18;

// 2. 設定日夜色彩參數 (基於 Sunrise 與 Night 風格)
const config = {
  bgColor: isDayTime ? 0xfd9e73 : 0x050810,      // 日落暖橘 vs 深夜極暗藍
  fogColor: isDayTime ? 0xfd9e73 : 0x050810,     
  terrainColor: isDayTime ? 0x3d8c40 : 0x163820, // 白天翠綠草皮 vs 夜間微光草皮
  sunMoonColor: isDayTime ? 0xffdf6d : 0xe2e8f0, // 太陽暖黃 vs 月亮冷白
  lightColor: isDayTime ? 0xffdfb3 : 0x6e88a6,   // 日光 vs 月光
  ambientColor: isDayTime ? 0x6e5043 : 0x15251a  // 環境暗部色
};

// 3. 場景、霧氣、攝影機初始化
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

// 4. 建立光源
const ambientLight = new THREE.AmbientLight(config.ambientColor, 1.2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(config.lightColor, isDayTime ? 2.5 : 1.5);
dirLight.position.set(0, 15, -40);
scene.add(dirLight);

// 5. 建立天體 (太陽 / 月亮 - 放回中央)
const sphereGeometry = new THREE.SphereGeometry(15, 64, 64);
const sphereMaterial = new THREE.MeshBasicMaterial({ 
  color: config.sunMoonColor,
  fog: false // 保持發光體不被霧氣遮蔽
}); 
const celestialBody = new THREE.Mesh(sphereGeometry, sphereMaterial);
celestialBody.position.set(0, 6, -85); 
scene.add(celestialBody);

// 6. 創建 3D 起伏草皮地形
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

// 7. 夜晚專屬：星空粒子
if (!isDayTime) {
  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 1000;
  const posArray = new Float32Array(starsCount * 3);
  
  for(let i = 0; i < starsCount * 3; i+=3) {
    posArray[i] = (Math.random() - 0.5) * 160;   
    posArray[i+1] = Math.random() * 60 + 5;      
    posArray[i+2] = -Math.random() * 80 - 20;    
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const starsMaterial = new THREE.PointsMaterial({
    size: 0.15,
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    fog: false
  });
  
  const starMesh = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starMesh);
}

// 8. 監聽滑鼠移動 (計算視角晃動目標值)
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
  // 將滑鼠座標標準化為 -1 到 1 之間
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// 9. 動畫迴圈 (包含地形推移與滑鼠視角平滑跟隨)
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
  // 設定攝影機的目標移動範圍 (左右偏移最大 6，上下偏移基準 8 且變動 2)
  const targetCamX = mouseX * 6; 
  const targetCamY = 8 + mouseY * 2; 

  // 使用 Lerp (線性插值) 讓移動看起來非常滑順，不會死硬跟著滑鼠
  camera.position.x += (targetCamX - camera.position.x) * 0.03;
  camera.position.y += (targetCamY - camera.position.y) * 0.03;
  
  // 讓攝影機永遠看著地平線中心
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
