import { useState, useEffect, useRef, DOMElement, useCallback, useLayoutEffect } from "react";
import { debounce } from "lodash";

function getSize(el: HTMLElement | any) {
  if (!el) {
    return {
      width: 0,
      height: 0
    }
  }

  return {
    width: el.offsetWidth,
    height: el.offsetHeight
  }
}

// https://github.com/rehooks/component-size/blob/master/index.js
export function useComponentSize<T>(ref: React.RefObject<T>) {
  let [ComponentSize, setComponentSize] = useState(
    getSize(ref ? ref.current : {})
  )

  const handleResize = useCallback(
    function handleResize() {
      if (ref.current) {
        setComponentSize(getSize(ref.current))
      }
    },
    [ref]
  )

  const debounceHandleResize = debounce(handleResize, 300)

  useLayoutEffect(
    () => {
      if (!ref.current) {
        return
      }
      debounceHandleResize()
      window.addEventListener('resize', debounceHandleResize)
      return () => {
        window.removeEventListener('resize', debounceHandleResize)
      }
      
    },
    [ref.current]
  )
  return ComponentSize
}

export function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  const elem = useRef(null);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    const debounceHandleResize = debounce(handleResize, 350);

    window.addEventListener('resize', debounceHandleResize);
    return () => {
      window.removeEventListener('resize', debounceHandleResize);
    };
  });
  
  return width;
}

export default useWindowWidth;