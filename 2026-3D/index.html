// ==========================================
// 0. 你的圖庫資料設定 (請替換為真實檔名)
// ==========================================
const characterList = [
  './character/ani/ani_1.svg' // 替換成你 GitHub /ani 裡的圖檔名
];

const handList = [
  './character/hand/blue_hand_closed.png',
  './character/hand/blue_hand_open.png',
  './character/hand/blue_hand_peace.png',
  './character/hand/blue_hand_point.png',
  './character/hand/blue_hand_rock.png',
  './character/hand/blue_hand_thumb.png'
];


// 1. 設定色彩參數
const config = {
  bgColor: 0xe6d5b8, fogColor: 0xe6d5b8, terrainColor: 0x828a5c,  
  mountainColor: 0x6e7855, lightColor: 0xfff9e6, ambientColor: 0x5d604b   
};

// 2. 初始化場景
const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);
scene.fog = new THREE.Fog(config.fogColor, 10, 120);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 25);
camera.lookAt(0, 2, -10);

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 3. 光源
scene.add(new THREE.AmbientLight(config.ambientColor, 1.8));
const dirLight = new THREE.DirectionalLight(config.lightColor, 2.0);
dirLight.position.set(0, 20, -30);
scene.add(dirLight);

// 4. 背景與地形 (保持上一版的噪點設定)
function createNoiseTexture() {
  const size = 256; const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < data.length; i += 4) {
      const noise = Math.floor(Math.random() * 40) + 215; 
      data[i] = data[i+1] = data[i+2] = noise; data[i+3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(20, 20); tex.needsUpdate = true;
  return tex;
}
const noiseMap = createNoiseTexture();

const mGeo = new THREE.PlaneGeometry(300, 100, 60, 20);
const mMat = new THREE.MeshStandardMaterial({ color: config.mountainColor, flatShading: true, map: noiseMap });
const mPos = mGeo.attributes.position;
for (let i = 0; i < mPos.count; i++) {
  const x = mPos.getX(i), y = mPos.getY(i);
  if (y > 0) mPos.setZ(i, (Math.sin(x*0.02)*15 + Math.sin(x*0.05)*8 + Math.sin(x*0.1)*3) * (y/50)); 
}
mGeo.computeVertexNormals();
const mountains = new THREE.Mesh(mGeo, mMat);
mountains.rotation.x = -Math.PI/2; mountains.position.set(0, -6, -80);
scene.add(mountains);

const tWidth = 140, tLength = 200;
const pGeo = new THREE.PlaneGeometry(tWidth, tLength, 80, 100);
const pMat = new THREE.MeshStandardMaterial({ color: config.terrainColor, roughness: 1.0, map: noiseMap });
const terrain = new THREE.Mesh(pGeo, pMat);
terrain.rotation.x = -Math.PI/2; terrain.position.set(0, -2, -30);
scene.add(terrain);


// ==========================================
// 5. 角色與手勢系統
// ==========================================
// 建立一個群組統一管理角色與手勢
const playerGroup = new THREE.Group();
playerGroup.position.set(0, 0, -10); // 放在畫面正中央前方
scene.add(playerGroup);

let charSprite = null;
let leftHand = null;
let rightHand = null;
const textureLoader = new THREE.TextureLoader();

// 載入角色
function loadCharacter(url) {
  if (charSprite) playerGroup.remove(charSprite); // 移除舊角色
  
  const tex = textureLoader.load(url);
  tex.magFilter = THREE.NearestFilter; // 保持像素清晰
  charSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  charSprite.scale.set(4, 4, 1);
  charSprite.position.set(0, 0, 0); // 相對於群組置中
  playerGroup.add(charSprite);

  // 解鎖手勢按鈕
  document.getElementById('btn-hand').style.display = 'inline-block';
}

// 載入手勢 (雙手)
function loadHand(url) {
  if (leftHand) playerGroup.remove(leftHand);
  if (rightHand) playerGroup.remove(rightHand);

  const tex = textureLoader.load(url);
  tex.magFilter = THREE.NearestFilter;

  // 左手
  leftHand = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  leftHand.scale.set(1.5, 1.5, 1);
  leftHand.position.set(-2.5, 0, 0.1); // 定位在角色左側外圍，Z稍微靠前避免被吃掉

  // 右手 (如果需要左右鏡像，可獨立設定，這裡先用同一張圖)
  rightHand = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  rightHand.scale.set(1.5, 1.5, 1);
  rightHand.position.set(2.5, 0, 0.1); // 定位在角色右側外圍

  playerGroup.add(leftHand);
  playerGroup.add(rightHand);
}


// ==========================================
// 6. UI 事件與 Modal 控制
// ==========================================
const modal = document.getElementById('selector-modal');
const modalTitle = document.getElementById('modal-title');
const itemsGrid = document.getElementById('items-grid');
let currentSelectionType = '';

// 打開選單並產生縮圖
function openModal(type, list) {
  currentSelectionType = type;
  modalTitle.innerText = type === 'char' ? '選擇角色' : '選擇手勢';
  itemsGrid.innerHTML = ''; // 清空舊圖

  list.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.className = 'grid-item';
    img.onclick = () => {
      if (type === 'char') loadCharacter(url);
      if (type === 'hand') loadHand(url);
      modal.classList.add('hidden'); // 選完後自動關閉
    };
    itemsGrid.appendChild(img);
  });
  
  modal.classList.remove('hidden');
}

document.getElementById('btn-char').onclick = () => openModal('char', characterList);
document.getElementById('btn-hand').onclick = () => openModal('hand', handList);
document.getElementById('btn-close').onclick = () => modal.classList.add('hidden');


// ==========================================
// 7. 動畫與滑鼠互動
// ==========================================
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now(); 

  // A. 地形前進
  const pPos = pGeo.attributes.position;
  for (let i = 0; i < pPos.count; i++) {
    const x = pPos.getX(i), y = pPos.getY(i);
    const yOff = y + time * 0.018;
    pPos.setZ(i, Math.sin(x*0.04)*Math.cos(yOff*0.04)*3 + Math.sin(x*0.08)*Math.sin(yOff*0.02)*1.5 + Math.pow(Math.abs(x)/(tWidth/2),2)*5 - 2);
  }
  pPos.needsUpdate = true; pGeo.computeVertexNormals(); 

  // B. 視角晃動
  camera.position.x += (mouseX * 6 - camera.position.x) * 0.03;
  camera.position.y += ((8 + mouseY * 2) - camera.position.y) * 0.03;
  camera.lookAt(0, 2, -10);

  // C. 【手勢隨機小轉動】利用 Sine 波製造像呼吸一樣的上下浮動與旋轉
  if (leftHand && rightHand) {
    // 取得緩慢變化的數值
    const sway = Math.sin(time * 0.003); 
    const swayFast = Math.cos(time * 0.005);

    // 左右手稍微錯開相位 (phase)，看起來更生動
    leftHand.material.rotation = sway * 0.3;          // 左手輕微旋轉
    leftHand.position.y = swayFast * 0.2;             // 左手輕微上下浮動

    rightHand.material.rotation = -sway * 0.3;        // 右手反方向旋轉
    rightHand.position.y = -swayFast * 0.2;           // 右手反向浮動
  }

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
