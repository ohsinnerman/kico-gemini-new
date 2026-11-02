/*!
 * liquid-glass-js — container.js
 * Copyright (c) 2025 Armagan Amcalar (https://github.com/dashersw/liquid-glass-js)
 * Licensed under the MIT License (see assets/js/glass/LICENSE).
 *
 * Patched for production performance and accessibility:
 * 1. Added static `Container.snapshotTarget` (falls back to `document.body`) so html2canvas
 *    only rasterizes the hero container instead of the entire long document.
 * 2. Updated `getPosition()` so when `Container.snapshotTarget` is set, coordinates are
 *    computed relative to the target's bounding rect origin minus `window.scrollY`
 *    (cancelling out the shader's `window.scrollY` offset).
 * 3. Removed console.log noise and default canvas box-shadow.
 * 4. Added automatic `glass-fallback` class on `document.documentElement` if WebGL or
 *    html2canvas fails.
 */
(function (global) {
  'use strict';

  function failToFallback() {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.classList.add('glass-fallback');
      document.documentElement.classList.remove('has-glass');
    }
  }

  window.glassControls = window.glassControls || {
    edgeIntensity: 0.024,
    rimIntensity: 0.075,
    baseIntensity: 0.014,
    edgeDistance: 0.18,
    rimDistance: 0.85,
    baseDistance: 0.14,
    cornerBoost: 0.03,
    rippleEffect: 0.08,
    blurRadius: 6.0,
    tintOpacity: 0.22
  };

  const VERTEX_SHADER = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const FRAGMENT_SHADER = `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform vec2 u_textureSize;
    uniform vec2 u_position;
    uniform float u_scrollY;
    uniform float u_borderRadius;
    uniform int u_shapeType;
    uniform int u_warp;
    uniform float u_edgeIntensity;
    uniform float u_rimIntensity;
    uniform float u_baseIntensity;
    uniform float u_edgeDistance;
    uniform float u_rimDistance;
    uniform float u_baseDistance;
    uniform float u_cornerBoost;
    uniform float u_rippleEffect;
    uniform float u_blurRadius;
    uniform float u_tintOpacity;

    float sdRoundedBox(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
    }

    void main() {
      vec2 halfSize = u_resolution * 0.5;
      vec2 p = (v_uv - 0.5) * u_resolution;
      float r = u_borderRadius;
      if (u_shapeType == 1) {
        r = min(halfSize.x, halfSize.y);
      } else if (u_shapeType == 2) {
        r = min(halfSize.x, halfSize.y);
      }
      float d = sdRoundedBox(p, halfSize, r);
      if (d > 0.0) {
        discard;
      }

      float distFromEdge = clamp(-d / max(min(halfSize.x, halfSize.y), 1.0), 0.0, 1.0);
      vec2 norm = normalize(p + vec2(0.0001));

      float edgeFactor = exp(-distFromEdge / max(u_edgeDistance, 0.01)) * u_edgeIntensity;
      float baseFactor = (u_warp == 1) ? (1.0 - distFromEdge) * u_baseIntensity : 0.0;
      float ripple = sin(length(p) * 0.15) * u_rippleEffect * 0.003;
      vec2 offset = norm * (edgeFactor + baseFactor + ripple);

      vec2 sampleCenter = u_position + vec2(0.0, u_scrollY);
      vec2 fragPagePos = sampleCenter + vec2(p.x, -p.y) + offset * u_resolution;
      vec2 texUV = clamp(fragPagePos / max(u_textureSize, vec2(1.0)), 0.002, 0.998);
      texUV.y = 1.0 - texUV.y;

      vec3 col = vec3(0.0);
      float totalWeight = 0.0;
      vec2 texel = (u_blurRadius / max(u_textureSize, vec2(1.0)));

      for (int x = -2; x <= 2; x++) {
        for (int y = -2; y <= 2; y++) {
          float w = exp(-float(x*x + y*y) / 4.0);
          vec2 uvOff = texUV + vec2(float(x), float(y)) * texel * 0.45;
          col += texture2D(u_texture, clamp(uvOff, 0.002, 0.998)).rgb * w;
          totalWeight += w;
        }
      }
      col /= max(totalWeight, 0.0001);

      float rim = exp(-distFromEdge * 6.0 / max(u_rimDistance, 0.1)) * u_rimIntensity;
      col = mix(col, vec3(0.97, 0.98, 0.96), clamp(u_tintOpacity + rim, 0.0, 0.85));

      float alpha = smoothstep(0.0, -1.5, d);
      gl_FragColor = vec4(col, alpha);
    }
  `;

  class Container {
    static instances = [];
    static snapshotTarget = null;
    static pageSnapshot = null;
    static snapshotPromise = null;

    constructor(options = {}) {
      this.borderRadius = options.borderRadius !== undefined ? options.borderRadius : 48;
      this.type = options.type || 'rounded';
      this.tintOpacity = options.tintOpacity !== undefined ? options.tintOpacity : window.glassControls.tintOpacity;
      this.warp = Boolean(options.warp);
      this.children = [];
      this.parent = null;
      this.gl_refs = null;

      this.element = document.createElement('div');
      this.element.className = 'glass-container';
      if (this.type === 'circle') this.element.classList.add('glass-container-circle');
      if (this.type === 'pill') this.element.classList.add('glass-container-pill');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'glass-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.element.appendChild(this.canvas);

      Container.instances.push(this);
      this.init();
    }

    addChild(child) {
      if (!child || !child.element) return;
      child.parent = this;
      this.children.push(child);
      this.element.appendChild(child.element);
      this.updateSizeFromDOM();
    }

    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parent = null;
        if (child.element && child.element.parentNode === this.element) {
          this.element.removeChild(child.element);
        }
      }
    }

    getPosition() {
      const rect = this.canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.5;
      if (Container.snapshotTarget) {
        const targetRect = Container.snapshotTarget.getBoundingClientRect();
        return {
          x: centerX - targetRect.left,
          y: centerY - targetRect.top - window.scrollY
        };
      }
      return {
        x: centerX + window.scrollX,
        y: centerY
      };
    }

    updateSizeFromDOM() {
      if (!this.element || !this.canvas) return;
      const rect = this.element.getBoundingClientRect();
      const w = Math.max(Math.round(rect.width), 64);
      const h = Math.max(Math.round(rect.height), 36);
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      if (this.gl_refs && this.gl_refs.gl) {
        this.gl_refs.gl.viewport(0, 0, w, h);
        this.render();
      }
    }

    static captureSnapshot() {
      if (Container.pageSnapshot) return Promise.resolve(Container.pageSnapshot);
      if (Container.snapshotPromise) return Container.snapshotPromise;
      if (typeof window.html2canvas !== 'function') {
        failToFallback();
        return Promise.reject(new Error('html2canvas unavailable'));
      }
      const targetEl = Container.snapshotTarget || document.body;
      Container.snapshotPromise = window.html2canvas(targetEl, {
        backgroundColor: null,
        logging: false,
        useCORS: true,
        scale: 1
      }).then(canvas => {
        Container.pageSnapshot = canvas;
        return canvas;
      }).catch(err => {
        failToFallback();
        throw err;
      });
      return Container.snapshotPromise;
    }

    init() {
      Container.captureSnapshot().then(snapshotCanvas => {
        this.setupWebGL(snapshotCanvas);
      }).catch(() => {
        failToFallback();
      });
    }

    setupWebGL(snapshotCanvas) {
      const gl = this.canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false }) ||
                 this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
      if (!gl) {
        failToFallback();
        return;
      }

      const compile = (type, src) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
      const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      if (!vs || !fs) {
        failToFallback();
        return;
      }

      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        failToFallback();
        return;
      }

      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,  1, -1, -1,  1,
        -1,  1,  1, -1,  1,  1
      ]), gl.STATIC_DRAW);

      const posLoc = gl.getAttribLocation(prog, 'a_position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, snapshotCanvas);

      this.gl_refs = {
        gl,
        prog,
        tex,
        snapshotCanvas,
        resolutionLoc: gl.getUniformLocation(prog, 'u_resolution'),
        textureSizeLoc: gl.getUniformLocation(prog, 'u_textureSize'),
        positionLoc: gl.getUniformLocation(prog, 'u_position'),
        scrollYLoc: gl.getUniformLocation(prog, 'u_scrollY'),
        borderRadiusLoc: gl.getUniformLocation(prog, 'u_borderRadius'),
        shapeTypeLoc: gl.getUniformLocation(prog, 'u_shapeType'),
        warpLoc: gl.getUniformLocation(prog, 'u_warp'),
        edgeIntensityLoc: gl.getUniformLocation(prog, 'u_edgeIntensity'),
        rimIntensityLoc: gl.getUniformLocation(prog, 'u_rimIntensity'),
        baseIntensityLoc: gl.getUniformLocation(prog, 'u_baseIntensity'),
        edgeDistanceLoc: gl.getUniformLocation(prog, 'u_edgeDistance'),
        rimDistanceLoc: gl.getUniformLocation(prog, 'u_rimDistance'),
        baseDistanceLoc: gl.getUniformLocation(prog, 'u_baseDistance'),
        cornerBoostLoc: gl.getUniformLocation(prog, 'u_cornerBoost'),
        rippleEffectLoc: gl.getUniformLocation(prog, 'u_rippleEffect'),
        blurRadiusLoc: gl.getUniformLocation(prog, 'u_blurRadius'),
        tintOpacityLoc: gl.getUniformLocation(prog, 'u_tintOpacity')
      };

      this.updateSizeFromDOM();
    }

    render() {
      if (!this.gl_refs || !this.gl_refs.gl) return;
      const r = this.gl_refs;
      const gl = r.gl;
      const ctrl = window.glassControls;
      const pos = this.getPosition();
      const shapeCode = this.type === 'circle' ? 1 : (this.type === 'pill' ? 2 : 0);

      gl.useProgram(r.prog);
      gl.uniform2f(r.resolutionLoc, this.canvas.width, this.canvas.height);
      gl.uniform2f(r.textureSizeLoc, r.snapshotCanvas.width || 1, r.snapshotCanvas.height || 1);
      gl.uniform2f(r.positionLoc, pos.x, pos.y);
      gl.uniform1f(r.scrollYLoc, window.scrollY || 0);
      gl.uniform1f(r.borderRadiusLoc, this.borderRadius);
      gl.uniform1i(r.shapeTypeLoc, shapeCode);
      gl.uniform1i(r.warpLoc, this.warp ? 1 : 0);
      gl.uniform1f(r.edgeIntensityLoc, ctrl.edgeIntensity);
      gl.uniform1f(r.rimIntensityLoc, ctrl.rimIntensity);
      gl.uniform1f(r.baseIntensityLoc, ctrl.baseIntensity);
      gl.uniform1f(r.edgeDistanceLoc, ctrl.edgeDistance);
      gl.uniform1f(r.rimDistanceLoc, ctrl.rimDistance);
      gl.uniform1f(r.baseDistanceLoc, ctrl.baseDistance);
      gl.uniform1f(r.cornerBoostLoc, ctrl.cornerBoost);
      gl.uniform1f(r.rippleEffectLoc, ctrl.rippleEffect);
      gl.uniform1f(r.blurRadiusLoc, ctrl.blurRadius);
      gl.uniform1f(r.tintOpacityLoc, this.tintOpacity);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  window.addEventListener('resize', () => {
    Container.instances.forEach(inst => inst.updateSizeFromDOM());
  }, { passive: true });

  global.Container = Container;
})(window);
