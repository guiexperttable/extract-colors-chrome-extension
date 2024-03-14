
if (!window['rulerLoaded']) {
  window['rulerLoaded'] = true;

  (function () {
    // -------------------------------------------------------------   util.js


    const {innerWidth, innerHeight} = window

    const crossIcon = `&#10005;`

    const resetBodyStyle = () => {
      if (document) {
        document.body.style.cursor = 'row-resize'
        document.body.style.userSelect = 'none'
      }
    }

    /**
     *
     * @param {HTMLElement} element - HTML Element
     * @param {object} style - JavaScript css style object
     *
     *  use:
     * applyStyle(element, {
     *    color:'red',
     *    marginRight:'10px'
     * })
     */
    const applyStyle = (element, style) => {
      for (const property in style) element.style[property] = style[property]
    }

    /**
     *  create DOM
     *  use:
     * __createElement({
     *    Tag:'div',
     *    innerHTML:'Hello World'
     * })
     *  */
    const createElement = (initObj) => {
      const element = document.createElement(initObj.Tag)
      for (const prop in initObj) {
        if (prop === 'childNodes') {
          initObj.childNodes.forEach(function (node) {
            element.appendChild(node)
          })
        } else if (prop === 'attributes') {
          initObj.attributes.forEach(function (attr) {
            element.setAttribute(attr.key, attr.value)
          })
        } else {
          element[prop] = initObj[prop]
        }
      }

      return element
    }

    /** check position */
    const isTop = (clientY) => clientY <= 20
    const isRight = (clientX) => clientX <= 20

    /** func to create and update dom */
    const createUpdateDOM = (config) => {
      const {rule, className, indicator, value, event} = config
      if (event.target.className === rule) {
        const element = createElement({
          Tag: 'div',
          classList: [className],
          innerHTML: value + ` ${indicator}`,
        })

        const crossElement = createElement({
          Tag: 'button',
          classList: ['__ruler_delete_line'],
          title: 'Right Click + Backspace',
          innerHTML: crossIcon,
        })
        element.addEventListener('click', (event) => {
          const selector =  (indicator === 'Y') ? '.__rulerXline' : '.__rulerYline';
          event.target.closest(selector).remove();
        })
        element.appendChild(crossElement)
        event.target.innerHTML = ''
        event.target.appendChild(element)
      }
    }


    const updatePositionInPixel = (element, key, value) =>
      applyStyle(element, {
        [key]: value + 'px',
      })


    const getStorage = (key) => localStorage.getItem(key)
    const setStorage = (key, value) => localStorage.setItem(key, value)

    const isNotNull = (value) => value !== null

    const isNotUndefined = (value) => value !== undefined && value !== 'undefined'


// -------------------------------------------------------------   helper.js

    function setDisplay(element, value){
      element.style.display = (value === true) ? 'block': 'none';
    }

    const enableRuler = (value, element) => {
      setStorage('__ruler_ext_ENABLED', value)
      if (isNotNull(value)) {
        element.style.display = (value === true) ? 'block': 'none';
      }
    }

    const setLineVisibility = (value) => {
      setStorage('__ruler_ext_LINE_VISIBILITY', value)
      document.querySelectorAll('#__ext_ruler_line').forEach((el) => {
        if (el) {
          el.style.display = value ? 'none' : 'block'
        }
      })
    }

    const toggleRulerVisibility = (value) => {
      setStorage('__ruler_ext_RULER_VISIBILITY', value)
      document.querySelectorAll('.__ruler_EXT').forEach((el) => {
        if (el) {
          el.style.display = value ? 'none' : 'block'
        }
      })
    }

    const removeRulerLines = () => {
      document.querySelectorAll('#__ext_ruler_line')
        .forEach((element) => {
        if (element) {
          element.remove()
        }
      })
    }

    const setLineColor = (color) => {
      setStorage('__ruler_ext_LINE_COLOR', color)
      if (isNotUndefined(color)) {
        document.documentElement.style.setProperty('--lineColor', color)
      }
    }

    const setLineWidth = (width) => {
      setStorage('__ruler_ext_LINE_WIDTH', width)
      if (isNotUndefined(width)) {
        document.documentElement.style.setProperty('--lineWidth', width + 'px')
      }
    }

    const determineRulersMode = () => {
      const _rulersMode = getStorage('__ruler_ext_ENABLED')
      if (_rulersMode === 'true') {
        return 'block'
      }
      return 'none'
    }

    const applyLineColor = () => {
      const lineColor = getStorage('__ruler_ext_LINE_COLOR')
      if (isNotUndefined(lineColor))
        document.documentElement.style.setProperty('--lineColor', lineColor)
    }

    const applyLineWidth = () => {
      const lineWidth = getStorage('__ruler_ext_LINE_WIDTH')
      if (isNotUndefined(lineWidth) && isNotNull(lineWidth))
        document.documentElement.style.setProperty('--lineWidth', lineWidth + 'px')
    }

    const handleMessage = (signal, target) => {
      const {type, value} = signal
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


// -------------------------------------------------------------   app.js

    if (document) {
      console.log('document...'); // TODO
      let rulerLineElement = null // ruler line
      let clickedX = false // is clicked on ruler contgainer area
      let clickedY = false // is clicked on ruler contgainer area
      let mouseDown = false
      let targetElement = null

      /** preserve mouse position */
      const mouse = {
        x: 0,
        y: 0,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0,
      }

      /** set mouse position on move */
      const setMousePosition = (e) => {
        const ev = e || window.event // Moz || IE
        const {clientX, clientY} = ev
        if (ev.pageX) {
          // Moz
          mouse.x = clientX
          mouse.y = clientY
        } else if (clientX) {
          // IE
          mouse.x = clientX
          mouse.y = clientY
        }
      }

      /** set initial mouse position on click */
      // const setInitialPosition = (e) => {
      //   const ev = e || window.event // Moz || IE
      //   if (ev.pageX) {
      //     // Moz
      //     mouse.initialX = ev.layerX
      //     mouse.initialY = ev.layerY
      //   } else if (ev.clientX) {
      //     // IE
      //     mouse.initialX = ev.layerX
      //     mouse.initialY = ev.layerY
      //   }
      // }

      const rulerMainElement = createElement({
        Tag: 'div',
        classList: ['__ruler_EXT_MAIN'],
      })

      applyStyle(rulerMainElement, {
        display: determineRulersMode(),
      })

      /** ruler X container */
      const rulerContainerX = createElement({
        Tag: 'div',
        classList: ['__rulerX __ruler_EXT'],
      })

      /** ruler Y container */
      const rulerContainerY = createElement({
        Tag: 'div',
        classList: ['__rulerY __ruler_EXT'],
      })

      /** ruler X list container */
      const rulerElementX = createElement({
        Tag: 'ul',
        classList: ['__ruler_X'],
      })

      /** ruler Y list container */
      const rulerElementY = createElement({
        Tag: 'ul',
        classList: ['__ruler_Y'],
      })

      rulerElementX.addEventListener('mouseover', () => {
        rulerElementX.style.cursor = 'row-resize'
      })

      rulerElementY.addEventListener('mouseover', () => {
        rulerElementY.style.cursor = 'col-resize'
      })

      const onRulerXClick = () => {
        mouse.startX = mouse.x
        mouse.startY = mouse.y
        rulerLineElement = createElement({
          Tag: 'div',
          classList: ['__rulerXline'],
          id: '__ext_ruler_line',
        })
        applyStyle(rulerLineElement, {
          width: '100%',
          height: '10px',
          background: 'transparent',
          position: 'fixed',
          zIndex: '9999999999999999999',
          cursor: 'row-resize',
        })
        targetElement = rulerLineElement
        rulerLineElement.addEventListener('mousedown', (event) => {
          targetElement = event.target
          clickedX = true
        })

        rulerMainElement.append(rulerLineElement)
      }

      const onRulerYClick = () => {
        document.body.style.cursor = 'col-resize'
        mouse.startX = mouse.x
        mouse.startY = mouse.y
        rulerLineElement = createElement({
          Tag: 'div',
          classList: ['__rulerYline'],
          id: '__ext_ruler_line',
        })
        applyStyle(rulerLineElement, {
          width: '10px',
          height: '100vh',
          background: 'transparent',
          position: 'fixed',
          zIndex: '9999999999999999999',
          cursor: 'col-resize',
          top: '0px',
        })
        targetElement = rulerLineElement

        rulerLineElement.addEventListener('mousedown', (event) => {
          targetElement = event.target
          clickedY = true
        })
        rulerMainElement.append(rulerLineElement)
      }

      const onRulerXMouseMove = (event) => {
        setMousePosition(event)
        if (clickedX && rulerLineElement !== null) {
          createUpdateDOM({
            rule: '__rulerXline',
            className: '__rulerXContent__EL',
            indicator: 'Y',
            value: event.clientY,
            event,
          })

          resetBodyStyle()
          updatePositionInPixel(rulerLineElement, 'top', mouse.y)
        }
      }

      const onRulerYMouseMove = (event) => {
        setMousePosition(event)
        if (clickedY && rulerLineElement !== null) {
          createUpdateDOM({
            rule: '__rulerYline',
            className: '__rulerYContent__EL',
            indicator: 'X',
            value: event.clientX,
            event,
          })

          resetBodyStyle()
          updatePositionInPixel(rulerLineElement, 'left', mouse.x)
        }
      }

      const moveTargetElement = (event) => {
        setMousePosition(event)
        if (targetElement) {
          resetBodyStyle()
          if (clickedX) {
            createUpdateDOM({
              rule: '__rulerXline',
              className: '__rulerXContent__EL',
              indicator: 'Y',
              value: event.clientY,
              event,
            })
            updatePositionInPixel(targetElement, 'top', mouse.y)
          } else if (clickedY) {
            createUpdateDOM({
              rule: '__rulerYline',
              className: '__rulerYContent__EL',
              indicator: 'X',
              value: event.clientX,
              event,
            })
            updatePositionInPixel(targetElement, 'left', mouse.x)
          }
        }
      }

      // TODO add listener
      document.onmousedown = (e) => {
        const {clientY, clientX} = e
        mouseDown = true
        setMousePosition(e)
        if (isTop(clientY)) {
          clickedX = true
          onRulerXClick(e)
        } else if (isRight(clientX)) {
          clickedY = true
          onRulerYClick(e)
        }
      }

      // TODO add listener
      document.onmousemove = (e) => {
        if (targetElement) {
          moveTargetElement(e)
        } else if (clickedX) {
          onRulerXMouseMove(e)
        } else if (clickedY) {
          onRulerYMouseMove(e)
        }
      }

      // TODO add listener
      document.onmouseup = (e) => {
        clickedX = false
        clickedY = false
        mouseDown = false
        __ruler__Line__ruler__Line = null
        targetElement = null
        document.body.style.userSelect = 'auto'
        document.body.style.cursor = 'auto'
      }

      // TODO add listener
      document.onkeydown = (e) => {
        const {key} = e
        if (key === 'Backspace' && targetElement) {
          targetElement.remove()
        }
        if (mouseDown && key === 'h') {
          rulerLineElement = createElement({
            Tag: 'div',
            classList: ['__rulerXline'],
            id: '__ext_ruler_line',
          })
          applyStyle(rulerLineElement, {
            width: '100%',
            height: '10px',
            background: 'transparent',
            position: 'fixed',
            zIndex: '9999999999999999999',
            cursor: 'row-resize',
            top: mouse.y + 'px',
            left: '0px',
          })
          targetElement = rulerLineElement
          rulerLineElement.addEventListener('mousedown', (event) => {
            targetElement = event.target
            clickedX = true
          })

          rulerMainElement.append(rulerLineElement)
        }
        if (mouseDown && key === 'v') {
          rulerLineElement = createElement({
            Tag: 'div',
            classList: ['__rulerYline'],
            id: '__ext_ruler_line',
          })
          applyStyle(rulerLineElement, {
            width: '10px',
            height: '100vh',
            background: 'transparent',
            position: 'fixed',
            zIndex: '9999999999999999999',
            cursor: 'col-resize',
            top: '0px',
            left: mouse.x + 'px',
          })
          targetElement = rulerLineElement

          rulerLineElement.addEventListener('mousedown', (event) => {
            targetElement = event.target
            clickedY = true
          })
          rulerMainElement.append(rulerLineElement)
        }
      }


      const loop = (loopCount, rulerListContainer) => {
        for (let _ = 0; _ <= loopCount; _++) {
          let e = document.createElement('li')
          e.style.boxSizing = 'initial'
          rulerListContainer.appendChild(e)
        }
      }

      // /** rulerX lists */
      loop(Math.round(innerWidth / 50), rulerElementX)

      // /** rulerY lists */
      loop(Math.round(innerHeight / 50), rulerElementY)

      /** append rulers to container */
      rulerContainerY.append(rulerElementY)
      rulerContainerX.append(rulerElementX)

      /** append ruler to body */
      rulerMainElement.append(rulerContainerX)
      rulerMainElement.append(rulerContainerY)
      document.body.appendChild(rulerMainElement)

      /** listen for windo resize */
      window.addEventListener('resize', function (event) {
        const {innerWidth, innerHeight} = event.currentTarget

        /** clear existing rulers and calculate new rulers */
        rulerElementX.innerHTML = ''
        rulerElementY.innerHTML = ''
        loop(Math.round(innerWidth / 50), rulerElementX)
        loop(Math.round(innerHeight / 50), rulerElementY)
      })
      applyLineColor();
      applyLineWidth();

      chrome.runtime.onMessage.addListener((msg, sender, response) => {
        console.log('innen ruler listen msg:', msg);
        return handleMessage(msg, rulerMainElement);
      });

      handleMessage({
        type: 'ENABLE', value: true
      }, rulerMainElement);
    }

  })();

}

chrome.runtime.onMessage.addListener((msg, sender, response) => {});