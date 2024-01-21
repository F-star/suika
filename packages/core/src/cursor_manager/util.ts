const getRotationIconSvg = (degree: number) =>
  `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g filter="url(#filter0_d_1139_2)" transform="rotate(${degree} 16 16)"><path d="M4.38452 17.3499L9.68782 16.9963L7.78571 15.0942C8.84801 14.0319 10.1091 13.1892 11.4971 12.6143C12.8851 12.0394 14.3727 11.7435 15.875 11.7435C17.3773 11.7435 18.8649 12.0394 20.2529 12.6143C21.6409 13.1892 22.902 14.0319 23.9643 15.0942L22.0622 16.9963L27.3655 17.3499L27.0119 12.0466L25.0674 13.9911C23.8602 12.784 22.4271 11.8264 20.8499 11.1731C19.2727 10.5198 17.5822 10.1835 15.875 10.1835C14.1678 10.1835 12.4774 10.5198 10.9001 11.1731C9.32289 11.8264 7.88978 12.784 6.68262 13.9911L4.73807 12.0466L4.38452 17.3499Z" fill="#000000"/><path d="M9.72108 17.4952L10.8205 17.4219L10.0414 16.6428L8.5009 15.1023C9.43698 14.2481 10.5153 13.5622 11.6884 13.0763C13.0158 12.5265 14.4383 12.2435 15.875 12.2435C17.3117 12.2435 18.7343 12.5265 20.0616 13.0763C21.2347 13.5622 22.313 14.2481 23.2491 15.1023L21.7086 16.6428L20.9295 17.4219L22.0289 17.4952L27.3322 17.8488L27.9024 17.8868L27.8644 17.3166L27.5108 12.0133L27.4375 10.9139L26.6584 11.693L25.0608 13.2906C23.8859 12.1996 22.525 11.3257 21.0412 10.7111C19.4033 10.0327 17.6479 9.68351 15.875 9.68351C14.1022 9.68351 12.3467 10.0327 10.7088 10.7111C9.22503 11.3257 7.86411 12.1996 6.68917 13.2906L5.09163 11.693L4.31248 10.9139L4.23918 12.0133L3.88563 17.3166L3.84762 17.8868L4.41778 17.8488L9.72108 17.4952Z" stroke="white"/></g><defs><filter id="filter0_d_1139_2" x="1.3107" y="7.18351" width="29.1286" height="13.2402" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="1"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1139_2"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1139_2" result="shape"/></filter></defs></svg>`;
const getResizeIconSvg = (degree: number) =>
  `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g filter="url(#filter0_d_1173_45)" transform="rotate(${degree} 16 16)"><path d="M16 6L12.5 10H19.5L16 6Z" fill="#000000"/><path d="M16 26L12.5 22H19.5L16 26Z" fill="#000000"/><path d="M15.25 10H16.75V22H15.25V10Z" fill="#000000"/><path d="M12.1237 9.67075L11.3981 10.5H12.5H14.75V21.5H12.5H11.3981L12.1237 22.3293L15.6237 26.3293L16 26.7593L16.3763 26.3293L19.8763 22.3293L20.6019 21.5H19.5H17.25V10.5H19.5H20.6019L19.8763 9.67075L16.3763 5.67075L16 5.2407L15.6237 5.67075L12.1237 9.67075Z" stroke="white"/></g><defs><filter id="filter0_d_1173_45" x="8.29623" y="2.48141" width="15.4075" height="27.0372" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset/><feGaussianBlur stdDeviation="1"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1173_45"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1173_45" result="shape"/></filter></defs></svg>`;

const svgIconCache = new Map<string, string>();

export const getIconSvgDataUrl = (
  type: 'resize' | 'rotation',
  degree: number,
) => {
  const key = type + degree;
  if (svgIconCache.has(key)) {
    return svgIconCache.get(key)!;
  }
  let svgStr = '';
  switch (type) {
    case 'resize':
      svgStr = getResizeIconSvg(degree);
      break;
    case 'rotation':
      svgStr = getRotationIconSvg(degree);
      break;
    default:
      console.warn('getIconSvgDataUrl: unknown type', type);
  }

  const dataUrl = `url("data:image/svg+xml,${svgStr
    .replace(/"/g, "'")
    .replace(/#/g, '%23')}") 16 16, auto`;
  svgIconCache.set(key, dataUrl);
  return dataUrl;
};
