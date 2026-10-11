// 1. 設定色彩參數 (溫暖米黃天空 + 莫蘭迪橄欖綠草地與山脈)
const config = {
  bgColor: 0xe6d5b8,      // 溫暖的米黃/卡其色天空
  fogColor: 0xe6d5b8,     // 霧氣與天空同色，製造無邊際感
  terrainColor: 0x828a5c, // 莫蘭迪橄欖綠 (草地)
  mountainColor: 0x6e7855, // 稍深一點的莫蘭迪綠 (山脈)
  lightColor: 0xfff9e6,   // 柔和微暖的日光
  ambientColor: 0x5d604b  // 灰綠色的陰影暗部，讓草皮立體但不突兀
};

// 2. 場景、霧氣、攝影機初始化
const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);
// 讓霧氣延伸得更遠，讓山脈若隱若現
scene.fog = new THREE.Fog(config.fogColor, 15, 150);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
// 攝影機初始位置 (放在草地上方)
camera.position.set(0, 8, 25);
camera.lookAt(0, 2, -10);

const canvas = document.querySelector('#bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 3. 建立光源
const ambientLight = new THREE.AmbientLight(config.ambientColor, 1.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(config.lightColor, 2.0);
dirLight.position.set(0, 20, -30);
scene.add(dirLight);

// ==========================================
// 4A. 創建「遠方山脈」 (新加入)
// ==========================================
// 使用較低的面數來製造 low-poly 的稜角感
const mountainGeometry = new THREE.PlaneGeometry(300, 100, 60, 20);
const mountainMaterial = new THREE.MeshStandardMaterial({
  color: config.mountainColor,
  roughness: 1.0,
  metalness: 0.0,
  flatShading: true // 山脈保留稜角分明的 Low-Poly 風格
});

// 利用數學函式製造隨機山峰
const mountainPos = mountainGeometry.attributes.position;
for (let i = 0; i < mountainPos.count; i++) {
  const x = mountainPos.getX(i);
  const y = mountainPos.getY(i);
  
  // 透過多重 sine 波疊加，製造高低起伏的山峰
  const height = Math.sin(x * 0.02) * 15 + Math.sin(x * 0.05) * 8 + Math.sin(x * 0.1) * 3;
  // 只有上半部的頂點會被拉高成山峰，下半部埋在地底
  if (y > 0) {
      mountainPos.setZ(i, height * (y / 50)); 
  }
}
mountainGeometry.computeVertexNormals();

const mountains = new THREE.Mesh(mountainGeometry, mountainMaterial);
// 把山脈立起來並推到非常遠的地方 (z: -100)
mountains.rotation.x = -Math.PI / 2;
mountains.position.set(0, -10, -100); 
scene.add(mountains);

// ==========================================
// 4B. 創建「近處平滑草皮」 (含噪點)
// ==========================================
const terrainWidth = 140;
const terrainLength = 200;
const planeGeometry = new THREE.PlaneGeometry(terrainWidth, terrainLength, 80, 100);

const planeMaterial = new THREE.MeshStandardMaterial({ 
  color: config.terrainColor,
  roughness: 1.0, 
  metalness: 0.0
});

// 透過 Shader 注入噪點 (Noise) 提升草地質感
planeMaterial.onBeforeCompile = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `
    #include <common>
    float randomNoise(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    `
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <dithering_fragment>',
    `
    #include <dithering_fragment>
    float noise = (randomNoise(gl_FragCoord.xy) - 0.5) * 0.06; 
    gl_FragColor.rgb += vec3(noise);
    `
  );
};

const terrain = new THREE.Mesh(planeGeometry, planeMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.position.set(0, -2, -30);
scene.add(terrain);

// ==========================================
// 5. 監聽滑鼠移動 (修復視角晃動)
// ==========================================
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
  // 將滑鼠座標標準化為 -1 到 1 之間
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// 6. 動畫迴圈 
function animate() {
  requestAnimationFrame
