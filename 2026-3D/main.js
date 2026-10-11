// 1. 取得當前時間並判斷日夜
const currentHour = new Date().getHours();
// 判斷：大於等於 6 且小於 18 為白天 (06:00 - 17:59)，否則為夜晚 (18:00 - 05:59)
const isDayTime = currentHour >= 6 && currentHour < 18;

// 2. 根據日夜設定顏色與視覺參數 (強化色彩對比與夜景亮度)
const config = {
  bgColor: isDayTime ? 0xff8c42 : 0x050515,      // 白天暖橘色 / 晚上深藍黑
  fogColor: isDayTime ? 0xfc6a03 : 0x07071a,     // 白天霧氣 / 晚上深紫藍色
  sphereColor: isDayTime ? 0xffd700 : 0xf0f0ff,  // 太陽金黃色 / 月亮冷白發光色
  gridColor: isDayTime ? 0xffffff : 0x4d4dff,    // 白天白線 / 晚上霓虹深藍線
};

// 3. 初始化場景、攝影機、渲染器
const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);
// 調整霧氣距離，既能讓遠處朦朧，又保留近處細節
scene.fog = new THREE.FogExp2(config.fogColor, 0.03);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
// 調整攝影機位置，與 threeui 原作相同，稍微抬高俯瞰
camera.position.set(0, 12, 35);
camera.lookAt(0, 0, -20);

const canvas = document.querySelector('#bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 4. 建立天體 (太陽 / 月亮) - 提高其在地平線上的位置與尺寸
const sphereGeometry = new THREE.SphereGeometry(10, 32, 32);
// 晚上讓月亮呈現帶有微弱自發光的亮白色
const sphereMaterial = new THREE.MeshBasicMaterial({ color: config.sphereColor }); 
const celestialBody = new THREE.Mesh(sphereGeometry, sphereMaterial);
celestialBody.position.set(0, 8, -60);
scene.add(celestialBody);

// 5. 建立波浪地形網格 (不再是平坦的網狀，而是像山巒一樣高低起伏)
const planeGeometry = new THREE.PlaneGeometry(120, 120, 60, 60);

// 將平面的頂點轉換為波浪高低起伏 (模擬山谷地貌)
const positionAttribute = planeGeometry.attributes.position;
for (let i = 0; i < positionAttribute.count; i++) {
  const x = positionAttribute.getX(i);
  const y = positionAttribute.getY(i);
  // 透過三角函數產生自然的山巒波浪起伏
  const z = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 3 + Math.sin(x * 0.05) * 4;
  positionAttribute.setZ(i, z);
}
positionAttribute.needsUpdate = true;

const planeMaterial = new THREE.MeshBasicMaterial({ 
  color: config.gridColor, 
  wireframe: true,
  transparent: true,
  opacity: 0.7
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // 平放
plane.position.y = -3;
scene.add(plane);

// 6. 如果是夜晚，加入更密集、立體的星空 (繁星點點效果)
if (!isDayTime) {
  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 1200; // 增加星星數量
  const posArray = new Float32Array(starsCount * 3);
  
  for(let i = 0; i < starsCount * 3; i+=3) {
    // 隨機在天空中和遠處灑滿星星
    posArray[i] = (Math.random() - 0.5) * 150;      // X 軸散開
    posArray[i+1] = Math.random() * 80 + 2;         // Y 軸 (天空中，不低於地面)
    posArray[i+2] = -Math.random() * 80 - 10;       // Z 軸 (向遠處延伸)
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const starsMaterial = new THREE.PointsMaterial({
    size: 0.15,
    color: 0xffffff,
    transparent: true,
    opacity: 0.9
  });
  
  const starMesh = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starMesh);
}

// 7. 動畫迴圈 (網格地形滾動，營造前進感)
function animate() {
  requestAnimationFrame(animate);

  // 網格持續朝向攝影機方向推移
  plane.position.z += 0.15;
  // 當推移超出一個循環長度時，重置位置以達成無縫循環
  if(plane.position.z > 8) {
      plane.position.z = 0;
  }

  renderer.render(scene, camera);
}
animate();

// 8. 響應式
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
