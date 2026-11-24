import React, { useEffect, useRef } from 'react';
import { SkyRenderer } from '../engine/SkyRenderer';

export default function SkyView({ weatherSnapshot, fogLevel, onReady }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Instantiate procedural sky engine
    const renderer = new SkyRenderer(canvas);
    rendererRef.current = renderer;
    renderer.start();

    if (onReady) {
      onReady(renderer);
    }

    const handleResize = () => {
      if (rendererRef.current) {
        rendererRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  // Sync weather changes
  useEffect(() => {
    if (rendererRef.current && weatherSnapshot && weatherSnapshot.current) {
      const data = {
        ...weatherSnapshot.current,
        sunrise: weatherSnapshot.daily?.sunrise,
        sunset: weatherSnapshot.daily?.sunset
      };
      rendererRef.current.setWeather(data);
    }
  }, [weatherSnapshot]);

  // Sync mystery fog veil level
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setFogLevel(fogLevel);
    }
  }, [fogLevel]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none select-none z-0"
      style={{ touchAction: 'none' }}
    />
  );
}
