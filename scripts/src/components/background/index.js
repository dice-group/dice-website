import { useEffect, useState } from 'react';
import Trianglify from 'trianglify';

/**
 * Generates randomized background pattern using brand colors.
 * WARNING: will only work when running in dev mode (since it's only in dev deps)
 * DO NOT try to run it in production, it is pretty heavy!
 * 
 * NOTE: requires trianglify to be installed, it is not in dev deps due to
 * some issues with nested deps using outdated node-gyp stuff
 *
 * Usage:
 * 1. Use as hook to get background svg html
 *
 *   const bg = useBackground();
 *
 * 2. Set as inline image using style attribute:
 *
 *   style={{ backgroundImage: `url('data:image/svg+xml;utf8,${bg}')` }}
 */

export default function useBackground({ width, height } = {}) {
  const [svgHtml, setSvgHtml] = useState('');
  useEffect(() => {
    const pattern = Trianglify({
      width: width || 300,
      height: height || 700,
      cell_size: 60,
      variance: 0.75,
      stroke_width: 0.1,
      x_colors: ['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)'],
      y_colors: [
        'rgba(255, 255, 255, 1)',
        'rgba(255, 255, 255, 1)',
        'rgba(18, 144, 255, 1)',
      ],
    });
    const svg = pattern.svg();
    console.log(svg);
    const html = svg.outerHTML.replace(
      '<svg width',
      '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' +
        ' x="0px" y="0px" xml:space="preserve" width'
    );
    setSvgHtml(html);
  }, [width, height]);

  return svgHtml;
}
