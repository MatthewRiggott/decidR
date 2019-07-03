interface IAnimationHandler {
  touchStart: (te: TouchEvent) => void
  touchMove: (te: TouchEvent) => void
  touchEnd: (te: TouchEvent) => void
  mouseLeft: (me: MouseEvent) => void
  mouseRight: (me: MouseEvent) => void

  canvas: HTMLCanvasElement | null
  ctx: CanvasRenderingContext2D | null
  setCanvas: (c: HTMLCanvasElement) => void
  onResize: () => void
  width: number
  height: number
  lastFrame: number
  
  doFrame: (timeElapsed: number) => void
}

export default IAnimationHandler;