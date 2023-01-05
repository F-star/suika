
export class Setting {
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
}