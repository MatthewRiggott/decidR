import { clamp } from "lodash";
import { Color } from "csstype";
import { isCircle } from "./Circle";
import { callbackify } from "util";

var chance: Chance.Chance = require('chance')();

export interface iPoint {
  x: number,
  y: number
}

export enum DrawState {
  Normal,
  Animating,
  AnimationFinished
}

export enum DrawMode {
  Vanishing,
  Unvanishing
}

export interface iDrawable {
  draw: (ctx: CanvasRenderingContext2D, delta: number) => void
  loadImageData: () => void
  id?: number
  position: iPoint
  color: string
  imageData?: ImageData
}

export interface iRect extends iDrawable {
  width: number
  length: number
}

export interface iCircle extends iDrawable {
  radius: number
}

export interface withVanishingState extends iDrawable {
  getMode: () => DrawMode
  setMode: (value: DrawMode) => void
  getState: () => DrawState
  setState: (value: DrawState) => void
  reloadFrames: () => void
}

export function isVanishable(object: any): object is withVanishingState {
  return true
  //return 'getMode' in object && 'getState' in object;
}


export interface iVanishingOptions {
  frames?: number
  vanishLength?: number
  frameDelay?: number
  callback?: boolean
  nextColor?: Color
}

export interface iVanishingSettings {
  frames: number
  vanishLength: number
  frameDelay: number
}

const defaultOptions: iVanishingSettings = {
  frames: 45,
  vanishLength: 2500,
  frameDelay: 100,
}

export function withVanishingState<T extends iDrawable>(drawable: T, ctx: CanvasRenderingContext2D, options?: iVanishingOptions): T & withVanishingState {
  const vanishOptions = Object.assign({}, defaultOptions, options)
  let state: DrawState = DrawState.Normal
  let normalDraw = drawable.draw
  let animationDuration = 0
  let mode = DrawMode.Vanishing
  let animationFrames: ImageBitmap[] = []
  let vanishable = {
    vanishOptions,
    getMode() { return mode },
    setMode(value: DrawMode) {
      mode = value
      animationDuration = 0
      this.setState(DrawState.Animating)
    },
    getState() { return state },
    async setState(value: DrawState) {
      if(state == value) {
        return;
      }
      state = value
      if(state == DrawState.Normal) {
        animationDuration = 0
      } else if(state == DrawState.Animating) {
        animationDuration = 0
        if(animationFrames.length == 0) {
          const sx = drawable.imageData
          animationFrames = await Promise.all<ImageBitmap>(loadVanishFrames(drawable.imageData!, vanishOptions.frames, drawable.color))
          debugger
        }
      } else if (state == DrawState.AnimationFinished) {
        if(vanishOptions.callback && mode == DrawMode.Vanishing) {
          drawable.color = vanishOptions.nextColor!
          drawable.loadImageData()
          this.reloadFrames()
          this.setMode(DrawMode.Unvanishing)
        } else if (mode == DrawMode.Unvanishing) {
          this.setState(DrawState.Normal)
        }
      }
    },
    reloadFrames: async function() {
      animationFrames = await Promise.all<ImageBitmap>(loadVanishFrames(drawable.imageData!, vanishOptions.frames, drawable.color))
      debugger
    },
    draw: function(ctx: CanvasRenderingContext2D, delta: number) {
      if(state == DrawState.Normal) {
        normalDraw(ctx, delta)
      } else if(state == DrawState.Animating) {
        animationDuration += delta
        if(animationDuration >= (animationFrames.length * vanishOptions.frameDelay) + vanishOptions.vanishLength) {
          this.setState(DrawState.AnimationFinished)
          return
        }
        let dx = drawable.position.x
        let dy = drawable.position.y
        if(isCircle(drawable)) {
          const radius = drawable.radius
          dx -= radius
          dy -= radius
        }

        for(let i = 0; i < animationFrames.length; i++) {
          const step = animationDuration - (i+1) * vanishOptions.frameDelay
          let alpha = clamp(1 - (step / vanishOptions.vanishLength), 0, 1)
          if(mode == DrawMode.Unvanishing) {
            alpha = 1 - alpha
          }
          ctx.globalAlpha = alpha
          ctx.drawImage(animationFrames[i], dx, dy)
        }
        ctx.globalAlpha = 1;
      }
    } 
  }

  return Object.assign({}, drawable, vanishable)
}

const weightedRandomDistrib = (peak: number, count: number) => {
  const prob = [], seq = [];
  for(let i=0;i<count;i++) {
    prob.push(Math.pow(count-Math.abs(peak-i), count/2));
    seq.push(i);
  }
  return chance.weighted(seq, prob);
}

function loadVanishFrames (imageData: ImageData, count: number, colorFilter?: Color): Promise<ImageBitmap>[] {
  let imgs: HTMLImageElement[] = [];
  let bitmap: ImageBitmap[] = []
  const pixelArr = imageData.data;
  const sliced = imageData.data.slice(0)
  const data = sliced.fill(0);
  const width = imageData.width
  const height = imageData.height
  let imageDataArray = Array.from({length: count}, e => sliced);
  
  //put pixel info to imageDataArray (Weighted Distributed)
  for (let i = 0; i < pixelArr.length; i+=4) {
    //find the highest probability canvas the pixel should be in
    const p = Math.floor((i/pixelArr.length) * count)
    const a = imageDataArray[weightedRandomDistrib(p, count)]
    
    // assign RGBA values from image to dust canvas
    a[i] = pixelArr[i]
    a[i+1] = pixelArr[i+1]
    a[i+2] = pixelArr[i+2]
    a[i+3] = pixelArr[i+3]

    if(colorFilter != undefined) {
      const color = hexToRGB(colorFilter)
      if(a[i] !== color.red || a[i+1] !== color.green || a[i+2] !== color.blue) {
        a[i] = 0
        a[i+1] = 0
        a[i+2] = 0
        a[i+3] = 0
      }
    }
  }
  let promiseContainer = []
  for(let i = 0; i < imageDataArray.length; i++) {
    let img = new Image()
    let tmpCanvas = document.createElement("canvas")
    tmpCanvas.width = width
    tmpCanvas.height = height
    let tmpCtx = tmpCanvas.getContext("2d")!
    promiseContainer.push(createImageBitmap(tmpCanvas, 0, 0, width, height))
    // tmpCtx.putImageData(new ImageData(imageDataArray[i], width, height), 0, 0)
    // img.src = tmpCanvas.toDataURL('image/png')	
    // imgs.push(img)
  }

  return promiseContainer;
  //return imgs
}

function hexToRGB(hexString: string){
  const hexColorNumber = parseInt(hexString.replace("#", "0x"))
  return {
    red: (hexColorNumber >> 16) & 0xFF,
    green: (hexColorNumber >> 8) & 0xFF,  
    blue: hexColorNumber & 0xFF
  }
}