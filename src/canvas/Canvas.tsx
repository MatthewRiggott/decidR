import React from 'react';
import { useWindowWidth, useComponentSize } from '../lib/Effects';
import { useRef } from 'react';
import { useAnimationFrame } from './AnimateFx';
import "./Canvas.css";
import IAnimationHandler from './animator/IAnimationHandler';

interface ICanvasProps {
  width: number,
  height: number,
  animator: IAnimationHandler
} 

const Canvas: React.FC<ICanvasProps> = (props: ICanvasProps) => {
  const animator = props.animator;
  let ref = useRef<HTMLCanvasElement>(null)
  let size = useComponentSize<HTMLElement>(ref, [animator.onResize])
  let anim = useAnimationFrame(ref, animator)
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