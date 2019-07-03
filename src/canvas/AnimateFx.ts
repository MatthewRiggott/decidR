import { useRef, useLayoutEffect, RefObject } from "react";
import IAnimationHandler from "./animator/IAnimationHandler";

export function useAnimationFrame(_canvas: RefObject<HTMLCanvasElement>, animator: IAnimationHandler) {
  const canvasRef = useRef(_canvas);

  useLayoutEffect(
    () => {
      canvasRef.current = _canvas;
    },
    [_canvas]
  )

  const loop: FrameRequestCallback = (delta: number) => {
    // const elapsed = delta - lastDelta;
    // lastDelta = delta;
    // console.log(elapsed);
    // frameRef.current = requestAnimationFrame(
    //   loop
    // );
    // const cb = callbackRef.current;
    // const canvas = _canvas.current;
    // const ctx = canvas != null ? canvas.getContext('2d') : null; 
    // if(canvas != null && ctx != null) {
    //   cb(canvas, ctx);
    // }
  };

  const frameRef = useRef<number>();
  useLayoutEffect(() => {
    const canvas = _canvas.current;
    if(canvas != null) {
      animator.setCanvas(canvas)
      frameRef.current = requestAnimationFrame(
        animator.doFrame
      );
      
      canvas.addEventListener('touchstart', animator.touchStart);
      canvas.addEventListener('touchmove', animator.touchMove);
      canvas.addEventListener('touchend', animator.touchEnd);
      canvas.addEventListener('click', animator.mouseLeft);
      canvas.addEventListener('contextmenu', animator.mouseRight);
      
      return () => {
        cancelAnimationFrame(frameRef.current!);

        canvas.removeEventListener('touchstart', animator.touchStart);
        canvas.removeEventListener('touchmove', animator.touchMove);
        canvas.removeEventListener('touchend', animator.touchEnd);
        canvas.removeEventListener('click', animator.mouseLeft);
        canvas.removeEventListener('contextmenu', animator.mouseRight);
      }
    }
  }, []);
};