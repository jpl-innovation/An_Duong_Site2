import { Spherical, TOUCH, Vector3 } from 'three';

const angleKeys = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
};

export function installStageOrbit(stage, canvas, camera, controls) {
  const position = camera.position.clone();
  const target = controls.target.clone();
  let fov = camera.fov;
  let active = false;
  let autoRotate = controls.autoRotate;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'stage-orbit';
  stage.append(button);

  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Mô hình 3D. Dùng các phím mũi tên để xoay, phím cộng và trừ để thu phóng.');
  canvas.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight ArrowUp ArrowDown + - Escape');
  controls.touches.TWO = TOUCH.DOLLY_ROTATE;

  function updateInput() {
    controls.enableZoom = active;
    canvas.style.touchAction = active ? 'none' : 'pan-y pinch-zoom';
    canvas.toggleAttribute('data-lenis-prevent', active);
    stage.toggleAttribute('data-orbit-active', active);
    button.textContent = active ? 'Góc mặc định' : 'Xoay mô hình';
    canvas.title = active ? 'Kéo để xoay, cuộn để thu phóng' : 'Kéo để xoay mô hình';
  }

  function activate() {
    if (active) return;
    active = true;
    autoRotate = controls.autoRotate;
    controls.autoRotate = false;
    const distance = camera.position.distanceTo(controls.target);
    controls.minDistance = distance * .5;
    controls.maxDistance = distance * 2.5;
    updateInput();
  }

  function applyCamera() {
    camera.position.copy(position);
    controls.target.copy(target);
    if (Math.abs(camera.fov - fov) > .01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }

  function leave(restore = true) {
    if (!active) return;
    active = false;
    controls.minDistance = 0;
    controls.maxDistance = Infinity;
    // Clear residual drag before restoring the authored camera.
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    if (restore) applyCamera();
    controls.update();
    controls.enableDamping = damping;
    controls.autoRotate = autoRotate;
    updateInput();
  }

  function setBase(nextPosition, nextTarget, nextFov = fov) {
    position.copy(nextPosition);
    target.copy(nextTarget);
    fov = nextFov;
  }

  function follow(nextPosition, nextTarget, nextFov) {
    setBase(nextPosition, nextTarget, nextFov);
    if (!active) applyCamera();
  }

  canvas.addEventListener('pointerdown', event => {
    if (!stage.classList.contains('ready') || (event.pointerType === 'touch' && !active)) {
      event.stopImmediatePropagation();
    }
  }, { capture: true });
  controls.addEventListener('start', activate);
  button.addEventListener('click', () => {
    if (active) leave();
    else {
      activate();
      canvas.focus({ preventScroll: true });
    }
  });
  stage.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !active) return;
    event.preventDefault();
    leave();
    button.focus({ preventScroll: true });
  });

  const offset = new Vector3();
  const angles = new Spherical();
  canvas.addEventListener('keydown', event => {
    const rotation = angleKeys[event.key];
    const zoom = ['+', '='].includes(event.key) ? .9 : event.key === '-' ? 1.1 : 1;
    if ((!rotation && zoom === 1) || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    activate();
    angles.setFromVector3(offset.subVectors(camera.position, controls.target));
    if (rotation) {
      angles.theta += rotation[0] * .12;
      angles.phi = Math.min(controls.maxPolarAngle, Math.max(controls.minPolarAngle, angles.phi + rotation[1] * .12));
    }
    angles.radius = Math.min(controls.maxDistance, Math.max(controls.minDistance, angles.radius * zoom));
    camera.position.setFromSpherical(angles.makeSafe()).add(controls.target);
    controls.update();
  });

  updateInput();
  return { get active() { return active; }, follow, setBase, leave };
}
