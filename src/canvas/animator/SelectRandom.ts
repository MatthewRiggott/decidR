import IAnimationHandler from './IAnimationHandler';
import { COLORS } from './Colors';
import { countDownWithWrap } from '../animations/CanvasCountDown';
import { iCircle, withVanishingState, DrawState, iVanishingOptions, isVanishable, DrawMode } from '../drawable/Drawable';
import circle from '../drawable/Circle';
import { clamp, shuffle } from 'lodash';

interface IPoint {
  x: number
  y: number
}

//configuration
const circleRadius = 60
const backgroundColor = 'black'

enum State {
  Initializing,
  Empty, 
  Listening,
  Selecting,
  Finished
}

enum SelectionMode {
  FirstOnly,
  FullOrder,
  Teams
}

interface iSimulatedTouch {
  identifier: number
  pageX: number
  pageY: number
}

interface iSelectRandomOptions {
  teamCount?: number
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

  activeTouches: (iCircle | (withVanishingState & iCircle))[]
  colors: string[]
  offset: IPoint
  _state: State
  enableResetFlag: boolean
  selectionMode: SelectionMode
  teamCount: number

  countDownToLock: any
  countDownToSelect: any
  selectedIndex: number

  constructor(mode = SelectionMode.FirstOnly, options?: iSelectRandomOptions) {
    this.lastFrame = 0
    this.touchStart = this.updateTouches
    this.touchMove = this.updateTouches
    this.touchEnd = this.updateTouches
    this.mouseLeft = this.clickAsTouch
    this.mouseRight = this.clickToCancel

    this._state = State.Initializing
    this.canvas = null
    this.ctx = null
    this.countDownToLock = null
    this.selectedIndex = -1
    this.selectionMode = mode
    this.teamCount = 2

    this.activeTouches = []
    this.colors = shuffle(COLORS)
    this.offset = { x: 0, y: 0 }
    this.height = this.width = 0
    this.state = State.Empty
    this.enableResetFlag = false
  }

  get state(): State { return this._state }
  set state(value) {
    if(value === this._state) {
      return
    }
    this._state = value
    if(this._state === State.Empty) {
      this.colors = shuffle(COLORS)
    }
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
    const touches = this.activeTouches.length;
    const callbacks = this.selectionMode === SelectionMode.FirstOnly ?  this.activeTouches.length - 1 : this.activeTouches.length;
    this.countDownToSelect = countDownWithWrap(this.canvas!, clamp((touches - 1) * 400, 1000, 3000), { color: "yellow", callback: this.selectRandomPlayer, callbackInterval: callbacks, lineWidth: 10 })
    let vanishOptions: iVanishingOptions = { vanishLength: 1200, frameDelay: 35, callback: this.selectionMode == SelectionMode.Teams }
    let range = shuffle(Array.from(Array(touches).keys()))
    let teams = new Array(this.teamCount)
    let teamMap = new Array(touches)
    for(let i = 0; i < this.teamCount; i ++) {
      teams[i] = []
    }
    if(this.selectionMode === SelectionMode.Teams) {
      for(let i = 0; i < range.length; i++) {
        teams[i % this.teamCount].push(this.activeTouches[range[i]])
        teamMap[range[i]] = teams[i % this.teamCount][0].id
      }
    }
    console.log(teams)
    this.activeTouches = this.activeTouches.map(t => {
      let options= {}
      if(this.selectionMode === SelectionMode.Teams){
        options = Object.assign(options, { nextColor: this.activeTouches[teamMap[t.id!]].color })
      }
      return withVanishingState(t, this.ctx!, Object.assign(options, vanishOptions))
    })
    this.state = State.Selecting
  }

  selectRandomPlayer = () => {
    const unpickedTouches = (this.activeTouches as (iCircle & withVanishingState)[]).filter(t => t.getState() === DrawState.Normal)

    const selectedId = unpickedTouches[Math.floor(Math.random() * unpickedTouches.length)].id
    const index = this.activeTouches.findIndex(t => t.id == selectedId)
    let target = this.activeTouches[index] as iCircle & withVanishingState
    target.setState(DrawState.Animating)
    const threshold = this.selectionMode == SelectionMode.FirstOnly ? 2 : 1

    if(unpickedTouches.length == threshold) {
      this.state = State.Finished
    }
  }

  copyTouch = (touch: Touch | iSimulatedTouch): iCircle => {
    const id = touch.identifier
    return circle(id, this.colors[id], { x: touch.pageX - this.offset.x, y: touch.pageY - this.offset.y }, circleRadius)
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
      const identifier = this.activeTouches.length;
      const touch: iSimulatedTouch = { 
        identifier,
        pageX: mouseEvent.clientX,
        pageY: mouseEvent.clientY
      }

      const newTouch = this.copyTouch(touch);
      this.activeTouches = [...this.activeTouches, newTouch]

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

    if(this.state == State.Listening) {
      this.countDownToLock.draw(delta)
    }

    if(this.state == State.Selecting) {
      this.countDownToSelect.draw(delta);
    }

    for(let touch of this.activeTouches) {
      touch.draw(ctx, delta)
    }
  }
}

export default SelectRandom;