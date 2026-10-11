// 1. 初始化場景、攝影機、渲染器
const scene = new THREE.Scene();

// 設定日出氛圍的霧氣 (粉橘色)
const fogColor = new THREE.Color(0xff8c42);
scene.fog = new THREE.Fog(fogColor, 10, 50);
scene.background = fogColor;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// 讓攝影機稍微抬高並往下看
camera.position.set(0, 5, 20);

const canvas = document.querySelector('#bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 效能優化

// 2. 建立日出的太陽 (發光球體)
const sunGeometry = new THREE.SphereGeometry(15, 32, 32);
// 使用 BasicMaterial 不受光照影響，呈現自發光效果
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 }); 
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, -5, -40); // 放在遠方地平線下
scene.add(sun);

// 3. 建立網格地面 (跑動的地形)
const planeGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
// 暫時使用 Wireframe 方便觀察地面的推移
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // 將平面平放
plane.position.y = -2;
scene.add(plane);

// 4. 動畫迴圈 (推移地形營造速度感)
function animate() {
  requestAnimationFrame(animate);

  // 讓網格地面持續往攝影機方向移動
  plane.position.z += 0.1;
  // 當地面移動超過一個區塊時，重置位置以達到無限延伸的效果
  if(plane.position.z > 5) {
      plane.position.z = 0;
  }

  renderer.render(scene, camera);
}
animate();

// 5. 響應式：監聽視窗大小改變
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
