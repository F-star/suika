const colorfulCursorMap = new Map<string, string>();

export const getColorfulCursor = (color: string) => {
  if (colorfulCursorMap.has(color)) {
    return colorfulCursorMap.get(color)!;
  }
  const svgStr = `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_1303_6)">
<path d="M13.0089 25.4736L9 9L24.4249 15.9665L18.2783 18.5351L13.0089 25.4736Z" fill="${color}"/>
<path d="M18.0855 18.0738L17.9614 18.1256L17.8801 18.2327L13.2463 24.3343L9.72813 9.87748L23.1707 15.9487L18.0855 18.0738Z" stroke="white"/>
</g>
<defs>
<filter id="filter0_d_1303_6" x="7" y="7" width="19.4249" height="20.4736" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1303_6"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1303_6" result="shape"/>
</filter>
</defs>
</svg>`;
  const dataUrl = `data:image/svg+xml,${svgStr
    .replace(/"/g, "'")
    .replace(/#/g, '%23')}`;
  colorfulCursorMap.set(color, dataUrl);
  return dataUrl;
};
