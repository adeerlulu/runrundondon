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

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const dbRef = firebase.database().ref('2026_records'); // 獨立的 2026 資料夾，不影響舊資料

// ==========================================
// 1. 圖庫資料設定 (已指向正確的 PNG 角色與手勢)
// ==========================================
const characterList = [
  './character/ani/ani_1.png'
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
// 3. 地形與山脈 (噪點安全版)
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
// 4. 角色與手勢系統 (已完美解決透明黑塊問題)
// ==========================================
const playerGroup = new THREE.Group();
playerGroup.position.set(0, 0, -10); 
scene.add(playerGroup);

let charSprite = null;
let leftHand = null;
let rightHand = null;
const textureLoader = new THREE.TextureLoader();

let currentCharUrl = '';
let currentHandUrl = '';

function loadCharacter(url) {
  currentCharUrl = url;
  if (charSprite) playerGroup.remove(charSprite);
  
  textureLoader.load(url, (tex) => {
    tex.magFilter = THREE.NearestFilter;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    
    charSprite = new THREE.Sprite(new THREE.SpriteMaterial({ 
      map: tex, 
      transparent: true, 
      alphaTest: 0.1,
      depthWrite: false 
    }));
    charSprite.scale.set(4, 4, 1);
    playerGroup.add(charSprite);
  });

  document.getElementById('hand-box').style.display = 'flex'; 
}

function loadHand(url) {
  currentHandUrl = url;
  if (leftHand) playerGroup.remove(leftHand);
  if (rightHand) playerGroup.remove(rightHand);

  textureLoader.load(url, (tex) => {
    tex.magFilter = THREE.NearestFilter;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;

    leftHand = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.1, depthWrite: false }));
    leftHand.scale.set(1.5, 1.5, 1);

    rightHand = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.1, depthWrite: false }));
    rightHand.scale.set(1.5, 1.5, 1);

    playerGroup.add(leftHand);
    playerGroup.add(rightHand);
  });
}

// ==========================================
// 5. UI 與 Firebase 資料讀寫
// ==========================================
const mainContent = document.getElementById('main-content');
const openPanelBtn = document.getElementById('open-panel-btn');
const closePanelBtn = document.getElementById('close-panel-btn');
const userSelect = document.getElementById('user-select');
const newNameInput = document.getElementById('new-name');

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

// 從 Firebase 載入已有成員列表到下拉選單
function loadMembersFromFirebase() {
  dbRef.on('value', (snapshot) => {
    userSelect.innerHTML = '<option value="">+ 新成員</option>';
    const data = snapshot.val();
    if (data) {
      Object.keys(data).forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.innerText = name;
        userSelect.appendChild(opt);
      });
    }
  });
}

// 當下拉選單切換時，自動帶入該成員上次的設定與角色
userSelect.onchange = (e) => {
  const selectedName = e.target.value;
  if (selectedName) {
    newNameInput.value = selectedName;
    dbRef.child(selectedName).once('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        if (val.mins) document.getElementById('mins').value = val.mins;
        if (val.sportType) document.getElementById('sport-type').value = val.sportType;
        if (val.charUrl) loadCharacter(val.charUrl);
        if (val.handUrl) loadHand(val.handUrl);
      }
    });
  } else {
    newNameInput.value = '';
  }
};

// 點擊確認送出：將資料寫入 Firebase 2026 專屬路徑
window.submitData = function() {
  const nameInput = newNameInput.value.trim();
  const selectUser = userSelect.value;
  const finalName = nameInput || selectUser;
  const mins = document.getElementById('mins').value;
  const sportType = document.getElementById('sport-type').value;

  if(!finalName) {
    alert("請輸入或選擇成員名字！");
    return;
  }
  if(!charSprite) {
    alert("請先選擇一位角色！");
    return;
  }

  const memberData = {
    name: finalName,
    mins: mins || '0',
    sportType: sportType,
    charUrl: currentCharUrl,
    handUrl: currentHandUrl,
    updatedAt: Date.now()
  };

  dbRef.child(finalName).set(memberData)
    .then(() => {
      alert(`成功儲存！${finalName} 的 2026 今日工事已更新至資料庫。`);
      mainContent.classList.add('hidden');
      openPanelBtn.classList.remove('hidden');
    })
    .catch((error) => {
      alert("儲存失敗：" + error.message);
    });
}

// 網頁載入時抓取成員清單
window.addEventListener('DOMContentLoaded', () => {
  loadMembersFromFirebase();
});

// ==========================================
// 6. 動畫與滑鼠互動
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
