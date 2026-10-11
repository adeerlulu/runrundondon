const currentHour = new Date().getHours();
const isDayTime = currentHour >= 6 && currentHour < 18;

// 完全還原 threeui.com 原始的極簡色彩參數
const config = {
  bgColor: isDayTime ? 0xff7e5f : 0x0f172a,      // 日出漸層暖色 / 晚間深邃暗藍色
  fogColor: isDayTime ? 0xff7e5f : 0x0f172a,     // 霧氣與背景色融合
  sphereColor: isDayTime ? 0xffd700 : 0xe2e8f0,  // 明亮的太陽 / 偏冷的白月亮
  gridColor: isDayTime ? 0xffffff : 0x334155     // 日間白色網格 / 夜間暗灰色網格
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);
scene.fog = new THREE.Fog(config.fogColor, 10, 50); // 線性霧氣，還原地平線消失感

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 15); // 較低的平視視角

const canvas = document.querySelector('#bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 建立天體 (極簡發光圓球)
const sphereGeometry = new THREE.SphereGeometry(10, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: config.sphereColor }); 
const celestialBody = new THREE.Mesh(sphereGeometry, sphereMaterial);
celestialBody.position.set(0, 2, -30); // 貼近地平線
scene.add(celestialBody);

// 建立平坦網格地面 (移除所有高低起伏，回歸原始平面)
const planeGeometry = new THREE.PlaneGeometry(100, 100, 40, 40);
const planeMaterial = new THREE.MeshBasicMaterial({ 
  color: config.gridColor, 
  wireframe: true 
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -2;
scene.add(plane);

// 動畫迴圈
function animate() {
  requestAnimationFrame(animate);

  // 網格平移，營造單純的前進速度感
  plane.position.z += 0.05;
  
  // 100(寬度) / 40(段數) = 2.5，移動超過一個網格單位即重置，達成無縫循環
  if (plane.position.z > 2.5) {
      plane.position.z = 0;
  }

  renderer.render(scene, camera);
}
animate();

// 響應式調整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
