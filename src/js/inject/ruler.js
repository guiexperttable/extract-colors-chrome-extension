

chrome.runtime.onMessage.addListener((_msg, _sender, _response) => {
});



if (!window['rulerLoaded']) {

  window['rulerLoaded'] = true;

  const MAX_Z_INDEX = '2147483647';
  const FREELINE_SIZE = 10;
  const RULER_SIZE = 20;

  const STORAGE_KEY_RULER_EXT_ENABLED = 'ruler-div-enabled';
  const STORAGE_KEY_RULER_EXT_LINE_VISIBILITY = 'ruler-div-line-visibility';
  const STORAGE_KEY_RULER_EXT_RULER_VISIBILITY = 'ruler-div-ruler-visibility';
  const STORAGE_KEY_RULER_EXT_LINE_COLOR = 'ruler-div-line-color';
  const STORAGE_KEY_RULER_EXT_LINE_WIDTH = 'ruler-div-line-width';

  const crossIcon = `&#10005;`;
  const DELETE_KEY = `Backspace`;

  let rulerLineElement = null;
  let clickedX = false;
  let clickedY = false;
  let mouseDown = false;
  let targetElement = null;

  let rulerMainElement;
  let rulerContainerX;
  let rulerContainerY;
  let rulerElementX;
  let rulerElementY;

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
    if (visible){
      snapLineTopDiv.classList.remove('hidden');
      snapLineBottomDiv.classList.remove('hidden');
      snapLineLeftDiv.classList.remove('hidden');
      snapLineRightDiv.classList.remove('hidden');
    } else {
      snapLineTopDiv.classList.add('hidden');
      snapLineBottomDiv.classList.add('hidden');
      snapLineLeftDiv.classList.add('hidden');
      snapLineRightDiv.classList.add('hidden');
    }
  }


  function createListItemsX(rulerElementX, innerWidth) {
    appendElements({
      parent: rulerElementX,
      elementCount: innerWidth / 50,
      createElement: createListItem
    });
  }

  function createListItemsY(rulerElementY, innerHeight) {
    appendElements({
      parent: rulerElementY,
      elementCount: innerHeight / 50,
      createElement: createListItem
    });
  }

  function createListItemsXandY(event) {
    const {innerWidth, innerHeight} = event.currentTarget;

    rulerElementX.innerHTML = "";
    rulerElementY.innerHTML = "";
    createListItemsX(rulerElementX, innerWidth);
    createListItemsY(rulerElementY, innerHeight);
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


  function isTop(clientY) {
    return clientY <= RULER_SIZE;
  }

  function isRight(clientX) {
    return clientX <= RULER_SIZE;
  }


  function createLineMarkerWithDeleteButton(config) {
    const {targetClassName, className, indicator, value, event} = config;
    if (event.target.className === targetClassName) {
      const element= createElement({
        elementTag: 'div',
        classList: [className],
        innerHTML: `<div>${indicator}: ${value}</div>`
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
      event.target.innerHTML = '';
      event.target.appendChild(element);
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
    if (type === 'ENABLE') {
      enableRuler(value, target);
      return true;
    }
    if (type === 'TOGGLE_LINE_VISIBILITY') {
      setLineVisibility(value);
      return true;
    }
    if (type === 'TOGGLE_RULER_VISIBILITY') {
      toggleRulerVisibility(value);
      return true;
    }
    if (type === 'CLEAR') {
      removeRulerLines();
      return true;
    }
    if (type === 'CHANGE_COLOR') {
      setLineColor(value);
      return true;
    }
    if (type === 'CHANGE_WIDTH') {
      setLineWidth(value);
      return true;
    }
    return false;
  }

  function saveMousePosition(ev) {
    const {clientX, clientY} = ev
    mouse.x = clientX;
    mouse.y = clientY;
  }


  function onRulerXClick() {
    mouse.startX = mouse.x;
    mouse.startY = mouse.y;
    rulerLineElement = createElement({
      elementTag: 'div',
      classList: ['ruler-free-horizontal-line']
    });
    applyStyle(rulerLineElement, {
      width: '100%',
      height: `${FREELINE_SIZE}px`,
      background: 'transparent',
      position: 'fixed',
      zIndex: MAX_Z_INDEX,
      cursor: 'row-resize',
    });
    targetElement = rulerLineElement;
    rulerLineElement.addEventListener('mousedown', (event) => {
      targetElement = event.target;
      clickedX = true;
    })

    rulerMainElement.append(rulerLineElement);
  }

  function onRulerYClick() {
    document.body.style.cursor = 'col-resize';
    mouse.startX = mouse.x;
    mouse.startY = mouse.y;
    rulerLineElement = createElement({
      elementTag: 'div',
      classList: ['ruler-free-vertical-line']
    });
    applyStyle(rulerLineElement, {
      width: `${FREELINE_SIZE}px`,
      height: '100%',
      background: 'transparent',
      position: 'fixed',
      zIndex: MAX_Z_INDEX,
      cursor: 'col-resize',
      top: '0',
    });
    targetElement = rulerLineElement;

    rulerLineElement.addEventListener('mousedown', (event) => {
      targetElement = event.target;
      clickedY = true;
    })
    rulerMainElement.append(rulerLineElement);
  }

  function onRulerXMouseMove(event) {
    saveMousePosition(event);
    if (clickedX && rulerLineElement !== null) {
      createLineMarkerWithDeleteButton({
        targetClassName: 'ruler-free-horizontal-line',
        className: 'line-marker',
        indicator: 'Y',
        value: event.clientY,
        event,
      });

      updatePositionInPixel(rulerLineElement, 'top', mouse.y);
    }
  }

  function onRulerYMouseMove(event) {
    saveMousePosition(event);
    if (clickedY && rulerLineElement !== null) {
      createLineMarkerWithDeleteButton({
        targetClassName: 'ruler-free-vertical-line',
        className: 'line-marker',
        indicator: 'X',
        value: event.clientX,
        event,
      });

      updatePositionInPixel(rulerLineElement, 'left', mouse.x);
    }
  }

  function moveTargetElement(event) {
    saveMousePosition(event);
    if (targetElement) {
      if (clickedX) {
        createLineMarkerWithDeleteButton({
          targetClassName: 'ruler-free-horizontal-line',
          className: 'line-marker',
          indicator: 'Y',
          value: event.clientY,
          event,
        });
        updatePositionInPixel(targetElement, 'top', mouse.y);

      } else if (clickedY) {
        createLineMarkerWithDeleteButton({
          targetClassName: 'ruler-free-vertical-line',
          className: 'line-marker',
          indicator: 'X',
          value: event.clientX,
          event,
        });
        updatePositionInPixel(targetElement, 'left', mouse.x);
      }
    }
  }

  function onMouseDown(e) {
    const {clientY, clientX} = e;
    mouseDown = true;
    saveMousePosition(e);
    if (isTop(clientY)) {
      clickedX = true;
      onRulerXClick(e);
    } else if (isRight(clientX)) {
      clickedY = true;
      onRulerYClick(e);
    }
  }

  function initMouseAndKeyListener() {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
  }


  function moveSnapLines(target) {
    const {left, top, width, height} = target.getBoundingClientRect();
    const absoluteX = left + window.scrollX;
    const absoluteY = top + window.scrollY;

    applyStyle(snapLineLeftDiv, {
      left: `${absoluteX}px`,
      display: 'block'
    });
    applyStyle(snapLineRightDiv, {
      left: `${absoluteX + width}px`,
      display: 'block'
    });
    applyStyle(snapLineTopDiv, {
      top: `${absoluteY}px`,
      display: 'block'
    });
    applyStyle(snapLineBottomDiv, {
      top: `${absoluteY + height}px`,
      display: 'block'
    });
  }

  function convertSnapToRulerLine() {
    createHorizontalRulerLine(snapLineTopDiv.getBoundingClientRect().top - FREELINE_SIZE/2);
    createHorizontalRulerLine(snapLineBottomDiv.getBoundingClientRect().top - FREELINE_SIZE/2);
    createVerticalRulerLine(snapLineLeftDiv.getBoundingClientRect().left - FREELINE_SIZE/2);
    createVerticalRulerLine(snapLineRightDiv.getBoundingClientRect().left - FREELINE_SIZE/2);

    setSnapperVisible(false);
  }

  function createVerticalRulerLine(x) {
    rulerLineElement = createElement({
      elementTag: 'div',
      classList: ['ruler-free-vertical-line']
    });

    applyStyle(rulerLineElement, {
      width: '10px',
      height: '100%',
      background: 'transparent',
      position: 'fixed',
      zIndex: MAX_Z_INDEX,
      cursor: 'col-resize',
      top: '0',
      left: x + 'px',
    });
    targetElement = rulerLineElement;

    rulerLineElement.addEventListener('mousedown', (event) => {
      targetElement = event.target
      clickedY = true
    });
    rulerMainElement.append(rulerLineElement);
  }

  function createHorizontalRulerLine(y) {
    rulerLineElement = createElement({
      elementTag: 'div',
      classList: ['ruler-free-horizontal-line'],
    });
    applyStyle(rulerLineElement, {
      width: '100%',
      height: '10px',
      background: 'transparent',
      position: 'fixed',
      zIndex: MAX_Z_INDEX,
      cursor: 'row-resize',
      top: y + 'px',
      left: '0',
    });
    targetElement = rulerLineElement
    rulerLineElement.addEventListener('mousedown', (event) => {
      targetElement = event.target;
      clickedX = true;
    });

    rulerMainElement.append(rulerLineElement);
  }


  function onMouseMove(evt) {
    const target = evt.target;

    if (targetElement) {
      moveTargetElement(evt);
    } else if (clickedX) {
      onRulerXMouseMove(evt);
    } else if (clickedY) {
      onRulerYMouseMove(evt);
    } else {
      moveSnapLines(target);
    }
  }

  function onMouseUp(_evt) {
    clickedX = false;
    clickedY = false;
    mouseDown = false;
    targetElement = null;
    document.body.style.userSelect = 'auto';
    document.body.style.cursor = 'auto';
  }

  function onKeyDown(evt) {
    const {key} = evt;
    console.log(evt);
    if (key === DELETE_KEY && targetElement) {
      targetElement.remove();
    }
    if (isSnapperVisible() && key === 's') {
      convertSnapToRulerLine();
    }
    if (mouseDown && key === 'h') {
      createHorizontalRulerLine(mouse.y);
    }
    if (mouseDown && key === 'v') {
      createVerticalRulerLine(mouse.x);
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

  function createSnapperLines(){
    snapLineTopDiv = appendElement(rulerMainElement, createElement( {
      elementTag: 'div',
      classList: ['snap-line-horizontal snap-line-top snap-line-div']
    }));
    snapLineBottomDiv = appendElement(rulerMainElement, createElement( {
      elementTag: 'div',
      classList: ['snap-line-horizontal snap-line-bottom snap-line-div']
    }));
    snapLineLeftDiv = appendElement(rulerMainElement, createElement( {
      elementTag: 'div',
      classList: ['snap-line-vertical snap-line-left snap-line-div']
    }));
    snapLineRightDiv = appendElement(rulerMainElement, createElement( {
      elementTag: 'div',
      classList: ['snap-line-vertical snap-line-right snap-line-div']
    }));
  }

  function init(document) {
    const {innerWidth, innerHeight} = window;

    rulerMainElement = createElement({
      elementTag: 'div',
      classList: ['extract-colors-devtool', 'ruler-main-div'],
      innerHTML:   `
 <style>     
.extract-colors-devtool {
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
    --ruler2-space: 50;

    --lineColor: rgba(0, 255, 255, 0.83);
    --lineWidth: 1px;

    --line-marker-bg: rgba(0,0,0,0.9);
    --line-marker-color: #fff;
    --line-marker-delete-btn-bg: #111;
    --line-marker-delete-btn-color: cyan;
    --line-marker-delete-btn-hover-bg: #fff;
    --line-marker-delete-btn-hover-color: #5e0000;

    --snap-line-color: rgba(255, 0, 0, 0.5);
}



.extract-colors-devtool {
    display: block;
}

.extract-colors-devtool .hidden{
    display: none;
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
    position: fixed;
    top: 0;
    right: 0;
    z-index: 2147483647;
    background-attachment: fixed;
    background-position: 0 0;
    box-sizing: initial;
}

.extract-colors-devtool .ruler-content-x-top {
    width: 100%;
    height: 20px;
    border-bottom: 1px solid var(--ruler-border-color);
    background-image: linear-gradient(90deg, var(--ruler-hash-mark-fraction-line) 0 var(--ruler1-bdw), transparent 0),
    linear-gradient(90deg, var(--ruler-hash-mark-main-line) 0 var(--ruler2-bdw), transparent 0);
    background-repeat: repeat-x, repeat-x;
    background-size: calc(var(--ruler-unit) * var(--ruler1-space) * var(--ruler-x)) var(--ruler1-h),
    calc(var(--ruler-unit) * var(--ruler2-space) * var(--ruler-x)) var(--ruler2-h);
}

.extract-colors-devtool .ruler-content-y-left {
    width: 22px;
    height: 100vh;
    left: 0;
    border-right: 1px solid var(--ruler-border-color);
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
    counter-reset: d 0;
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
    height: var(--ruler2-h);
    inset-block-start: 0;
    inset-inline-start: calc(var(--ruler-unit) * var(--ruler2-space));
    opacity: var(--ruler-x);
    width: 100%;
}

.extract-colors-devtool .ruler-y-ul {
    flex-direction: column;
    height: 100%;
    inset-block-start: calc(var(--ruler-unit) * var(--ruler2-space));
    inset-inline-start: 0;
    opacity: var(--ruler-y);
    width: var(--ruler2-h);
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
    counter-increment: d var(--ruler2-space);
    flex: 0 0 calc(var(--ruler-unit) * var(--ruler2-space));
    box-sizing: initial;
}

.extract-colors-devtool .ruler-y-ul li {
    margin-left: 3px;
}

.extract-colors-devtool .ruler-x-ul li::after {
    content: counter(d) '';
    line-height: 1;
    padding-inline-start: var(--ruler-num-padding-line-start);
}

.extract-colors-devtool .ruler-y-ul li::after {
    content: counter(d) '';
    display: block;
    padding-inline-end: var(--ruler-num-padding-line-start);
    transform: rotate(-90deg) translateY(-13px);
    transform-origin: 100% 0;
    text-align: end;
    width: fit-content;
}

.extract-colors-devtool .ruler-free-horizontal-line {
    left: 0;
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

.extract-colors-devtool .ruler-free-horizontal-line:hover .line-marker {
    display: flex;
}

.extract-colors-devtool .ruler-free-vertical-line:hover .line-marker {
    display: flex;
        /*display: grid;*/
        /*grid-template-columns: 1fr 20px;*/
        /*user-select: none;*/
}
</style>
`
    });

    applyStyle(rulerMainElement, {
      display: determineRulersMode(),
    });

    rulerContainerX = createElement({
      elementTag: 'div',
      classList: ['ruler-content-x-top single-ruler-div'],
    });

    rulerContainerY = createElement({
      elementTag: 'div',
      classList: ['ruler-content-y-left single-ruler-div'],
    });

    rulerElementX = createElement({
      elementTag: 'ul',
      classList: ['ruler-x-ul'],
    });

    rulerElementY = createElement({
      elementTag: 'ul',
      classList: ['ruler-y-ul'],
    });

    createListItemsX(rulerElementX, innerWidth);
    createListItemsY(rulerElementY, innerHeight);

    rulerContainerY.append(rulerElementY);
    rulerContainerX.append(rulerElementX);

    rulerMainElement.append(rulerContainerX);
    rulerMainElement.append(rulerContainerY);
    document.body.appendChild(rulerMainElement);


    window.addEventListener('resize', createListItemsXandY);

    applyLineColor();
    applyLineWidth();

    chrome.runtime.onMessage
      .addListener((message, _sender, _response) => {
        if (window.location.href.includes('debug=1')) {
          console.log("message:", message);
        }
        return handleMessage(message, rulerMainElement);
      });

    handleMessage({
      type: 'ENABLE',
      value: true
    }, rulerMainElement);

    initMouseAndKeyListener();

    createSnapperLines();
  }

  if (document) {
    init(document);
  }
}

