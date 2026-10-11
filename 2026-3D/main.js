// 1. 日夜時間判斷
const currentHour = new Date().getHours();
// 06:00 - 17:59 白天(日出/日落風格) ； 18:00 - 05:59 晚上(夜間風格)
const isDayTime = currentHour >= 6 && currentHour < 18;

// 2. 原始 Landscape 採用的自然色調
const config = {
  bgColor: isDayTime ? 0xfd9e73 : 0x070b19,      // 溫暖的日出/日落橙紅 vs 深夜暗藍
  fogColor: isDayTime ? 0xfd9e73 : 0x070b19,     // 霧氣顏色（必須與天空背景完全一致，消除地平線邊緣）
  sphereColor: isDayTime ? 0xffdf6d : 0xffffff,  // 暖黃太陽 vs 純白月球
  terrainColor: isDayTime ? 0x2e6f40 : 0x111e38, // 綠色起伏草皮地貌 vs 晚上的暗藍色大地
  lightColor: isDayTime ? 0xffdfb3 : 0x7a889b,   // 白天暖色光 vs 晚上冷調月光
  ambientColor: isDayTime ? 0x6e5043 : 0x0d1424  // 基礎暗部陰影色
};

// 3. 場景、霧氣、攝影機、渲染器初始化
const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);
// 設置柔和的線性霧氣 (距離 15 到 120)，讓地景完美過渡至地平線[cite: 3]
scene.fog = new THREE.Fog(config.fogColor, 15, 120);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
// 模擬 threeui 原作視角：稍微抬高俯瞰，保持開闊感[cite: 1.2.11]
camera.position.set(0, 8, 25);
camera.lookAt(0, 2, -10);

const canvas = document.querySelector('#bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 4. 基礎與動態光源 (立體地貌的關鍵)
const ambientLight = new THREE.AmbientLight(config.ambientColor, 1.2);
scene.add(ambientLight);

// 平行光 (模擬陽光/月光照色)
const dirLight = new THREE.DirectionalLight(config.lightColor, isDayTime ? 2.5 : 1.5);
dirLight.position.set(0, 15, -40); // 自天體方向射向地面
scene.add(dirLight);

// 5. 建立天體 (日/月)
const sphereGeometry = new THREE.SphereGeometry(15, 64, 64);
const sphereMaterial = new THREE.MeshBasicMaterial({ 
  color: config.sphereColor,
  fog: false // 保持發光體不被霧氣吃掉
}); 
const celestialBody = new THREE.Mesh(sphereGeometry, sphereMaterial);
celestialBody.position.set(0, 6, -85); 
scene.add(celestialBody);

// 6. 創建像起伏草皮的 3D 地形 (移除 wireframe!)
// z 軸尺寸必須足夠延伸到遠方
const terrainWidth = 140;
const terrainLength = 200;
const planeGeometry = new THREE.PlaneGeometry(terrainWidth, terrainLength, 70, 100);

// 為平面加上隨機高低落差 (生成低多邊形的山巒、山丘與草皮)
const positionAttribute = planeGeometry.attributes.position;
for (let i = 0; i < positionAttribute.count; i++) {
  const x = positionAttribute.getX(i);
  const y = positionAttribute.getY(i);
  
  // 利用多重 Sine 函數製造連綿不絕的自然地形起伏 (中央山谷，兩側高起)[cite: 1.2.1]
  const wave1 = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 4;
  const wave2 = Math.sin(x * 0.1) * Math.sin(y * 0.03) * 2;
  const edgeFactor = Math.pow(Math.abs(x) / (terrainWidth / 2), 2) * 8; // 讓畫面兩側高度更高，中間維持山谷感
  
  const z = wave1 + wave2 + edgeFactor;
  positionAttribute.setZ(i, z - 2); // 稍微將基礎高度降低
}
planeGeometry.computeVertexNormals(); // 重新計算頂點法線以獲得正確光影

// 使用實體材質 + flatShading 保留 3D 起伏的顆粒與面片感[cite: 1.2.1]
const planeMaterial = new THREE.MeshStandardMaterial({ 
  color: config.terrainColor,
  roughness: 0.9,
  metalness: 0.1,
  flatShading: true // 低多邊形(Low-Poly)地貌的靈魂設定！
});

const terrain = new THREE.Mesh(planeGeometry, planeMaterial);
terrain.rotation.x = -Math.PI / 2; // 將其平放
terrain.position.set(0, -2, -30);
scene.add(terrain);

// 7. 晚上加碼：點點星空粒子效果 (限夜間)[cite: 1.2.12]
if (!isDayTime) {
  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 1000;
  const posArray = new Float32Array(starsCount * 3);
  
  for(let i = 0; i < starsCount * 3; i+=3) {
    posArray[i] = (Math.random() - 0.5) * 160;   // X
    posArray[i+1] = Math.random() * 60 + 5;      // Y
    posArray[i+2] = -Math.random() * 80 - 20;    // Z
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

// 8. 動畫迴圈 (前進奔跑感)
function animate() {
  requestAnimationFrame(animate);

  // 讓地形朝攝影機方向推進
  terrain.position.z += 0.12;
  
  // 地形無縫重複：只要推進超過一格頂點的長度(200 / 100 = 2)就微調重置位置
  if (terrain.position.z > 2.0) {
      terrain.position.z = 0;
  }

  renderer.render(scene, camera);
}
animate();

// 9. 響應式
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
