
if (!window['rulerLoaded']) {
  window['rulerLoaded'] = true;

  (function () {
    // -------------------------------------------------------------   util.js


    const {innerWidth, innerHeight} = window

    const crossIcon = `&#10005;`

    const __resetBodyStyle = () => {
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
     * __style = (element, {
     *    color:'red',
     *    marginRight:'10px'
     * })
     */
    const style = (element, style) => {
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
    const _createElement = (initObj) => {
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
        } else element[prop] = initObj[prop]
      }

      return element
    }

    /** check position */
    const __isTop = (clientY) => clientY <= 20
    const __isRight = (clientX) => clientX <= 20

    /** func to create and update dom */
    const __createUpdateDOM = (config) => {
      const {rule, className, indicator, value, event} = config
      if (event.target.className === rule) {
        const __el = _createElement({
          Tag: 'div',
          classList: [className],
          innerHTML: value + ` ${indicator}`,
        })

        const __crossEl = _createElement({
          Tag: 'button',
          classList: ['__ruler_delete_line'],
          title: 'Right Click + Backspace',
          innerHTML: crossIcon,
        })
        __el.addEventListener('click', (event) => {
          if (indicator === 'Y') {
            event.target.closest('.__rulerXline').remove()
          } else event.target.closest('.__rulerYline').remove()
        })
        __el.appendChild(__crossEl)
        event.target.innerHTML = ''
        event.target.appendChild(__el)
      }
    }

    /** update posotion */
    const __updatePOS = (element, key, value) =>
      style(element, {
        [key]: value + 'px',
      })

    /** storage controllers */
    const getStorage = (key) => localStorage.getItem(key)
    const setStorage = (key, value) => localStorage.setItem(key, value)

    const isNull = (value) => value !== null

    const isUndefined = (value) => value !== undefined && value !== 'undefined'


// -------------------------------------------------------------   helper.js


    const __enableRuler = (value, EL) => {
      setStorage('__ruler_ext_ENABLED', value)
      if (isNull(value)) {
        if (value === true) EL.style.display = 'block'
        else EL.style.display = 'none'
      }
    }

    const $__toggleLineVisibility = (value) => {
      setStorage('__ruler_ext_LINE_VISIBILITY', value)
      document.querySelectorAll('#__ext_ruler_line').forEach((el) => {
        if (el) {
          el.style.display = value ? 'none' : 'block'
        }
      })
    }

    const $__toggleRulerVisibility = (value) => {
      setStorage('__ruler_ext_RULER_VISIBILITY', value)
      document.querySelectorAll('.__ruler_EXT').forEach((el) => {
        if (el) {
          el.style.display = value ? 'none' : 'block'
        }
      })
    }

    const __clearAllLines = () => {
      document.querySelectorAll('#__ext_ruler_line').forEach((el) => {
        if (el) {
          el.remove()
        }
      })
    }

    const __changeLineColor = (color) => {
      setStorage('__ruler_ext_LINE_COLOR', color)
      if (isUndefined(color)) document.documentElement.style.setProperty('--lineColor', color)
    }

    const __changeLineWidth = (width) => {
      setStorage('__ruler_ext_LINE_WIDTH', width)
      if (isUndefined(width)) document.documentElement.style.setProperty('--lineWidth', width + 'px')
    }

    const __is_rulers_enabled = () => {
      const _rulersMode = getStorage('__ruler_ext_ENABLED')
      if (_rulersMode === 'true') {
        return 'block'
      }
      return 'none'
    }

    const __get_saved_line_color = () => {
      const __lineColor = getStorage('__ruler_ext_LINE_COLOR')
      if (isUndefined(__lineColor))
        document.documentElement.style.setProperty('--lineColor', __lineColor)
    }

    const __get_saved_line_width = () => {
      const __lineWidth = getStorage('__ruler_ext_LINE_WIDTH')
      if (isUndefined(__lineWidth) && isNull(__lineWidth))
        document.documentElement.style.setProperty('--lineWidth', __lineWidth + 'px')
    }

    const handleMessage = (signal, __ruler_EXT_MAIN) => {
      const {type, value} = signal
      if (type === 'ENABLE') {
        __enableRuler(value, __ruler_EXT_MAIN);
        return true;
      }
      if (type === 'TOGGLE_LINE_VISIBILITY') {
        $__toggleLineVisibility(value);
        return true;
      }
      if (type === 'TOGGLE_RULER_VISIBILITY') {
        $__toggleRulerVisibility(value);
        return true;
      }
      if (type === 'CLEAR') {
        __clearAllLines();
        return true;
      }
      if (type === 'CHANGE_COLOR') {
        __changeLineColor(value);
        return true;
      }
      if (type === 'CHANGE_WIDTH') {
        __changeLineWidth(value);
        return true;
      }
      return false;
    }


// -------------------------------------------------------------   app.js

    if (document) {
      console.log('document...'); // TODO
      let __ruler__Line = null // ruler line
      let __isClickedX = false // is clicked on ruler contgainer area
      let __isClickedY = false // is clicked on ruler contgainer area
      let __isMouseDown = false
      let __targetElement = null

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
      const setInitialPosition = (e) => {
        const ev = e || window.event // Moz || IE
        if (ev.pageX) {
          // Moz
          mouse.initialX = ev.layerX
          mouse.initialY = ev.layerY
        } else if (ev.clientX) {
          // IE
          mouse.initialX = ev.layerX
          mouse.initialY = ev.layerY
        }
      }

      const __ruler_EXT_MAIN = _createElement({
        Tag: 'div',
        classList: ['__ruler_EXT_MAIN'],
      })

      style(__ruler_EXT_MAIN, {
        display: __is_rulers_enabled(),
      })

      /** ruler X container */
      const __rulerContainer = _createElement({
        Tag: 'div',
        classList: ['__rulerX __ruler_EXT'],
      })

      /** ruler Y container */
      const __rulerContainerY = _createElement({
        Tag: 'div',
        classList: ['__rulerY __ruler_EXT'],
      })

      /** ruler X list container */
      const __rulerX = _createElement({
        Tag: 'ul',
        classList: ['__ruler_X'],
      })

      /** ruler Y list container */
      const __rulerY = _createElement({
        Tag: 'ul',
        classList: ['__ruler_Y'],
      })

      __rulerX.addEventListener('mouseover', () => {
        __rulerX.style.cursor = 'row-resize'
      })

      __rulerY.addEventListener('mouseover', () => {
        __rulerY.style.cursor = 'col-resize'
      })

      const __onRulerXClick = () => {
        mouse.startX = mouse.x
        mouse.startY = mouse.y
        __ruler__Line = _createElement({
          Tag: 'div',
          classList: ['__rulerXline'],
          id: '__ext_ruler_line',
        })
        style(__ruler__Line, {
          width: '100%',
          height: '10px',
          background: 'transparent',
          position: 'fixed',
          zIndex: '9999999999999999999',
          cursor: 'row-resize',
        })
        __targetElement = __ruler__Line
        __ruler__Line.addEventListener('mousedown', (event) => {
          __targetElement = event.target
          __isClickedX = true
        })

        __ruler_EXT_MAIN.append(__ruler__Line)
      }

      const __onRulerYClick = () => {
        document.body.style.cursor = 'col-resize'
        mouse.startX = mouse.x
        mouse.startY = mouse.y
        __ruler__Line = _createElement({
          Tag: 'div',
          classList: ['__rulerYline'],
          id: '__ext_ruler_line',
        })
        style(__ruler__Line, {
          width: '10px',
          height: '100vh',
          background: 'transparent',
          position: 'fixed',
          zIndex: '9999999999999999999',
          cursor: 'col-resize',
          top: '0px',
        })
        __targetElement = __ruler__Line

        __ruler__Line.addEventListener('mousedown', (event) => {
          __targetElement = event.target
          __isClickedY = true
        })
        __ruler_EXT_MAIN.append(__ruler__Line)
      }

      const __onRulerXMouseMove = (event) => {
        setMousePosition(event)
        if (__isClickedX && __ruler__Line !== null) {
          __createUpdateDOM({
            rule: '__rulerXline',
            className: '__rulerXContent__EL',
            indicator: 'Y',
            value: event.clientY,
            event,
          })

          __resetBodyStyle()
          __updatePOS(__ruler__Line, 'top', mouse.y)
        }
      }

      const __onRulerYMouseMove = (event) => {
        setMousePosition(event)
        if (__isClickedY && __ruler__Line !== null) {
          __createUpdateDOM({
            rule: '__rulerYline',
            className: '__rulerYContent__EL',
            indicator: 'X',
            value: event.clientX,
            event,
          })

          __resetBodyStyle()
          __updatePOS(__ruler__Line, 'left', mouse.x)
        }
      }

      const __moveTargetElement = (event) => {
        setMousePosition(event)
        if (__targetElement) {
          __resetBodyStyle()
          if (__isClickedX) {
            __createUpdateDOM({
              rule: '__rulerXline',
              className: '__rulerXContent__EL',
              indicator: 'Y',
              value: event.clientY,
              event,
            })
            __updatePOS(__targetElement, 'top', mouse.y)
          } else if (__isClickedY) {
            __createUpdateDOM({
              rule: '__rulerYline',
              className: '__rulerYContent__EL',
              indicator: 'X',
              value: event.clientX,
              event,
            })
            __updatePOS(__targetElement, 'left', mouse.x)
          }
        }
      }

      document.onmousedown = (e) => {
        const {clientY, clientX} = e
        __isMouseDown = true
        setMousePosition(e)
        if (__isTop(clientY)) {
          __isClickedX = true
          __onRulerXClick(e)
        } else if (__isRight(clientX)) {
          __isClickedY = true
          __onRulerYClick(e)
        }
      }

      document.onmousemove = (e) => {
        if (__targetElement) {
          __moveTargetElement(e)
        } else if (__isClickedX) {
          __onRulerXMouseMove(e)
        } else if (__isClickedY) {
          __onRulerYMouseMove(e)
        }
      }

      document.onmouseup = (e) => {
        __isClickedX = false
        __isClickedY = false
        __isMouseDown = false
        __ruler__Line__ruler__Line = null
        __targetElement = null
        document.body.style.userSelect = 'auto'
        document.body.style.cursor = 'auto'
      }

      document.onkeydown = (e) => {
        const {key} = e
        if (key === 'Backspace' && __targetElement) {
          __targetElement.remove()
        }
        if (__isMouseDown && key === 'h') {
          __ruler__Line = _createElement({
            Tag: 'div',
            classList: ['__rulerXline'],
            id: '__ext_ruler_line',
          })
          style(__ruler__Line, {
            width: '100%',
            height: '10px',
            background: 'transparent',
            position: 'fixed',
            zIndex: '9999999999999999999',
            cursor: 'row-resize',
            top: mouse.y + 'px',
            left: '0px',
          })
          __targetElement = __ruler__Line
          __ruler__Line.addEventListener('mousedown', (event) => {
            __targetElement = event.target
            __isClickedX = true
          })

          __ruler_EXT_MAIN.append(__ruler__Line)
        }
        if (__isMouseDown && key === 'v') {
          __ruler__Line = _createElement({
            Tag: 'div',
            classList: ['__rulerYline'],
            id: '__ext_ruler_line',
          })
          style(__ruler__Line, {
            width: '10px',
            height: '100vh',
            background: 'transparent',
            position: 'fixed',
            zIndex: '9999999999999999999',
            cursor: 'col-resize',
            top: '0px',
            left: mouse.x + 'px',
          })
          __targetElement = __ruler__Line

          __ruler__Line.addEventListener('mousedown', (event) => {
            __targetElement = event.target
            __isClickedY = true
          })
          __ruler_EXT_MAIN.append(__ruler__Line)
        }
      }

      /** loop n numbers of time and create li element */
      const loop = (loopCount, rulerListContainer) => {
        for (let _ = 0; _ <= loopCount; _++) {
          let e = document.createElement('li')
          e.style.boxSizing = 'initial'
          rulerListContainer.appendChild(e)
        }
      }

      // /** rulerX lists */
      loop(Math.round(innerWidth / 50), __rulerX)

      // /** rulerY lists */
      loop(Math.round(innerHeight / 50), __rulerY)

      /** append rulers to container */
      __rulerContainerY.append(__rulerY)
      __rulerContainer.append(__rulerX)

      /** append ruler to body */
      __ruler_EXT_MAIN.append(__rulerContainer)
      __ruler_EXT_MAIN.append(__rulerContainerY)
      document.body.appendChild(__ruler_EXT_MAIN)

      /** listen for windo resize */
      window.addEventListener('resize', function (event) {
        const {innerWidth, innerHeight} = event.currentTarget

        /** clear existing rulers and calculate new rulers */
        __rulerX.innerHTML = ''
        __rulerY.innerHTML = ''
        loop(Math.round(innerWidth / 50), __rulerX)
        loop(Math.round(innerHeight / 50), __rulerY)
      })
      __get_saved_line_color();
      __get_saved_line_width();

      chrome.runtime.onMessage.addListener((msg, sender, response) => {
        console.log('innen ruler listen msg:', msg);
        return handleMessage(msg, __ruler_EXT_MAIN);
      });

      handleMessage({
        type: 'ENABLE', value: true
      }, __ruler_EXT_MAIN);
    }
    console.log('done'); // TODO
  })();

}

chrome.runtime.onMessage.addListener((msg, sender, response) => {});