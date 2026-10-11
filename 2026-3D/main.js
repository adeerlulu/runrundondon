// 1. 日夜時間判斷
const currentHour = new Date().getHours();
const isDayTime = currentHour >= 6 && currentHour < 18;

// 2. 色彩配置 (已修正夜晚為綠色草皮)
const config = {
  bgColor: isDayTime ? 0xfd9e73 : 0x050810,      // 日落暖橘 vs 深夜極暗藍
  fogColor: isDayTime ? 0xfd9e73 : 0x050810,     
  // 草皮顏色：白天為翠綠色，夜晚為被微弱光線照亮的暗綠草皮
  terrainColor: isDayTime ? 0x3d8c40 : 0x163820, 
  lightColor: isDayTime ? 0xffdfb3 : 0x6e88a6,   // 白天暖色陽光 vs 夜晚冷色月光
  ambientColor: isDayTime ? 0x6e5043 : 0x15251a  // 環境暗部色 (夜間帶點幽綠色)
};

// 3. 場景、霧氣、攝影機初始化
const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);
scene.fog = new THREE.Fog(config.fogColor, 15, 120);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
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

// (已移除中央的太陽/月亮球體)

// 5. 創建 3D 起伏草皮地形
// 稍微降低網格數(60x80)確保手機與電腦運算動態地形時都能維持 60 FPS 順暢度
const terrainWidth = 140;
const terrainLength = 200;
const planeGeometry = new THREE.PlaneGeometry(terrainWidth, terrainLength, 60, 80);

const planeMaterial = new THREE.MeshStandardMaterial({ 
  color: config.terrainColor
