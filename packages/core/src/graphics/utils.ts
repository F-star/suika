// subsequent drawing
export const drawLayer = (params: {
  originCtx: CanvasRenderingContext2D;
  viewSize: { width: number; height: number };
  draw: (ctx: CanvasRenderingContext2D) => void;
}) => {
  const { originCtx, viewSize, draw } = params;
  originCtx.save();

  const canvas = document.createElement('canvas');
  canvas.width = viewSize.width;
  canvas.height = viewSize.height;
  const layerCtx = canvas.getContext('2d')!;

  layerCtx.setTransform(originCtx.getTransform());

  draw(layerCtx);

  originCtx.resetTransform();
  originCtx.drawImage(canvas, 0, 0);

  originCtx.restore();
  return canvas;
};
