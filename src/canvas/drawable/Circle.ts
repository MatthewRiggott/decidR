import { iCircle, iPoint } from "./Drawable";

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
    draw: (ctx, delta) => {
      ctx.beginPath()
      ctx.fillStyle = color
      ctx.arc(position.x, position.y, radius, 0, Math.PI * 2)
      ctx.fill()
      if(imageData == undefined) {
        const sx = position.x - radius
        const sy = position.y - radius
        imageData = ctx.getImageData(sx, sy, radius * 2, radius * 2)
        let t = 2
      }
    }
  })
}