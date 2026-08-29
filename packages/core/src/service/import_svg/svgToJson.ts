import { parseTransform } from './transform';
import type { SvgNode } from './types';

const elementToNode = (el: Element): SvgNode => {
  const attributes: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name === 'transform') continue;
    attributes[attr.name] = attr.value;
  }

  const children: SvgNode[] = [];
  for (const child of Array.from(el.children)) {
    children.push(elementToNode(child));
  }

  const node: SvgNode = {
    type: el.tagName,
    transform: parseTransform(el.getAttribute('transform')),
    attributes,
    children,
  };

  const directText = Array.from(el.childNodes)
    .filter((n) => n.nodeType === 3 /* Node.TEXT_NODE */)
    .map((n) => n.textContent ?? '')
    .join('')
    .trim();
  if (directText) node.text = directText;

  return node;
};

export const svgToJson = (svgString: string): SvgNode => {
  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
  const error = doc.querySelector('parsererror');
  if (error) {
    throw new Error(
      'Failed to parse SVG: ' + (error.textContent ?? 'unknown error'),
    );
  }
  const root = doc.documentElement;
  if (!root) throw new Error('Failed to parse SVG: no root element');
  return elementToNode(root);
};
