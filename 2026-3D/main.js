const currentHour = new Date().getHours();
const isDayTime = currentHour >= 6 && currentHour < 18;

// 1. 修正色彩配置：讓晚上的網格變成高對比的亮青色 (Neon Cyan)
const config = {
  bgColor: isDayTime ? 0xff7e5f : 0x0f172a,      
  fogColor: isDayTime ? 0xff7e5f : 0x0f172a,     
  sphereColor: isDayTime ? 0xffd700 : 0xffffff,  // 讓月亮變成純白色
  gridColor: isDayTime ? 0xffffff : 0x00e5ff     // 夜間改為明亮的霓虹青色
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);
// 把霧氣推遠一點，讓網格能見度更高
scene.fog = new THREE.Fog(config.fogColor, 15, 80); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 15);

const canvas = document.querySelector('#bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 2. 修正天體：加入 fog: false，讓它不會被霧氣染成灰色
const sphereGeometry = new THREE.SphereGeometry(10, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ 
  color: config.sphereColor, 
  fog: false // <--- 關鍵修正：無視霧氣，保持絕對明亮
}); 
const celestialBody = new THREE.Mesh(sphereGeometry, sphereMaterial);
// 稍微把球體往上抬高 (y: 8)，並往後推 (z: -40)，更像天空中的星體
celestialBody.position.set(0, 8, -40); 
scene.add(celestialBody);

// 3. 修正網格：加入透明度讓線條更柔和
const planeGeometry = new THREE.PlaneGeometry(100, 100, 40, 40);
const planeMaterial = new THREE.MeshBasicMaterial({ 
  color: config.gridColor, 
  wireframe: true,
  transparent: true,
  opacity: 0.6 // 微微透明，看起來更有數位感
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -2;
scene.add(plane);

// 動畫迴圈
function animate() {
  requestAnimationFrame(animate);

  plane.position.z += 0.05;
  
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
