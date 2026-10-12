// ==========================================
// 0. Firebase 初始化設定
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
// 1. 圖庫資料設定
// ==========================================
const characterList = [ './character/ani/ani_1.png', './character/ani/ani_2.png' ];
const handList = [
  './character/hand/blue_hand_closed.png', './character/hand/blue_hand_open.png',
  './character/hand/blue_hand_peace.png', './character/hand/blue_hand_point.png',
  './character/hand/blue_hand_rock.png', './character/hand/blue_hand_thumb.png'
];
const grassList = [];
for (let i = 1; i <= 24; i++) grassList.push(`./grass/grass_${i}.png`);

// ==========================================
// 2. 場景與渲染器初始化
// ==========================================
const config = {
  bgColor: 0xf2eae9, fogColor: 0xf2eae9, terrainColor: 0x828a5c,  
  mountainColor: 0x6e7855, lightColor: 0xfff9e6, ambientColor: 0x6e737c   
};
const scene = new THREE.Scene();
scene.background = null; 
scene.fog = new THREE.Fog(config.fogColor, 15, 120);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 25);
camera.lookAt(0, 2, -10);

const canvas = document.querySelector('#bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const labelRenderer = new THREE.CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none'; 
document.body.appendChild(labelRenderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 1.8));
const dirLight = new THREE.DirectionalLight(0xfffaee, 0.8);
dirLight.position.set(0, 50, 30);
scene.add(dirLight);

// ==========================================
// 3. 地形與草叢系統
// ==========================================
const tWidth = 140, tLength = 200;
const pGeo = new THREE.PlaneGeometry(tWidth, tLength, 30, 30);
const pMat = new THREE.MeshStandardMaterial({ color: config.terrainColor, roughness: 1.0, metalness: 0.0 });
const terrain = new THREE.Mesh(pGeo, pMat);
terrain.rotation.x = -Math.PI/2; terrain.position.set(0, -2, -30);
scene.add(terrain);

const textureLoader = new THREE.TextureLoader();
const grassGroup = new THREE.Group();
scene.add(grassGroup);

function spawnFullGrassField() {
  for (let i = 0; i < 65; i++) {
    const url = grassList[Math.floor(Math.random() * grassList.length)];
    textureLoader.load(url, (tex) => {
      tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = true;
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      const zDepth = -2 - Math.random() * 63;
      const scaleFactor = (zDepth > -15) ? (4.5 + Math.random() * 2.5) : (2.0 + Math.random() * 2.5);
      const grassMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.9 + Math.random() * 0.1, depthWrite: false });
      const grassSprite = new THREE.Sprite(grassMat);
      grassSprite.scale.set(scaleFactor, scaleFactor, 1);
      grassSprite.position.set((Math.random() - 0.5) * 110, -1.5 - (zDepth / 25), zDepth);
      grassGroup.add(grassSprite);
    });
  }
}
spawnFullGrassField();

// ==========================================
// 4. 多角色系統 (絕對綁定對齊、手部分離、文字格式修正)
// ==========================================
const allPlayerGroups = []; 
let allMembersData = {}; 
let tempCharUrl = ''; let tempHandUrl = '';

function updatePreviewUI() {
  document.getElementById('preview-avatar').style.display = tempCharUrl ? 'block' : 'none';
  if(tempCharUrl) document.getElementById('preview-avatar').src = tempCharUrl;
  document.getElementById('preview-placeholder').style.display = tempCharUrl ? 'none' : 'block';
  document.getElementById('preview-hand').style.display = tempHandUrl ? 'block' : 'none';
  if(tempHandUrl) document.getElementById('preview-hand').src = tempHandUrl;
}

function previewCharacter(url) { tempCharUrl = url; updatePreviewUI(); document.getElementById('hand-box').style.display = 'flex'; }
function previewHand(url) { tempHandUrl = url; updatePreviewUI(); }

function getBubbleText(sportType) { return `努力ㄉ${sportType || '運動'}！`; }
function getCountdownText(minsInput) {
  const diff = 3900 - (parseInt(minsInput) || 0);
  if (diff > 0) return `還要動…${diff}分鐘`;
  else if (diff === 0) return `剛好達成 3900 分鐘！`;
  else return `哇喔多動了${Math.abs(diff)}分鐘`;
}

function spawnOrUpdateCharacter(charUrl, handUrl, memberName = '成員', sportType = '健走', mins = '0', customX = 0, customY = 0, customZ = -10, scaleMultiplier = 1) {
  let existingGroup = allPlayerGroups.find(g => g.userData.name === memberName);
  const bubbleText = getBubbleText(sportType);
  const countdownText = getCountdownText(mins);

  if (existingGroup) {
    const bubbleLabel = existingGroup.getObjectByName('bubbleLabel');
    if (bubbleLabel) bubbleLabel.element.textContent = bubbleText;
    const countdownLabel = existingGroup.getObjectByName('countdownLabel');
    if (countdownLabel) countdownLabel.element.textContent = countdownText;
    return;
  }

  const adjustedY = customY - 2.0;
  const group = new THREE.Group();
  group.userData = { 
    name: memberName, baseX: customX, baseY: adjustedY, baseZ: customZ, 
    targetBaseY: -2.5, randomOffset: Math.random() * 100, isDragging: false, isDropping: false, scale: scaleMultiplier
  };
  scene.add(group);

  // 1. 名字標籤 (位於角色下方)
  const nameDiv = document.createElement('div'); nameDiv.className = 'player-name-tag'; nameDiv.textContent = memberName;
  const nameLabel = new THREE.CSS2DObject(nameDiv); nameLabel.name = 'nameLabel';
  nameLabel.position.set(0, -1.9 * scaleMultiplier, 0); 
  group.add(nameLabel);

  // 2. 倒數計時標籤 (位於名字正下方，絕對不重疊)
  const countdownDiv = document.createElement('div'); countdownDiv.className = 'player-countdown-tag'; countdownDiv.textContent = countdownText;
  const countdownLabel = new THREE.CSS2DObject(countdownDiv); countdownLabel.name = 'countdownLabel';
  countdownLabel.position.set(0, -2.7 * scaleMultiplier, 0); 
  group.add(countdownLabel);

  // 3. 頭頂對話泡泡 (完美置中於頭頂)
  const bubbleDiv = document.createElement('div'); bubbleDiv.className = 'player-speech-bubble'; bubbleDiv.textContent = bubbleText;
  const bubbleLabel = new THREE.CSS2DObject(bubbleDiv); bubbleLabel.name = 'bubbleLabel';
  bubbleLabel.position.set(0, 2.6 * scaleMultiplier, 0);
  group.add(bubbleLabel);

  textureLoader.load(charUrl, (tex) => {
    tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = true;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    const spriteMaterial = new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.1, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.name = 'bodySprite'; // 綁定名稱確保精準抓取
    const finalScale = 4 * scaleMultiplier;
    sprite.scale.set(finalScale, finalScale, 1);
    group.add(sprite);
  });

  if (handUrl) {
    textureLoader.load(handUrl, (tex) => {
      tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = true;
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      const handScale = 1.5 * scaleMultiplier * 0.7; 

      const leftHand = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.1, depthWrite: false }));
      leftHand.name = 'leftHand'; // 絕對綁定左手
      leftHand.scale.set(handScale, handScale, 1);
      leftHand.position.set(-2.2 * scaleMultiplier, 0, 0.1);
      group.add(leftHand);

      const rightHand = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.1, depthWrite: false }));
      rightHand.name = 'rightHand'; // 絕對綁定右手
      rightHand.scale.set(handScale, handScale, 1);
      rightHand.position.set(2.2 * scaleMultiplier, 0, 0.1);
      group.add(rightHand);
      group.userData.hasHands = true;
    });
  }
  allPlayerGroups.push(group);
}

// ==========================================
// 5. 滑鼠拖曳系統
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let draggedGroup = null; 
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 10); 
const planeIntersectPoint = new THREE.Vector3();
let isClickAction = true; 

window.addEventListener('mousedown', (event) => {
  if (event.target.closest('.main-container') || event.target.closest('.modal') || event.target.closest('.floating-btn')) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1; mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const sprites = [];
  allPlayerGroups.forEach(g => { const body = g.getObjectByName('bodySprite'); if (body) sprites.push(body); });
  const intersects = raycaster.intersectObjects(sprites);
  if (intersects.length > 0) {
    draggedGroup = intersects[0].object.parent; draggedGroup.userData.isDragging = true; draggedGroup.userData.isDropping = false;
    isClickAction = true; dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), draggedGroup.position);
  }
});
window.addEventListener('mousemove', (event) => {
  if (!draggedGroup) return;
  isClickAction = false; 
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1; mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera); raycaster.ray.intersectPlane(dragPlane, planeIntersectPoint);
  draggedGroup.userData.baseX = planeIntersectPoint.x; draggedGroup.userData.baseY = Math.max(-2.5, planeIntersectPoint.y); 
});
window.addEventListener('mouseup', () => {
  if (draggedGroup) {
    draggedGroup.userData.isDragging = false; draggedGroup.userData.targetBaseY = -2.5; draggedGroup.userData.isDropping = true;
    if (isClickAction) { const data = allMembersData[draggedGroup.userData.name]; if (data) showRecordModal(data); }
    draggedGroup = null;
  }
});

function showRecordModal(data) {
  const modal = document.getElementById('record-modal'); const title = document.getElementById('record-title'); const body = document.getElementById('record-body');
  title.innerText = `🏅 ${data.name} 的 2026 運動紀錄`;
  body.innerHTML = `<b>最近運動項目：</b> ${data.sportType || '無'}<br><b>最近運動時數：</b> ${data.mins || '0'} 分鐘<br><b>今日 Murmur：</b> ${data.murmur || '今天也是充滿活力的一天！'}<br><hr style="border:0; border-top:1px solid #eee; margin:10px 0;"><span style="font-size: 12px; color: #718096;">更新時間：${new Date(data.updatedAt).toLocaleString()}</span>`;
  modal.classList.remove('hidden');
}
window.closeRecordModal = function() { document.getElementById('record-modal').classList.add('hidden'); }

// ==========================================
// 6. UI、Firebase 與左至右排序漸變輪播
// ==========================================
const mainContent = document.getElementById('main-content');
const openPanelBtn = document.getElementById('open-panel-btn');
const closePanelBtn = document.getElementById('close-panel-btn');
const userSelect = document.getElementById('user-select');
const newNameBox = document.getElementById('new-name-box'); 
const newNameInput = document.getElementById('new-name');

openPanelBtn.onclick = () => { mainContent.classList.remove('hidden'); openPanelBtn.classList.add('hidden'); };
closePanelBtn.onclick = () => { mainContent.classList.add('hidden'); openPanelBtn.classList.remove('hidden'); };

window.openModal = function(type) {
  document.getElementById('modal-title').innerText = type === 'char' ? '選擇頭像' : '選擇裝備';
  const grid = document.getElementById('items-grid'); grid.innerHTML = ''; 
  const list = type === 'char' ? characterList : handList;
  list.forEach(url => {
    const img = document.createElement('img'); img.src = url; img.className = 'grid-item';
    img.onclick = () => { if(type === 'char') previewCharacter(url); if(type === 'hand') previewHand(url); window.closeModal(); };
    grid.appendChild(img);
  });
  document.getElementById('selector-modal').classList.remove('hidden');
}
window.closeModal = function() { document.getElementById('selector-modal').classList.add('hidden'); }

let murmurList = [];
let currentMurmurStartIndex = 0;

function renderMurmurCards() {
  const wrapper = document.getElementById('ticker-cards-wrapper');
  if (!wrapper) return; wrapper.innerHTML = '';
  if (murmurList.length === 0) { wrapper.innerHTML = '<div style="color:#2c5282; font-size:13px; font-weight:bold;">目前還沒有人留下碎碎念喔！</div>'; return; }

  const displayCount = Math.min(3, murmurList.length);
  for (let i = 0; i < displayCount; i++) {
    const itemIndex = (currentMurmurStartIndex + i) % murmurList.length;
    const item = murmurList[itemIndex];

    // 最左側的第一則 (i === 0) 視為當前焦點顯示彩色，其餘變淡
    const isActive = (i === 0);

    const card = document.createElement('div');
    card.className = `murmur-card ${isActive ? 'active' : 'inactive'}`;
    card.innerHTML = `
      <div class="murmur-header">
        <img class="murmur-avatar" src="${item.charUrl || './character/ani/ani_1.png'}" alt="頭像">
        <div class="murmur-user-info"><span class="murmur-username">${item.name}</span><span class="murmur-date">${item.dateStr}</span></div>
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
  setInterval(() => {
    if (murmurList.length > 3) {
      currentMurmurStartIndex = (currentMurmurStartIndex + 1) % murmurList.length;
      renderMurmurCards();
    }
  }, 6000); 
}

let isLoadedFromFirebase = false;
function loadAllMembersFromFirebase() {
  dbRef.on('value', (snapshot) => {
    userSelect.innerHTML = '<option value="">+ 新成員</option>';
    const data = snapshot.val() || {};
    allMembersData = data;

    if (!isLoadedFromFirebase) {
      allPlayerGroups.forEach(g => { scene.remove(g); g.children.forEach(child => { if (child instanceof THREE.CSS2DObject) child.element.remove(); }); });
      allPlayerGroups.length = 0;
    }

    // 將資料轉為陣列，並依照更新時間由新到舊排序 (最新的在最左側)
    const membersArray = Object.keys(data).map(key => ({ name: key, ...data[key] }));
    membersArray.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    murmurList = [];
    membersArray.forEach((member, index) => {
      const opt = document.createElement('option'); opt.value = member.name; opt.innerText = member.name; userSelect.appendChild(opt);

      if (member.murmur) {
        const dateObj = member.updatedAt ? new Date(member.updatedAt) : new Date();
        const dateStr = `${String(dateObj.getMonth()+1).padStart(2,'0')}/${String(dateObj.getDate()).padStart(2,'0')} ${String(dateObj.getHours()).padStart(2,'0')}:${String(dateObj.getMinutes()).padStart(2,'0')}`;
        murmurList.push({ name: member.name, murmur: member.murmur, charUrl: member.charUrl, dateStr: dateStr });
      }

      if (member.charUrl) {
        const spreadX = (index % 4 - 1.5) * 5.0 + (Math.random() - 0.5) * 1.5; const spreadY = (index % 3) * 1.2 - 1.0; const spreadZ = -8 - (index * 3); 
        const scaleFactor = Math.max(0.6, 1.2 - (index * 0.15)); 
        spawnOrUpdateCharacter(member.charUrl, member.handUrl, member.name, member.sportType, member.mins, spreadX, spreadY, spreadZ, scaleFactor);
      }
    });
    renderMurmurCards(); isLoadedFromFirebase = true;
  });
}

userSelect.onchange = (e) => {
  const selectedName = e.target.value;
  if (selectedName) {
    if (newNameBox) newNameBox.style.display = 'none';
    newNameInput.value = selectedName;
    dbRef.child(selectedName).once('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        if(val.mins) document.getElementById('mins').value = val.mins;
        if(val.sportType) document.getElementById('sport-type').value = val.sportType;
        if(val.murmur) document.getElementById('murmur-input').value = val.murmur;
        if(val.charUrl) previewCharacter(val.charUrl);
        if(val.handUrl) previewHand(val.handUrl);
      }
    });
  } else {
    if (newNameBox) newNameBox.style.display = 'flex';
    newNameInput.value = ''; tempCharUrl = ''; tempHandUrl = ''; document.getElementById('murmur-input').value = ''; updatePreviewUI();
  }
};

window.submitData = function() {
  const finalName = newNameInput.value.trim() || userSelect.value;
  const mins = document.getElementById('mins').value; const sportType = document.getElementById('sport-type').value; const murmur = document.getElementById('murmur-input').value.trim();
  if(!finalName) return alert("請輸入或選擇成員名字！");
  if(!tempCharUrl) return alert("請先挑選頭像！");

  dbRef.child(finalName).set({ name: finalName, mins: mins || '0', sportType: sportType, murmur: murmur || '今天也有好好運動！', charUrl: tempCharUrl, handUrl: tempHandUrl, updatedAt: Date.now() })
    .then(() => {
      spawnOrUpdateCharacter(tempCharUrl, tempHandUrl, finalName, sportType, mins || '0', (Math.random() - 0.5)*10, (Math.random() - 0.5)*1.5, -10 - Math.random()*6, 1.0);
      const submitBtn = document.getElementById('submit-btn'); submitBtn.style.background = '#2b6cb0'; submitBtn.innerText = '已送出！';
      setTimeout(() => { mainContent.classList.add('hidden'); openPanelBtn.classList.remove('hidden'); submitBtn.style.background = '#38a169'; submitBtn.innerText = '確認送出'; }, 1000);
    }).catch(e => alert("儲存失敗：" + e.message));
}

window.addEventListener('DOMContentLoaded', () => { loadAllMembersFromFirebase(); startMurmurTicker(); });

// ==========================================
// 7. 動畫迴圈 (JS負責 3D 動態，包含泡泡懸浮與手部防重疊綁定)
// ==========================================
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => { mouseX = (e.clientX / window.innerWidth) * 2 - 1; mouseY = -(e.clientY / window.innerHeight) * 2 + 1; });

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now(); 

  allPlayerGroups.forEach((group) => {
    const offset = group.userData.randomOffset || 0;
    const sc = group.userData.scale || 1.0;
    const baseX = group.userData.baseX || 0; let baseY = group.userData.baseY || 0; const baseZ = group.userData.baseZ || -10;

    if (group.userData.isDropping) {
      baseY += (group.userData.targetBaseY - baseY) * 0.1; group.userData.baseY = baseY;
      if (Math.abs(baseY - group.userData.targetBaseY) < 0.05) group.userData.isDropping = false;
    }

    let walkX = baseX; let bounceY = baseY;
    if (!group.userData.isDragging && !group.userData.isDropping) {
      walkX = baseX + Math.sin(time * 0.001 + offset) * 1.2;     
      bounceY = baseY + Math.abs(Math.sin(time * 0.004 + offset)) * 0.4; 
    }
    group.position.set(walkX, bounceY, baseZ);

    const body = group.getObjectByName('bodySprite');
    if (body) body.material.rotation = group.userData.isDragging ? 0 : Math.sin(time * 0.003 + offset) * 0.1;

    // 頭頂泡泡上下懸浮效果 (透過 3D Y軸)
    const bubble = group.getObjectByName('bubbleLabel');
    if (bubble) bubble.position.y = 2.6 * sc + Math.sin(time * 0.003 + offset) * 0.15;

    // 絕對綁定左右手，防重疊
    if (group.userData.hasHands) {
      const leftHand = group.getObjectByName('leftHand');
      const rightHand = group.getObjectByName('rightHand');
      const sway = Math.sin(time * 0.003 + offset); 
      const swayFast = Math.cos(time * 0.005 + offset);
      if(leftHand) { leftHand.position.set(-2.2 * sc, swayFast * 0.15, 0.1); leftHand.material.rotation = sway * 0.3; }
      if(rightHand) { rightHand.position.set(2.2 * sc, -swayFast * 0.15, 0.1); rightHand.material.rotation = -sway * 0.3; }
    }
  });

  camera.position.x += (mouseX * 6 - camera.position.x) * 0.03; camera.position.y += ((8 + mouseY * 2) - camera.position.y) * 0.03; camera.lookAt(0, 2, -10);
  renderer.render(scene, camera); labelRenderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight); labelRenderer.setSize(window.innerWidth, window.innerHeight);
});
