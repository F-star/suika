
export class Setting {
  canvasBgColor = '#f4f4f4';
  stroke = '';
  fill = '#D9D9D9';
  guideBBoxStroke = '#1592fe';
  selectionStroke = '#0f8eff';
  selectionFill = '#0f8eff33';

  handleRotationStroke = '#1592fe';
  handleRotationFill = '#fff';
  handleRotationStrokeWidth = 2;
  handleRotationRadius = 4;

  lockRotation = Math.PI / 12; // 旋转时，通过 shift 约束旋转角度为该值的整数倍。

  zoomStep = 0.27; // 缩放比例步长
  zoomMax = 256;
  zoomMin = 0.02;

  drawRectDefaultWidth = 100; // 绘制矩形工具，如果不拖拽就不会产生宽高。此时提供矩形的宽度
  drawRectDefaultHeight = 100; // 高度，同上
}