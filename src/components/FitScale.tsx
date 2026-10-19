import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Renders children at a fixed design width, then scales them down (never up) to fit the box.
 * Lets a full-size invite or phone screen sit inside a viewport-height layout without scrolling.
 */
export function FitScale({ width, height, children, className, align = 'center' }: { width: number; height?: number; children: ReactNode; className?: string; align?: 'center' | 'start' }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [innerH, setInnerH] = useState(height ?? 0);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!box || !inner) return;
    const measure = () => {
      const h = height ?? inner.scrollHeight;
      setInnerH(h);
      setScale(Math.min(1, box.clientWidth / width, box.clientHeight / h));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [width, height]);

  return (
    <div ref={boxRef} className={`fit-box fit-${align} ${className ?? ''}`}>
      <div className="fit-sizer" style={{ width: width * scale, height: innerH * scale }}>
        <div ref={innerRef} className="fit-inner" style={{ width, height, transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
