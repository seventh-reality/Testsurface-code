// Wait for A-Frame and 8th Wall components to load
window.addEventListener('DOMContentLoaded', () => {
  // Hide loading screen when scene is ready
  const scene = document.querySelector('a-scene')
  const loadingScreen = document.getElementById('loading')
  
  scene.addEventListener('loaded', () => {
    setTimeout(() => {
      loadingScreen.style.display = 'none'
    }, 500)
  })

  // Initialize surface placement
  initSurfacePlacement()
})

function initSurfacePlacement() {
  const scene = document.querySelector('a-scene')
  
  // Get the template model
  const modelTemplate = document.getElementById('model-template')
  
  // Counter for unique model IDs
  let modelCount = 0
  
  // Handle tap events to place models
  scene.addEventListener('click', (evt) => {
    // Get the position where the user tapped
    const position = evt.detail.intersection.point
    
    // Create a new model instance
    const newModel = modelTemplate.cloneNode(true)
    newModel.id = `model-${modelCount++}`
    newModel.object3D.position.copy(position)
    newModel.setAttribute('visible', 'true')
    
    // Align the model with the surface normal
    const normal = evt.detail.intersection.face.normal
    newModel.object3D.lookAt(
      position.x + normal.x,
      position.y + normal.y,
      position.z + normal.z
    )
    
    // Add animation for better UX
    newModel.setAttribute('animation', {
      property: 'scale',
      from: '0.01 0.01 0.01',
      to: '0.2 0.2 0.2',
      dur: 300,
      easing: 'easeOutElastic'
    })
    
    scene.appendChild(newModel)
  })
  
  // Optional: Add surface detection events
  const surfaceVisualizer = document.querySelector('[xrextras-surface-visualizer]')
  if (surfaceVisualizer) {
    surfaceVisualizer.addEventListener('surfacefound', () => {
      console.log('Surface detected!')
    })
    
    surfaceVisualizer.addEventListener('surfaceupdated', () => {
      console.log('Surface updated!')
    })
    
    surfaceVisualizer.addEventListener('surfacelost', () => {
      console.log('Surface lost!')
    })
  }
  
  // Optional: Add gesture controls for placed models
  scene.addEventListener('onefingermove', (evt) => {
    const model = evt.detail.target
    if (model && model.classList.contains('movable')) {
      const touchPosition = evt.detail.position
      model.object3D.position.set(touchPosition.x, touchPosition.y, touchPosition.z)
    }
  })
}
