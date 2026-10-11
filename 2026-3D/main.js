// 1. 取得當前時間並判斷日夜
const currentHour = new Date().getHours();
// 判斷：大於等於 6 且小於 18 為白天 (06:00 - 17:59)，否則為夜晚
const isDayTime = currentHour >= 6 && currentHour < 18;

// 2. 根據日夜設定顏色風格參數
const config = {
  bgColor: isDayTime ? 0xff8c42 : 0x05051a,      // 白天暖橘色 / 晚上深藍黑
  fogColor: isDayTime ? 0xff8c42 : 0x0a0a2a,     // 白天霧氣 / 晚上深色霧氣
  sphereColor: isDayTime ? 0xffd700 : 0xe0e0ff,  // 太陽金黃色 / 月亮冷白色
  gridColor: isDayTime ? 0xffffff : 0x00ffff,    // 白天地板白線 / 晚上霓虹青藍色
};

// 3. 初始化場景、攝影機、渲染器
const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);
scene.fog = new THREE.Fog(config.fogColor, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 20);

const canvas = document.querySelector('#bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 4. 建立天體 (太陽或月亮)
const sphereGeometry = new THREE.SphereGeometry(15, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: config.sphereColor }); 
const celestialBody = new THREE.Mesh(sphereGeometry, sphereMaterial);
celestialBody.position.set(0, -5, -40);
scene.add(celestialBody);

// 5. 建立網格地面
const planeGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
const planeMaterial = new THREE.MeshBasicMaterial({ color: config.gridColor, wireframe: true });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -2;
scene.add(plane);

// 6. 如果是晚上，額外加入星空粒子特效
if (!isDayTime) {
  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 500;
  const posArray = new Float32Array(starsCount * 3);
  
  for(let i = 0; i < starsCount * 3; i++) {
    // 讓星星隨機散佈在畫面上方與遠處
    posArray[i] = (Math.random() - 0.5) * 100; // x, y, z 隨機分佈
  }
  
  // 將 z 軸向後推，避免擋住月亮
  for(let i = 2; i < starsCount * 3; i+=3) {
      posArray[i] = -Math.random() * 50 - 20; 
  }
  // 將 y 軸往上推，避免出現在地板下
  for(let i = 1; i < starsCount * 3; i+=3) {
      posArray[i] = Math.random() * 40; 
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const starsMaterial = new THREE.PointsMaterial({
    size: 0.1,
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
  });
  
  const starMesh = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starMesh);
}

// 7. 動畫迴圈 (推移地形)
function animate() {
  requestAnimationFrame(animate);

  // 讓網格地面持續往攝影機方向移動
  plane.position.z += 0.1;
  if(plane.position.z > 5) {
      plane.position.z = 0;
  }

  renderer.render(scene, camera);
}
animate();

// 8. 響應式：監聽視窗大小改變
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
