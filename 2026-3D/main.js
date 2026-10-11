const currentHour = new Date().getHours();
const isDayTime = currentHour >= 6 && currentHour < 18;

// 完全對齊 threeui 的極簡高質感配色
const config = {
  bgColor: isDayTime ? 0xfcd0a1 : 0x070b19,      // 柔和的日出桃色 / 極深的夜空藍
  fogColor: isDayTime ? 0xfcd0a1 : 0x070b19,     // 霧氣必須與背景色完全一致
  sphereColor: isDayTime ? 0xff5e00 : 0xffffff,  // 太陽暖橘色 / 月亮純白色
  gridColor: isDayTime ? 0xffffff : 0x223355     // 白天白線 / 夜間低調的暗藍線 (移除突兀的螢光青色)
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);

// 【關鍵修正 1】設定霧氣範圍：從距離相機 10 開始起霧，到 60 完全不透明
scene.fog = new THREE.Fog(config.fogColor, 10, 60);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 3, 10); // 攝影機位置

const canvas = document.querySelector('#bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 建立天體 (太陽 / 月亮)
const sphereGeometry = new THREE.SphereGeometry(12, 64, 64); // 提高面數讓邊緣絕對平滑
const sphereMaterial = new THREE.MeshBasicMaterial({ 
  color: config.sphereColor,
  fog: false // 保持發光體不受霧氣遮蔽
}); 
const celestialBody = new THREE.Mesh(sphereGeometry, sphereMaterial);
// 將球體推到霧氣範圍外 (z: -70)，完美掛在地平線上
celestialBody.position.set(0, 2, -70); 
scene.add(celestialBody);

// 建立網格地面
// 【關鍵修正 2】將網格放大到 200x200，遠超出霧氣的 60 範圍，徹底消除邊緣斷層
const planeGeometry = new THREE.PlaneGeometry(200, 200, 80, 80);
const planeMaterial = new THREE.MeshBasicMaterial({ 
  color: config.gridColor, 
  wireframe: true,
  transparent: true,
  opacity: isDayTime ? 0.8 : 0.3 // 夜間降低透明度，讓網格更柔和
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -2;
scene.add(plane);

function animate() {
  requestAnimationFrame(animate);

  plane.position.z += 0.05;
  
  // 網格寬度 200 / 段數 80 = 2.5。移動超過 2.5 即重置，達成無縫順暢前進
  if (plane.position.z > 2.5) {
      plane.position.z = 0;
  }

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
