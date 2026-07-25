import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle } from 'react-native';

export default function TypewriterText({
  text,
  style,
  speed = 55,
  onDone,
  startDelay = 0,
}: {
  text: string;
  style?: TextStyle | TextStyle[];
  speed?: number;
  onDone?: () => void;
  startDelay?: number;
}) {
  const [count, setCount] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setCount(0);
    let i = 0;
    let interval: ReturnType<typeof setInterval> | null = null;

    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= text.length) {
          if (interval) clearInterval(interval);
          if (!doneRef.current) {
            doneRef.current = true;
            onDone?.();
          }
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, startDelay]);

  return <Text style={style}>{text.slice(0, count)}</Text>;
}
