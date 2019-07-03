
export interface ICountDownOptions {
  color?: string,
  lineWidth?: number,
  callback?: (() => void),
  callbackInterval?: number
}

const defaultOptions = Object.freeze({
  color: "black",
  lineWidth: 5,
  callback: () => {},
  callbackInterval: 1
})


export function countDownWithWrap(canvas: HTMLCanvasElement, time: number, _options: ICountDownOptions): any {
  const options = Object.assign({}, defaultOptions, _options)
  const lineWidth = options.lineWidth
  const color = options.color
  const callback = options.callback
  const ctx = canvas.getContext("2d")!
  const width = canvas.width - lineWidth
  const height = canvas.height - lineWidth
  const perimeterLength = 2 * (width + height)
  const offset = lineWidth / 2
  const invocationInterval = time / options.callbackInterval
  let invocationCount = 0

  const rate = perimeterLength / time
  let elapsed = 0

  return ({
    reset() {
      elapsed = 0
      invocationCount = 0
      return
    },

    draw(delta: number) {
      elapsed += delta
      if(elapsed > time) {
        elapsed = time
      }
      if(elapsed >= (invocationCount + 1) * invocationInterval) {
        console.log(`invocation ${invocationCount}`)
        callback()
        invocationCount++
      }
      ctx.beginPath()
      ctx.lineWidth = lineWidth
      ctx.strokeStyle = color
      ctx.moveTo(offset, offset)

      let length = rate * elapsed
      if(length <= width) {
        ctx.lineTo(length + offset, offset)
        ctx.stroke()
        return
      }
      ctx.lineTo(width + offset, offset)
      length -= width
      if(length <= height) {
        ctx.lineTo(width + offset, length + offset)
        ctx.stroke()
        return
      }
      ctx.lineTo(width + offset, height + offset)
      length -= height
      if(length <= width) {
        ctx.lineTo(width - length + offset, height + offset)
        ctx.stroke()
        return
      }
      ctx.lineTo(offset, height + offset)
      length -= width
      if(length <= height) {
        ctx.lineTo(offset, height - length + offset)
        ctx.stroke()
        return
      }
      ctx.lineTo(offset, offset)
      ctx.stroke()
    }
  });
}