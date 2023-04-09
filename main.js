import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import result from "./api.js";

const EARTH_RADIUS = 1; // 1:6373

class App {
  constructor() {
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.controls = null;
    this.markerGroup = null;
  }

  init() {
    // create camera
    const fov = 70;
    const AR = window.innerWidth / window.innerHeight;
    const near = 0.05;
    const far = 1000;
    this.camera = new THREE.PerspectiveCamera(fov, AR, near, far);
    this.camera.position.z = 3;

    // create scene
    this.scene = new THREE.Scene();

    // create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // create controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 3;

    // create earth mesh
    const earthMesh = this.createEarthMesh();
    this.mesh = earthMesh;
    this.scene.add(earthMesh);

    // create a sphere geometry for the stars
    const starsMesh = this.createStarsMesh();
    this.scene.add(starsMesh);

    // create marker group
    this.markerGroup = new THREE.Group();
    this.scene.add(this.markerGroup);

    // load earthquake data and create markers
    result.then((response) => {
      for (let i = 0; i < response.length; i++) {
        const earthquake = response[i];
        const coordinates = earthquake.geometry.coordinates;
        const magn = earthquake.properties.mag;
        this.createMarker(coordinates[1], coordinates[0], magn);
      }
    });

    // add event listener for window resize
    window.addEventListener("resize", () => this.onWindowResize());

    // start animation
    this.animate();
    this.renderer.render(this.scene, this.camera);
  }

  createEarthMesh() {
    const texture = new THREE.TextureLoader().load("./static/images/earth.jpg");
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  createStarsMesh() {
    const starGeometry = new THREE.SphereGeometry(90, 64, 64);
    const starTexture = new THREE.TextureLoader().load(
      "./static/images/stars.jpg"
    );
    const starMaterial = new THREE.MeshBasicMaterial({
      map: starTexture,
      side: THREE.BackSide,
    });
    const starMesh = new THREE.Mesh(starGeometry, starMaterial);
    return starMesh;
  }

  createMarkerMesh(magn) {
    // create a marker mesh
    const markerGeometry = new THREE.CircleGeometry(0.001 * magn, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8,
    });
    const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);

    // add a pulse effect to the marker
    const pulseGeometry = new THREE.CircleGeometry(0.004 * magn, 32);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.2,
      transparent: true,
    });
    const pulseMesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulseMesh.scale.set(0.001, 0.001, 0.001);
    markerMesh.add(pulseMesh);

    // animate the pulse effect
    let pulseScale = 0.001;
    let pulseSpeed = 0.005;
    const animatePulse = function () {
      requestAnimationFrame(animatePulse);
      pulseScale += pulseSpeed;
      if (pulseScale >= 1) {
        pulseScale = 0.001;
      }
      pulseMesh.scale.set(pulseScale, pulseScale, pulseScale);
    };
    animatePulse();

    return markerMesh;
  }

  createMarker(lat, long, magn) {
    const position = this.calcPosFromLatLonRad(lat, long, 1);
    const markerMesh = this.createMarkerMesh(magn);
    markerMesh.position.set(position[0], position[1], position[2]);
    const centerOfEarth = new THREE.Vector3(0, 0, 0)
      .normalize()
      .multiplyScalar(1);

    markerMesh.lookAt(centerOfEarth);
    markerMesh.rotateY(Math.PI);

    this.markerGroup.add(markerMesh);
  }

  calcPosFromLatLonRad(lat, long, radius) {
    let phi = (90 - lat) * (Math.PI / 180);
    let theta = (long + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return [x, y, z];
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight); // updated
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    // Rotate the Earth
    this.mesh.rotation.y += 0.0005;

    // Rotate the markers
    this.markerGroup.rotation.y += 0.0005;

    this.renderer.render(this.scene, this.camera);
  }
}

const app = new App();
app.init();
