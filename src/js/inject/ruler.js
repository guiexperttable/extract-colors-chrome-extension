chrome.runtime.onMessage.addListener((_msg, _sender, _response) => {
});



if (!window['rulerLoaded']) {

  window['rulerLoaded'] = true;

  const MAX_Z_INDEX = '2147483647';
  const RULER_SIZE = 20;
  const RULER_EXT_ENABLED = '__ruler_ext_ENABLED';
  const RULER_EXT_LINE_VISIBILITY = '__ruler_ext_LINE_VISIBILITY';
  const RULER_EXT_RULER_VISIBILITY = '__ruler_ext_RULER_VISIBILITY';
  const RULER_EXT_LINE_COLOR = '__ruler_ext_LINE_COLOR';
  const RULER_EXT_LINE_WIDTH = '__ruler_ext_LINE_WIDTH';
  const crossIcon = `&#10005;`;

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


  const mouse = {
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  };



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


  function createUpdateDOM(config) {
    const {rule, className, indicator, value, event} = config;
    if (event.target.className === rule) {
      const element = createElement({
        elementTag: 'div',
        classList: [className],
        innerHTML: value + ` ${indicator}`
      });

      const crossElement = createElement({
        elementTag: 'button',
        classList: ['__ruler_delete_line'],
        title: 'Right Click + Backspace',
        innerHTML: crossIcon
      });
      element.addEventListener('click', (event) => {
        const selector = (indicator === 'Y') ? '.__rulerXline' : '.__rulerYline';
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
    setStorage(RULER_EXT_ENABLED, value);
    if (isNotNull(value)) {
      setDisplay(element, value === true);
    }
  }

  function setLineVisibility(value) {
    setStorage(RULER_EXT_LINE_VISIBILITY, value);
    document.querySelectorAll('#__ext_ruler_line').forEach((element) => {
      if (element) {
        setDisplay(element, !value);
      }
    })
  }

  function toggleRulerVisibility(value) {
    setStorage(RULER_EXT_RULER_VISIBILITY, value);
    document
      .querySelectorAll('.__ruler_EXT')
      .forEach((element) => {
        if (element) {
          setDisplay(element, !value);
        }
      });
  }

  function removeRulerLines() {
    document
      .querySelectorAll('#__ext_ruler_line')
      .forEach((element) => {
        if (element) {
          element.remove();
        }
      });
  }

  function setLineColor(color) {
    setStorage(RULER_EXT_LINE_COLOR, color);
    if (isNotUndefined(color)) {
      document.documentElement.style.setProperty('--lineColor', color);
    }
  }

  function setLineWidth(width) {
    setStorage(RULER_EXT_LINE_WIDTH, width);
    if (isNotUndefined(width)) {
      document.documentElement.style.setProperty('--lineWidth', width + 'px');
    }
  }

  function determineRulersMode() {
    const _rulersMode = getStorage(RULER_EXT_ENABLED);
    if (_rulersMode === 'true') {
      return 'block';
    }
    return 'none';
  }

  function applyLineColor() {
    const lineColor = getStorage(RULER_EXT_LINE_COLOR);
    if (isNotUndefined(lineColor)) document.documentElement.style.setProperty('--lineColor', lineColor);
  }

  function applyLineWidth() {
    const lineWidth = getStorage(RULER_EXT_LINE_WIDTH);
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
      classList: ['__rulerXline'],
      id: '__ext_ruler_line'
    });
    applyStyle(rulerLineElement, {
      width: '100%',
      height: '10px',
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

    rulerMainElement.append(rulerLineElement)
  }

  function onRulerYClick() {
    document.body.style.cursor = 'col-resize';
    mouse.startX = mouse.x;
    mouse.startY = mouse.y;
    rulerLineElement = createElement({
      elementTag: 'div',
      classList: ['__rulerYline'],
      id: '__ext_ruler_line',
    });
    applyStyle(rulerLineElement, {
      width: '10px',
      height: '100vh',
      background: 'transparent',
      position: 'fixed',
      zIndex: MAX_Z_INDEX,
      cursor: 'col-resize',
      top: '0px',
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
      createUpdateDOM({
        rule: '__rulerXline',
        className: '__rulerXContent__EL',
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
      createUpdateDOM({
        rule: '__rulerYline',
        className: '__rulerYContent__EL',
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
        createUpdateDOM({
          rule: '__rulerXline',
          className: '__rulerXContent__EL',
          indicator: 'Y',
          value: event.clientY,
          event,
        });
        updatePositionInPixel(targetElement, 'top', mouse.y);
      } else if (clickedY) {
        createUpdateDOM({
          rule: '__rulerYline',
          className: '__rulerYContent__EL',
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

  function onMouseMove(e) {
    if (targetElement) {
      moveTargetElement(e);
    } else if (clickedX) {
      onRulerXMouseMove(e);
    } else if (clickedY) {
      onRulerYMouseMove(e);
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

  function onKeyDown(e) {
    const {key} = e
    if (key === 'Backspace' && targetElement) {
      targetElement.remove();
    }
    if (mouseDown && key === 'h') {
      rulerLineElement = createElement({
        elementTag: 'div',
        classList: ['__rulerXline'],
        id: '__ext_ruler_line',
      });
      applyStyle(rulerLineElement, {
        width: '100%',
        height: '10px',
        background: 'transparent',
        position: 'fixed',
        zIndex: '9999999999999999999',
        cursor: 'row-resize',
        top: mouse.y + 'px',
        left: '0px',
      });
      targetElement = rulerLineElement
      rulerLineElement.addEventListener('mousedown', (event) => {
        targetElement = event.target;
        clickedX = true;
      });

      rulerMainElement.append(rulerLineElement);
    }
    if (mouseDown && key === 'v') {
      rulerLineElement = createElement({
        elementTag: 'div',
        classList: ['__rulerYline'],
        id: '__ext_ruler_line',
      });

      applyStyle(rulerLineElement, {
        width: '10px',
        height: '100vh',
        background: 'transparent',
        position: 'fixed',
        zIndex: '9999999999999999999',
        cursor: 'col-resize',
        top: '0px',
        left: mouse.x + 'px',
      });
      targetElement = rulerLineElement;

      rulerLineElement.addEventListener('mousedown', (event) => {
        targetElement = event.target
        clickedY = true
      });
      rulerMainElement.append(rulerLineElement);
    }
  }


  function createListItem() {
    const listItem = document.createElement('li');
    listItem.style.boxSizing = 'initial';
    return listItem;
  }

  function appendElements({ parent, elementCount, createElement }) {
    Array(Math.floor(elementCount))
      .fill(undefined)
      .map(createElement)
      .forEach(element => parent.appendChild(element));
  }

  function init(document) {
    const {innerWidth, innerHeight} = window;

    rulerMainElement = createElement({
      elementTag: 'div',
      classList: ['extract-colors-devtool', '__ruler_EXT_MAIN'],
    });

    applyStyle(rulerMainElement, {
      display: determineRulersMode(),
    });

    rulerContainerX = createElement({
      elementTag: 'div',
      classList: ['__rulerX __ruler_EXT'],
    });

    rulerContainerY = createElement({
      elementTag: 'div',
      classList: ['__rulerY __ruler_EXT'],
    });

    rulerElementX = createElement({
      elementTag: 'ul',
      classList: ['__ruler_X'],
    });

    rulerElementY = createElement({
      elementTag: 'ul',
      classList: ['__ruler_Y'],
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
      .addListener((msg, _sender, _response) => {
        console.log("inner ruler listen msg:", msg);
        return handleMessage(msg, rulerMainElement);
      });

    handleMessage({
      type: 'ENABLE',
      value: true
    }, rulerMainElement);

    initMouseAndKeyListener();
  }

  if (document) {
    init(document);
  }
}

