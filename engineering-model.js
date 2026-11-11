function shader(gl, type, source) {
  const result = gl.createShader(type);
  gl.shaderSource(result, source);
  gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(result);
    gl.deleteShader(result);
    throw new Error(error);
  }
  return result;
}

function modelProgram(gl) {
  const vertex = shader(gl, gl.VERTEX_SHADER, `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat3 uCamera;
    uniform vec2 uScale;
    varying vec3 vNormal;
    void main() {
      vec3 p = uCamera * aPosition;
      vNormal = uCamera * aNormal;
      gl_Position = vec4(p.xy * uScale, -p.z * 0.45, 1.0);
    }
  `);
  const fragment = shader(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    uniform vec3 uColor;
    varying vec3 vNormal;
    void main() {
      vec3 n = normalize(vNormal);
      float lighting = 0.62 + 0.37 * abs(dot(n, vec3(0.29, 0.54, 0.79)));
      gl_FragColor = vec4(uColor * lighting, 1.0);
    }
  `);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(error);
  }
  return program;
}

function decode(data) {
  return Uint8Array.from(atob(data), character => character.charCodeAt(0));
}

function makeBuffer(gl, target, data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, gl.STATIC_DRAW);
  return buffer;
}

function cameraMatrix(yaw, pitch) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const h = Math.cos(pitch), v = Math.sin(pitch);
  return new Float32Array([-c, -v * s, h * s, s, -v * c, h * c, 0, h, v]);
}

export function mountEngineeringModel(host, scene) {
  if (!scene?.parts?.length) return null;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', '三维模型，拖动或按方向键旋转');
  canvas.tabIndex = 0;
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
  if (!gl) return null;

  const program = modelProgram(gl);
  const parts = scene.parts.map(item => {
    const position = decode(item.position);
    const normal = decode(item.normal);
    const triangles = decode(item.triangles);
    if (!position.length || position.length !== normal.length * 2 || triangles.length % 6) {
      throw new Error('三维网格数据不完整');
    }
    return {
      label: item.label,
      color: item.color,
      rgb: [1, 3, 5].map(offset => parseInt(item.color.slice(offset, offset + 2), 16) / 255),
      positions: makeBuffer(gl, gl.ARRAY_BUFFER, position),
      normals: makeBuffer(gl, gl.ARRAY_BUFFER, normal),
      faces: makeBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, triangles),
      count: triangles.length / 2,
      visible: true,
    };
  });
  const attribute = {
    position: gl.getAttribLocation(program, 'aPosition'),
    normal: gl.getAttribLocation(program, 'aNormal'),
  };
  const uniform = {
    camera: gl.getUniformLocation(program, 'uCamera'),
    scale: gl.getUniformLocation(program, 'uScale'),
    color: gl.getUniformLocation(program, 'uColor'),
  };
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);
  gl.enableVertexAttribArray(attribute.position);
  gl.enableVertexAttribArray(attribute.normal);

  host.replaceChildren(canvas);
  const controls = document.createElement('div');
  controls.className = 'br-model-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', '三维视角');
  host.append(controls);

  const home = scene.view || [Math.PI * .8, .55];
  let [yaw, pitch] = home;
  const fitZoom = 1.07;
  let zoom = fitZoom;
  let frame = 0;
  let drag;
  const paint = () => {
    frame = 0;
    const scale = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(canvas.clientWidth * scale));
    const height = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.clearColor(.933, .949, .969, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const ratio = width / height;
    gl.uniformMatrix3fv(uniform.camera, false, cameraMatrix(yaw, pitch));
    gl.uniform2f(uniform.scale, zoom / Math.max(1, ratio), zoom * Math.min(1, ratio));
    for (const part of parts) {
      if (!part.visible) continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, part.positions);
      gl.vertexAttribPointer(attribute.position, 3, gl.SHORT, true, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, part.normals);
      gl.vertexAttribPointer(attribute.normal, 3, gl.BYTE, true, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, part.faces);
      gl.uniform3fv(uniform.color, part.rgb);
      gl.drawElements(gl.TRIANGLES, part.count, gl.UNSIGNED_SHORT, 0);
    }
    canvas.dataset.modelReady = 'true';
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };
  const setView = (angle, tilt) => {
    yaw = angle;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, tilt));
    schedule();
  };
  const changeZoom = ratio => {
    zoom = Math.max(.7, Math.min(3, zoom * ratio));
    schedule();
  };
  function button(parent, label, action) {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = label;
    element.addEventListener('click', action);
    parent.append(element);
    return element;
  }
  button(controls, '轴测', () => { zoom = fitZoom; setView(...home); });
  button(controls, '正视', () => { zoom = fitZoom; setView(Math.PI, 0); });
  button(controls, '俯视', () => { zoom = fitZoom; setView(Math.PI, Math.PI / 2); });
  button(controls, '仰视', () => { zoom = fitZoom; setView(Math.PI, -Math.PI / 2); });
  button(controls, '放大', () => changeZoom(1.2));
  button(controls, '缩小', () => changeZoom(1 / 1.2));
  if (parts.length > 1) {
    const layers = document.createElement('div');
    layers.className = 'br-model-controls br-model-layers';
    layers.setAttribute('role', 'group');
    layers.setAttribute('aria-label', '模型分组');
    host.append(layers);
    for (const part of parts) {
      const toggle = button(layers, part.label, () => {
        part.visible = !part.visible;
        toggle.setAttribute('aria-pressed', String(part.visible));
        schedule();
      });
      toggle.setAttribute('aria-pressed', 'true');
      toggle.style.setProperty('--part-color', part.color);
    }
  }
  canvas.addEventListener('pointerdown', event => {
    if (drag || event.button !== 0) return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    setView(yaw - (event.clientX - drag.x) * .009, pitch + (event.clientY - drag.y) * .009);
    drag.x = event.clientX;
    drag.y = event.clientY;
  });
  canvas.addEventListener('lostpointercapture', () => { drag = undefined; });
  canvas.addEventListener('keydown', event => {
    switch (event.key) {
      case 'ArrowLeft': setView(yaw - .16, pitch); break;
      case 'ArrowRight': setView(yaw + .16, pitch); break;
      case 'ArrowUp': setView(yaw, pitch + .16); break;
      case 'ArrowDown': setView(yaw, pitch - .16); break;
      case '+': changeZoom(1.2); break;
      case '-': changeZoom(1 / 1.2); break;
      default: return;
    }
    event.preventDefault();
  });
  const observer = new ResizeObserver(schedule);
  observer.observe(canvas);
  schedule();
  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    for (const part of parts) {
      gl.deleteBuffer(part.positions);
      gl.deleteBuffer(part.normals);
      gl.deleteBuffer(part.faces);
    }
    gl.deleteProgram(program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
