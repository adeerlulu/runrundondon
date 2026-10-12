// ==========================================
// 0. Firebase 初始化設定 (2026 獨立專案路徑)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDqX_tZqqfw0txXpd-b4AWuolhgQgU6lLU",
  authDomain: "runrundondon-31b12.firebaseapp.com",
  databaseURL: "https://runrundondon-31b12-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "runrundondon-31b12",
  storageBucket: "runrundondon-31b12.firebasestorage.app",
  messagingSenderId: "466713105396",
  appId: "1:466713105396:web:c0651103b028978cd9dfa1",
  measurementId: "G-D5D9SP15X4"
};

firebase.initializeApp(firebaseConfig);
const dbRef = firebase.database().ref('2026_records'); 

// ==========================================
// 1. 圖庫資料設定 (包含草叢 6~13 漸變群組)
// ==========================================
const characterList = [
  './character/ani/ani_1.png',
  './character/ani/ani_2.png'
];

const handList = [
  './character/hand/blue_hand_closed.png',
  './character/hand/blue_hand_open.png',
  './character/hand/blue_hand_peace.png',
  './character/hand/blue_hand_point.png',
  './character/hand/blue_hand_rock.png',
  './character/hand/blue_hand_thumb.png'
];

// 草叢總圖庫 (包含 1~5, 6~13, 14~24)
const grassList = [];
for (let i = 1; i <= 5; i++) grassList.push(`./grass/grass_${i}.png`);
for (let i = 6; i <= 13; i++) grassList.push(`./grass/grass_${i}.png`); 
for (let i = 14; i <= 24; i++) grassList.push(`./grass/grass_${i}.png`);

// ==========================================
// 2. 場景與渲染器初始化
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

const labelRenderer = new THREE.CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none'; 
document.body.appendChild(labelRenderer.domElement);

scene.add(new THREE.AmbientLight(config.ambientColor, 1.8));
const dirLight = new THREE.DirectionalLight(config.lightColor, 2.0);
dirLight.position.set(0, 20, -30);
scene.add(dirLight);

// ==========================================
// 3. 地形與草叢動態漸變散佈系統 (grass_6~13 支援隨機漸變出現)
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

const textureLoader = new THREE.TextureLoader();
const grassGroup = new THREE.Group();
scene.add(grassGroup);

// 生成基礎滿版草叢
function spawnFullGrassField() {
  for (let i = 0; i < 35; i++) {
    const randomGrassUrl = grassList[Math.floor(Math.random() * grassList.length)];
    textureLoader.load(randomGrassUrl, (tex) => {
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;

      const scale = 2.5 + Math.random() * 3.5; 
      const grassMat = new THREE.SpriteMaterial({ 
        map: tex, transparent: true, opacity: 0.8 + Math.random() * 0.2, alphaTest: 0.1, depthWrite: false 
      });

      const grassSprite = new THREE.Sprite(grassMat);
      grassSprite.scale.set(scale, scale, 1);
      grassSprite.position.set((Math.random() - 0.5) * 80, -0.8, -2 - Math.random() * 50);
      grassGroup.add(grassSprite);
    });
  }
}
spawnFullGrassField();

// 特殊動態漸變草叢群組 (grass_6 ~ grass_13)
const dynamicGrassGroup = new THREE.Group();
scene.add(dynamicGrassGroup);
const dynamicGrassList = [];
for (let i = 6; i <= 13; i++) {
  dynamicGrassList.push(`./grass/grass_${i}.png`);
}

function updateDynamicGrass() {
  if (dynamicGrassGroup.children.length < 3) {
    const url = dynamicGrassList[Math.floor(Math.random() * dynamicGrassList.length)];
    textureLoader.load(url, (tex) => {
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;

      const mat = new THREE.SpriteMaterial({ 
        map: tex, transparent: true, opacity: 0, alphaTest: 0.1, depthWrite: false 
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(3.0, 3.0, 1);
      sprite.position.set((Math.random() - 0.5) * 50, -0.6, -5 - Math.random() * 30);
      sprite.userData = { fadeIn: true, opacitySpeed: 0.01 + Math.random() * 0.01 };
      
      dynamicGrassGroup.add(sprite);
    });
  }

  dynamicGrassGroup.children.forEach((sprite, index) => {
    if (sprite.userData.fadeIn) {
      sprite.material.opacity += sprite.userData.opacitySpeed;
      if (sprite.material.opacity >= 0.9) sprite.userData.fadeIn = false;
    } else {
      sprite.material.opacity -= sprite.userData.opacitySpeed * 0.5;
      if (sprite.material.opacity <= 0.05) {
        dynamicGrassGroup.remove(sprite);
      }
    }
  });
}

// ==========================================
// 4. 多角色系統 (起始 Y 軸向下調整 2.0 單位，約等於畫面 200px 視覺效果)
// ==========================================
const allPlayerGroups = []; 
let allMembersData = {}; 

let tempCharUrl = '';
let tempHandUrl = '';

function updatePreviewUI() {
  const avatarImg = document.getElementById('preview-avatar');
  const handImg = document.getElementById('preview-hand');
  const placeholder = document.getElementById('preview-placeholder');

  if (tempCharUrl) {
    avatarImg.src = tempCharUrl;
    avatarImg.style.display = 'block';
    placeholder.style.display = 'none';
  }
  if (tempHandUrl) {
    handImg.src = tempHandUrl;
    handImg.style.display = 'block';
  } else {
    handImg.style.display = 'none';
  }
}

function previewCharacter(url) {
  tempCharUrl = url;
  updatePreviewUI();
  document.getElementById('hand-box').style.display = 'flex'; 
}

function previewHand(url) {
  tempHandUrl = url;
  updatePreviewUI();
}

function getGoalText(minsInput) {
  const totalMins = parseInt(minsInput) || 0;
  const target = 3900;
  const diff = target - totalMins;

  if (diff > 0) return `還要動 ${diff} 分鐘`;
  else if (diff === 0) return `剛好達成 3900 分鐘！`;
  else return `多動了 ${Math.abs(diff)} 分鐘`;
}

function spawnOrUpdateCharacter(charUrl, handUrl, memberName = '成員', mins = '0', customX = 0, customY = 0, customZ = -10, scaleMultiplier = 1) {
  let existingGroup = allPlayerGroups.find(g => g.userData.name === memberName);
  const goalText = getGoalText(mins);

  if (existingGroup) {
    const bubbleChild = existingGroup.children.find(child => child.element && child.element.classList.contains('player-speech-bubble'));
    if (bubbleChild) {
      bubbleChild.element.textContent = goalText;
    }
    return;
  }

  // 將起始 Y 軸向下調整（原本的 baseY 再往下降低 2.0 單位，對應向下 200px 視覺）
  const adjustedY = customY - 2.0;

  const group = new THREE.Group();
  group.userData = { 
    name: memberName,
    baseX: customX, 
    baseY: adjustedY, 
    baseZ: customZ, 
    targetBaseY: -2.5, // 掉回草皮時的基準高度（配合向下 200px）
    randomOffset: Math.random() * 100,
    isDragging: false,
    isDropping: false
  };
  scene.add(group);

  const nameDiv = document.createElement('div');
  nameDiv.className = 'player-name-tag';
  nameDiv.textContent = memberName;
  const nameLabel = new THREE.CSS2DObject(nameDiv);
  nameLabel.position.set(0, -1.8 * scaleMultiplier, 0);
  group.add(nameLabel);

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'player-speech-bubble';
  bubbleDiv.textContent = goalText;
  const bubbleLabel = new THREE.CSS2DObject(bubbleDiv);
  bubbleLabel.position.set(0, 2.2 * scaleMultiplier, 0);
  group.add(bubbleLabel);

  textureLoader.load(charUrl, (tex) => {
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: tex, transparent: true, alphaTest: 0.1, depthWrite: false 
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    const finalScale = 4 * scaleMultiplier;
    sprite.scale.set(finalScale, finalScale, 1);
    group.add(sprite);
    group.userData.sprite = sprite; 
  });

  if (handUrl) {
    textureLoader.load(handUrl, (tex) => {
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;

      const handScale = 1.5 * scaleMultiplier * 0.7; 

      const leftHand = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.1, depthWrite: false }));
      leftHand.scale.set(handScale, handScale, 1);
      leftHand.position.set(-2.2 * scaleMultiplier, 0, 0.1);
      group.add(leftHand);

      const rightHand = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.1, depthWrite: false }));
      rightHand.scale.set(handScale, handScale, 1);
      rightHand.position.set(2.2 * scaleMultiplier, 0, 0.1);
      group.add(rightHand);
      
      group.userData.hasHands = true;
    });
  }

  allPlayerGroups.push(group);
}

// ==========================================
// 5. 滑鼠拖曳與放開後掉回草皮系統
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let draggedGroup = null; 
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 10); 
const planeIntersectPoint = new THREE.Vector3();
let isClickAction = true; 

window.addEventListener('mousedown', (event) => {
  if (event.target.closest('.main-container') || event.target.closest('.modal') || event.target.closest('.floating-btn')) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const sprites = [];
  allPlayerGroups.forEach(g => {
    if (g.userData.sprite) sprites.push(g.userData.sprite);
  });

  const intersects = raycaster.intersectObjects(sprites);
  if (intersects.length > 0) {
    draggedGroup = intersects[0].object.parent;
    draggedGroup.userData.isDragging = true;
    draggedGroup.userData.isDropping = false;
    isClickAction = true; 
    dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), draggedGroup.position);
  }
});

window.addEventListener('mousemove', (event) => {
  if (!draggedGroup) return;
  isClickAction = false; 

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  raycaster.ray.intersectPlane(dragPlane, planeIntersectPoint);
  draggedGroup.userData.baseX = planeIntersectPoint.x;
  draggedGroup.userData.baseY = Math.max(-2.5, planeIntersectPoint.y); 
});

window.addEventListener('mouseup', (event) => {
  if (draggedGroup) {
    draggedGroup.userData.isDragging = false;
    draggedGroup.userData.targetBaseY = -2.5;
    draggedGroup.userData.isDropping = true;

    if (isClickAction) {
      const name = draggedGroup.userData.name;
      const data = allMembersData[name];
      if (data) showRecordModal(data);
    }
    draggedGroup = null;
  }
});

function showRecordModal(data) {
  const modal = document.getElementById('record-modal');
  const title = document.getElementById('record-title');
  const body = document.getElementById('record-body');

  title.innerText = `🏅 ${data.name} 的 2026 運動紀錄`;
  body.innerHTML = `
    <b>最近運動項目：</b> ${data.sportType || '無'}<br>
    <b>最近運動時數：</b> ${data.mins || '0'} 分鐘<br>
    <b>今日 Murmur：</b> ${data.murmur || '今天也是充滿活力的一天！'}<br>
    <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
    <span style="font-size: 12px; color: #718096;">更新時間：${new Date(data.updatedAt).toLocaleString()}</span>
  `;
  modal.classList.remove('hidden');
}

window.closeRecordModal = function() {
  document.getElementById('record-modal').classList.add('hidden');
}

// ==========================================
// 6. UI、Firebase 與碎碎念卡片輪播
// ==========================================
const mainContent = document.getElementById('main-content');
const openPanelBtn = document.getElementById('open-panel-btn');
const closePanelBtn = document.getElementById('close-panel-btn');
const userSelect = document.getElementById('user-select');
const newNameInput = document.getElementById('new-name');

openPanelBtn.onclick = () => { mainContent.classList.remove('hidden'); openPanelBtn.classList.add('hidden'); };
closePanelBtn.onclick = () => { mainContent.classList.add('hidden'); openPanelBtn.classList.remove('hidden'); };

const modal = document.getElementById('selector-modal');
const itemsGrid = document.getElementById('items-grid');
const modalTitle = document.getElementById('modal-title');

window.openModal = function(type) {
  modalTitle.innerText = type === 'char' ? '選擇頭像' : '選擇裝備';
  itemsGrid.innerHTML = ''; 
  const list = type === 'char' ? characterList : handList;

  list.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.className = 'grid-item';
    img.onclick = () => {
      if (type === 'char') previewCharacter(url);
      if (type === 'hand') previewHand(url);
      closeModal();
    };
    itemsGrid.appendChild(img);
  });
  modal.classList.add('hidden');
}

window.closeModal = function() { modal.classList.add('hidden'); }

let murmurList = [];
let currentMurmurStartIndex = 0;

function renderMurmurCards() {
  const wrapper = document.getElementById('ticker-cards-wrapper');
  if (!wrapper) return;
  wrapper.innerHTML = '';

  if (murmurList.length === 0) {
    wrapper.innerHTML = '<div style="color:white; font-size:13px; text-align:center; padding:10px;">目前還沒有人留下碎碎念，快來填寫今日工事吧！</div>';
    return;
  }

  const displayCount = Math.min(3, murmurList.length);
  for (let i = 0; i < displayCount; i++) {
    const itemIndex = (currentMurmurStartIndex + i) % murmurList.length;
    const item = murmurList[itemIndex];

    const card = document.createElement('div');
    card.className = 'murmur-card';
    card.innerHTML = `
      <div class="murmur-header">
        <img class="murmur-avatar" src="${item.charUrl || './character/ani/ani_1.png'}" alt="頭像">
        <div class="murmur-user-info">
          <span class="murmur-username">${item.name}</span>
          <span class="murmur-date">${item.dateStr}</span>
        </div>
      </div>
      <div class="murmur-body">${item.murmur}</div>
    `;
    wrapper.appendChild(card);
  }
}

window.slideMurmur = function(direction) {
  if (murmurList.length === 0) return;
  currentMurmurStartIndex = (currentMurmurStartIndex + direction + murmurList.length) % murmurList.length;
  renderMurmurCards();
};

function startMurmurTicker() {
  setInterval
