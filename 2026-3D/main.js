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
// 1. 圖庫資料設定 (支援多頭像與手勢)
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
// 4. 多角色群組管理系統 (避免重疊)
// ==========================================
const textureLoader = new THREE.TextureLoader();
const allPlayerGroups = []; // 存放畫面上所有的角色群組

let tempCharUrl = './character/ani/ani_1.png'; // 預設頭像
let tempHandUrl = '';

// 暫時預覽當前選中的頭像或手勢（在面板中操作時用）
function previewCharacter(url) {
  tempCharUrl = url;
  document.getElementById('hand-box').style.display = 'flex'; 
}

function previewHand(url) {
  tempHandUrl = url;
}

// 建立並新增一個角色到畫面上（透過傳入 x 軸偏移量來避免重疊）
function spawnCharacter(charUrl, handUrl, customX = 0) {
  const group = new THREE.Group();
  // 讓不同角色有不同的基礎 X 軸位置，防止重疊
  group.userData = { baseX: customX, randomOffset: Math.random() * 100 };
  scene.add(group);

  // 載入角色本體
  textureLoader.load(charUrl, (tex) => {
    tex.magFilter = THREE.NearestFilter;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ 
      map: tex, transparent: true, alphaTest: 0.1, depthWrite: false 
    }));
    sprite.scale.set(4, 4, 1);
    group.add(sprite);
  });

  // 如果有選擇手勢，則載入雙手
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
  modalTitle.innerText = type === 'char' ? '選擇角色' : '選擇裝備';
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

// 從 Firebase 載入所有歷史成員，並自動在畫面上展開不重疊的角色
let isLoadedFromFirebase = false;
function loadAllMembersFromFirebase() {
  dbRef.on('value', (snapshot) => {
    userSelect.innerHTML = '<option value="">+ 新成員</option>';
    const data = snapshot.val();
    
    // 如果還沒載入過，先清空畫面上預設的角色群組
    if (!isLoadedFromFirebase) {
      allPlayerGroups.forEach(g => scene.remove(g));
      allPlayerGroups.length = 0;
    }

    if (data) {
      const names = Object.keys(data);
      names.forEach((name, index) => {
        // 下拉選單加入選項
        const opt = document.createElement('option');
        opt.value = name;
        opt.innerText = name;
        userSelect.appendChild(opt);

        // 如果是剛進網頁，把資料庫裡的所有成員依照順序散開排列在畫面上 (防重疊)
        if (!isLoadedFromFirebase && data[name].charUrl) {
          // 透過 index 計算不同的 X 軸位置 (例如: -6, -2, 2, 6...)
          const spreadX = (index - (names.length - 1) / 2) * 4.5;
          spawnCharacter(data[name].charUrl, data[name].handUrl, spreadX);
        }
      });
      isLoadedFromFirebase = true;
    }
  });
}

// 切換下拉選單時填入資料
userSelect.onchange = (e) => {
  const selectedName = e.target.value;
  if (selectedName) {
    newNameInput.value = selectedName;
    dbRef.child(selectedName).once('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        if (val.mins) document.getElementById('mins').value = val.mins;
        if (val.sportType) document.getElementById('sport-type').value = val.sportType;
        if (val.charUrl) tempCharUrl = val.charUrl;
        if (val.handUrl) tempHandUrl = val.handUrl;
      }
    });
  } else {
    newNameInput.value = '';
  }
};

// 確認送出：儲存並在畫面上新增一隻專屬角色（自動錯開位置）
window.submitData = function() {
  const nameInput = newNameInput.value.trim();
  const selectUser = userSelect.value;
  const finalName = nameInput || selectUser;
  const mins = document.getElementById('mins').value;
  const sportType = document.getElementById('sport-type').value;

  if(!finalName) { alert("請輸入或選擇成員名字！"); return; }

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
      // 算出一個新的不重疊位置並直接在畫面上生成
      const newX = (allPlayerGroups.length * 4) - 2;
      spawnCharacter(tempCharUrl, tempHandUrl, newX);

      alert(`成功儲存！${finalName} 已加入 2026 跑跑動動陣容。`);
      mainContent.classList.add('hidden');
      openPanelBtn.classList.remove('hidden');
    })
    .catch((error) => { alert("儲存失敗：" + error.message); });
}

window.addEventListener('DOMContentLoaded', () => {
  loadAllMembersFromFirebase();
});

// ==========================================
// 6. 動畫迴圈 (讓所有角色各自走動、彈跳、手部擺動)
// ==========================================
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now(); 

  // 讓畫面上所有的角色各自獨立進行晃動與散步
  allPlayerGroups.forEach((group, idx) => {
    const offset = group.userData.randomOffset || 0;
    const baseX = group.userData.baseX || 0;

    // 每個角色有微微不同的移動頻率，看起來更生動自然
    const walkX = baseX + Math.sin(time * 0.001 + offset) * 1.5;     
    const bounceY = Math.abs(Math.sin(time * 0.004 + offset)) * 0.6; 
    const rotateZ = Math.sin(time * 0.003 + offset) * 0.1; 

    group.position.set(walkX, bounceY, -10);

    // 角色本體旋轉
    const sprite = group.children[0];
    if (sprite) sprite.material.rotation = rotateZ;

    // 如果有左右手，讓手勢跟著呼吸擺動
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
