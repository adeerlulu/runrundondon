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
// 1. 圖庫資料設定
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

// ==========================================
// 2. 場景、霧氣、攝影機初始化
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
// 3. 地形與山脈
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
// 4. 多角色群組與獨立預覽管理
// ==========================================
const textureLoader = new THREE.TextureLoader();
const allPlayerGroups = []; 

let tempCharUrl = '';
let tempHandUrl = '';

// 更新面板中的獨立預覽區
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

// 在草地上生成角色（加入 X、Y、Z 軸差異，讓位置與高度錯開，絕不重疊）
function spawnCharacter(charUrl, handUrl, customX = 0, customY = 0, customZ = -10) {
  const group = new THREE.Group();
  group.userData = { 
    baseX: customX, 
    baseY: customY, 
    baseZ: customZ, 
    randomOffset: Math.random() * 100 
  };
  scene.add(group);

  textureLoader.load(charUrl, (tex) => {
    tex.magFilter = THREE.NearestFilter;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ 
      map: tex, transparent: true, alphaTest: 0.1, depthWrite: false 
    }));
    sprite.scale.set(4, 4, 1);
    group.add(sprite);
  });

  if (handUrl) {
    textureLoader.load(handUrl, (tex) => {
      tex.magFilter = THREE.NearestFilter;
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;

      const leftHand = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.1, depthWrite: false }));
      leftHand.scale.set(1.5, 1.5, 1);
      leftHand.position.set(-2.5, 0, 0.1);
      group.add(leftHand);

      const rightHand = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.1, depthWrite: false }));
      rightHand.scale.set(1.5, 1.5, 1);
      rightHand.position.set(2.5, 0, 0.1);
      group.add(rightHand);
      
      group.userData.hasHands = true;
    });
  }

  allPlayerGroups.push(group);
}

// ==========================================
// 5. UI 與 Firebase 資料讀寫
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

// 從 Firebase 載入所有成員，並在草地上自由錯開位置（包含 X 與 Y 軸高低差）
let isLoadedFromFirebase = false;
function loadAllMembersFromFirebase() {
  dbRef.on('value', (snapshot) => {
    userSelect.innerHTML = '<option value="">+ 新成員</option>';
    const data = snapshot.val();
    
    if (!isLoadedFromFirebase) {
      allPlayerGroups.forEach(g => scene.remove(g));
      allPlayerGroups.length = 0;
    }

    if (data) {
      const names = Object.keys(data);
      names.forEach((name, index) => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.innerText = name;
        userSelect.appendChild(opt);

        if (!isLoadedFromFirebase && data[name].charUrl) {
          // 利用數學公式讓每個人在 X 軸散開、Y 軸高低錯開、Z 軸前後錯開，達成完全不重疊且位置自由
          const spreadX = (index % 5 - 2) * 4.5 + (Math.random() - 0.5) * 2; 
          const spreadY = (index % 3) * 0.8 - 0.5; // Y 軸高低錯開
          const spreadZ = -10 - (Math.floor(index / 5) * 4); // 遠近錯開
          
          spawnCharacter(data[name].charUrl, data[name].handUrl, spreadX, spreadY, spreadZ);
        }
      });
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
        if (val.charUrl) previewCharacter(val.charUrl);
        if (val.handUrl) previewHand(val.handUrl);
      }
    });
  } else {
    newNameInput.value = '';
    tempCharUrl = '';
    tempHandUrl = '';
    updatePreviewUI();
  }
};

window.submitData = function() {
  const nameInput = newNameInput.value.trim();
  const selectUser = userSelect.value;
  const finalName = nameInput || selectUser;
  const mins = document.getElementById('mins').value;
  const sportType = document.getElementById('sport-type').value;

  if(!finalName) { alert("請輸入或選擇成員名字！"); return; }
  if(!tempCharUrl) { alert("請先挑選頭像！"); return; }

  const memberData = {
    name: finalName,
    mins: mins || '0',
    sportType: sportType,
    charUrl: tempCharUrl,
    handUrl: tempHandUrl,
    updatedAt: Date.now()
  };

  dbRef.child(finalName).set(memberData)
    .then(() => {
      // 送出後在畫面上隨機錯開位置新增
      const newX = (Math.random() - 0.5) * 10;
      const newY = (Math.random() - 0.5) * 1.5;
      const newZ = -10 - Math.random() * 5;
      spawnCharacter(tempCharUrl, tempHandUrl, newX, newY, newZ);

      alert(`成功儲存！${finalName} 已加入草地散步陣容。`);
      mainContent.classList.add('hidden');
      openPanelBtn.classList.remove('hidden');
    })
    .catch((error) => { alert("儲存失敗：" + error.message); });
}

window.addEventListener('DOMContentLoaded', () => {
  loadAllMembersFromFirebase();
});

// ==========================================
// 6. 動畫迴圈 (獨立帶有 Y 軸高低差與自由漫步)
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

    // 自由漫步與 Y 軸高低浮動
    const walkX = baseX + Math.sin(time * 0.001 + offset) * 1.8;     
    const bounceY = baseY + Math.abs(Math.sin(time * 0.004 + offset)) * 0.6; 
    const rotateZ = Math.sin(time * 0.003 + offset) * 0.1; 

    group.position.set(walkX, bounceY, baseZ);

    const sprite = group.children[0];
    if (sprite) sprite.material.rotation = rotateZ;

    if (group.userData.hasHands && group.children.length >= 3) {
      const leftHand = group.children[1];
      const rightHand = group.children[2];
      const sway = Math.sin(time * 0.003 + offset); 
      const swayFast = Math.cos(time * 0.005 + offset);

      leftHand.position.set(-2.5, swayFast * 0.2, 0.1);
      leftHand.material.rotation = sway * 0.3;
      rightHand.position.set(2.5, -swayFast * 0.2, 0.1);
      rightHand.material.rotation = -sway * 0.3;
    }
  });

  // 地形前進
  const pPos = pGeo.attributes.position;
  for (let i = 0; i < pPos.count; i++) {
    const x = pPos.getX(i), y = pPos.getY(i);
    const yOff = y + time * 0.018;
    pPos.setZ(i, Math.sin(x*0.04)*Math.cos(yOff*0.04)*3 + Math.sin(x*0.08)*Math.sin(yOff*0.02)*1.5 + Math.pow(Math.abs(x)/(tWidth/2),2)*5 - 2);
  }
  pPos.needsUpdate = true; pGeo.computeVertexNormals(); 

  // 視角晃動
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
