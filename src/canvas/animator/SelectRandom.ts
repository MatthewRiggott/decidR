import IAnimationHandler from './IAnimationHandler';
import { COLORS } from './Colors';
import { countDownWithWrap } from '../animations/CanvasCountDown';

interface ITouch {
  id: number
  color: string
  position: IPoint
}

interface IPoint {
  x: number
  y: number
}

//configuration
const circleRadius = 60
const backgroundColor = 'black'

enum State {
  Empty, 
  Listening,
  Selecting,
  Finished
}

class SelectRandom implements IAnimationHandler {
  touchStart: (te: TouchEvent) => void
  touchMove: (te: TouchEvent) => void
  touchEnd: (te: TouchEvent) => void
  mouseLeft: (me: MouseEvent) => void
  mouseRight: (me: MouseEvent) => void

  lastFrame: number
  canvas: HTMLCanvasElement | null
  ctx: CanvasRenderingContext2D | null
  width: number
  height: number

  activeTouches: ITouch[]
  colors: string[]
  offset: IPoint
  state: State
  enableResetFlag: boolean

  countDownToLock: any
  countDownToSelect: any
  selectedIndex: number

  constructor() {
    this.lastFrame = 0
    this.touchStart = this.updateTouches
    this.touchMove = this.updateTouches
    this.touchEnd = this.updateTouches
    this.mouseLeft = this.clickAsTouch
    this.mouseRight = this.clickToCancel

    this.canvas = null
    this.ctx = null
    this.countDownToLock = null
    this.selectedIndex = -1

    this.activeTouches = []
    this.colors = [...COLORS]
    this.offset = { x: 0, y: 0 }
    this.height = this.width = 0
    this.state = State.Empty
    this.enableResetFlag = false
  }

  setCanvas = (_canvas: HTMLCanvasElement) => {
    this.canvas = _canvas
    this.ctx = this.canvas.getContext('2d')!
    this.onResize()
  }

  onResize = () => {
    const rect = this.canvas!.getBoundingClientRect()
    this.offset = { x: rect.left, y: rect.top }
    const canvas = this.canvas!
    this.width = canvas.width
    this.height = canvas.height
    this.countDownToLock = countDownWithWrap(canvas, 2000, { color: "red", callback: this.lockPlayers, lineWidth: 10 })
    
  }

  lockPlayers = () => {
    this.countDownToSelect = countDownWithWrap(this.canvas!, 4000, { color: "yellow", callback: this.selectRandomPlayer, callbackInterval: this.activeTouches.length - 1, lineWidth: 10 })
    this.state = State.Selecting
  }

  selectRandomPlayer = () => {
    const selectedId = this.activeTouches[Math.floor(Math.random() * this.activeTouches.length)].id
    this.activeTouches = this.activeTouches.filter(t => t.id != selectedId)
    if(this.activeTouches.length == 1) {
      this.state = State.Finished
    }
  }

  copyTouch = (touch: Touch): ITouch => {
    return { 
      id: touch.identifier,
      position: { x: touch.pageX - this.offset.x, y: touch.pageY - this.offset.y },
      color: this.colors[touch.identifier]
    }
  }

  updateTouches = (touchEvent: TouchEvent) => {
    if(this.state == State.Empty || this.state == State.Listening) {
      const touches = Array.from(touchEvent.targetTouches)
      if(touches.length != this.activeTouches.length) {
        this.countDownToLock.reset()
      }
      this.activeTouches = touches.map(t => this.copyTouch(t))
      const touchCount = this.activeTouches.length
      if(touchCount <= 1) {
        this.state = State.Empty
      }
      if(touchCount > 1) {
        this.state = State.Listening
      }
    }
    if(this.state == State.Finished) {
      if(touchEvent.targetTouches.length > 0 && this.enableResetFlag) {
        this.state = State.Empty
        this.enableResetFlag = false
      }
      if(touchEvent.targetTouches.length == 0) {
        this.enableResetFlag = true
      }
    }
  }

  clickAsTouch = (mouseEvent: MouseEvent) => {
    if(this.state == State.Empty || this.state == State.Listening) {
      const id = this.activeTouches.length;
      const touch = { 
        id,
        position: { x: mouseEvent.clientX - this.offset.x, y: mouseEvent.clientY - this.offset.y },
        color: this.colors[id]
      }

      this.activeTouches = [...this.activeTouches, touch];
      if(this.activeTouches.length > 1 && this.state == State.Empty) {
        this.state = State.Listening
      }
      this.countDownToLock.reset();
    }

    if(this.state == State.Finished) {
      this.activeTouches = []
      this.state = State.Empty
    }
  }

  clickToCancel = (mouseEvent: MouseEvent) => {
    mouseEvent.preventDefault();
    if(this.activeTouches.length == 0 || this.state == State.Selecting) {
      return
    }

    if(this.state == State.Finished) {
      this.activeTouches = []
      this.state = State.Empty
      return
    }

    this.activeTouches = this.activeTouches.slice(0, -1);
    if(this.activeTouches.length <= 1) {
      this.state = State.Empty
    }
    this.countDownToLock.reset();
  }

  doFrame = (elapsedTime: number) => {
    const delta = elapsedTime - this.lastFrame
    this.lastFrame = elapsedTime
    window.requestAnimationFrame(this.doFrame)
    
    if(this.ctx == null || this.ctx == undefined) {
      return
    }
    
    const ctx = this.ctx
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0,0, this.width, this.height)

    if(this.state == State.Empty) {
      this.countDownToLock.reset()
    }

    if(this.state != State.Finished)
    {
      for(let touch of this.activeTouches) {
        ctx.beginPath()
        ctx.fillStyle = touch.color
        ctx.arc(touch.position.x, touch.position.y, circleRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if(this.state == State.Listening) {
      this.countDownToLock.draw(delta)
    }

    if(this.state == State.Selecting) {
      this.countDownToSelect.draw(delta);
    }

    if(this.state == State.Finished) {
      for(let touch of this.activeTouches) {
        ctx.beginPath()
        ctx.fillStyle = touch.color
        ctx.arc(touch.position.x, touch.position.y, circleRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  testRender = () => {
    this.activeTouches = [{
      id: 0,
      position: {
        x: 50,
        y: 50
      },
      color: this.colors[0]
    }, {
      id: 1,
      position: {
        x: 100,
        y: 50
      },
      color: this.colors[1]
    }]
  }
}

export default SelectRandom;