/**
 * AAVIN MAIN DAIRY EXPLORER
 * Interactive 3D Tamil Nadu Map Engine (Three.js WebGL)
 * 
 * Features:
 * - Extruded 3D Tamil Nadu geographic terrain with bevels & soft shadows
 * - Real-time glowing beacon markers for all 22 verified main dairies
 * - Facility-type color coding (No BMCs or booths permitted)
 * - Animated radar wave rings on the surface
 * - Smooth camera navigation & raycasted interactive cards
 * - Auto-rotation, district focus presets, and responsive performance throttling
 */

window.AAVIN_3D_MAP = {
  container: null,
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  mapMesh: null,
  beaconGroup: null,
  radarRings: [],
  dairies: [],
  activeDairyId: null,
  raycaster: null,
  mouse: null,
  hoveredPin: null,
  isAutoRotating: true,
  animationFrameId: null,

  // Geographical Center of Tamil Nadu for 3D coordinate projection
  CENTER_LAT: 10.85,
  CENTER_LNG: 78.50,
  GEO_SCALE: 16.0,

  // Facility Color Mapping
  FACILITY_COLORS: {
    MAIN_DAIRY: { hex: 0x0284c7, css: '#0284c7', name: 'Main Dairy' },
    FEEDER_BALANCING_DAIRY: { hex: 0x059669, css: '#059669', name: 'Feeder Balancing' },
    DAIRY_PLANT: { hex: 0xd97706, css: '#d97706', name: 'Dairy Plant' },
    PROCESSING_UNIT: { hex: 0x7c3aed, css: '#7c3aed', name: 'Processing Unit' },
    SPECIALISED_DAIRY_PLANT: { hex: 0xdb2777, css: '#db2777', name: 'Specialised / Ice Cream' }
  },

  // Authoritative boundary vertices of Tamil Nadu
  TN_BOUNDARY: [
    [13.45, 80.20], [13.25, 80.30], [13.08, 80.27], [12.60, 80.19],
    [12.20, 79.95], [11.50, 79.75], [10.76, 79.84], [10.30, 79.85],
    [10.15, 79.35], [9.95, 79.05],  [9.28, 79.30],  [8.80, 78.15],
    [8.48, 78.12],  [8.08, 77.55],  [8.25, 77.25],  [8.98, 77.20],
    [9.45, 77.40],  [10.00, 77.30], [10.35, 76.95], [10.95, 76.90],
    [11.50, 76.50], [11.60, 76.70], [11.85, 77.10], [12.15, 77.75],
    [12.75, 77.80], [12.85, 78.70], [13.10, 79.60], [13.40, 80.10],
    [13.45, 80.20]
  ],

  init(containerId, dairiesData) {
    this.container = document.getElementById(containerId);
    if (!this.container || typeof THREE === 'undefined') {
      console.warn('Three.js or map container not found.');
      return;
    }

    this.dairies = dairiesData || [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupScene();
    this.setupLights();
    this.createTamilNaduTerrain();
    this.createGridFloor();
    this.plotDairyBeacons();
    this.setupEventListeners();
    this.animate();
  },

  setupScene() {
    const width = this.container.clientWidth || (this.container.parentElement ? this.container.parentElement.clientWidth : 0) || 1200;
    const height = this.container.clientHeight || (this.container.parentElement ? this.container.parentElement.clientHeight : 0) || 680;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf1f5f9);
    this.scene.fog = new THREE.FogExp2(0xf1f5f9, 0.015);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    this.camera.position.set(0, 32, 42);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.maxPolarAngle = Math.PI / 2.15;
      this.controls.minDistance = 12;
      this.controls.maxDistance = 65;
      this.controls.target.set(0, 0, 0);

      this.controls.addEventListener('start', () => {
        this.isAutoRotating = false;
      });
    }
  },

  setupLights() {
    // Ambient soft fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Sun directional with soft shadows
    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    sunLight.position.set(25, 45, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Cool sky backlight
    const skyLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    skyLight.position.set(-20, 20, -30);
    this.scene.add(skyLight);

    // Subtle emerald rim light
    const rimLight = new THREE.PointLight(0x10b981, 0.8, 50);
    rimLight.position.set(0, 10, 0);
    this.scene.add(rimLight);
  },

  latLngTo3D(lat, lng, yOffset = 0) {
    const x = (lng - this.CENTER_LNG) * this.GEO_SCALE;
    const z = -(lat - this.CENTER_LAT) * this.GEO_SCALE;
    return new THREE.Vector3(x, yOffset, z);
  },

  createTamilNaduTerrain() {
    const shape = new THREE.Shape();

    this.TN_BOUNDARY.forEach((pt, idx) => {
      const pos = this.latLngTo3D(pt[0], pt[1]);
      if (idx === 0) shape.moveTo(pos.x, -pos.z);
      else shape.lineTo(pos.x, -pos.z);
    });

    const extrudeSettings = {
      steps: 1,
      depth: 1.4,
      bevelEnabled: true,
      bevelThickness: 0.25,
      bevelSize: 0.25,
      bevelOffset: 0,
      bevelSegments: 4
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(Math.PI / 2);

    // Layered premium physical material with emerald top
    const material = new THREE.MeshStandardMaterial({
      color: 0x052e16,
      roughness: 0.4,
      metalness: 0.15,
      flatShading: false
    });

    this.mapMesh = new THREE.Mesh(geometry, material);
    this.mapMesh.position.y = 0;
    this.mapMesh.receiveShadow = true;
    this.mapMesh.castShadow = true;
    this.scene.add(this.mapMesh);

    // Illuminated edge contour lines
    const edgeGeo = new THREE.EdgesGeometry(geometry, 25);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x34d399, linewidth: 1.5, transparent: true, opacity: 0.5 });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    this.mapMesh.add(edgeLines);
  },

  createGridFloor() {
    // Subtle circular grid base
    const gridHelper = new THREE.GridHelper(80, 40, 0x10b981, 0xcfd8dc);
    gridHelper.position.y = -1.6;
    gridHelper.material.opacity = 0.35;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Soft drop shadow catcher plane
    const planeGeo = new THREE.PlaneGeometry(120, 120);
    const planeMat = new THREE.ShadowMaterial({ opacity: 0.12 });
    const shadowPlane = new THREE.Mesh(planeGeo, planeMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.61;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);
  },

  plotDairyBeacons() {
    if (this.beaconGroup) {
      this.scene.remove(this.beaconGroup);
    }

    this.beaconGroup = new THREE.Group();
    this.radarRings = [];

    const pinStemGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8);
    const pinHeadGeo = new THREE.SphereGeometry(0.48, 16, 16);
    const ringGeo = new THREE.RingGeometry(0.3, 0.6, 24);
    ringGeo.rotateX(-Math.PI / 2);

    this.dairies.forEach((dairy) => {
      if (!dairy.latitude || !dairy.longitude) return;

      const pos = this.latLngTo3D(dairy.latitude, dairy.longitude, 1.4);
      const conf = this.FACILITY_COLORS[dairy.facility_type] || { hex: 0x0284c7, css: '#0284c7' };

      const beaconObj = new THREE.Group();
      beaconObj.position.copy(pos);
      beaconObj.userData = { dairy, originalY: pos.y, colorHex: conf.hex };

      // Glowing Pin Head
      const headMat = new THREE.MeshStandardMaterial({
        color: conf.hex,
        emissive: conf.hex,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.3
      });
      const pinHead = new THREE.Mesh(pinHeadGeo, headMat);
      pinHead.position.y = 2.2;
      pinHead.castShadow = true;
      beaconObj.add(pinHead);

      // Pin Stem (White/Metal)
      const stemMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 });
      const pinStem = new THREE.Mesh(pinStemGeo, stemMat);
      pinStem.position.y = 1.1;
      beaconObj.add(pinStem);

      // Radar Ground Wave Ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: conf.hex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.02;
      beaconObj.add(ring);

      this.radarRings.push({
        mesh: ring,
        baseScale: 1.0,
        speed: 0.015 + Math.random() * 0.01,
        maxScale: 3.5
      });

      this.beaconGroup.add(beaconObj);
    });

    this.scene.add(this.beaconGroup);
  },

  setupEventListeners() {
    const canvas = this.renderer.domElement;

    // Hover Raycasting
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.checkHover(e.clientX, e.clientY);
    });

    // Click Selection
    canvas.addEventListener('pointerdown', (e) => {
      this.onCanvasClick();
    });

    // Window Resize
    window.addEventListener('resize', () => {
      if (!this.container || !this.camera || !this.renderer) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  },

  checkHover(clientX, clientY) {
    if (!this.beaconGroup) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.beaconGroup.children, true);

    const tooltip = document.getElementById('mapHoverTooltip');

    if (intersects.length > 0) {
      let root = intersects[0].object;
      while (root.parent && root.parent !== this.beaconGroup) {
        root = root.parent;
      }

      if (root.userData && root.userData.dairy) {
        if (this.hoveredPin && this.hoveredPin !== root) {
          this.unhighlightPin(this.hoveredPin);
        }

        this.hoveredPin = root;
        this.highlightPin(root);

        this.renderer.domElement.style.cursor = 'pointer';

        if (tooltip) {
          const d = root.userData.dairy;
          tooltip.innerHTML = `<strong>${d.name}</strong><br><span style="font-size:11px;opacity:0.8;">📍 ${d.district} • ${d.facility_type.replace(/_/g, ' ')}</span>`;
          tooltip.style.left = `${clientX}px`;
          tooltip.style.top = `${clientY}px`;
          tooltip.classList.add('active');
        }
        return;
      }
    }

    if (this.hoveredPin) {
      this.unhighlightPin(this.hoveredPin);
      this.hoveredPin = null;
    }
    this.renderer.domElement.style.cursor = 'grab';
    if (tooltip) tooltip.classList.remove('active');
  },

  highlightPin(pinGroup) {
    pinGroup.position.y = pinGroup.userData.originalY + 0.6;
    pinGroup.scale.set(1.2, 1.2, 1.2);
  },

  unhighlightPin(pinGroup) {
    pinGroup.position.y = pinGroup.userData.originalY;
    pinGroup.scale.set(1.0, 1.0, 1.0);
  },

  onCanvasClick() {
    if (this.hoveredPin && this.hoveredPin.userData && this.hoveredPin.userData.dairy) {
      const dairy = this.hoveredPin.userData.dairy;
      this.focusOnDairy(dairy.id);
      if (window.AAVIN_EXPLORER && window.AAVIN_EXPLORER.selectDairy) {
        window.AAVIN_EXPLORER.selectDairy(dairy);
      }
    }
  },

  focusOnDairy(dairyId) {
    this.activeDairyId = dairyId;
    const dairy = this.dairies.find(d => d.id === dairyId);
    if (!dairy) return;

    const targetPos = this.latLngTo3D(dairy.latitude, dairy.longitude, 1.4);

    this.glideCameraTo(
      targetPos.x, targetPos.y + 12, targetPos.z + 14,
      targetPos.x, targetPos.y, targetPos.z
    );

    this.isAutoRotating = false;
  },

  focusOnDistrict(districtName) {
    const districtDairies = this.dairies.filter(d => d.district.toLowerCase() === districtName.toLowerCase());
    if (districtDairies.length === 0) return;

    const first = districtDairies[0];
    const targetPos = this.latLngTo3D(first.latitude, first.longitude, 1.4);

    this.glideCameraTo(
      targetPos.x, targetPos.y + 16, targetPos.z + 20,
      targetPos.x, targetPos.y, targetPos.z
    );

    this.isAutoRotating = false;

    // Trigger explorer card for the first facility
    if (window.AAVIN_EXPLORER && window.AAVIN_EXPLORER.selectDairy) {
      window.AAVIN_EXPLORER.selectDairy(first);
    }
  },

  glideCameraTo(camX, camY, camZ, lookX, lookY, lookZ, duration = 1200) {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls ? this.controls.target.clone() : new THREE.Vector3();
    const endPos = new THREE.Vector3(camX, camY, camZ);
    const endTarget = new THREE.Vector3(lookX, lookY, lookZ);

    const startTime = performance.now();

    const animateGlide = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const ease = 0.5 - Math.cos(progress * Math.PI) / 2; // Smooth cosine ease

      this.camera.position.lerpVectors(startPos, endPos, ease);
      if (this.controls) {
        this.controls.target.lerpVectors(startTarget, endTarget, ease);
        this.controls.update();
      }

      if (progress < 1.0) {
        requestAnimationFrame(animateGlide);
      }
    };

    requestAnimationFrame(animateGlide);
  },

  resetCamera() {
    this.glideCameraTo(0, 32, 42, 0, 0, 0, 1000);
    this.activeDairyId = null;
  },

  toggleAutoRotate() {
    this.isAutoRotating = !this.isAutoRotating;
    return this.isAutoRotating;
  },

  filterBeacons(facilityType) {
    if (!this.beaconGroup) return;

    this.beaconGroup.children.forEach(pin => {
      const dairy = pin.userData.dairy;
      if (!dairy) return;

      if (facilityType === 'ALL' || dairy.facility_type === facilityType) {
        pin.visible = true;
      } else {
        pin.visible = false;
      }
    });
  },

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Update Radar Wave Rings
    this.radarRings.forEach(r => {
      r.baseScale += r.speed;
      if (r.baseScale > r.maxScale) {
        r.baseScale = 1.0;
      }
      r.mesh.scale.set(r.baseScale, r.baseScale, 1.0);
      r.mesh.material.opacity = Math.max(0, 1.0 - (r.baseScale / r.maxScale));
    });

    // Gentle Auto-Rotation
    if (this.isAutoRotating && this.controls) {
      this.scene.rotation.y += 0.0015;
    } else {
      this.scene.rotation.y = 0;
    }

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  },

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }
  }
};
