let scene, camera, renderer, controller;
let hitTestSource = null;
let model = null;
let reticle = null;
let placedObjects = [];

// Initialize the AR experience
async function init() {
  // Create Three.js scene
  scene = new THREE.Scene();
  
  // Create camera
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
  
  // Create renderer with WebXR support
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.getElementById('ar-container').appendChild(renderer.domElement);
  
  // Add basic lighting
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);
  
  // Add reticle for placement
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);
  
  // Load a simple model (replace with your own)
  const loader = new THREE.GLTFLoader();
  loader.load(
    'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models/2.0/Box/glTF/Box.gltf',
    (gltf) => {
      model = gltf.scene;
      model.scale.set(0.3, 0.3, 0.3);
    }
  );
  
  // Set up WebXR session
  const sessionInit = { optionalFeatures: ['hit-test', 'dom-overlay'], domOverlay: { root: document.body } };
  
  try {
    await renderer.xr.setSession('immersive-ar', sessionInit);
    document.getElementById('loading').style.display = 'none';
  } catch (e) {
    document.getElementById('loading').innerHTML = `
      <h1>AR Not Supported</h1>
      <p>${e.message}</p>
      <p>Try using Chrome on Android or Safari on iOS with ARKit support.</p>
    `;
    return;
  }
  
  // Add controller
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);
  
  // Start animation loop
  renderer.setAnimationLoop(render);
}

// Handle tap/click to place objects
function onSelect() {
  if (reticle.visible && model) {
    const newModel = model.clone();
    newModel.position.setFromMatrixPosition(reticle.matrix);
    
    // Random color for demonstration
    newModel.traverse((child) => {
      if (child.isMesh) {
        child.material.color.setHex(Math.random() * 0xffffff);
      }
    });
    
    scene.add(newModel);
    placedObjects.push(newModel);
  }
}

// Main render loop
function render(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();
    
    // Get hit test results
    if (session && frame) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);
        
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
    
    // Initialize hit test source if not done yet
    if (!hitTestSource && session && frame.session.requestHitTestSource) {
      const space = renderer.xr.getReferenceSpace();
      session.requestHitTestSource({ space }).then((source) => {
        hitTestSource = source;
      });
    }
  }
  
  renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start button event listener
document.getElementById('start-button').addEventListener('click', () => {
  init();
});

// Handle window resize
window.addEventListener('resize', onWindowResize);
