// src/components/MaskEditor.js
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, Image as FabricImage, PencilBrush } from 'fabric';  // ← named imports
import Button from '@mui/material/Button';

export default function MaskEditor({ imageUrl, apiUrl, onResult }) {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [mode, setMode] = useState('erase'); // 'erase' or 'restore'
  const [maskLoaded, setMaskLoaded] = useState(false);

  // 1️⃣ Initialize Fabric Canvas and pull down auto-mask
  useEffect(() => {
    if (!canvasRef.current) return;
    const c = new Canvas(canvasRef.current, {
      width: 400,
      height: 400,
      isDrawingMode: false,
    });
    setCanvas(c);

    fetch(`${apiUrl}/runware/get-mask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    })
      .then(r => r.json())
      .then(({ maskUrl }) => {
        // Background = original
        FabricImage.fromURL(imageUrl, imgOrig => {
          imgOrig.selectable = imgOrig.evented = false;
          imgOrig.scaleToWidth(c.width);
          c.setBackgroundImage(imgOrig, c.renderAll.bind(c));
        });
        // Top layer = mask as destination-in
        FabricImage.fromURL(maskUrl, imgMask => {
          imgMask.selectable = imgMask.evented = false;
          imgMask.globalCompositeOperation = 'destination-in';
          imgMask.scaleToWidth(c.width);
          c.add(imgMask).renderAll();
          setMaskLoaded(true);
        });
      })
      .catch(console.error);

    return () => c.dispose();
  }, [imageUrl, apiUrl]);

  // 2️⃣ Enable drawing brush when mask’s loaded
  useEffect(() => {
    if (!canvas || !maskLoaded) return;
    canvas.isDrawingMode = true;
    const brush = new PencilBrush(canvas);
    brush.width = 20;
    brush.color = mode === 'erase' ? 'black' : 'white';
    canvas.freeDrawingBrush = brush;
  }, [canvas, mode, maskLoaded]);

  // 3️⃣ Send edited mask back for compositing
  const handleApply = () => {
    const maskDataUrl = canvas.toDataURL({ format: 'png' });
    fetch(`${apiUrl}/runware/apply-mask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, maskDataUrl }),
    })
      .then(r => r.json())
      .then(({ resultDataUrl }) => onResult(resultDataUrl))
      .catch(console.error);
  };

  return (
    <div>
      <canvas ref={canvasRef} style={{ border: '1px solid #ccc' }} />
      <div style={{ marginTop: 10 }}>
        <Button
          variant={mode === 'erase' ? 'contained' : 'outlined'}
          onClick={() => setMode('erase')}
        >
          Erase
        </Button>
        <Button
          variant={mode === 'restore' ? 'contained' : 'outlined'}
          onClick={() => setMode('restore')}
          sx={{ ml: 1 }}
        >
          Restore
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleApply}
          sx={{ ml: 2 }}
        >
          Apply & Download
        </Button>
      </div>
    </div>
  );
}
