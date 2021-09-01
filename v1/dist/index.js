(function () {
  "use strict";

  var __webpack_modules__ = {
    "./src/index.js": function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
      const helloworld = __webpack_require__("src/helloworld.js").default;

      const component = __webpack_require__("src/component.js").default;

      var setup = () => {
        const wrap = document.createElement('div');
        const helloworldElement = document.createElement('div');
        helloworldElement.innerHTML = helloworld;
        wrap.appendChild(helloworldElement);
        wrap.appendChild(component());
        document.body.appendChild(wrap);
      };

      setup();
    },
    "src/helloworld.js": function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
      __webpack_exports__.default = 'hello world';
    },
    "src/component.js": function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
      __webpack_exports__.default = () => {
        const div = document.createElement('div');
        div.innerHTML = 'this is a component';
        div.style.cssText = `
    width: 200px;
    height: 200px;
    background: blue;
    color: #fff;
  `;
        return div;
      };
    }
  };
  var __webpack_module_cache__ = {};

  function __webpack_require__(moduleId) {
    if (__webpack_module_cache__[moduleId]) {
      return __webpack_module_cache__[moduleId].exports;
    }

    var module = __webpack_module_cache__[moduleId] = {
      exports: {}
    };

    __webpack_modules__[moduleId](module, module.exports, __webpack_require__);

    return module.exports;
  }

  __webpack_require__("./src/index.js");
})();