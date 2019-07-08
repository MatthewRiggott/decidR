var chance: Chance.Chance = require('chance')();

export interface iPoint {
  x: number,
  y: number
}

export enum DrawState {
  Normal,
  Vanishing
}

export interface iDrawable {
  draw: (ctx: CanvasRenderingContext2D, delta: number) => void
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
  getState: () => DrawState
  setState: (value: DrawState) => void
}

export interface iVanishingOptions {
  frames?: number
  vanishLength?: number
  frameDelay?: number
}

export interface iVanishingSettings {
  frames: number
  vanishLength: number
  frameDelay: number
}

const defaultOptions: iVanishingSettings = {
  frames: 45,
  vanishLength: 2500,
  frameDelay: 100
}

export function withVanishingState<T extends iDrawable>(drawable: T, ctx: CanvasRenderingContext2D, options: iVanishingOptions | undefined): T & withVanishingState {
  const vanishOptions = Object.assign({}, defaultOptions, options)
  let state: DrawState = DrawState.Normal
  let normalDraw = drawable.draw
  let animationDuration = 0
  let animationFrames: HTMLImageElement[] = []
  let vanishable = {
    vanishOptions,
    getState() { return state },
    setState(value: DrawState) {
      if(state == value) {
        return;
      }
      state = value
      if(state == DrawState.Normal) {
        animationDuration = 0
      } else if(state == DrawState.Vanishing) {
        animationDuration = 0
        if(animationFrames.length == 0) {
          const sx = drawable.imageData
          animationFrames = loadVanishFrames(drawable.imageData!, vanishOptions.frames)
          let x = 2
        }
      }
    },
    draw: function(ctx: CanvasRenderingContext2D, delta: number) {
      if(state == DrawState.Normal) {
        normalDraw(ctx, delta)
      } else if(state == DrawState.Vanishing) {
        animationDuration += delta
        if(animationDuration >= (animationFrames.length * vanishOptions.frameDelay) + vanishOptions.vanishLength) {
          return
        }

        for(let i = 0; i < animationFrames.length; i++) {
          const step = animationDuration - (i+1) * vanishOptions.frameDelay
          let alpha = clamp(1 - (step / vanishOptions.vanishLength), 0, 1)
          ctx.globalAlpha = alpha
          ctx.drawImage(animationFrames[i], drawable.position.x, drawable.position.y)
        }
        ctx.globalAlpha = 1;
      }
    } 
  }

  return Object.assign({}, drawable, vanishable)
}

const clamp = (value: number, min: number, max: number) => {
  if(value < min) {
    return min
  } else if (value > max) {
    return max
  } else {
    return value
  }
}

const weightedRandomDistrib = (peak: number, count: number) => {
  const prob = [], seq = [];
  for(let i=0;i<count;i++) {
    prob.push(Math.pow(count-Math.abs(peak-i), count/2));
    seq.push(i);
  }
  return chance.weighted(seq, prob);
}

function loadVanishFrames (imageData: ImageData, count: number): HTMLImageElement[] {
  let imgs: HTMLImageElement[] = [];
  const pixelArr = imageData.data;
  const data = imageData.data.slice(0).fill(0);
  const width = imageData.width
  const height = imageData.height
  let imageDataArray = Array.from({length: count}, e => data.slice(0));

  //put pixel info to imageDataArray (Weighted Distributed)
  for (let i = 0; i < pixelArr.length; i+=4) {
    //find the highest probability canvas the pixel should be in
    const p = Math.floor((i/pixelArr.length) * count);
    const a = imageDataArray[weightedRandomDistrib(p, count)];
    
    // assign RGBA values from image to dust canvas
    a[i] = pixelArr[i];
    a[i+1] = pixelArr[i+1];
    a[i+2] = pixelArr[i+2];
    a[i+3] = pixelArr[i+3];
    if(a[i] == 255 && a[i+1] == 255 && a[i+2] == 255) {
      a[i+3] = 0;
    }
  }
  for(let i = 0; i < imageDataArray.length; i++) {
    let img = new Image();
    let tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = width;
    tmpCanvas.height = height;
    let tmpCtx = tmpCanvas.getContext("2d")!;
    tmpCtx.putImageData(new ImageData(imageDataArray[i], width, height), 0, 0);
    img.src = tmpCanvas.toDataURL('image/png');	
    imgs.push(img);
  }
  return imgs;
}