import { Box3, Group, Vector3 } from 'three';

const clamp = value => Math.min(1, Math.max(0, value));
const ease = value => value * value * (3 - 2 * value);

function modelParts(model) {
  model.updateMatrixWorld(true);
  const bounds = new Box3();
  const center = new Vector3();
  return model.children.map(object => {
    bounds.setFromObject(object);
    bounds.getCenter(center);
    const kind = object.name.replace(/_\d+$/, '');
    const key = `${kind}:${center.toArray().map(value => Math.round(value * 20)).join(',')}`;
    object.traverse(mesh => { if (mesh.isMesh) mesh.castShadow = mesh.receiveShadow = true; });
    return { object, key, kind, y: object.position.y, height: bounds.max.y - bounds.min.y, level: bounds.min.y };
  });
}

// A common part already in the preceding snapshot holds in place. Only new or
// removed work moves. Every transform is sampled from scroll position, so it reverses.
export function createPhasePlayer(scene, urls, loadModel, prioritizeModel) {
  const models = urls.map(() => null);
  let visible = [];
  let requestedPhase = -1;
  const pending = urls.map((url, index) => loadModel(url, { prefetch: index > 0 }).then(model => {
    model.name = `ADDC construction phase ${index + 1}`;
    model.visible = false;
    const parts = modelParts(model);
    const keys = new Set(parts.map(part => part.key));
    models[index] = { model, parts, keys };
    scene.add(model);
    return true;
  }).catch(error => {
    console.warn('ADDC construction phase unavailable:', url, error);
    return false;
  }));

  function draw(progress, { hideTemporary = false, reduced = false, interior = false } = {}) {
    const index = Math.max(0, Math.min(urls.length - 1, Math.floor(progress)));
    if (index !== requestedPhase) {
      requestedPhase = index;
      prioritizeModel(urls[index]);
    }
    const current = models[index] || models.slice(0, index).reverse().find(Boolean);
    if (!current) return false;
    const canShow = part => !(hideTemporary && part.kind.startsWith('Temp_')) &&
      !(interior && part.level < 3.6 && /^Interior/.test(part.kind));
    const previous = models[index - 1];
    const time = reduced || current !== models[index] ? 1 : clamp(progress - index);
    visible.forEach(model => { model.visible = false; });
    visible = [current.model];
    current.model.visible = true;
    current.parts.forEach((part, i) => {
      const stable = part.kind === 'Ground' || previous?.keys.has(part.key);
      const offset = (i % 11) * .027;
      const entrance = stable ? 1 : ease(clamp((time - offset) / .52));
      part.object.visible = entrance > 0 && canShow(part);
      part.object.position.y = part.y + (1 - entrance) * (part.kind.startsWith('Temp_') ? -.45 : .45 + Math.min(part.height, 2) * .48);
    });
    if (previous && time < .42 && current === models[index]) {
      const exit = ease(clamp(time / .42));
      previous.model.visible = true;
      visible.push(previous.model);
      previous.parts.forEach(part => {
        const temporary = part.kind.startsWith('Temp_');
        part.object.visible = part.kind !== 'Ground' && !current.keys.has(part.key) && canShow(part);
        part.object.position.y = part.y - exit * (temporary ? Math.max(.75, part.height) : .8);
      });
    }
    return true;
  }

  function hide() {
    visible.forEach(model => { model.visible = false; });
    visible = [];
  }

  return { first: pending[0], loaded: Promise.all(pending), draw, hide };
}

const houseSteps = [
  /^Pile$/, /^(PileCap|GroundBeam)$/, /^(Column|Beam|Slab|StairLid)$/,
  /^(Render|Coping|RoofMembrane|RoofMembraneUpturn)$/, /^(Pergola|Balcony|Glazing|Entrance|Window|Door|Batten|Gutter|Downpipe|AC|Curtain|Interior)/,
];

export function assembleHouse(model) {
  const animated = modelParts(model).map((part, index) => {
    const step = houseSteps.findIndex(pattern => pattern.test(part.kind));
    const level = Math.min(.72, Math.max(0, part.level) * .055);
    return { ...part, start: (step < 0 ? 5 : step) + level + (index % 7) * .042 };
  });
  return progress => animated.forEach(part => {
    const entrance = part.kind === 'Ground' ? 1 : ease(clamp((progress - part.start) / .48));
    part.object.visible = entrance > 0;
    part.object.position.y = part.y + (1 - entrance) * (.34 + Math.min(part.height, 2) * .48);
  });
}

export function mountedModel(model, { x = 0, y = 0, z = 0, angle = 0, width, depth } = {}) {
  const bounds = new Box3().setFromObject(model);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  model.scale.set(width ? width / size.x : 1, 1, depth ? depth / size.z : 1);
  model.position.set(-center.x * model.scale.x, -bounds.min.y, -center.z * model.scale.z);
  model.traverse(mesh => { if (mesh.isMesh) mesh.castShadow = mesh.receiveShadow = true; });
  const mount = new Group();
  mount.add(model);
  mount.position.set(x, y, z);
  mount.rotation.y = angle;
  return mount;
}
