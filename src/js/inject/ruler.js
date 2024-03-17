//noinspection CssUnresolvedCustomProperty

chrome.runtime.onMessage
  .addListener((_msg, _sender, _response) => {});

/*

rulerContainerY
ruler-container-vertical-left single-ruler-div
top: var(--ruler-margin-top);

 */

if (!window['rulerLoaded']) {

  window['rulerLoaded'] = true;

  const debugging = window.location.href.includes('debug=1');
  const counterIncrement = 50;

  const CSS_TO_INJECT = `
 <style>     
.extract-colors-devtool {
    --ruler-container-horizontal-top-pos: 0px;

    --ruler-border-color: rgba(0,0,0,0.1);
    --rulerNumbers: #000;
    --ruler-num-fontsize: 10px;
    --ruler-num-padding-line-start: 0.75ch;
    --ruler-unit: 1px;
    --ruler-x: 1;
    --ruler-y: 1;

    --ruler1-bdw: 1px;
    --ruler-hash-mark-fraction-line: #111;
    --ruler1-h: 8px;
    --ruler1-space: 5;

    --ruler2-bdw: 1px;
    --ruler-hash-mark-main-line: #000;
    --ruler2-h: 20px;
    --ruler2-space: ${counterIncrement};

    --lineColor: rgba(0, 0, 255, 0.3);
    /*--lineColor: rgba(0, 255, 255, 0.83);  TODO */
    --lineWidth: 1px;

    --line-marker-bg: rgba(0,0,0,0.9);
    --line-marker-color: #fff;
    --line-marker-delete-btn-bg: #111;
    --line-marker-delete-btn-color: cyan;
    --line-marker-delete-btn-hover-bg: #fff;
    --line-marker-delete-btn-hover-color: #5e0000;

    --snap-line-color: rgba(255, 0, 0, 0.5);
    
    --counter-x-start: 0;
    --counter-y-start: 0;
    --ruler-margin-top: 0px;
    --ruler-margin-left: 0px;
}



.extract-colors-devtool {
    display: block;
}


.extract-colors-devtool .hidden{
    display: none !important;
}

.extract-colors-devtool .snap-line-div {
    display: block;
    position: fixed;
    background-color: var(--snap-line-color);
    z-index: 2147483647;
}
.extract-colors-devtool .snap-line-horizontal {
    left: 0;
    width: 100vw;
    height: 1px;
}
.extract-colors-devtool .snap-line-vertical {
    top:0;
    width: 1px;
    height: 100vh;
}

.extract-colors-devtool.ruler-main-div {
    display: none;
}

.extract-colors-devtool .single-ruler-div {
    z-index: 2147483647;
    background-attachment: fixed;
    background-position: 0 0;
    box-sizing: initial;
}

.extract-colors-devtool .ruler-container-horizontal-top {
    position: absolute;
    top: var(--ruler-container-horizontal-top-pos);
    right: 0;
    width: 100%;
    height: 20px;
    border-bottom: 1px solid var(--ruler-border-color);
    background-image: linear-gradient(90deg, var(--ruler-hash-mark-fraction-line) 0 var(--ruler1-bdw), transparent 0),
    linear-gradient(90deg, var(--ruler-hash-mark-main-line) 0 var(--ruler2-bdw), transparent 0);
    background-repeat: repeat-x, repeat-x;
    background-size: calc(var(--ruler-unit) * var(--ruler1-space) * var(--ruler-x)) var(--ruler1-h),
    calc(var(--ruler-unit) * var(--ruler2-space) * var(--ruler-x)) var(--ruler2-h);
}

.extract-colors-devtool .ruler-container-vertical-left-outer-div {
    position: fixed;
    top: 0;
    left: 0;
    width: 22px;
    height: 100vh;
    overflow: clip;
}
.extract-colors-devtool .ruler-container-vertical-left {
    overflow: clip;
    position: relative;
    top: var(--ruler-margin-top);
    right: 0;
    width: 22px;
    height: max( calc(100% - var(--ruler-margin-top) ), calc(100vh - var(--ruler-margin-top)));
    /*top: var(--ruler-margin-top);*/
    left: 0;
    border-right: 1px solid var(--ruler-border-color);
    background-attachment: local;
    background-image: linear-gradient(90deg, var(--ruler-hash-mark-fraction-line) 0 var(--ruler1-bdw), transparent 0),
    linear-gradient(90deg, var(--ruler-hash-mark-main-line) 0 var(--ruler2-bdw), transparent 0),
    linear-gradient(0deg, var(--ruler-hash-mark-fraction-line) 0 var(--ruler1-bdw), transparent 0),
    linear-gradient(0deg, var(--ruler-hash-mark-main-line) 0 var(--ruler2-bdw), transparent 0);
    background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
    background-size: calc(var(--ruler-unit) * var(--ruler1-space) * var(--ruler-x)) var(--ruler1-h),
    calc(var(--ruler-unit) * var(--ruler2-space) * var(--ruler-x)) var(--ruler2-h),
    var(--ruler1-h) calc(var(--ruler-unit) * var(--ruler1-space) * var(--ruler-y)),
    var(--ruler2-h) calc(var(--ruler-unit) * var(--ruler2-space) * var(--ruler-y));
}

.extract-colors-devtool .__ruler ul {
    box-sizing: initial;
    pointer-events: all;
}

/* Ruler Numbers */
.extract-colors-devtool .ruler-x-ul,
.extract-colors-devtool .ruler-y-ul {
    color: var(--rulerNumbers);
    display: flex;
    font-size: var(--ruler-num-fontsize);
    line-height: 1;
    list-style: none;
    margin: 0;
    overflow: hidden;
    padding: 0;
    position: fixed;
}

.extract-colors-devtool .ruler-x-ul {
    counter-reset: counter-x var(--counter-x-start);
    height: var(--ruler2-h);
    inset-block-start: 0;
    inset-inline-start: calc(var(--ruler-unit) * var(--ruler2-space));
    opacity: var(--ruler-x);
    width: 100%;
}

.extract-colors-devtool .ruler-y-ul {
    counter-reset: counter-y var(--counter-y-start);
    flex-direction: column;
    height: 100%;
    inset-block-start: calc(var(--ruler-unit) * var(--ruler2-space));
    inset-inline-start: 0;
    opacity: var(--ruler-y);
    width: var(--ruler2-h);
    margin-top: var(--ruler-margin-top);
}
.extract-colors-devtool .ruler-x-ul:hover {
    cursor: row-resize;
}
.extract-colors-devtool .ruler-y-ul:hover {
    cursor: col-resize;
}

.extract-colors-devtool .ruler-x-ul li {
    align-self: flex-end;
}

.extract-colors-devtool .ruler-x-ul li,
.extract-colors-devtool .ruler-y-ul li {
    flex: 0 0 calc(var(--ruler-unit) * var(--ruler2-space));
    box-sizing: initial;
}

.extract-colors-devtool .ruler-x-ul li {
    counter-increment: counter-x var(--ruler2-space);
}
.extract-colors-devtool .ruler-y-ul li {
    counter-increment: counter-y var(--ruler2-space);
}

.extract-colors-devtool .ruler-y-ul li {
    margin-left: 3px;
}

.extract-colors-devtool .ruler-x-ul li::after {
    content: counter(counter-x) '';
    line-height: 1;
    padding-inline-start: var(--ruler-num-padding-line-start);
}

.extract-colors-devtool .ruler-y-ul li::after {
    content: counter(counter-y) '';
    display: block;
    padding-inline-end: var(--ruler-num-padding-line-start);
    transform: rotate(-90deg) translateY(-44px);
    transform-origin: 100% 0;
    text-align: end;
    width: 47px;
}

.extract-colors-devtool .ruler-free-horizontal-line {
    left: 0;
    width: 100%;
    height: 10px;
    background: transparent;
    position: absolute;
    cursor: row-resize;
    z-index: 2147483647;
}

.ruler-free-vertical-line {
    width: 10px;
    height: 100%;
    background: transparent;
    position: fixed;
    z-index: 2147483647;
    cursor: col-resize;
    top: 0;
}

.extract-colors-devtool .ruler-free-horizontal-line::after {
    content: ' ';
    position: absolute;
    background: var(--lineColor);
    width: 100%;
    height: var(--lineWidth);
    top: 5px;
}

.extract-colors-devtool .ruler-free-vertical-line::before {
    content: ' ';
    position: absolute;
    background: var(--lineColor);
    width: var(--lineWidth);
    height: 100vh;
    top: 0;
    left: 5px;
}

.extract-colors-devtool .ruler-free-horizontal-line .line-marker,
.extract-colors-devtool .ruler-free-vertical-line .line-marker {
    border: 0;
    text-align: center;
    display: none;
    font-size: 14px;
    background: var(--line-marker-bg);
    color: var(--line-marker-color);
    border-radius: 15px;
    padding: 2px 5px;
    min-width: 70px;
    gap: 0.4em;
    justify-content: center;
    align-items: center;
    user-select: none;
}
.extract-colors-devtool .ruler-free-horizontal-line .line-marker {
    margin: 9px 0 0 20px;
    position: relative;
    width: fit-content;
    top: -2px;
    left: 5px;
}

.extract-colors-devtool .ruler-free-vertical-line .line-marker {
    margin: 9px 0 0 3px;
    position: absolute;
    bottom: 40px;
    left: 4px;
}

.extract-colors-devtool .ruler-delete-line-btn {
    border: 0;
    width: 20px;
    height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;
    background: var(--line-marker-delete-btn-bg);
    color: var(--line-marker-delete-btn-color);
    cursor: pointer;
}
.extract-colors-devtool .ruler-delete-line-btn:hover {
    background: var(--line-marker-delete-btn-hover-bg);
    color: var(--line-marker-delete-btn-hover-color);
}

.marker-always-visible .ruler-free-horizontal-line .line-marker,
.marker-always-visible .ruler-free-vertical-line .line-marker,
.extract-colors-devtool .ruler-free-horizontal-line:hover .line-marker,
.extract-colors-devtool .ruler-free-vertical-line:hover .line-marker {
    display: flex;
}
</style>
`;

  const FREELINE_SIZE = 10;
  const RULER_SIZE = 20;

  const STORAGE_KEY_RULER_EXT_ENABLED = 'ruler-div-enabled';
  const STORAGE_KEY_RULER_EXT_LINE_VISIBILITY = 'ruler-div-line-visibility';
  const STORAGE_KEY_RULER_EXT_RULER_VISIBILITY = 'ruler-div-ruler-visibility';
  const STORAGE_KEY_RULER_EXT_LINE_COLOR = 'ruler-div-line-color';
  const STORAGE_KEY_RULER_EXT_LINE_WIDTH = 'ruler-div-line-width';

  const crossIcon = `&#10005;`;
  const DELETE_KEY = `Backspace`;

  const messageHandlers = {
    'ENABLE': (value, target) => enableRuler(value, target),
    'TOGGLE_LINE_VISIBILITY': (value) => setLineVisibility(value),
    'TOGGLE_RULER_VISIBILITY': (value) => toggleRulerVisibility(value),
    'CLEAR': () => removeRulerLines(),
    'CHANGE_COLOR': (value) => setLineColor(value),
    'CHANGE_WIDTH': (value) => setLineWidth(value)
  };

  let scrollY = 0;

  let rulerLineElement = null;
  let clickedOnTopRuler = false;
  let clickedOnLeftRuler = false;
  let mouseDown = false;
  let targetElement = null;

  let mainElement;
  let rulerMainElement;
  let linesMainElement;
  let rulerContainerHorizontalTop;
  let rulerContainerVerticalLeft;
  let rulerUlX;
  let rulerUlY;

  let _snapLinesVisible = true;
  let snapLineTopDiv;
  let snapLineRightDiv;
  let snapLineBottomDiv;
  let snapLineLeftDiv;


  const mouse = {
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  };


  function isSnapperVisible(){
    return _snapLinesVisible;
  }

  function setSnapperVisible(visible){
    _snapLinesVisible = visible;

    const classAction = visible ? 'remove' : 'add';
    const lines = [snapLineTopDiv, snapLineBottomDiv, snapLineLeftDiv, snapLineRightDiv];
    lines.forEach(line => {
      line.classList[classAction]('hidden');
    });
  }


  function createListItemsX(rulerElementX, innerWidth) {
    appendElements({
      parent: rulerElementX,
      elementCount: innerWidth / counterIncrement,
      createElement: createListItem
    });
  }

  function createListItemsY(rulerElementY, innerHeight) {
    appendElements({
      parent: rulerElementY,
      elementCount: innerHeight / counterIncrement,
      createElement: createListItem
    });
  }

  function createListItemsXandY(event) {
    const {innerWidth, innerHeight} = event.currentTarget;

    rulerUlX.innerHTML = "";
    rulerUlY.innerHTML = "";
    createListItemsX(rulerUlX, innerWidth);
    createListItemsY(rulerUlY, innerHeight);
  }

  function applyStyle(element, style) {
    for (const property in style) {
      element.style[property] = style[property];
    }
  }

  function createElement(para) {
    const element = document.createElement(para.elementTag);
    for (const prop in para) {
      if (prop === 'childNodes') {
        para.childNodes.forEach(node => {
          element.appendChild(node);
        });

      } else if (prop === 'attributes') {
        para.attributes.forEach(attr => {
          element.setAttribute(attr.key, attr.value);
        });

      } else if (prop === 'innerHTML') {
        element.innerHTML = para.innerHTML;

      } else if (prop === 'classList') {
        for (const clazz of para.classList) {
          clazz.split(" ")
            .forEach(c => element.classList.add(c));
        }

      } else {
        element[prop] = para[prop];
      }
    }
    return element;
  }


  function isTopRulerArea(clientY) {
    return clientY <= RULER_SIZE;
  }

  function isLeftRulerArea(clientX) {
    return clientX <= RULER_SIZE;
  }


  function createLineMarkerWithDeleteButton(config) {
    const {targetClassName, className, indicator, value, target} = config;
    if (target.className === targetClassName) {
      const element= createElement({
        elementTag: 'div',
        classList: [className],
        innerHTML: `${indicator}: <span class="value">${value}</span>`
      });

      const crossElement = createElement({
        elementTag: 'button',
        classList: ['ruler-delete-line-btn'],
        title: `${DELETE_KEY} + Click`,
        innerHTML: crossIcon
      });
      element.addEventListener('click', (event) => {
        const selector = (indicator === 'Y') ? '.ruler-free-horizontal-line' : '.ruler-free-vertical-line';
        event.target.closest(selector).remove();
      });
      element.appendChild(crossElement);
      target.innerHTML = '';
      target.appendChild(element);
    }
  }


  function updatePositionInPixel(element, key, value) {
    return applyStyle(element, {
      [key]: value + 'px',
    });
  }


  function getStorage(key) {
    return localStorage.getItem(key);
  }

  function setStorage(key, value) {
    return localStorage.setItem(key, value);
  }

  function isNotNull(value) {
    return value !== null;
  }

  function isNotUndefined(value) {
    return value !== undefined && value !== 'undefined';
  }


  function setDisplay(element, value) {
    element.style.display = (value === true) ? 'block' : 'none';
  }

  function enableRuler(value, element) {
    setStorage(STORAGE_KEY_RULER_EXT_ENABLED, value);
    if (isNotNull(value)) {
      setDisplay(element, value === true);
    }
  }

  function setLineVisibility(value) {
    setStorage(STORAGE_KEY_RULER_EXT_LINE_VISIBILITY, value);
    document.querySelectorAll('.__ext_ruler_line').forEach((element) => {
      if (element) {
        setDisplay(element, !value);
      }
    })
  }

  function toggleRulerVisibility(value) {
    setStorage(STORAGE_KEY_RULER_EXT_RULER_VISIBILITY, value);
    document
      .querySelectorAll('.single-ruler-div')
      .forEach((element) => {
        if (element) {
          setDisplay(element, !value);
        }
      });
  }

  function removeRulerLines() {
    document
      .querySelectorAll('.__ext_ruler_line')
      .forEach((element) => {
        if (element) {
          element.remove();
        }
      });
  }

  function setLineColor(color) {
    setStorage(STORAGE_KEY_RULER_EXT_LINE_COLOR, color);
    if (isNotUndefined(color)) {
      document.documentElement.style.setProperty('--lineColor', color);
    }
  }

  function setLineWidth(width) {
    setStorage(STORAGE_KEY_RULER_EXT_LINE_WIDTH, width);
    if (isNotUndefined(width)) {
      document.documentElement.style.setProperty('--lineWidth', width + 'px');
    }
  }

  function determineRulersMode() {
    const _rulersMode = getStorage(STORAGE_KEY_RULER_EXT_ENABLED);
    if (_rulersMode === 'true') {
      return 'block';
    }
    return 'none';
  }

  function applyLineColor() {
    const lineColor = getStorage(STORAGE_KEY_RULER_EXT_LINE_COLOR);
    if (isNotUndefined(lineColor)) document.documentElement.style.setProperty('--lineColor', lineColor);
  }

  function applyLineWidth() {
    const lineWidth = getStorage(STORAGE_KEY_RULER_EXT_LINE_WIDTH);
    if (isNotUndefined(lineWidth) && isNotNull(lineWidth)) {
      document.documentElement.style.setProperty('--lineWidth', lineWidth + 'px');
    }
  }



  function handleMessage(message, target) {
    const {type, value} = message;
    const handler = messageHandlers[type];

    if(handler){
      handler(value, target);
      return true;
    }
    return false;
  }


  function saveMousePosition(ev) {
    const {clientX, clientY} = ev
    mouse.x = clientX;
    mouse.y = Math.round(clientY);
  }


  function onRulerXClick() {
    mouse.startX = mouse.x;
    mouse.startY = mouse.y;
    createHorizontalRulerFreeLine(mouse.y);
  }

  function onRulerYClick() {
    mouse.startX = mouse.x;
    mouse.startY = mouse.y;
    createVerticalRulerFreeLine(mouse.x);
  }

  function onMouseMoveAfterTopRulerClicked(event) {
    saveMousePosition(event);
    console.log(mouse.y, event);
    if (clickedOnTopRuler && rulerLineElement !== null) {
      updatePositionInPixel(rulerLineElement, 'top', mouse.y);
      updateRulerMarkerValue(targetElement, mouse.y + RULER_SIZE/4 - 1);
    }
  }

  function onMouseMoveAfterLeftRulerClicked(event) {
    saveMousePosition(event);
    if (clickedOnLeftRuler && rulerLineElement !== null) {
      updatePositionInPixel(rulerLineElement, 'left', mouse.x);
      updateRulerMarkerValue(targetElement, mouse.x + RULER_SIZE/4);
    }
  }

  function updateRulerMarkerValue(rulerLineElement, value){
    const valueEle = rulerLineElement.querySelector('.value');
    if (valueEle) {
      valueEle.innerText = value;
    }
  }

  function moveTargetElement(event) {
    saveMousePosition(event);
    if (targetElement) {
      if (clickedOnTopRuler) {
        // Free horizontal line is dragged:
        const y = Math.round(mouse.y + scrollY);
        updatePositionInPixel(targetElement, 'top', y);
        updateRulerMarkerValue(targetElement, 1 + y + + RULER_SIZE/4);

      } else if (clickedOnLeftRuler) {
        updatePositionInPixel(targetElement, 'left', mouse.x);
        updateRulerMarkerValue(targetElement, mouse.x + RULER_SIZE/4);
      }
    }
  }

  function onMouseDown(e) {
    const {clientY, clientX} = e;
    mouseDown = true;
    saveMousePosition(e);

    if (isTopRulerArea(clientY)) {
      clickedOnTopRuler = true;
      onRulerXClick(e);

    } else if (isLeftRulerArea(clientX)) {
      clickedOnLeftRuler = true;
      onRulerYClick(e);

    } else if (isSnapperVisible()){
      convertSnapToRulerLine();
    }
  }

  function onSrollend(event) {
    onScroll(event);
  }
  function onScroll(event) {
    scrollY =  window.scrollY;

    const modY = (scrollY % counterIncrement);
    const startY = Math.floor(scrollY / counterIncrement);
    const marginTop = -modY;

    // console.log(scrollY + ", modY:" + modY + ",  startY:" + startY, marginTop);

    rulerMainElement.style.setProperty("--ruler-container-horizontal-top-pos", `${scrollY}px`);
    rulerMainElement.style.setProperty("--counter-y-start", startY * counterIncrement);
    rulerMainElement.style.setProperty("--ruler-margin-top", `${marginTop}px`);
  }

  function initDocumentListener() {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener("scroll", onScroll);
    document.addEventListener("scrollend", onSrollend);
  }


  function moveSnapLines(target) {
    const {left, top, width, height} = target.getBoundingClientRect();
    const absoluteX = left + window.scrollX;
    const absoluteY = top + window.scrollY;

    applyStyle(snapLineLeftDiv, {
      left: `${absoluteX}px`
    });
    applyStyle(snapLineRightDiv, {
      left: `${absoluteX + width}px`
    });
    applyStyle(snapLineTopDiv, {
      top: `${absoluteY}px`
    });
    applyStyle(snapLineBottomDiv, {
      top: `${absoluteY + height}px`
    });
  }

  function convertSnapToRulerLine() {
    const offset = FREELINE_SIZE / 2;
    createHorizontalRulerFreeLine(snapLineTopDiv.getBoundingClientRect().top - offset);
    createHorizontalRulerFreeLine(snapLineBottomDiv.getBoundingClientRect().top - offset);
    createVerticalRulerFreeLine(snapLineLeftDiv.getBoundingClientRect().left - offset);
    createVerticalRulerFreeLine(snapLineRightDiv.getBoundingClientRect().left - offset);

    setSnapperVisible(false);
  }

  function createVerticalRulerFreeLine(x) {
    rulerLineElement = createElement({
      elementTag: 'div',
      classList: ['ruler-free-vertical-line']
    });

    applyStyle(rulerLineElement, {
      left: x + 'px',
    });
    targetElement = rulerLineElement;

    rulerLineElement.addEventListener('mousedown', (event) => {
      targetElement = event.target
      clickedOnLeftRuler = true
    });

    createLineMarkerWithDeleteButton({
      targetClassName: 'ruler-free-vertical-line',
      className: 'line-marker',
      indicator: 'X',
      value: x,
      target: rulerLineElement,
    });

    //rulerMainElement.append(rulerLineElement);
    linesMainElement.append(rulerLineElement);
  }

  function createHorizontalRulerFreeLine(y) {
    rulerLineElement = createElement({
      elementTag: 'div',
      classList: ['ruler-free-horizontal-line'],
    });
    applyStyle(rulerLineElement, {
      top: y + 'px',
    });
    targetElement = rulerLineElement
    rulerLineElement.addEventListener('mousedown', (event) => {
      targetElement = event.target;
      clickedOnTopRuler = true;
    });

    //rulerMainElement.append(rulerLineElement);
    linesMainElement.append(rulerLineElement);

    createLineMarkerWithDeleteButton({
      targetClassName: 'ruler-free-horizontal-line',
      className: 'line-marker',
      indicator: 'Y',
      value: y,
      target: rulerLineElement,
    });
  }


  function onMouseMove(evt) {
    document.title = evt.clientY; // TODO
    const target = evt.target;
    //console.log({targetElement, clickedOnTopRuler, clickedOnLeftRuler});

    if (targetElement) {
      // we are dragging a line:
      moveTargetElement(evt);

    } else if (clickedOnTopRuler) {
      onMouseMoveAfterTopRulerClicked(evt);
    } else if (clickedOnLeftRuler) {
      onMouseMoveAfterLeftRulerClicked(evt);
    } else {
      moveSnapLines(target);
    }
  }

  function onMouseUp(_evt) {
    clickedOnTopRuler = false;
    clickedOnLeftRuler = false;
    mouseDown = false;
    targetElement = null;
    document.body.style.userSelect = 'auto';
    document.body.style.cursor = 'auto';
  }

  function onKeyDown(evt) {
    const {key, code} = evt;

    if (debugging) {
      console.log(`key: "${key}", code: ${code}`, evt);
    }

    if (key === DELETE_KEY && targetElement) {
      targetElement.remove();
      evt.stopPropagation();

    } else if (isSnapperVisible() && code === 'Enter') {
      convertSnapToRulerLine();
      evt.stopPropagation();

    } else if (key === 's') {
      setSnapperVisible(!isSnapperVisible());
      evt.stopPropagation();

    } else if (mouseDown && key === 'h') {
      createHorizontalRulerFreeLine(mouse.y);
      evt.stopPropagation();

    } else if (mouseDown && key === 'v') {
      createVerticalRulerFreeLine(mouse.x);
      evt.stopPropagation();

    } else if (key === 'm') {
      toggleMarkerVisibility();
      evt.stopPropagation();
    }
  }

  function toggleMarkerVisibility(){
    const classList = rulerMainElement.classList;
    if (classList.contains('marker-always-visible')) {
      classList.remove('marker-always-visible');
    } else {
      classList.add('marker-always-visible');
    }
  }


  function createListItem() {
    return document.createElement('li');
  }

  function appendElements({ parent, elementCount, createElement }) {
    Array(Math.floor(elementCount))
      .fill(undefined)
      .map(createElement)
      .forEach(element => parent.appendChild(element));
  }

  function appendElement(target, element){
    target.appendChild(element);
    return element;
  }

  function createSubLines(snapLineType) {
    return appendElement(rulerMainElement, createElement({
      elementTag: 'div',
      classList: [`snap-line-${snapLineType} snap-line-div`]
    }));
  }

  function createSnapperLines() {
    snapLineTopDiv = createSubLines('horizontal snap-line-top');
    snapLineBottomDiv = createSubLines('horizontal snap-line-bottom');
    snapLineLeftDiv = createSubLines('vertical snap-line-left');
    snapLineRightDiv = createSubLines('vertical snap-line-right');
  }


  function init(document) {
    const {innerWidth, innerHeight} = window;

    mainElement = createElement({
      elementTag: 'div',
      classList: ['extract-colors-devtool', 'main-div'],
      innerHTML: CSS_TO_INJECT
    });
    rulerMainElement = createElement({
      elementTag: 'div',
      classList: [ 'ruler-main-div'],
      //innerHTML: CSS_TO_INJECT
    });
    linesMainElement = createElement({
      elementTag: 'div',
      classList: [ 'lines-main-div'],
      //innerHTML: CSS_TO_INJECT
    });
    mainElement.appendChild(rulerMainElement);
    mainElement.appendChild(linesMainElement);

    applyStyle(rulerMainElement, {
      display: determineRulersMode(),
    });

    rulerContainerHorizontalTop = createElement({
      elementTag: 'div',
      classList: ['ruler-container-horizontal-top single-ruler-div'],
    });

    const rulerContainerOuterY = createElement({
      elementTag: 'div',
      classList: ['ruler-container-vertical-left-outer-div'],
    });
    rulerContainerVerticalLeft = createElement({
      elementTag: 'div',
      classList: ['ruler-container-vertical-left single-ruler-div'],
    });

    rulerUlX = createElement({
      elementTag: 'ul',
      classList: ['ruler-x-ul'],
    });

    rulerUlY = createElement({
      elementTag: 'ul',
      classList: ['ruler-y-ul'],
    });

    createListItemsX(rulerUlX, innerWidth);
    createListItemsY(rulerUlY, innerHeight);

    rulerContainerVerticalLeft.append(rulerUlY);
    rulerContainerHorizontalTop.append(rulerUlX);

    rulerMainElement.append(rulerContainerHorizontalTop);
    rulerMainElement.append(rulerContainerOuterY);
    rulerContainerOuterY.append(rulerContainerVerticalLeft);

    document.body.appendChild(mainElement);
    //document.body.appendChild(rulerMainElement);

    window.addEventListener('resize', createListItemsXandY);

    applyLineColor();
    applyLineWidth();

    chrome.runtime.onMessage
      .addListener((message, _sender, _response) => {
        if (debugging) {
          console.log("message:", message);
        }
        return handleMessage(message, rulerMainElement);
      });

    handleMessage({
      type: 'ENABLE',
      value: true
    }, rulerMainElement);

    initDocumentListener();
    createSnapperLines();
    if (debugging) {
      setSnapperVisible(false);
    }
  }

  if (document) {
    init(document);
  }
}

