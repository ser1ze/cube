import * as THREE from "three";
import { OrbitControls } from "OrbitControls";

document.addEventListener("DOMContentLoaded", function () {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x141414);

  const numCubes = 8;
  const cubeWidth = 330;
  const angleStep = (2 * Math.PI) / numCubes;

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
  );
  camera.position.set(0, 180, 1400);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  renderer.domElement.style.display = "block";
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0";
  renderer.domElement.style.left = "0";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 2000);
  pointLight1.position.set(500, 500, 500);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 2000);
  pointLight2.position.set(-500, -500, -500);
  scene.add(pointLight2);

  const textureLoader = new THREE.TextureLoader();

  function mirrorTexture(texture) {
    if (!texture.image) return;
    const canvas = document.createElement("canvas");
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;
    const context = canvas.getContext("2d");
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(texture.image, 0, 0);
    texture.image = canvas;
    texture.needsUpdate = true;
  }

  function loadTexture(path) {
    return new Promise((resolve, reject) => {
      textureLoader.load(path, resolve, undefined, reject);
    });
  }

  const frontTexturePaths = [
    "./img/busines.png",
    "./img/call.png",
    "./img/government.png",
    "./img/journalists.png",
    "./img/jurisprudence.png",
    "./img/medicine.png",
    "./img/students.png",
    "./img/translaters.png",
  ];

  const backTexturePaths = [
    "./img/busines.png",
    "./img/call.png",
    "./img/government.png",
    "./img/journalists.png",
    "./img/jurisprudence.png",
    "./img/medicine.png",
    "./img/students.png",
    "./img/translaters.png",
  ];

  Promise.all([
    ...frontTexturePaths.map(loadTexture),
    ...backTexturePaths.map(loadTexture),
  ])
    .then((loadedTextures) => {
      const frontTextures = loadedTextures.slice(0, frontTexturePaths.length);
      const backTextures = loadedTextures.slice(frontTexturePaths.length);
      backTextures.forEach((texture) => mirrorTexture(texture));
      createCubes(frontTextures, backTextures);
    })
    .catch((error) => {
      console.error("Ошибка загрузки текстур:", error);
    });

  const semiTransparentMaterial = new THREE.MeshStandardMaterial({
    color: 0xb4b4b4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
    roughness: 0.3,
    metalness: 0.3,
  });

  const cubesGroup = new THREE.Group();
  scene.add(cubesGroup);

  const chordLength = cubeWidth - 10;
  const octagonRadius = chordLength / (2 * Math.sin(Math.PI / numCubes));

  const width = cubeWidth;
  const height = 210;
  let depth = 9;
  const radius = 5;
  const segments = 32;

  function RoundedBoxFlat(w, h, d, r, s) {
    const pi2 = Math.PI * 2;
    const n = (s + 1) * 4;
    let indices = [];
    let positions = [];
    let uvs = [];

    makeFronts(n, 1, 0);
    makeFronts(n, -1, n + 1);
    makeFrame(n, 2 * n + 2, 1, n + 2);

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(positions), 3)
    );
    geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(uvs), 2)
    );
    const vtc = n * 3;
    geometry.addGroup(0, vtc, 4);
    geometry.addGroup(vtc, vtc, 5);
    geometry.addGroup(2 * vtc, 2 * vtc + 3, 0);
    geometry.computeVertexNormals();
    return geometry;

    function makeFronts(n, side, idx) {
      const d0 = side === 1 ? 0 : 1;
      const d1 = side === 1 ? 1 : 0;
      for (let j = 1; j < n; j++) {
        indices.push(idx, idx + d0 + j, idx + d1 + j);
      }
      const d2 = side === 1 ? n : 1;
      const d3 = side === 1 ? 1 : n;
      indices.push(idx, idx + d2, idx + d3);
      positions.push(0, 0, (side * d) / 2);
      uvs.push(0.5, 0.5);
      for (let j = 0; j < n; j++) {
        const qu = Math.trunc((4 * j) / n) + 1;
        const sgn = qu === 1 || qu === 4 ? 1 : -1;
        const c = {
          x: sgn * (w / 2 - r),
          y: (qu < 3 ? 1 : -1) * (h / 2 - r),
          z: (side * d) / 2,
        };
        const x = c.x + r * Math.cos((pi2 * (j - qu + 1)) / (n - 4));
        const y = c.y + r * Math.sin((pi2 * (j - qu + 1)) / (n - 4));
        const z = c.z;
        positions.push(x, y, z);
        const u0 = side === 1 ? 0 : 1;
        uvs.push(u0 + side * (0.5 + x / w), 0.5 + y / h);
      }
    }

    function makeFrame(n, sidx, sif, sib) {
      let a, b, c, d;
      const pif = sif * 3;
      const pib = sib * 3;
      let idx = sidx;
      let st = [];
      for (let j = 0; j < n; j++) {
        a = idx;
        b = idx + 1;
        c = idx + 2;
        d = idx + 3;
        indices.push(a, b, d, a, d, c);
        idx += 2;
      }
      for (let j = 0; j < n; j++) {
        const j3 = j * 3;
        const xf = positions[pif + j3];
        const yf = positions[pif + j3 + 1];
        const zf = positions[pif + j3 + 2];
        const xb = positions[pib + j3];
        const yb = positions[pib + j3 + 1];
        const zb = positions[pib + j3 + 2];
        positions.push(xf, yf, zf, xb, yb, zb);
        if (j === 0) st = [xf, yf, zf, xb, yb, zb];
        const v = j / n;
        uvs.push(0, v, 1, v);
      }
      positions.push(st[0], st[1], st[2], st[3], st[4], st[5]);
      uvs.push(0, 1, 1, 1);
    }
  }

  function createCubes(frontTextures, backTextures) {
    if (frontTextures.length !== backTextures.length) {
      console.error("Количество передних и задних текстур не совпадает!");
      return;
    }
    const cubeMaterialsArray = [];
    for (let i = 0; i < numCubes; i++) {
      const frontMaterial = new THREE.MeshStandardMaterial({
        map: frontTextures[i],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: 1,
      });
      const backMaterial = new THREE.MeshStandardMaterial({
        map: backTextures[i],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
      const materials = [
        semiTransparentMaterial,
        semiTransparentMaterial,
        semiTransparentMaterial,
        semiTransparentMaterial,
        frontMaterial,
        backMaterial,
      ];
      cubeMaterialsArray.push(materials);
    }
    for (let i = 0; i < numCubes; i++) {
      const geometry = RoundedBoxFlat(width, height, depth, radius, segments);
      const cube = new THREE.Mesh(geometry, cubeMaterialsArray[i]);
      const angle = i * angleStep;
      const x = octagonRadius * Math.cos(angle);
      const z = octagonRadius * Math.sin(angle);
      cube.position.set(x, 0, z);
      cube.lookAt(0, 0, 0);
      cubesGroup.add(cube);
    }
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.03;
  controls.enablePan = false;
  controls.enableZoom = true;
  const dist = Math.sqrt(
    camera.position.x ** 2 + camera.position.y ** 2 + camera.position.z ** 2
  );
  const polar = Math.acos(camera.position.y / dist);
  controls.minDistance = dist;
  controls.maxDistance = dist;
  controls.minPolarAngle = polar;
  controls.maxPolarAngle = polar;

  let rotationAngle = 0;
  let isDragging = false;
  let previousX;
  let rotationDirection = 1;
  const rotationSpeed = 0.06;
  const maxSpeed = 4.3 * 1.5 * 1.2;
  const increasedMaxSpeed = maxSpeed * 1.5 * 0.9;
  const speedFactor = 1.2;
  const threshold = 1;
  let currentScale = 1;
  let targetScale = 1;

  function onMouseDown(e) {
    if (e.button === 0) {
      isDragging = true;
      previousX = e.clientX;
      e.preventDefault();
      targetScale = 0.95;
    }
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const diff = e.clientX - previousX;
    if (Math.abs(diff) > threshold) {
      const newDirection = diff > 0 ? 1 : -1;
      if (newDirection !== rotationDirection) {
        rotationDirection = newDirection;
      }
      let speed = diff * (360 / numCubes) * (speedFactor / 200);
      speed = Math.min(Math.max(speed, -increasedMaxSpeed), increasedMaxSpeed);
      rotationAngle += speed;
      rotationAngle = normalizeAngle(rotationAngle);
      cubesGroup.rotation.y = THREE.MathUtils.degToRad(rotationAngle);
      previousX = e.clientX;
      updateSlideStyles();
    }
  }

  function onMouseUpOrLeave() {
    isDragging = false;
    targetScale = 1;
  }

  function normalizeAngle(angle) {
    return ((angle % 360) + 360) % 360;
  }

  function animate() {
    requestAnimationFrame(animate);
    rotationAngle += rotationSpeed * rotationDirection;
    rotationAngle = normalizeAngle(rotationAngle);
    cubesGroup.rotation.y = THREE.MathUtils.degToRad(rotationAngle);
    currentScale += (targetScale - currentScale) * 0.1;
    cubesGroup.scale.set(currentScale, currentScale, currentScale);
    updateSlideStyles();
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  function updateSlideStyles() {
    const step = 360 / numCubes;
    const centerAngle = normalizeAngle(rotationAngle);
    for (let i = 0; i < numCubes; i++) {
      const angle = normalizeAngle(i * step + centerAngle);
      const angleDiff =
        Math.abs(angle) > 180 ? 360 - Math.abs(angle) : Math.abs(angle);
      const cuboid = cubesGroup.children[i];
      if (!cuboid) continue;
      const frontMaterial = cuboid.material[4];
      if (frontMaterial) {
        frontMaterial.opacity = Math.max(0.9 - angleDiff / 180, 0.4);
        frontMaterial.needsUpdate = true;
      }
    }
  }

  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUpOrLeave);
  document.addEventListener("mouseleave", onMouseUpOrLeave);

  renderer.domElement.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      onMouseDown({
        button: 0,
        clientX: e.touches[0].clientX,
        preventDefault: () => {},
      });
    }
  });
  renderer.domElement.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1) {
      onMouseMove({ clientX: e.touches[0].clientX });
    }
  });
  renderer.domElement.addEventListener("touchend", onMouseUpOrLeave);
});
