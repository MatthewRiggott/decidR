import { iCircle, iPoint } from "./Drawable";

export function isCircle(object: any): object is iCircle {
  return 'radius' in object;
}

export default function circle(id: number, color: string, pos: iPoint, radius: number): iCircle {
  let imageData: (ImageData | undefined)
  let position = pos
  return ({
    get id() { return id },
    get imageData() { return imageData },
    get position() { return position },
    set position(value) { position = value },
    get radius() { return radius },
    set radius(value) { radius = value },
    get color() { return color },
    set color(value) { color = value },
    loadImageData: () => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.width = radius * 2
      canvas.height = radius * 2
      context.fillStyle = "black"
      context.fillRect(0,0,canvas.width, canvas.height)
      context.fillStyle = color
      context.arc(radius, radius, radius, 0, Math.PI * 2)
      context.fill()
      imageData = context.getImageData(0, 0, radius * 2, radius * 2)
    },
    draw: (ctx, delta) => {
      ctx.beginPath()
      ctx.fillStyle = color
      ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
      ctx.fill()
      if(imageData == undefined) {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        canvas.width = radius * 2
        canvas.height = radius * 2
        context.fillStyle = "black"
        context.fillRect(0,0,canvas.width, canvas.height)
        context.fillStyle = color
        context.arc(radius, radius, radius, 0, Math.PI * 2)
        context.fill()
        imageData = context.getImageData(0, 0, radius * 2, radius * 2)
      }
    }
  })
}