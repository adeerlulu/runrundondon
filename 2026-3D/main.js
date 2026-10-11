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
// 1. 圖庫資料設定 (包含角色、手勢與草地素材)
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

// 自動產生 grass_1.png ~ grass_24.png 路徑陣列
const grassList = [];
for (let i = 1; i <= 24; i++) {
  grassList.push(`./grass/grass_${i}.png`);
}

// ==========================================
// 2. 場景與 CSS2D 渲染器初始化
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
// 3. 地形、山脈與隨機草叢系統 (最多 5 組)
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

// 隨機在草地上生成草叢裝飾（最多 5 組）
const textureLoader = new THREE.TextureLoader();
const grassGroup = new THREE.Group();
scene.add(grassGroup);

function spawnRandomGrassClusters() {
  const maxGroups = 5; // 限制畫面最多出現 5 組
  for (let i = 0; i < maxGroups; i++) {
    // 隨機挑選一張草的圖片
    const randomGrassUrl = grassList[Math.floor(Math.random() * grassList.length)];
    
    textureLoader.load(randomGrassUrl, (tex) => {
      tex.magFilter = THREE.NearestFilter;
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;

      // 隨機大小與微透明度
      const scale = 2.0 + Math.random() * 2.5; 
      const grassMat = new THREE.SpriteMaterial({ 
        map: tex, 
        transparent: true, 
        opacity: 0.85 + Math.random() * 0.15, // 帶點自然的透明度
        alphaTest: 0.1, 
        depthWrite: false 
      });

      const grassSprite = new THREE.Sprite(grassMat);
      grassSprite.scale.set(scale, scale, 1);

      // 隨機散佈在草地各處（X 軸左右分散，Z 軸前後錯開，貼齊地面 Y 軸）
      const rx = (Math.random() - 0.5) * 50;
      const rz = -5 - Math.random() * 35;
      grassSprite.position.set(rx, -0.5, rz);

      grassGroup.add(grassSprite);
    });
  }
}
spawnRandomGrassClusters();

// ==========================================
// 4. 多角色、裝備縮小(70%)、對話泡泡與點擊事件
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

function spawnCharacter(charUrl, handUrl, memberName = '成員', sportType = '健走', mins = '0', customX = 0, customY = 0, customZ = -10, scaleMultiplier = 1) {
  const group = new THREE.Group();
  group.userData = { 
    name: memberName,
    baseX: customX, 
    baseY: customY, 
    baseZ: customZ, 
    randomOffset: Math.random() * 100 
  };
  scene.add(group);

  // 1. 名字標籤 (下方)
  const nameDiv = document.createElement('div');
  nameDiv.className = 'player-name-tag';
  nameDiv.textContent = memberName;
  const nameLabel = new THREE.CSS2DObject(nameDiv);
  nameLabel.position.set(0, -1.8 * scaleMultiplier, 0);
  group.add(nameLabel);

  // 2. 對話泡泡 (上方)
  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'player-speech-bubble';
  bubbleDiv.textContent = `${sportType} ${mins}分`;
  const bubbleLabel = new THREE.CSS2DObject(bubbleDiv);
  bubbleLabel.position.set(0, 2.2 * scaleMultiplier, 0);
  group.add(bubbleLabel);

  // 3. 角色本體
  textureLoader.load(charUrl, (tex) => {
    tex.magFilter = THREE.NearestFilter;
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

  // 4. 裝備 (縮小至 70%)
  if (handUrl) {
    textureLoader.load(handUrl, (tex) => {
      tex.magFilter = THREE.NearestFilter;
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;

      const handScale = 1.5 * scaleMultiplier * 0.7; 

      const leftHand = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.1, depthWrite: false }));
      leftHand.scale.set(handScale, handScale, 1);
      leftHand.position.set(-2.0 * scaleMultiplier, 0, 0.1);
      group.add(leftHand);

      const rightHand = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.1, depthWrite: false }));
      rightHand.scale.set(handScale, handScale, 1);
      rightHand.position.set(2.0 * scaleMultiplier, 0, 0.1);
      group.add(rightHand);
      
      group.userData.hasHands = true;
    });
  }

  allPlayerGroups.push(group);
}

// ==========================================
// 5. 點擊角色彈窗互動
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
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
    const clickedSprite = intersects[0].object;
    const group = clickedSprite.parent;
    const name = group.userData.name;
    const data = allMembersData[name];

    if (data) {
      showRecordModal(data);
    }
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
// 6. UI 與 Firebase 資料讀寫、留言輪播
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
  modal.classList.remove('hidden');
}

window.closeModal = function() { modal.classList.add('hidden'); }

let murmurList = [];
let currentMurmurIndex = 0;
function startMurmurTicker() {
  const tickerEl = document.getElementById('ticker-content');
  if (murmurList.length === 0) return;
  
  setInterval(() => {
    if (murmurList.length > 0) {
      currentMurmurIndex = (currentMurmurIndex + 1) % murmurList.length;
      tickerEl.innerText = murmurList[currentMurmurIndex];
    }
  }, 4000); 
}

let isLoadedFromFirebase = false;
function loadAllMembersFromFirebase() {
  dbRef.on('value', (snapshot) => {
    userSelect.innerHTML = '<option value="">+ 新成員</option>';
    const data = snapshot.val();
    allMembersData = data || {};
    
    if (!isLoadedFromFirebase) {
      allPlayerGroups.forEach(g => {
        scene.remove(g);
        g.children.forEach(child => {
          if (child instanceof THREE.CSS2DObject) child.element.remove();
        });
      });
      allPlayerGroups.length = 0;
    }

    murmurList = [];
    if (data) {
      const names = Object.keys(data);
      names.forEach((name, index) => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.innerText = name;
        userSelect.appendChild(opt);

        if (data[name].murmur) {
          murmurList.push(`💬 ${name}: ${data[name].murmur}`);
        }

        if (!isLoadedFromFirebase && data[name].charUrl) {
          const spreadX = (index % 4 - 1.5) * 5.0 + (Math.random() - 0.5) * 1.5; 
          const spreadY = (index % 3) * 1.2 - 1.0; 
          const spreadZ = -8 - (index * 3); 
          const scaleFactor = Math.max(0.6, 1.2 - (index * 0.15)); 

          spawnCharacter(data[name].charUrl, data[name].handUrl, name, data[name].sportType, data[name].mins, spreadX, spreadY, spreadZ, scaleFactor);
        }
      });
      if (murmurList.length > 0) {
        document.getElementById('ticker-content').innerText = murmurList[0];
      }
      isLoadedFromFirebase = true;
    }
  });
}

userSelect.onchange = (e) => {
  const selectedName = e.target.value;
  if (selectedName) {
    newNameInput.value = selectedName;
    dbRef.child(selectedName).once('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        if (val.mins) document.getElementById('mins').value = val.mins;
        if (val.sportType) document.getElementById('sport-type').value = val.sportType;
        if (val.murmur) document.getElementById('murmur-input').value = val.murmur;
        if (val.charUrl) previewCharacter(val.charUrl);
        if (val.handUrl) previewHand(val.handUrl);
      }
    });
  } else {
    newNameInput.value = '';
    tempCharUrl = '';
    tempHandUrl = '';
    document.getElementById('murmur-input').value = '';
    updatePreviewUI();
  }
};

window.submitData = function() {
  const nameInput = newNameInput.value.trim();
  const selectUser = userSelect.value;
  const finalName = nameInput || selectUser;
  const mins = document.getElementById('mins').value;
  const sportType = document.getElementById('sport-type').value;
  const murmur = document.getElementById('murmur-input').value.trim();

  if(!finalName) { alert("請輸入或選擇成員名字！"); return; }
  if(!tempCharUrl) { alert("請先挑選頭像！"); return; }

  const memberData = {
    name: finalName,
    mins: mins || '0',
    sportType: sportType,
    murmur: murmur || '今天也有好好運動！',
    charUrl: tempCharUrl,
    handUrl: tempHandUrl,
    updatedAt: Date.now()
  };

  dbRef.child(finalName).set(memberData)
    .then(() => {
      const newX = (Math.random() - 0.5) * 10;
      const newY = (Math.random() - 0.5) * 1.5;
      const newZ = -10 - Math.random() * 6;
      spawnCharacter(tempCharUrl, tempHandUrl, finalName, sportType, mins || '0', newX, newY, newZ, 1.0);

      alert(`成功儲存！${finalName} 的 2026 今日工事已更新。`);
      mainContent.classList.add('hidden');
      openPanelBtn.classList.remove('hidden');
    })
    .catch((error) => { alert("儲存失敗：" + error.message); });
}

window.addEventListener('DOMContentLoaded', () => {
  loadAllMembersFromFirebase();
  startMurmurTicker();
});

// ==========================================
// 7. 動畫迴圈
// ==========================================
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now(); 

  allPlayerGroups.forEach((group) => {
    const offset = group.userData.randomOffset || 0;
    const baseX = group.userData.baseX || 0;
    const baseY = group.userData.baseY || 0; 
    const baseZ = group.userData.baseZ || -10;

    const walkX = baseX + Math.sin(time * 0.001 + offset) * 1.2;     
    const bounceY = baseY + Math.abs(Math.sin(time * 0.004 + offset)) * 0.4; 
    const rotateZ = Math.sin(time * 0.003 + offset) * 0.1; 

    group.position.set(walkX, bounceY, baseZ);

    const sprite = group.children[2];
    if (sprite) sprite.material.rotation = rotateZ;

    if (group.userData.hasHands && group.children.length >= 5) {
      const leftHand = group.children[3];
      const rightHand = group.children[4];
      const sway = Math.sin(time * 0.003 + offset); 
      const swayFast = Math.cos(time * 0.005 + offset);

      leftHand.position.set(-1.8, swayFast * 0.15, 0.1);
      leftHand.material.rotation = sway * 0.3;
      rightHand.position.set(1.8, -swayFast * 0.15, 0.1);
      rightHand.material.rotation = -sway * 0.3;
    }
  });

  const pPos = pGeo.attributes.position;
  for (let i = 0; i < pPos.count; i++) {
    const x = pPos.getX(i), y = pPos.getY(i);
    const yOff = y + time * 0.018;
    pPos.setZ(i, Math.sin(x*0.04)*Math.cos(yOff*0.04)*3 + Math.sin(x*0.08)*Math.sin(yOff*0.02)*1.5 + Math.pow(Math.abs(x)/(tWidth/2),2)*5 - 2);
  }
  pPos.needsUpdate = true; pGeo.computeVertexNormals(); 

  camera.position.x += (mouseX * 6 - camera.position.x) * 0.03;
  camera.position.y += ((8 + mouseY * 2) - camera.position.y) * 0.03;
  camera.lookAt(0, 2, -10);

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});
