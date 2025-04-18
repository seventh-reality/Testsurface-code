document.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    const arContent = document.getElementById('ar-content');
    const plane = document.getElementById('plane');
    const clickable = document.getElementById('clickable');
    const loader = document.querySelector('.arjs-loader');
    
    let modelPlaced = false;
    let hitTestSource = null;
    let hitTestSourceRequested = false;
    let referenceSpace = null;
    let xrSession = null;
    
    // Check if WebXR is available
    if (!navigator.xr) {
        alert('WebXR not supported in your browser');
        return;
    }
    
    // Initialize AR
    async function initializeAR() {
        try {
            // Request XR session
            xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test', 'dom-overlay'],
                domOverlay: { root: document.body }
            });
            
            // Set up Three.js renderer for AR
            scene.renderer.xr.enabled = true;
            scene.renderer.xr.setReferenceSpaceType('local');
            scene.renderer.xr.setSession(xrSession);
            
            // Set up reference space
            referenceSpace = await xrSession.requestReferenceSpace('local');
            
            // Hide loader when AR is ready
            loader.style.display = 'none';
            
            // Show UI elements
            arContent.setAttribute('visible', 'true');
            clickable.setAttribute('visible', 'true');
            
            // Start the AR loop
            scene.renderer.setAnimationLoop(onXRFrame);
            
            // Handle session end
            xrSession.addEventListener('end', onXRSessionEnded);
        } catch (error) {
            console.error('AR initialization failed:', error);
            alert('Failed to initialize AR: ' + error.message);
        }
    }
    
    // XR Frame loop
    function onXRFrame(timestamp, frame) {
        if (!frame) return;
        
        const session = frame.session;
        const pose = frame.getViewerPose(referenceSpace);
        
        if (!pose) return;
        
        // Request hit test source if not already done
        if (!hitTestSourceRequested) {
            session.requestHitTestSource({ space: referenceSpace })
                .then(source => {
                    hitTestSource = source;
                })
                .catch(err => {
                    console.error('Hit test failed:', err);
                });
            hitTestSourceRequested = true;
        }
        
        // Perform hit test if source is available
        if (hitTestSource && !modelPlaced) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const hitPose = hit.getPose(referenceSpace);
                
                // Update plane indicator position
                plane.setAttribute('visible', 'true');
                plane.object3D.position.set(
                    hitPose.transform.position.x,
                    hitPose.transform.position.y,
                    hitPose.transform.position.z
                );
                plane.object3D.quaternion.set(
                    hitPose.transform.orientation.x,
                    hitPose.transform.orientation.y,
                    hitPose.transform.orientation.z,
                    hitPose.transform.orientation.w
                );
            } else {
                plane.setAttribute('visible', 'false');
            }
        }
    }
    
    // Handle session end
    function onXRSessionEnded() {
        scene.renderer.setAnimationLoop(null);
        xrSession = null;
        hitTestSource = null;
        hitTestSourceRequested = false;
        modelPlaced = false;
        
        // Reset UI
        arContent.setAttribute('visible', 'false');
        clickable.setAttribute('visible', 'false');
        plane.setAttribute('visible', 'false');
    }
    
    // Handle tap to place model
    scene.addEventListener('click', (evt) => {
        if (modelPlaced || !hitTestSource || !xrSession) return;
        
        const frame = scene.renderer.xr.getFrame();
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        
        if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const hitPose = hit.getPose(referenceSpace);
            
            // Place model at hit position
            const model = arContent.querySelector('[gltf-model]');
            model.object3D.position.set(
                hitPose.transform.position.x,
                hitPose.transform.position.y,
                hitPose.transform.position.z
            );
            model.object3D.quaternion.set(
                hitPose.transform.orientation.x,
                hitPose.transform.orientation.y,
                hitPose.transform.orientation.z,
                hitPose.transform.orientation.w
            );
            
            modelPlaced = true;
            plane.setAttribute('visible', 'false');
            clickable.setAttribute('visible', 'false');
        }
    });
    
    // Start AR when scene is loaded
    scene.addEventListener('loaded', () => {
        // Check for WebXR support
        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-ar')
                .then((supported) => {
                    if (supported) {
                        initializeAR();
                    } else {
                        alert('AR not supported on your device');
                        loader.style.display = 'none';
                    }
                })
                .catch((err) => {
                    console.error('XR support check failed:', err);
                    alert('Failed to check XR support: ' + err.message);
                    loader.style.display = 'none';
                });
        } else {
            alert('WebXR not supported in your browser');
            loader.style.display = 'none';
        }
    });
    
    // Handle resize
    window.addEventListener('resize', () => {
        if (scene.camera && scene.renderer) {
            scene.camera.aspect = window.innerWidth / window.innerHeight;
            scene.camera.updateProjectionMatrix();
            scene.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    });
});
