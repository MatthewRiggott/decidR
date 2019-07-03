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
export function useComponentSize<T>(ref: React.RefObject<T>, handlers?: (() => void)[]) {
  let [ComponentSize, setComponentSize] = useState(
    getSize(ref ? ref.current : {})
  )

  const handleResize = useCallback(
    function handleResize() {
      if (ref.current) {
        setComponentSize(getSize(ref.current))
        if(handlers) {
          for(let handler of handlers) {
            handler();
          }
        }
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

export function useComponentTouch<T extends HTMLElement>(ref: React.RefObject<T>) {
  let [ComponentSize, setComponentSize] = useState(
    getSize(ref ? ref.current : {})
  )

  const onTouchStart = useCallback(
    function onTouchStart() {
      if (ref.current) {
        setComponentSize(getSize(ref.current))
      }
    },
    [ref]
  )

  const onTouchMove = useCallback(
    function onTouchMove() {
      if (ref.current) {
        setComponentSize(getSize(ref.current))
      }
    },
    [ref]
  )

  const onTouchEnd = useCallback(
    function onTouchEnd() {
      if (ref.current) {
        setComponentSize(getSize(ref.current))
      }
    },
    [ref]
  )

  useLayoutEffect(
    () => {
      if (ref == null || !ref.current) {
        return
      }
      
      ref.current.addEventListener('touchstart', onTouchStart)
      ref.current.addEventListener('touchmove', onTouchMove)
      ref.current.addEventListener('touchend', onTouchEnd)
      return () => {
        const node = ref.current!;
        node.removeEventListener('touchstart', onTouchStart)
        node.removeEventListener('touchmove', onTouchMove)
        node.removeEventListener('touchend', onTouchEnd)
      }
    },
    [ref.current]
  )
  return ComponentSize
}

export default useWindowWidth;