import * as THREE from "three";
import { OrbitControls } from "OrbitControls";

document.addEventListener("DOMContentLoaded", () => {
  const scene = new THREE.Scene();
  scene.background = null;
  const numCubes = 8;
  const cubeWidth = 336;
  const height = 210;
  const depth = 3;
  const radius = 6;
  const segments = 32;
  const angleStep = (2 * Math.PI) / numCubes;
  const chordLength = cubeWidth - 20;
  const octagonRadius =
    (chordLength / (2 * Math.sin(Math.PI / numCubes))) * 1.05;

  const camera = new THREE.PerspectiveCamera(
    13,
    window.innerWidth / window.innerHeight,
    1,
    4000
  );
  camera.position.set(0, 0, 1950);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  const container = document.getElementById("threejs-slider");
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = "flex";
  renderer.domElement.style.position = "relative";
  renderer.domElement.style.margin = "0 auto";
  renderer.domElement.style.maxWidth = "805px";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "310px";
  renderer.domElement.style.background = "transparent";
  renderer.setPixelRatio(window.devicePixelRatio);

  function resizeRenderer() {
    const cw = 705;
    const ch = 310;
    renderer.setSize(cw, ch, false);
    camera.aspect = cw / ch;
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
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(texture.image, 0, 0);
    texture.image = canvas;
    texture.needsUpdate = true;
  }

  function loadTexture(path) {
    return new Promise((resolve, reject) => {
      textureLoader.load(path, resolve, undefined, reject);
    });
  }

  const frontPaths = [
    "./img/busines.png",
    "./img/government.png",
    "./img/medicine.png",
    "./img/translaters.png",
    "./img/jurisprudence.png",
    "./img/journalists.png",
    "./img/call.png",
    "./img/students.png",
  ];

  const backPaths = [
    "./img/busines.png",
    "./img/government.png",
    "./img/medicine.png",
    "./img/translaters.png",
    "./img/jurisprudence.png",
    "./img/journalists.png",
    "./img/call.png",
    "./img/students.png",
  ];

  let cumulativeRotation = 0;

  Promise.all([...frontPaths.map(loadTexture), ...backPaths.map(loadTexture)])
    .then((textures) => {
      const front = textures.slice(0, frontPaths.length);
      const back = textures.slice(frontPaths.length);
      back.forEach(mirrorTexture);
      makeCubes(front, back);
      goToSlide(0);
      cumulativeRotation = -90;
    })
    .catch((error) => {
      console.error("Error loading textures:", error);
    });

  const group = new THREE.Group();
  group.position.set(0, 260, 0);
  scene.add(group);

  function RoundedBoxFlat(w, h, d, r, s) {
    const pi2 = Math.PI * 2;
    const n = (s + 1) * 4;
    const indices = [];
    const positions = [];
    const uvs = [];
    makeFront(n, 1, 0);
    makeFront(n, -1, n + 1);
    makeFrame(n, 2 * n + 2, 1, n + 2);
    const geom = new THREE.BufferGeometry();
    geom.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geom.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(positions), 3)
    );
    geom.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(uvs), 2)
    );
    const vtc = n * 3;
    geom.addGroup(0, vtc, 4);
    geom.addGroup(vtc, vtc, 5);
    geom.addGroup(2 * vtc, 2 * vtc + 3, 0);
    geom.computeVertexNormals();
    return geom;

    function makeFront(n, side, idx) {
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
        positions.push(x, y, c.z);
        const u0 = side === 1 ? 0 : 1;
        uvs.push(u0 + side * (0.5 + x / w), 0.5 + y / h);
      }
    }

    function makeFrame(n, sidx, sif, sib) {
      let idx = sidx;
      let st = [];
      for (let j = 0; j < n; j++) {
        const a = idx;
        const b = idx + 1;
        const c = idx + 2;
        const d = idx + 3;
        indices.push(a, b, d, a, d, c);
        idx += 2;
      }
      const pif = sif * 3;
      const pib = sib * 3;
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

  const semiMat = new THREE.MeshPhysicalMaterial({
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

  function makeCubes(frontTextures, backTextures) {
    if (frontTextures.length !== backTextures.length) return;
    for (let i = 0; i < numCubes; i++) {
      const frontMat = new THREE.MeshStandardMaterial({
        map: frontTextures[i],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: 1,
      });
      const backMat = new THREE.MeshStandardMaterial({
        map: backTextures[i],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
      const geometry = RoundedBoxFlat(
        cubeWidth,
        height,
        depth,
        radius,
        segments
      );
      const mesh = new THREE.Mesh(geometry, [
        semiMat,
        semiMat,
        semiMat,
        semiMat,
        frontMat,
        backMat,
      ]);
      mesh.userData.index = i;
      const angle = i * angleStep;
      const x = octagonRadius * Math.cos(angle);
      const z = octagonRadius * Math.sin(angle);
      mesh.position.set(x, 0, z);
      mesh.lookAt(0, 0, 0);
      group.add(mesh);
    }
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.target.set(0, 200, 0);
  controls.enableZoom = false;
  controls.minPolarAngle = Math.PI / 2.25;
  controls.maxPolarAngle = Math.PI / 2.25;
  controls.enableRotate = false;

  let autoRotationSpeed = 0.06;
  let rotationVelocity = 0;
  const maxSpeed = 4.3 * 1.5 * 1.2;
  const friction = 0.89;
  let rotationDirection = 1;
  const rotationThreshold = 5;
  let moveAccumulator = 0;
  let didDrag = false;
  let isDragging = false;
  let previousX;
  let isAnimatingToTarget = false;
  let transitionStartTime = 0;
  let transitionDuration = 300;
  let startRotationAngle = 0;
  let endRotationAngle = 0;
  const btns = [];
  const texts = [];
  for (let i = 1; i <= numCubes; i++) {
    btns.push(document.getElementById("btn" + i));
    texts.push(document.getElementById("text" + i));
  }

  texts.forEach((block) => {
    block.addEventListener("animationend", (e) => {
      if (e.animationName === "slideLeft") {
        block.style.display = "none";
        block.style.opacity = "1";
      }
    });
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function normalizeAngle(a) {
    return ((a % 360) + 360) % 360;
  }

  function getShortestAngleDiff(from, to) {
    const nf = normalizeAngle(from);
    const nt = normalizeAngle(to);
    return ((nt - nf + 540) % 360) - 180;
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function goToSlide(index) {
    texts.forEach((block, i) => {
      if (i !== index) {
        if (block.classList.contains("slide-in")) {
          block.classList.remove("slide-in");
          block.classList.add("slide-left");
          block.style.opacity = "0.5";
        }
      }
    });
    const el = texts[index];
    el.classList.remove("slide-left");
    el.classList.add("slide-in");
    el.style.display = "block";
    const currentDeg = cumulativeRotation;
    const step = 360 / numCubes;
    const offset = -90;
    const desired = offset - step * index;
    const diff = getShortestAngleDiff(currentDeg, desired);
    rotationDirection = diff >= 0 ? 1 : -1;
    endRotationAngle = currentDeg + diff;
    startRotationAngle = currentDeg;
    transitionStartTime = performance.now();
    isAnimatingToTarget = true;
    btns.forEach((b) => b.classList.remove("active"));
    btns[index].classList.add("active");
  }

  btns.forEach((b, i) => {
    b.addEventListener("click", () => goToSlide(i));
  });

  function updateSlideStyles() {
    const step = 360 / numCubes;
    const deg = cumulativeRotation;
    group.children.forEach((cube) => {
      const idx = cube.userData.index;
      const cubeAngle = normalizeAngle(idx * step + deg);
      const aDiff =
        Math.abs(cubeAngle) > 180
          ? 360 - Math.abs(cubeAngle)
          : Math.abs(cubeAngle);
      const front = cube.material[4];
      if (front) {
        front.opacity = Math.max(0.9 - aDiff / 180, 0.4);
        front.needsUpdate = true;
      }
    });
  }

  let scaleFrom = 1;
  let scaleToValue = 1;
  let scaleStartTime = 0;
  let scaleDuration = 200;
  let isScaling = false;

  function animateScale(to) {
    scaleFrom = group.scale.x;
    scaleToValue = to;
    scaleStartTime = performance.now();
    isScaling = true;
  }

  function onMouseDown(e) {
    if (e.button === 0) {
      isDragging = true;
      previousX = e.clientX;
      moveAccumulator = 0;
      didDrag = false;
      e.preventDefault();
      animateScale(0.97);
    }
  }

  function onMouseMove(e) {
    if (!isDragging) return;

    const diff = e.clientX - previousX;
    const absDiff = Math.abs(diff);
    const velocityFactor = Math.min(absDiff / 20, 2);

    moveAccumulator += absDiff;

    if (moveAccumulator >= rotationThreshold) {
      const newDirection = diff > 0 ? 1 : -1;
      rotationDirection = newDirection;
      const dragSpeedFactor = 0.1 * velocityFactor;
      rotationVelocity += absDiff * dragSpeedFactor * rotationDirection;
      rotationVelocity = Math.min(
        Math.max(rotationVelocity, -maxSpeed),
        maxSpeed
      );
      moveAccumulator = 0;
      previousX = e.clientX;
      didDrag = true;
    }
  }
  function onMouseUpOrLeave() {
    isDragging = false;
    animateScale(1);
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

  function onClick(event) {
    if (didDrag) {
      didDrag = false;
      return;
    }
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(group.children, false);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const index = clickedObject.userData.index;
      if (typeof index !== "undefined") {
        const targetIndex = index === 0 ? 0 : numCubes - index;
        goToSlide(targetIndex);
      }
    }
  }

  renderer.domElement.addEventListener("click", onClick, false);

  let lastPressedButton = null;
  const fastClickDelay = 200;

  function onMouseDownOnSlide(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(group.children, false);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const index = clickedObject.userData.index;

      if (typeof index !== "undefined") {
        const targetIndex = index === 0 ? 0 : numCubes - index;
        btns.forEach((btn) => {
          btn.classList.remove("pressed");
          btn.classList.remove("fast-click");
        });
        const targetButton = btns[targetIndex];
        targetButton.classList.add("pressed");
        targetButton.classList.add("fast-click");
        setTimeout(() => {
          targetButton.classList.remove("fast-click");
        }, fastClickDelay);
        lastPressedButton = targetButton;
      }
    }
  }

  function onMouseUpFromSlide() {
    if (lastPressedButton) {
      lastPressedButton.classList.remove("pressed");
      lastPressedButton = null;
    }
  }

  renderer.domElement.addEventListener("mousedown", onMouseDownOnSlide, false);
  renderer.domElement.addEventListener("mouseup", onMouseUpFromSlide, false);
  renderer.domElement.addEventListener("mouseleave", onMouseUpFromSlide, false);

  function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();

    if (isAnimatingToTarget) {
      const elapsed = now - transitionStartTime;
      const t = Math.min(elapsed / transitionDuration, 1);
      const eased = easeInOutQuad(t);
      const totalDiff = endRotationAngle - startRotationAngle;
      const newDeg = startRotationAngle + totalDiff * eased;
      group.rotation.y = THREE.MathUtils.degToRad(newDeg);
      cumulativeRotation = newDeg;
      if (t >= 1) {
        isAnimatingToTarget = false;
      }
    } else {
      const deltaRotation =
        autoRotationSpeed * rotationDirection + rotationVelocity;
      group.rotation.y += THREE.MathUtils.degToRad(deltaRotation);
      cumulativeRotation += deltaRotation;
      rotationVelocity *= friction;
      if (Math.abs(rotationVelocity) < 0.0001) rotationVelocity = 0;
    }

    if (isScaling) {
      const elapsed = now - scaleStartTime;
      const t = Math.min(elapsed / scaleDuration, 1);
      const eased = easeInOutQuad(t);
      const scaleNow = scaleFrom + (scaleToValue - scaleFrom) * eased;
      group.scale.set(scaleNow, scaleNow, scaleNow);
      if (t >= 1) {
        isScaling = false;
      }
    }

    updateSlideStyles();
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
});
