// ==========================================
// 0. 圖庫資料設定
// ==========================================
const characterList = [
  './character/walk01/slime_walk_1.png'
];

const handList = [
  './character/hand/blue_hand_closed.png',
  './character/hand/blue_hand_open.png',
  './character/hand/blue_hand_peace.png',
  './character/hand/blue_hand_point.png',
  './character/hand/blue_hand_rock.png',
  './character/hand/blue_hand_thumb.png'
];

// ==========================================
// 1. 場景、霧氣、攝影機初始化
// ==========================================
const config = {
  bgColor: 0xe6d5b8, fogColor: 0xe6d5b8, terrainColor: 0x828a5c,  
  mountainColor: 0x6e7855, lightColor: 0xfff9e6, ambientColor: 0x5d604b   
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);
scene.fog = new THREE.Fog(config.fogColor, 10, 120);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 25);
camera.lookAt(0, 2, -10);

const canvas = document.querySelector('#bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

scene.add(new THREE.AmbientLight(config.ambientColor, 1.8));
const dirLight = new THREE.DirectionalLight(config.lightColor, 2.0);
dirLight.position.set(0, 20, -30);
scene.add(dirLight);

// ==========================================
// 2. 地形與山脈 (噪點安全版)
// ==========================================
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
// 3. 角色與手勢系統 (已修復黑塊問題)
// ==========================================
const playerGroup = new THREE.Group();
playerGroup.position.set(0, 0, -10); 
scene.add(playerGroup);

let charSprite = null;
let leftHand = null;
let rightHand = null;
const textureLoader = new THREE.TextureLoader();

function loadCharacter(url) {
  if (charSprite) playerGroup.remove(charSprite);
  
  const tex = textureLoader.load(url);
  tex.magFilter = THREE.NearestFilter; 
  
  // 【關鍵修正】加入 depthWrite: false 與色調修正，徹底解決黑塊問題
  charSprite = new THREE.Sprite(new THREE.SpriteMaterial({ 
    map: tex, 
    color: 0xffffff, 
    transparent: true, 
    alphaTest: 0.1,
    depthWrite: false 
  }));
  charSprite.scale.set(4, 4, 1);
  playerGroup.add(charSprite);

  document.getElementById('hand-box').style.display = 'flex'; 
}

function loadHand(url) {
  if (leftHand) playerGroup.remove(leftHand);
  if (rightHand) playerGroup.remove(rightHand);

  const tex = textureLoader.load(url);
  tex.magFilter = THREE.NearestFilter;

  leftHand = new THREE.Sprite(new THREE.SpriteMaterial({ 
    map: tex, color: 0xffffff, transparent: true, alphaTest: 0.1, depthWrite: false 
  }));
  leftHand.scale.set(1.5, 1.5, 1);

  rightHand = new THREE.Sprite(new THREE.SpriteMaterial({ 
    map: tex, color: 0xffffff, transparent: true, alphaTest: 0.1, depthWrite: false 
  }));
  rightHand.scale.set(1.5, 1.5, 1);

  playerGroup.add(leftHand);
  playerGroup.add(rightHand);
}

// ==========================================
// 4. UI 介面與表單送出邏輯
// ==========================================
const mainContent = document.getElementById('main-content');
const openPanelBtn = document.getElementById('open-panel-btn');
const closePanelBtn = document.getElementById('close-panel-btn');

openPanelBtn.onclick = () => {
  mainContent.classList.remove('hidden');
  openPanelBtn.classList.add('hidden');
};
closePanelBtn.onclick = () => {
  mainContent.classList.add('hidden');
  openPanelBtn.classList.remove('hidden');
};

const modal = document.getElementById('selector-modal');
const itemsGrid = document.getElementById('items-grid');
const modalTitle = document.getElementById('modal-title');

window.openModal = function(type) {
  modalTitle.innerText = type === 'char' ? '選擇角色' : '選擇裝備';
  itemsGrid.innerHTML = ''; 
  const list = type === 'char' ? characterList : handList;

  list.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.className = 'grid-item';
    img.onclick = () => {
      if (type === 'char') loadCharacter(url);
      if (type === 'hand') loadHand(url);
      closeModal();
    };
    itemsGrid.appendChild(img);
  });
  modal.classList.remove('hidden');
}

window.closeModal = function() {
  modal.classList.add('hidden');
}

window.submitData = function() {
  const name = document.getElementById('new-name').value;
  const mins = document.getElementById('mins').value;
  const sportType = document.getElementById('sport-type').value;

  if(!charSprite) {
    alert("請先選擇一位角色！");
    return;
  }

  console.log("送出成功！", { name, mins, sportType });
  
  // 關閉面板，保留角色在畫面上走動
  mainContent.classList.add('hidden');
  openPanelBtn.classList.remove('hidden');
}

// ==========================================
// 5. 動畫與滑鼠互動
// ==========================================
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now(); 

  // A. 角色動態
  if (charSprite) {
    const walkX = Math.sin(time * 0.001) * 3;     
    const bounceY = Math.abs(Math.sin(time * 0.004)) * 0.6; 
    const rotateZ = Math.sin(time * 0.003) * 0.1; 

    charSprite.position.set(walkX, bounceY, 0);
    charSprite.material.rotation = rotateZ;

    if (leftHand && rightHand) {
      const sway = Math.sin(time * 0.003); 
      const swayFast = Math.cos(time * 0.005);
      leftHand.position.set(walkX - 2.5, bounceY + swayFast * 0.2, 0.1);
      leftHand.material.rotation = sway * 0.3;
      rightHand.position.set(walkX + 2.5, bounceY - swayFast * 0.2, 0.1);
      rightHand.material.rotation = -sway * 0.3;
    }
  }

  // B. 地形前進
  const pPos = pGeo.attributes.position;
  for (let i = 0; i < pPos.count; i++) {
    const x = pPos.getX(i), y = pPos.getY(i);
    const yOff = y + time * 0.018;
    pPos.setZ(i, Math.sin(x*0.04)*Math.cos(yOff*0.04)*3 + Math.sin(x*0.08)*Math.sin(yOff*0.02)*1.5 + Math.pow(Math.abs(x)/(tWidth/2),2)*5 - 2);
  }
  pPos.needsUpdate = true; pGeo.computeVertexNormals(); 

  // C. 視角晃動
  camera.position.x += (mouseX * 6 - camera.position.x) * 0.03;
  camera.position.y += ((8 + mouseY * 2) - camera.position.y) * 0.03;
  camera.lookAt(0, 2, -10);

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
