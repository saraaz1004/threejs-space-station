import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

//inicijalizacija scene, kamere i renderera
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100000);
camera.position.set(0, 600, 2400);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.style.margin = '0';
document.body.appendChild(renderer.domElement);

//kontrole
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 300;
controls.maxDistance = 30000;

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

//osvetljenje
scene.add(new THREE.AmbientLight(0xffffff, 0.35));

const sun = new THREE.DirectionalLight(0xfff3dd, 1.9);
sun.position.set(800, 700, 500);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 50;
sun.shadow.camera.far = 8000;
sun.shadow.camera.left = -1800;
sun.shadow.camera.right = 1800;
sun.shadow.camera.top = 1800;
sun.shadow.camera.bottom = -1800;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x88aaff, 1.0);
fill.position.set(-900, -250, -500);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.7);
rim.position.set(0, 350, -900);
scene.add(rim);

//spotlight
const spot = new THREE.SpotLight(0xffffff, 18, 0, Math.PI * 0.23, 0.35, 1);
spot.position.set(950, 650, 950);
spot.castShadow = true;
spot.shadow.mapSize.set(2048, 2048);
spot.shadow.radius = 14;
spot.shadow.camera.near = 50;
spot.shadow.camera.far = 9000;

spot.target.position.set(0, 0, 0);
scene.add(spot);
scene.add(spot.target);

//skybox model -glt
const gltfLoader = new GLTFLoader();
let skyboxMesh = null;

gltfLoader.load(
  '/models/realistic_galaxy_skybox.glb',
  (gltf) => {
    const sky = gltf.scene;
    sky.scale.setScalar(20000);

    sky.traverse((obj) => {
      if (obj.isMesh) {
        obj.material.side = THREE.BackSide;
        obj.material.depthWrite = false;
      }
    });

    scene.add(sky);
    skyboxMesh = sky;
  },
  undefined,
  (err) => console.error('Skybox load error:', err)
);

//texture loader
const loader = new THREE.TextureLoader();
const loadTex = (name) => {
  const t = loader.load('/textures/' + name);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const texMain = loadTex('station_main.jpg');
const texLab = loadTex('lab_panel.jpg');
const texHab = loadTex('hab_panel.jpg');
const texSolar = loadTex('solar_panel.jpg');
const texAntenna = loadTex('antenna_metal.jpg');
const texRobot = loadTex('robot_arm.jpg');

//svemirska stanica
const station = new THREE.Group();
scene.add(station);

//moduli
const mainModule = new THREE.Mesh(
  new THREE.CylinderGeometry(200, 200, 350, 32),
  new THREE.MeshStandardMaterial({
    map: texMain,
    metalness: 0.9,
    roughness: 0.38,
    emissive: new THREE.Color(0x101018),
    emissiveIntensity: 0.35
  })
);
mainModule.position.set(0, 0, 0);
mainModule.name = 'Centralni modul';
station.add(mainModule);

const labModule = new THREE.Mesh(
  new THREE.BoxGeometry(260, 120, 260),
  new THREE.MeshStandardMaterial({
    map: texLab,
    metalness: 0.75,
    roughness: 0.45
  })
);
labModule.position.set(650, 0, 0);
labModule.name = 'Laboratorijski modul';
station.add(labModule);

const habModule = new THREE.Mesh(
  new THREE.CapsuleGeometry(120, 380, 10, 20),
  new THREE.MeshStandardMaterial({
    map: texHab,
    metalness: 0.7,
    roughness: 0.55
  })
);
habModule.position.set(-650, 0, 0);
habModule.name = 'Stambeni modul';
station.add(habModule);

//solarni paneli
const solarPanels = [];

function addSolar(z, name) {
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(380, 8, 160),
    new THREE.MeshStandardMaterial({
      map: texSolar,
      metalness: 0.9,
      roughness: 0.23,
      emissive: new THREE.Color(0x070a14),
      emissiveIntensity: 0.25
    })
  );
  panel.position.z = z;
  panel.name = name;

  const holder = new THREE.Group();
  holder.add(panel);
  station.add(holder);

  solarPanels.push({ holder, panel, speed: 0.35 });
}

addSolar(520, 'Solarni panel A');
addSolar(-520, 'Solarni panel B');

//antena
const antenna = new THREE.Mesh(
  new THREE.CylinderGeometry(10, 10, 200, 16),
  new THREE.MeshStandardMaterial({
    map: texAntenna,
    metalness: 0.95,
    roughness: 0.2
  })
);
antenna.position.set(0, 120, 620);
antenna.name = 'Antena';
station.add(antenna);

//robot ruka
const robotArm = new THREE.Mesh(
  new THREE.BoxGeometry(40, 200, 40),
  new THREE.MeshStandardMaterial({
    map: texRobot,
    metalness: 0.85,
    roughness: 0.35
  })
);
robotArm.position.set(0, -180, -520);
robotArm.name = 'Robot ruka';
station.add(robotArm);

//shadow flags
station.traverse((o) => {
  if (o.isMesh) {
    o.castShadow = true;
    o.receiveShadow = true;
  }
});

//info panel
const info = document.createElement('div');
Object.assign(info.style, {
  position: 'absolute',
  top: '18px',
  left: '18px',
  padding: '18px 20px',
  background: 'rgba(15,15,20,0.85)',
  color: '#fff',
  borderRadius: '14px',
  font: '18px/1.45 system-ui',
  maxWidth: '520px',
  userSelect: 'none'
});
document.body.appendChild(info);

const DESCR = {
  'Centralni modul': 'Glavno jezgro svemirske stanice.',
  'Laboratorijski modul': 'Modul za naučne eksperimente u mikrogravitaciji.',
  'Stambeni modul': 'Životni prostor posade.',
  'Solarni panel A': 'Primarni izvor energije (rotira se).',
  'Solarni panel B': 'Sekundarni izvor energije (rotira se).',
  'Antena': 'Komunikacija sa Zemljom / satelitima.',
  'Robot ruka': 'Manipulator za popravke i pomeranje tereta.'
};

function showControls(extraHtml = '') {
  info.innerHTML = `${extraHtml}
  <hr style="border:0;border-top:1px solid rgba(255,255,255,0.15);margin:12px 0;">
  <b>Kontrole</b><br>
  • Klik na objekat: info<br>
  • <b>T</b>: sledeća tačka ture<br>
  • <b>C</b>: auto-tour ON/OFF<br>
  • <b>Esc</b>: stop tour`;
}

showControls('<b>Info</b><br>Klikni na objekat ili pokreni turu (T/C).');

//interakcija
const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clickable = [
  mainModule,
  labModule,
  habModule,
  antenna,
  robotArm,
  ...solarPanels.map((p) => p.panel)
];

let selected = null;

function clearSelection() {
  if (selected?.material?.emissive) selected.material.emissive.set(0x000000);
  selected = null;
}

addEventListener('pointerdown', (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;

  ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObjects(clickable, true)[0];

  if (!hit) {
    clearSelection();
    showControls('<b>Info</b><br>Klikni na neki objekat.');
    return;
  }

  clearSelection();
  selected = hit.object;

  if (selected.material?.emissive) selected.material.emissive.set(0x222244);

  const name = selected.name || 'Objekat';
  const desc = DESCR[name] || 'Nema opisa.';
  showControls(`<b>${name}</b><br>${desc}`);
});

//camera tour
const tourPoints = [
  { pos: new THREE.Vector3(0, 650, 2200),    target: new THREE.Vector3(0, 0, 0),          label: 'Pogled na celu stanicu' },
  { pos: new THREE.Vector3(1200, 280, 150),  target: labModule.position.clone(),          label: 'Laboratorijski modul' },
  { pos: new THREE.Vector3(-1200, 280, 150), target: habModule.position.clone(),          label: 'Stambeni modul' },
  { pos: new THREE.Vector3(0, 260, 850),     target: mainModule.position.clone(),         label: 'Centralni modul' },
  { pos: new THREE.Vector3(0, 120, -950),    target: robotArm.position.clone(),           label: 'Robot ruka' }
];

let tourIndex = 0;
let touring = false;
let autoTour = false;

let tourProgress = 0; // 0..1
const tourFromPos = new THREE.Vector3();
const tourFromTarget = new THREE.Vector3();
const tourToPos = new THREE.Vector3();
const tourToTarget = new THREE.Vector3();
let tourLabel = '';

let tourPause = false;
let tourPauseTime = 0;

let TOUR_SPEED = 0.45;         
let TOUR_PAUSE_DURATION = 1.8;  // sekunde pauze

function startTourTo(index) {
  const p = tourPoints[index];

  touring = true;
  tourPause = false;
  tourPauseTime = 0;

  tourProgress = 0;

  tourFromPos.copy(camera.position);
  tourFromTarget.copy(controls.target);

  tourToPos.copy(p.pos);
  tourToTarget.copy(p.target);

  tourLabel = p.label;
  showControls(`<b>Camera tour</b><br>${tourLabel}`);
}

function stopTour() {
  touring = false;
  autoTour = false;
  tourPause = false;
}


addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();

  if (k === 't') {
    startTourTo(tourIndex);
    tourIndex = (tourIndex + 1) % tourPoints.length;
  }

  if (k === 'c') {
    autoTour = !autoTour;

    if (autoTour && !touring && !tourPause) {
      startTourTo(tourIndex);
      tourIndex = (tourIndex + 1) % tourPoints.length;
    } else if (!autoTour) {
      showControls('<b>Auto-tour</b><br>Isključen.');
    }
  }

  if (e.key === 'Escape') {
    stopTour();
    clearSelection();
    showControls('<b>Tour</b><br>Zaustavljen.');
  }
});



//animacija
let prev = performance.now();

function animate() {
  const now = performance.now();
  const dt = (now - prev) / 1000;
  prev = now;

  station.rotation.y += dt * 0.1;
  solarPanels.forEach((p) => (p.holder.rotation.y += dt * p.speed));
  antenna.rotation.y += dt * 0.4;

  if (skyboxMesh) skyboxMesh.position.copy(camera.position);

  // camera tour 
  if (touring) {
    tourProgress += dt * TOUR_SPEED;
    const a = Math.min(tourProgress, 1);

    camera.position.lerpVectors(tourFromPos, tourToPos, a);
    controls.target.lerpVectors(tourFromTarget, tourToTarget, a);

    if (a >= 1) {
      touring = false;
      tourPause = true;
      tourPauseTime = 0;
    }
  }

  if (tourPause) {
    tourPauseTime += dt;
    if (tourPauseTime >= TOUR_PAUSE_DURATION) {
      tourPause = false;
      if (autoTour) {
        startTourTo(tourIndex);
        tourIndex = (tourIndex + 1) % tourPoints.length;
      }
    }
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
