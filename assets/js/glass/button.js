/*!
 * liquid-glass-js — button.js
 * Copyright (c) 2025 Armagan Amcalar (https://github.com/dashersw/liquid-glass-js)
 * Licensed under the MIT License (see assets/js/glass/LICENSE).
 */
(function (global) {
  'use strict';

  class Button extends global.Container {
    constructor(options = {}) {
      const size = options.size || 16;
      const type = options.type || 'pill';
      const borderRadius = options.borderRadius !== undefined ? options.borderRadius : size * 1.5;
      super({
        borderRadius,
        type,
        tintOpacity: options.tintOpacity !== undefined ? options.tintOpacity : 0.24,
        warp: Boolean(options.warp)
      });

      this.text = options.text || 'Button';
      this.size = size;
      this.onClick = typeof options.onClick === 'function' ? options.onClick : null;

      this.element.classList.add('glass-button');
      if (this.type === 'circle') {
        this.element.classList.add('glass-button-circle');
      }

      this.textElement = document.createElement('span');
      this.textElement.className = 'glass-button-text';
      this.textElement.textContent = this.text;
      this.textElement.style.fontSize = this.size + 'px';
      this.element.appendChild(this.textElement);

      if (this.onClick) {
        this.element.addEventListener('click', (e) => {
          this.onClick(this.text, e);
        });
      }

      requestAnimationFrame(() => this.updateSizeFromDOM());
    }
  }

  global.Button = Button;
})(window);
