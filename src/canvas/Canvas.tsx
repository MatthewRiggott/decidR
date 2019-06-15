import React from 'react';
import { useWindowWidth, useComponentSize } from '../lib/Effects';
import { useRef } from 'react'
import "./Canvas.css";

interface ICanvasProps {
  width: number,
  height: number
} 

const Canvas: React.FC<ICanvasProps> = (props: ICanvasProps) => {
  let ref = useRef<HTMLCanvasElement>(null)
  let size = useComponentSize<HTMLElement>(ref)
  // size == { width: 100, height: 200 }
  let { width, height } = size
  return (
    <div className="Canvas">
      {width}
      <canvas ref={ref} height={height} width={width}></canvas>
    </div>
  );
}

export default Canvas;