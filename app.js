let scene, camera, renderer;
let hitTestSource = null;
let hitTestSourceRequested = false;
let model = null;
let reticle = null;
let controller = null;
let xrSession = null;

// Check for WebXR support
async function checkXRSupport() {
  if (!navigator.xr) {
    return false;
  }
  
  try {
    return await navigator.xr.isSessionSupported('immersive-ar');
  } catch (e) {
    console.error("XR support check failed:", e);
    return false;
  }
}

// Initialize the AR experience
async function init() {
  // Check for WebXR support
  const supported = await checkXRSupport();
  if (!supported) {
    document.getElementById('support-message').innerHTML = 
      '<p class="unsupported">WebXR AR not supported on this device/browser</p>' +
      '<p>Try Chrome on Android or Safari on iOS 13+</p>';
    return;
  }

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
  
  // Add lighting
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);
  
  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0.5, 1, 0.25);
  scene.add(directionalLight);
  
  // Create reticle for placement
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);
  
  // Load a simple model
  const loader = new THREE.GLTFLoader();
  try {
    const gltf = await loader.loadAsync('https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models/2.0/Box/glTF/Box.gltf');
    model = gltf.scene;
    model.scale.set(0.3, 0.3, 0.3);
  } catch (e) {
    console.error("Failed to load model:", e);
    model = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
  }
  
  // Start AR session
  try {
    const sessionInit = { 
      optionalFeatures: ['hit-test', 'dom-overlay'],
      domOverlay: { root: document.body }
    };
    
    xrSession = await navigator.xr.requestSession('immersive-ar', sessionInit);
    await renderer.xr.setSession(xrSession);
    
    document.getElementById('loading').style.display = 'none';
    
    // Set up controller - FIXED: Properly get the controller
    controller = renderer.xr.getController(0);
    if (controller && controller.addEventListener) {
      controller.addEventListener('select', onSelect);
      scene.add(controller);
    } else {
      console.warn("XR controller not available");
    }
    
    // Start animation loop
    renderer.setAnimationLoop(render);
  } catch (e) {
    console.error("AR session failed to start:", e);
    document.getElementById('support-message').innerHTML = 
      `<p class="unsupported">Failed to start AR: ${e.message}</p>`;
  }
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
  }
}

// Main render loop
function render(timestamp, frame) {
  if (!frame) return;
  
  // Request hit test source if not done yet
  if (!hitTestSourceRequested && frame.session) {
    frame.session.requestReferenceSpace('viewer').then((referenceSpace) => {
      return frame.session.requestHitTestSource({ space: referenceSpace });
    }).then((source) => {
      hitTestSource = source;
      hitTestSourceRequested = true;
    }).catch((err) => {
      console.error("Hit test failed:", err);
    });
  }
  
  // Get hit test results
  if (hitTestSource && frame) {
    const hitTestResults = frame.getHitTestResults(hitTestSource);
    
    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(renderer.xr.getReferenceSpace());
      
      reticle.visible = true;
      reticle.matrix.fromArray(pose.transform.matrix);
    } else {
      reticle.visible = false;
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
document.getElementById('start-button').addEventListener('click', init);

// Handle window resize
window.addEventListener('resize', onWindowResize);

// Check for WebXR support on page load
window.addEventListener('load', () => {
  checkXRSupport().then(supported => {
    if (!supported) {
      document.getElementById('support-message').innerHTML = 
        '<p class="unsupported">WebXR AR not supported on this device/browser</p>' +
        '<p>Try Chrome on Android or Safari on iOS 13+</p>';
    }
  });
});
