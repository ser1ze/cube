import * as THREE from "three";
import { OrbitControls } from "OrbitControls";
import { RoundedBoxGeometry } from "https://unpkg.com/three@0.138.0/examples/jsm/geometries/RoundedBoxGeometry.js";

document.addEventListener("DOMContentLoaded", function () {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x141414);

  const numCubes = 8;
  const desiredSpacing = 10;
  const cubeWidth = 356;
  const angleStep = (2 * Math.PI) / numCubes;

  const chordLength = cubeWidth + desiredSpacing;
  const octagonRadius = chordLength / (2 * Math.sin(Math.PI / numCubes));

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
  );
  camera.position.set(0, 190, octagonRadius * 2.5);

  const polarAngle = Math.acos(
    camera.position.y /
      Math.sqrt(
        camera.position.x * camera.position.x +
          camera.position.y * camera.position.y +
          camera.position.z * camera.position.z
      )
  );

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
    if (!texture.image) {
      return;
    }

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
      textureLoader.load(
        path,
        (texture) => {
          resolve(texture);
        },
        undefined,
        (err) => {
          reject(err);
        }
      );
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
    opacity: 0.2,
  });

  function createBoxGeometry(d) {
    const geo = new RoundedBoxGeometry(width, height, d, segments, radius);
    return geo;
  }

  const cubesGroup = new THREE.Group();
  scene.add(cubesGroup);

  const width = cubeWidth;
  const height = 210;
  let depth = 10;
  const radius = 5;
  const segments = 32;

  function createCubes(frontTextures, backTextures) {
    if (frontTextures.length !== backTextures.length) {
      console.error("Количество передних и задних текстур не совпадает!");
      return;
    }

    const cubeMaterialsArray = [];

    for (let i = 0; i < numCubes; i++) {
      const materials = [
        semiTransparentMaterial,
        semiTransparentMaterial,
        semiTransparentMaterial,
        semiTransparentMaterial,
        new THREE.MeshStandardMaterial({
          map: frontTextures[i],
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        }),
        new THREE.MeshStandardMaterial({
          map: backTextures[i],
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        }),
      ];

      cubeMaterialsArray.push(materials);
    }

    for (let i = 0; i < numCubes; i++) {
      const geometry = createBoxGeometry(depth);
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
  controls.dampingFactor = 0.06;

  controls.minPolarAngle = polarAngle;
  controls.maxPolarAngle = polarAngle;

  controls.minDistance = octagonRadius * 1;
  controls.maxDistance = octagonRadius * 3;

  controls.enablePan = false;
  controls.enableZoom = true;

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    slideWidth = window.innerWidth;
  });

  let rotationAngle = 0;
  const rotationSpeed = 0.06;
  let isDragging = false;
  let previousX;
  let slideWidth = window.innerWidth;
  let rotationDirection = 1;
  const delay = 120;

  let isUserInteracting = false;

  function normalizeAngle(angle) {
    return ((angle % 360) + 360) % 360;
  }

  function getShortestAngleDiff(fromAngle, toAngle) {
    const normalizedFrom = normalizeAngle(fromAngle);
    const normalizedTo = normalizeAngle(toAngle);
    const diff = ((normalizedTo - normalizedFrom + 540) % 360) - 180;
    return diff;
  }

  function nav(d) {
    rotationAngle += (360 / numCubes) * d;
    cubesGroup.rotation.y = THREE.MathUtils.degToRad(rotationAngle);
  }

  function handleClick(index) {
    const targetAngle = (360 / numCubes) * index;
    const angleDiff = getShortestAngleDiff(rotationAngle, targetAngle);

    if (Math.abs(angleDiff) > 0.1) {
      rotationDirection = angleDiff > 0 ? 1 : -1;
      rotationAngle += angleDiff;

      rotationAngle = normalizeAngle(rotationAngle);

      cubesGroup.rotation.y = THREE.MathUtils.degToRad(rotationAngle);

      buttons.forEach((btn) => btn.classList.remove("active"));
      buttons[index].classList.add("active");

      applyFastClick(buttons[index]);
    }
  }

  function applyFastClick(button) {
    if (!button) {
      return;
    }

    button.classList.add("fast-click");
    setTimeout(() => {
      button.classList.remove("fast-click");
    }, delay);
  }

  const onMouseDown = (e) => {
    if (e.button === 0) {
      isDragging = true;
      isUserInteracting = true;
      previousX = e.clientX;
      e.preventDefault();
    }
  };

  const onMouseMove = (e) => {
    if (isDragging) {
      const diff = e.clientX - previousX;
      const threshold = 1;

      if (Math.abs(diff) > threshold) {
        const newDirection = diff > 0 ? 1 : -1;
        rotationDirection = newDirection;
        console.log(`Dragging. diff: ${diff}, newDirection: ${newDirection}`);

        rotationAngle += rotationSpeed * rotationDirection;

        rotationAngle = normalizeAngle(rotationAngle);

        cubesGroup.rotation.y = THREE.MathUtils.degToRad(rotationAngle);

        previousX = e.clientX;

        updateSlideStyles();
      }
    }
  };

  const onMouseUpOrLeave = () => {
    isDragging = false;
    setTimeout(() => {
      isUserInteracting = false;
    }, 1000);
  };

  function updateSlideStyles() {
    const all = numCubes;
    const step = 360 / all;

    const centerAngle = normalizeAngle(rotationAngle);

    for (let i = 0; i < all; i++) {
      const angle = normalizeAngle(i * step + centerAngle);
      const angleDiff =
        Math.abs(angle) > 180 ? 360 - Math.abs(angle) : Math.abs(angle);

      const cuboid = cubesGroup.children[i];
      const frontMaterial = cuboid.material[4];
      if (frontMaterial) {
        frontMaterial.opacity = Math.max(0.9 - angleDiff / 180, 0.4);
        frontMaterial.needsUpdate = true;
      }
    }
  }

  function animate() {
    requestAnimationFrame(animate);

    if (!isUserInteracting) {
      rotationAngle += rotationSpeed * rotationDirection;
    }

    rotationAngle = normalizeAngle(rotationAngle);
    cubesGroup.rotation.y = THREE.MathUtils.degToRad(rotationAngle);

    updateSlideStyles();

    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUpOrLeave);
  document.addEventListener("mouseleave", onMouseUpOrLeave);

  renderer.domElement.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      onMouseDown(e.touches[0]);
    }
  });

  renderer.domElement.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1) {
      onMouseMove(e.touches[0]);
    }
  });

  renderer.domElement.addEventListener("touchend", onMouseUpOrLeave);
});
