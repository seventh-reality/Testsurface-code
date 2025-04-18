document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    const arContent = document.getElementById('ar-content');
    const surfaceMesh = document.getElementById('surface-mesh');
    const placementUI = document.getElementById('placement-ui');
    const loader = document.querySelector('.arjs-loader');
    const errorMessage = document.getElementById('error-message');
    
    let modelPlaced = false;
    let hitTestSource = null;
    let xrSession = null;
    let referenceSpace = null;
    let lastHitPose = null;
    let meshVisible = false;
    
    // Check for WebXR support
    if (!window.XRSession) {
        showError("WebXR not supported in your browser");
        return;
    }
    
    // Initialize AR
    async function initializeAR() {
        try {
            // Request AR session
            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test', 'dom-overlay'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: document.body }
            });
            
            xrSession = session;
            
            // Set up Three.js renderer for AR
            scene.renderer.xr.enabled = true;
            scene.renderer.xr.setReferenceSpaceType('local');
            scene.renderer.xr.setSession(session);
            
            // Get the reference space
            referenceSpace = await session.requestReferenceSpace('local');
            
            // Create hit test source
            const viewerSpace = await session.requestReferenceSpace('viewer');
            hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
            
            // Hide loader and show UI
            loader.style.display = 'none';
            placementUI.setAttribute('visible', 'true');
            
            // Start the AR render loop
            scene.renderer.setAnimationLoop(onXRFrame);
            
            // Handle session end
            session.addEventListener('end', onXRSessionEnded);
            
        } catch (error) {
            console.error('AR initialization failed:', error);
            showError(`AR initialization failed: ${error.message}`);
        }
    }
    
    // XR Frame rendering loop
    function onXRFrame(time, frame) {
        if (!frame || !hitTestSource) return;
        
        const session = frame.session;
        const pose = frame.getViewerPose(referenceSpace);
        
        if (!pose) return;
        
        // Get hit test results
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        
        if (!modelPlaced && hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            lastHitPose = hit.getPose(referenceSpace);
            
            // Update surface mesh visualization
            updateSurfaceMesh(lastHitPose);
            
            if (!meshVisible) {
                surfaceMesh.setAttribute('visible', 'true');
                meshVisible = true;
            }
        } else if (meshVisible && hitTestResults.length === 0) {
            surfaceMesh.setAttribute('visible', 'false');
            meshVisible = false;
        }
    }
    
    // Update the white mesh visualization
    function updateSurfaceMesh(hitPose) {
        // Clear previous mesh if any
        surfaceMesh.innerHTML = '';
        
        // Create a white semi-transparent plane
        const plane = document.createElement('a-plane');
        plane.setAttribute('position', {
            x: hitPose.transform.position.x,
            y: hitPose.transform.position.y,
            z: hitPose.transform.position.z
        });
        plane.setAttribute('rotation', '-90 0 0');
        plane.setAttribute('width', '0.5');
        plane.setAttribute('height', '0.5');
        plane.setAttribute('color', 'white');
        plane.setAttribute('opacity', '0.5');
        plane.setAttribute('material', 'shader: flat; side: double');
        
        surfaceMesh.appendChild(plane);
        
        // Add grid pattern for better visibility
        const grid = document.createElement('a-grid');
        grid.setAttribute('position', {
            x: hitPose.transform.position.x,
            y: hitPose.transform.position.y + 0.01, // Slightly above the plane
            z: hitPose.transform.position.z
        });
        grid.setAttribute('rotation', '-90 0 0');
        grid.setAttribute('size', '0.5 0.5');
        grid.setAttribute('color', '#333');
        grid.setAttribute('opacity', '0.8');
        
        surfaceMesh.appendChild(grid);
    }
    
    // Handle tap to place model
    scene.addEventListener('click', (evt) => {
        if (modelPlaced || !lastHitPose) return;
        
        // Place a sample model (replace with your own)
        const model = document.createElement('a-box');
        model.setAttribute('position', {
            x: lastHitPose.transform.position.x,
            y: lastHitPose.transform.position.y,
            z: lastHitPose.transform.position.z
        });
        model.setAttribute('width', '0.2');
        model.setAttribute('height', '0.2');
        model.setAttribute('depth', '0.2');
        model.setAttribute('color', '#4CC3D9');
        model.setAttribute('shadow', 'cast: true; receive: true');
        
        // Add animation
        model.setAttribute('animation', {
            property: 'rotation',
            to: '0 360 0',
            loop: true,
            dur: 10000
        });
        
        arContent.appendChild(model);
        modelPlaced = true;
        surfaceMesh.setAttribute('visible', 'false');
        placementUI.setAttribute('visible', 'false');
    });
    
    // Handle session end
    function onXRSessionEnded() {
        scene.renderer.setAnimationLoop(null);
        xrSession = null;
        hitTestSource = null;
        modelPlaced = false;
        lastHitPose = null;
        
        // Reset UI
        loader.style.display = 'flex';
        placementUI.setAttribute('visible', 'false');
        surfaceMesh.setAttribute('visible', 'false');
        arContent.innerHTML = '';
    }
    
    // Show error message
    function showError(message) {
        loader.style.display = 'none';
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        console.error(message);
    }
    
    // Start AR when scene is loaded
    scene.addEventListener('loaded', () => {
        // Check for WebXR AR support
        navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
            if (supported) {
                initializeAR();
            } else {
                showError("AR not supported on your device");
            }
        }).catch((error) => {
            showError(`Error checking AR support: ${error.message}`);
        });
    });
    
    // Handle Android back button
    document.addEventListener('backbutton', () => {
        if (xrSession) {
            xrSession.end().catch(() => {});
        }
    }, false);
});
