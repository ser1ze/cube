import * as THREE from "three";
import { OrbitControls } from "OrbitControls";

document.addEventListener("DOMContentLoaded", function () {
  const scene = new THREE.Scene();
  scene.background = null;

  const numCubes = 8;
  const cubeWidth = 336;
  const height = 210;
  const depth = 3;
  const radius = 6;
  const segments = 32;

  const angleStep = (2 * Math.PI) / numCubes;
  const chordLength = cubeWidth - 10;
  const octagonRadius = chordLength / (2 * Math.sin(Math.PI / numCubes));

  const fov = 40;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 1;
  const far = 2000;

  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 150, 800);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);

  const sliderContainer = document.getElementById("threejs-slider");
  sliderContainer.appendChild(renderer.domElement);

  renderer.domElement.style.display = "flex";
  renderer.domElement.style.position = "relative";
  renderer.domElement.style.margin = "0 auto";
  renderer.domElement.style.maxWidth = "805px";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "310px";
  renderer.domElement.style.background = "transparent";
  renderer.setPixelRatio(window.devicePixelRatio);

  function resizeRenderer() {
    const canvasWidth = 705;
    const canvasHeight = 310;
    renderer.setSize(canvasWidth, canvasHeight, false);
    camera.aspect = canvasWidth / canvasHeight;
    camera.updateProjectionMatrix();
  }

  resizeRenderer();
  window.addEventListener("resize", resizeRenderer);

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

  const cubesGroup = new THREE.Group();
  cubesGroup.position.set(0, 230, 0);

  scene.add(cubesGroup);

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
      const geometry = RoundedBoxFlat(
        cubeWidth,
        height,
        depth,
        radius,
        segments
      );
      const cube = new THREE.Mesh(geometry, cubeMaterialsArray[i]);

      cube.userData.index = i;

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
  controls.target.set(0, 150, 0);
  controls.enableZoom = false;
  controls.minPolarAngle = Math.PI / 2.25;
  controls.maxPolarAngle = Math.PI / 2.25;

  let rotationAngle = 0;
  let isDragging = false;
  let previousX;
  let rotationDirection = 1;
  const rotationSpeed = 0.06;
  const maxSpeed = 4.3 * 1.5 * 1.2;
  const increasedMaxSpeed = maxSpeed * 1.5 * 0.9;
  const speedFactor = 1.2;
  const threshold = 1;
  let targetScale = 1;
  let currentScale = 1;

  const buttons = [];
  const textBlocks = [];
  for (let i = 1; i <= numCubes; i++) {
    buttons.push(document.getElementById("btn" + i));
    textBlocks.push(document.getElementById("text" + i));
  }

  const semiTransparentMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xfefefe,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
    roughness: 0.2,
    metalness: 0.5,
    reflectivity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.5,
  });

  function normalizeAngle(angle) {
    return ((angle % 360) + 360) % 360;
  }

  function getShortestAngleDiff(fromAngle, toAngle) {
    const normalizedFrom = normalizeAngle(fromAngle);
    const normalizedTo = normalizeAngle(toAngle);

    const diff = ((normalizedTo - normalizedFrom + 540) % 360) - 180;
    return diff;
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  let isAnimatingToTarget = false;
  let transitionStartTime = 0;
  const transitionDuration = 500;
  let startRotationAngle = 0;
  let endRotationAngle = 0;

  function handleButtonClick(index) {
    textBlocks.forEach((block, i) => {
      if (i === index) {
        block.style.display = "block";
        block.classList.add("slide-in");
        block.classList.remove("slide-left");
      } else {
        block.style.display = "none";
        block.classList.remove("slide-in");
        block.classList.add("slide-left");
      }
    });

    buttons.forEach((btn) => btn.classList.remove("active"));
    buttons[index].classList.add("active");

    const step = 360 / numCubes;
    const offset = -90;
    const targetAngle = offset - step * index;

    const angleDiff = getShortestAngleDiff(rotationAngle, targetAngle);
    endRotationAngle = rotationAngle + angleDiff;

    endRotationAngle = normalizeAngle(endRotationAngle);

    startRotationAngle = rotationAngle;
    transitionStartTime = performance.now();
    isAnimatingToTarget = true;
  }

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      handleButtonClick(index);
    });
  });

  function updateSlideStyles() {
    const step = 360 / numCubes;
    const centerAngle = normalizeAngle(rotationAngle);

    cubesGroup.children.forEach((cube) => {
      const cubeIndex = cube.userData.index;
      const cubeAngle = normalizeAngle(cubeIndex * step + centerAngle);
      const angleDiff =
        Math.abs(cubeAngle) > 180
          ? 360 - Math.abs(cubeAngle)
          : Math.abs(cubeAngle);
      const frontMaterial = cube.material[4];
      if (frontMaterial) {
        frontMaterial.opacity = Math.max(0.9 - angleDiff / 180, 0.4);
        frontMaterial.needsUpdate = true;
      }
    });
  }

  function onMouseDown(e) {
    if (e.button === 0) {
      isDragging = true;
      previousX = e.clientX;
      e.preventDefault();
      targetScale = 0.95;
      isAnimatingToTarget = false;
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

  renderer.domElement.addEventListener("mousedown", onMouseDown);
  renderer.domElement.addEventListener("mousemove", onMouseMove);
  renderer.domElement.addEventListener("mouseup", onMouseUpOrLeave);
  renderer.domElement.addEventListener("mouseleave", onMouseUpOrLeave);

  renderer.domElement.addEventListener("touchstart", (e) => {
    if (e.target === renderer.domElement && e.touches.length === 1) {
      onMouseDown({
        button: 0,
        clientX: e.touches[0].clientX,
        preventDefault: () => {},
      });
    }
  });

  renderer.domElement.addEventListener("touchmove", (e) => {
    if (e.target === renderer.domElement && e.touches.length === 1) {
      onMouseMove({ clientX: e.touches[0].clientX });
    }
  });

  renderer.domElement.addEventListener("touchend", (e) => {
    if (e.target === renderer.domElement) {
      onMouseUpOrLeave();
    }
  });

  function animate() {
    requestAnimationFrame(animate);

    const currentTime = performance.now();

    if (isAnimatingToTarget) {
      const elapsed = currentTime - transitionStartTime;
      const t = Math.min(elapsed / transitionDuration, 1);
      const easedT = easeInOutQuad(t);
      rotationAngle =
        startRotationAngle + (endRotationAngle - startRotationAngle) * easedT;
      rotationAngle = normalizeAngle(rotationAngle);
      cubesGroup.rotation.y = THREE.MathUtils.degToRad(rotationAngle);
      updateSlideStyles();

      if (t === 1) {
        isAnimatingToTarget = false;
      }
    } else {
      rotationAngle += rotationSpeed * rotationDirection;
      rotationAngle = normalizeAngle(rotationAngle);
      cubesGroup.rotation.y = THREE.MathUtils.degToRad(rotationAngle);
      updateSlideStyles();
    }

    currentScale += (targetScale - currentScale) * 0.1;
    cubesGroup.scale.set(currentScale, currentScale, currentScale);

    controls.update();
    renderer.render(scene, camera);
  }
  animate();
});
