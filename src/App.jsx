import { useState, useRef, useEffect, useCallback } from "react";
import { ChromePicker } from "react-color";
import {
  FaPen,
  FaSquare,
  FaTrash,
  FaSave,
  FaEraser,
  FaEye,
  FaRegSquare,
  FaRegCircle,
  FaRegObjectUngroup,
  FaVectorSquare,
  FaImage,
  FaCloud,
  FaFont,
  FaMagic,
  FaUndo,
  FaRedo,
} from "react-icons/fa";
import {
  GiTriangleTarget,
  GiLipstick,
  GiNoseFront,
  GiAbstract050,
  GiNinjaHead,
  GiSolidLeaf,
} from "react-icons/gi";
import { MdFormatColorFill, MdOutlineColorize } from "react-icons/md";
import ToolButton from "./components/ToolButton";

const App = () => {
  // Tool definitions
  const TOOLS = {
    PEN: "pen",
    ERASER: "eraser",
    CIRCLE: "circle",
    RECTANGLE: "rectangle",
    TRIANGLE: "triangle",
    SQUARE: "square",
    ORGANIC1: "organic1",
    ORGANIC2: "organic2",
    ORGANIC3: "organic3",
    EYE: "eye",
    NOSE: "nose",
    MOUTH: "mouth",
    HEAD: "head",
    TEXT: "text",
    IMAGE: "image",
    SELECT: "select",
  };

  const canvasRef = useRef(null);
  const [currentTool, setCurrentTool] = useState(TOOLS.PEN);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(null); // 'stroke' or 'fill'
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(100);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [layers, setLayers] = useState([
    { id: 1, name: "Layer 1", visible: true },
  ]);
  const [activeLayer, setActiveLayer] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Save to history
  const saveToHistory = useCallback(
    (currentShapes) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(JSON.stringify(currentShapes));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setShapes(JSON.parse(history[newIndex]));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setShapes(JSON.parse(history[newIndex]));
    }
  };

  // Utility functions
  const getDistance = (p1, p2) =>
    Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

  const getPointOnCanvas = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x = (e.clientX - rect.left) * scaleX;
    let y = (e.clientY - rect.top) * scaleY;

    if (snapToGrid) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }

    return { x, y };
  };

  // Drawing functions
  const drawShape = (ctx, shape) => {
    ctx.strokeStyle = shape.strokeColor;
    ctx.fillStyle = shape.fillColor;
    ctx.lineWidth = shape.strokeWidth || strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    switch (shape.type) {
      case TOOLS.CIRCLE:
        ctx.beginPath();
        const radius = Math.abs(shape.width) / 2;
        ctx.arc(shape.x + radius, shape.y + radius, radius, 0, 2 * Math.PI);
        if (shape.fillColor !== "transparent") ctx.fill();
        ctx.stroke();
        break;

      case TOOLS.RECTANGLE:
        ctx.beginPath();
        ctx.rect(shape.x, shape.y, shape.width, shape.height);
        if (shape.fillColor !== "transparent") ctx.fill();
        ctx.stroke();
        break;

      case TOOLS.SQUARE:
        const squareSize =
          Math.max(Math.abs(shape.width), Math.abs(shape.height)) *
          Math.sign(shape.width);
        ctx.beginPath();
        ctx.rect(shape.x, shape.y, squareSize, squareSize);
        if (shape.fillColor !== "transparent") ctx.fill();
        ctx.stroke();
        break;

      case TOOLS.TRIANGLE:
        ctx.beginPath();
        ctx.moveTo(shape.x + shape.width / 2, shape.y);
        ctx.lineTo(shape.x, shape.y + shape.height);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.closePath();
        if (shape.fillColor !== "transparent") ctx.fill();
        ctx.stroke();
        break;

      case TOOLS.ORGANIC1:
        ctx.beginPath();
        const cx = shape.x + shape.width / 2;
        const cy = shape.y + shape.height / 2;
        const rx = Math.abs(shape.width) / 2;
        const ry = Math.abs(shape.height) / 2;

        for (let i = 0; i <= 360; i += 10) {
          const angle = (i * Math.PI) / 180;
          const variation = 0.8 + 0.4 * Math.sin(angle * 3);
          const x = cx + rx * variation * Math.cos(angle);
          const y = cy + ry * variation * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        if (shape.fillColor !== "transparent") ctx.fill();
        ctx.stroke();
        break;

      case TOOLS.ORGANIC2:
        ctx.beginPath();
        const lx = shape.x + shape.width / 2;
        const ly = shape.y;
        ctx.moveTo(lx, ly);
        ctx.quadraticCurveTo(
          shape.x + shape.width,
          shape.y + shape.height / 2,
          lx,
          shape.y + shape.height
        );
        ctx.quadraticCurveTo(shape.x, shape.y + shape.height / 2, lx, ly);
        if (shape.fillColor !== "transparent") ctx.fill();
        ctx.stroke();
        break;

      case TOOLS.ORGANIC3:
        ctx.beginPath();
        const cloudCx = shape.x + shape.width / 2;
        const cloudCy = shape.y + shape.height / 2;
        const cloudRx = Math.abs(shape.width) / 2;
        const cloudRy = Math.abs(shape.height) / 2;

        ctx.arc(
          cloudCx - cloudRx * 0.5,
          cloudCy,
          cloudRy * 0.6,
          0,
          2 * Math.PI
        );
        ctx.arc(
          cloudCx + cloudRx * 0.5,
          cloudCy,
          cloudRy * 0.6,
          0,
          2 * Math.PI
        );
        ctx.arc(
          cloudCx,
          cloudCy - cloudRy * 0.4,
          cloudRy * 0.8,
          0,
          2 * Math.PI
        );
        if (shape.fillColor !== "transparent") ctx.fill();
        ctx.stroke();
        break;

      case TOOLS.EYE:
        ctx.beginPath();
        ctx.ellipse(
          shape.x + shape.width / 2,
          shape.y + shape.height / 2,
          Math.abs(shape.width) / 2,
          Math.abs(shape.height) / 2,
          0,
          0,
          2 * Math.PI
        );
        if (shape.fillColor !== "transparent") ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(
          shape.x + shape.width / 2,
          shape.y + shape.height / 2,
          Math.min(Math.abs(shape.width), Math.abs(shape.height)) / 6,
          0,
          2 * Math.PI
        );
        ctx.fill();
        break;

      case TOOLS.NOSE:
        ctx.beginPath();
        ctx.moveTo(shape.x + shape.width / 2, shape.y);
        ctx.lineTo(shape.x, shape.y + shape.height);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.closePath();
        if (shape.fillColor !== "transparent") ctx.fill();
        ctx.stroke();
        break;

      case TOOLS.MOUTH:
        ctx.beginPath();
        ctx.arc(
          shape.x + shape.width / 2,
          shape.y,
          Math.abs(shape.width) / 2,
          0,
          Math.PI
        );
        ctx.stroke();
        break;

      case TOOLS.HEAD:
        ctx.beginPath();
        ctx.ellipse(
          shape.x + shape.width / 2,
          shape.y + shape.height / 2,
          Math.abs(shape.width) / 2,
          Math.abs(shape.height) / 2,
          0,
          0,
          2 * Math.PI
        );
        if (shape.fillColor !== "transparent") ctx.fill();
        ctx.stroke();
        break;

      case TOOLS.TEXT:
        ctx.font = `${shape.fontSize || 16}px Arial`;
        ctx.fillStyle = shape.strokeColor;
        ctx.fillText(shape.text, shape.x, shape.y);
        break;

      case TOOLS.PEN:
        if (shape.path && shape.path.length > 1) {
          ctx.beginPath();
          ctx.moveTo(shape.path[0].x, shape.path[0].y);
          for (let i = 1; i < shape.path.length; i++) {
            ctx.lineTo(shape.path[i].x, shape.path[i].y);
          }
          ctx.stroke();
        }
        break;

      case TOOLS.ERASER:
        if (shape.path && shape.path.length > 1) {
          const originalComposite = ctx.globalCompositeOperation;
          ctx.globalCompositeOperation = "destination-out";
          ctx.beginPath();
          ctx.moveTo(shape.path[0].x, shape.path[0].y);
          for (let i = 1; i < shape.path.length; i++) {
            ctx.lineTo(shape.path[i].x, shape.path[i].y);
          }
          ctx.stroke();
          ctx.globalCompositeOperation = originalComposite;
        }
        break;
    }

    // Draw selection handles if selected
    if (selectedShape && selectedShape.id === shape.id) {
      ctx.strokeStyle = "#0066ff";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        shape.x - 5,
        shape.y - 5,
        shape.width + 10,
        shape.height + 10
      );
      ctx.setLineDash([]);

      // Corner handles
      ctx.fillStyle = "#0066ff";
      const handleSize = 8;
      ctx.fillRect(
        shape.x - handleSize / 2,
        shape.y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.fillRect(
        shape.x + shape.width - handleSize / 2,
        shape.y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.fillRect(
        shape.x - handleSize / 2,
        shape.y + shape.height - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.fillRect(
        shape.x + shape.width - handleSize / 2,
        shape.y + shape.height - handleSize / 2,
        handleSize,
        handleSize
      );
    }
  };

  const drawGrid = (ctx, canvas) => {
    if (!showGrid) return;

    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas);

    // Draw all shapes
    shapes.forEach((shape) => {
      if (
        shape.layer === activeLayer ||
        layers.find((l) => l.id === shape.layer)?.visible
      ) {
        drawShape(ctx, shape);
      }
    });

    // Draw current path for pen/eraser tool
    if (
      (currentTool === TOOLS.PEN || currentTool === TOOLS.ERASER) &&
      currentPath.length > 0
    ) {
      ctx.strokeStyle = currentTool === TOOLS.ERASER ? "#ffffff" : strokeColor;
      ctx.lineWidth =
        currentTool === TOOLS.ERASER ? strokeWidth * 2 : strokeWidth;
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
    }
  }, [
    shapes,
    selectedShape,
    currentPath,
    currentTool,
    strokeColor,
    strokeWidth,
    activeLayer,
    layers,
    showGrid,
    gridSize,
  ]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const point = getPointOnCanvas(e, canvas);

    if (currentTool === TOOLS.SELECT) {
      // Check if clicking on a shape
      const clickedShape = [...shapes]
        .reverse()
        .find(
          (shape) =>
            point.x >= shape.x &&
            point.x <= shape.x + shape.width &&
            point.y >= shape.y &&
            point.y <= shape.y + shape.height
        );

      setSelectedShape(clickedShape || null);
      if (clickedShape) {
        setDragStart({
          x: point.x - clickedShape.x,
          y: point.y - clickedShape.y,
        });
      }
      return;
    }

    if (currentTool === TOOLS.TEXT) {
      const newShape = {
        id: Date.now(),
        type: TOOLS.TEXT,
        text: textInput || "Double click to edit",
        x: point.x,
        y: point.y,
        width: 100,
        height: 20,
        strokeColor,
        fillColor: "transparent",
        layer: activeLayer,
      };
      setShapes((prev) => [...prev, newShape]);
      saveToHistory([...shapes, newShape]);
      return;
    }

    setIsDrawing(true);
    setDragStart(point);

    if (currentTool === TOOLS.PEN || currentTool === TOOLS.ERASER) {
      setCurrentPath([point]);
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const point = getPointOnCanvas(e, canvas);

    if (currentTool === TOOLS.SELECT && selectedShape && dragStart) {
      // Move selected shape
      const updatedShapes = shapes.map((shape) =>
        shape.id === selectedShape.id
          ? { ...shape, x: point.x - dragStart.x, y: point.y - dragStart.y }
          : shape
      );
      setShapes(updatedShapes);
      const updatedSelectedShape = updatedShapes.find(
        (s) => s.id === selectedShape.id
      );
      setSelectedShape(updatedSelectedShape);
      return;
    }

    if (!isDrawing) return;

    if (currentTool === TOOLS.PEN || currentTool === TOOLS.ERASER) {
      setCurrentPath((prev) => [...prev, point]);
    } else {
      // Preview shape while dragging
      redrawCanvas();

      const ctx = canvas.getContext("2d");
      const width = point.x - dragStart.x;
      const height = point.y - dragStart.y;

      const previewShape = {
        type: currentTool,
        x: dragStart.x,
        y: dragStart.y,
        width:
          currentTool === TOOLS.SQUARE
            ? Math.abs(width) * Math.sign(width)
            : width,
        height:
          currentTool === TOOLS.SQUARE
            ? Math.abs(width) * Math.sign(height)
            : height,
        strokeColor,
        fillColor,
        strokeWidth,
      };

      drawShape(ctx, previewShape);
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing && currentTool !== TOOLS.SELECT) return;

    const canvas = canvasRef.current;
    const point = getPointOnCanvas(e, canvas);

    if (currentTool === TOOLS.SELECT) {
      setDragStart(null);
      return;
    }

    if (currentTool === TOOLS.PEN || currentTool === TOOLS.ERASER) {
      if (currentPath.length > 1) {
        const newShape = {
          id: Date.now(),
          type: currentTool,
          path: currentPath,
          x: Math.min(...currentPath.map((p) => p.x)),
          y: Math.min(...currentPath.map((p) => p.y)),
          width:
            Math.max(...currentPath.map((p) => p.x)) -
            Math.min(...currentPath.map((p) => p.x)),
          height:
            Math.max(...currentPath.map((p) => p.y)) -
            Math.min(...currentPath.map((p) => p.y)),
          strokeColor: currentTool === TOOLS.ERASER ? "#ffffff" : strokeColor,
          fillColor: "transparent",
          strokeWidth:
            currentTool === TOOLS.ERASER ? strokeWidth * 2 : strokeWidth,
          layer: activeLayer,
        };
        const newShapes = [...shapes, newShape];
        setShapes(newShapes);
        saveToHistory(newShapes);
      }
      setCurrentPath([]);
    } else {
      const width = point.x - dragStart.x;
      const height = point.y - dragStart.y;

      if (Math.abs(width) > 5 || Math.abs(height) > 5) {
        const newShape = {
          id: Date.now(),
          type: currentTool,
          x: dragStart.x,
          y: dragStart.y,
          width:
            currentTool === TOOLS.SQUARE
              ? Math.abs(width) * Math.sign(width)
              : width,
          height:
            currentTool === TOOLS.SQUARE
              ? Math.abs(width) * Math.sign(height)
              : height,
          strokeColor,
          fillColor,
          strokeWidth,
          layer: activeLayer,
        };
        const newShapes = [...shapes, newShape];
        setShapes(newShapes);
        saveToHistory(newShapes);
      }
    }

    setIsDrawing(false);
    setDragStart(null);
  };

  const deleteSelected = () => {
    if (selectedShape) {
      const newShapes = shapes.filter((shape) => shape.id !== selectedShape.id);
      setShapes(newShapes);
      setSelectedShape(null);
      saveToHistory(newShapes);
    }
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "artwork.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const clearCanvas = () => {
    setShapes([]);
    setSelectedShape(null);
    setCurrentPath([]);
    saveToHistory([]);
  };

  const addLayer = () => {
    const newLayerId =
      layers.length > 0 ? Math.max(...layers.map((l) => l.id)) + 1 : 1;
    setLayers([
      ...layers,
      { id: newLayerId, name: `Layer ${newLayerId}`, visible: true },
    ]);
    setActiveLayer(newLayerId);
  };

  const toggleLayerVisibility = (layerId) => {
    setLayers(
      layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const handleTextDoubleClick = (shape) => {
    const newText = prompt("Edit text:", shape.text);
    if (newText !== null) {
      const updatedShapes = shapes.map((s) =>
        s.id === shape.id ? { ...s, text: newText } : s
      );
      setShapes(updatedShapes);
      saveToHistory(updatedShapes);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const point = { x: canvas.width / 4, y: canvas.height / 4 }; // Default position

        const newShape = {
          id: Date.now(),
          type: TOOLS.IMAGE,
          image: img,
          x: point.x,
          y: point.y,
          width: img.width / 2, // Scale down
          height: img.height / 2,
          strokeColor: "transparent",
          fillColor: "transparent",
          layer: activeLayer,
        };

        const newShapes = [...shapes, newShape];
        setShapes(newShapes);
        saveToHistory(newShapes);
        setSelectedShape(newShape);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top App Bar - Mobile Friendly */}
      <div className="bg-gray-900 text-white p-2 md:p-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <h1 className="text-lg md:text-xl font-bold whitespace-nowrap">
              Art Studio Pro
            </h1>

            {/* Mobile Menu Button (for smaller screens) */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-gray-700"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Undo/Redo */}
            <div className="flex space-x-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 transition-colors"
                title="Undo"
              >
                <FaUndo className="text-sm" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 transition-colors"
                title="Redo"
              >
                <FaRedo className="text-sm" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-2 bg-gray-800 rounded-full px-3 py-1">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-1 rounded-full hover:bg-gray-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <span className="text-sm">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-1 rounded-full hover:bg-gray-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Grid Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded-full ${
                  showGrid ? "bg-blue-600" : "hover:bg-gray-700"
                } transition-colors`}
                title="Toggle Grid"
              >
                <FaVectorSquare className="text-sm" />
              </button>
              <button
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`p-2 rounded-full ${
                  snapToGrid ? "bg-blue-600" : "hover:bg-gray-700"
                } transition-colors`}
                title="Snap to Grid"
              >
                <FaMagic className="text-sm" />
              </button>
            </div>

            {/* Export Button */}
            <button
              onClick={exportImage}
              className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-full flex items-center space-x-1 transition-colors"
              title="Export Image"
            >
              <FaSave className="text-sm" />
              <span className="text-sm hidden lg:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu (shown on small screens) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-800 text-white p-3 space-y-3 shadow-lg">
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 transition-colors"
                title="Undo"
              >
                <FaUndo className="text-sm" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 transition-colors"
                title="Redo"
              >
                <FaRedo className="text-sm" />
              </button>
            </div>

            <button
              onClick={exportImage}
              className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-700 transition-colors"
              title="Export"
            >
              <FaSave className="text-sm" />
            </button>
          </div>

          <div className="flex justify-between">
            <div className="flex items-center space-x-2 bg-gray-700 rounded-full px-3 py-1">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-1 hover:text-blue-300 transition-colors"
              >
                -
              </button>
              <span className="text-sm">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-1 hover:text-blue-300 transition-colors"
              >
                +
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded-full ${
                  showGrid ? "bg-blue-600" : "bg-gray-700"
                } hover:bg-gray-600 transition-colors`}
                title="Grid"
              >
                <FaVectorSquare className="text-sm" />
              </button>
              <button
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`p-2 rounded-full ${
                  snapToGrid ? "bg-blue-600" : "bg-gray-700"
                } hover:bg-gray-600 transition-colors`}
                title="Snap"
              >
                <FaMagic className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar - Collapsible on mobile */}
        <div
          className={`${
            isMobileMenuOpen ? "hidden" : "flex"
          } md:flex flex-col bg-gray-800 text-white p-2 w-16 md:w-32 transition-all`}
        >
          <div className="overflow-y-auto flex-grow  hide-scrollbar">
            <div className="space-y-4">
              {/* Drawing Tools */}
              <ToolButton
                active={currentTool === TOOLS.SELECT}
                onClick={() => setCurrentTool(TOOLS.SELECT)}
                icon={<FaRegObjectUngroup />}
                title="Select"
              />

              <ToolButton
                active={currentTool === TOOLS.PEN}
                onClick={() => setCurrentTool(TOOLS.PEN)}
                icon={<FaPen />}
                title="Pen"
              />

              <ToolButton
                active={currentTool === TOOLS.ERASER}
                onClick={() => setCurrentTool(TOOLS.ERASER)}
                icon={<FaEraser />}
                title="Eraser"
              />

              <ToolButton
                active={currentTool === TOOLS.RECTANGLE}
                onClick={() => setCurrentTool(TOOLS.RECTANGLE)}
                icon={<FaRegSquare />}
                title="Rectangle"
              />

              <ToolButton
                active={currentTool === TOOLS.SQUARE}
                onClick={() => setCurrentTool(TOOLS.SQUARE)}
                icon={<FaSquare />}
                title="Square"
              />

              <ToolButton
                active={currentTool === TOOLS.CIRCLE}
                onClick={() => setCurrentTool(TOOLS.CIRCLE)}
                icon={<FaRegCircle />}
                title="Circle"
              />

              <ToolButton
                active={currentTool === TOOLS.TRIANGLE}
                onClick={() => setCurrentTool(TOOLS.TRIANGLE)}
                icon={<GiTriangleTarget />}
                title="Triangle"
              />
              {/* Organic Shapes */}
              <ToolButton
                active={currentTool === TOOLS.ORGANIC1}
                onClick={() => setCurrentTool(TOOLS.ORGANIC1)}
                icon={<GiAbstract050 />}
                title="Blob"
                color="green"
              />

              <ToolButton
                active={currentTool === TOOLS.ORGANIC2}
                onClick={() => setCurrentTool(TOOLS.ORGANIC2)}
                icon={<GiSolidLeaf />}
                title="Leaf"
                color="green"
              />

              <ToolButton
                active={currentTool === TOOLS.ORGANIC3}
                onClick={() => setCurrentTool(TOOLS.ORGANIC3)}
                icon={<FaCloud />}
                title="Cloud"
                color="green"
              />

              {/* Face Parts */}
              <ToolButton
                active={currentTool === TOOLS.HEAD}
                onClick={() => setCurrentTool(TOOLS.HEAD)}
                icon={<GiNinjaHead />}
                title="Head"
                color="purple"
              />

              <ToolButton
                active={currentTool === TOOLS.EYE}
                onClick={() => setCurrentTool(TOOLS.EYE)}
                icon={<FaEye />}
                title="Eye"
                color="purple"
              />

              <ToolButton
                active={currentTool === TOOLS.NOSE}
                onClick={() => setCurrentTool(TOOLS.NOSE)}
                icon={<GiNoseFront />}
                title="Nose"
                color="purple"
              />

              <ToolButton
                active={currentTool === TOOLS.MOUTH}
                onClick={() => setCurrentTool(TOOLS.MOUTH)}
                icon={<GiLipstick />}
                title="Mouth"
                color="purple"
              />

              {/* Text Tool */}
              <ToolButton
                active={currentTool === TOOLS.TEXT}
                onClick={() => setCurrentTool(TOOLS.TEXT)}
                icon={<FaFont />}
                title="Text"
                color="yellow"
              />

              {/* Image Tool */}
              <ToolButton
                active={currentTool === TOOLS.IMAGE}
                onClick={() => document.getElementById("image-upload").click()}
                icon={<FaImage />}
                title="Image"
                color="yellow"
              />
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            className="md:hidden p-2 mt-auto text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Right Panel - Collapsible on mobile */}
        <div
          className={`${
            isRightPanelOpen ? "flex" : "hidden"
          } md:flex flex-col bg-white border-l border-gray-200 w-64 md:w-72 shadow-lg`}
        >
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Properties</h3>
            <button
              onClick={() => setIsRightPanelOpen(false)}
              className="md:hidden p-1 rounded-full hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-grow p-4 custom-scrollbar">
            {/* Stroke Properties */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                <MdOutlineColorize className="mr-2" />
                Stroke
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() =>
                    setShowColorPicker(
                      showColorPicker === "stroke" ? null : "stroke"
                    )
                  }
                  className="w-10 h-10 rounded-md border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: strokeColor }}
                  title="Stroke Color"
                >
                  {showColorPicker === "stroke" && (
                    <div className="fixed z-20 mt-2 ml-10">
                      <ChromePicker
                        color={strokeColor}
                        onChangeComplete={(color) => {
                          setStrokeColor(color.hex);
                          setShowColorPicker(null);
                        }}
                      />
                    </div>
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Width</span>
                    <span>{strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Fill Properties */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                <MdFormatColorFill className="mr-2" />
                Fill
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() =>
                    setShowColorPicker(
                      showColorPicker === "fill" ? null : "fill"
                    )
                  }
                  className="w-10 h-10 rounded-md border-2 border-gray-300 shadow-sm relative"
                  style={{
                    backgroundColor:
                      fillColor === "transparent" ? "white" : fillColor,
                  }}
                  title="Fill Color"
                >
                  {fillColor === "transparent" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-red-500 transform rotate-45"></div>
                    </div>
                  )}
                  {showColorPicker === "fill" && (
                    <div className="fixed z-20 mt-2 ml-10">
                      <ChromePicker
                        color={
                          fillColor === "transparent" ? "#ffffff" : fillColor
                        }
                        onChangeComplete={(color) => {
                          setFillColor(color.hex);
                          setShowColorPicker(null);
                        }}
                      />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setFillColor("transparent")}
                  className={`px-3 py-2 text-xs rounded-md ${
                    fillColor === "transparent"
                      ? "bg-gray-200 text-gray-800"
                      : "bg-gray-100 text-gray-600"
                  } hover:bg-gray-200 transition-colors`}
                >
                  No Fill
                </button>
              </div>
            </div>

            {/* Text Input */}
            {currentTool === TOOLS.TEXT && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Text Content
                </h3>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Layers Panel */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700">Layers</h3>
                <button
                  onClick={addLayer}
                  className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`p-2 rounded-md flex items-center justify-between ${
                      activeLayer === layer.id
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 hover:bg-gray-100"
                    } cursor-pointer transition-colors`}
                    onClick={() => setActiveLayer(layer.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerVisibility(layer.id);
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        {layer.visible ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                              clipRule="evenodd"
                            />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                        )}
                      </button>
                      <span className="text-sm text-gray-800">
                        {layer.name}
                      </span>
                    </div>
                    {activeLayer === layer.id && (
                      <span className="text-xs text-blue-500 font-medium">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Shape Actions */}
            {selectedShape && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700">Selected Shape</h3>
                <button
                  onClick={deleteSelected}
                  className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <FaTrash className="text-sm" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Clear Canvas Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={clearCanvas}
              className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
            >
              <FaTrash className="text-sm" />
              <span>Clear Canvas</span>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-100">
          {/* Floating Controls for Mobile */}
          <div className="md:hidden absolute bottom-4 right-4 z-10 flex space-x-2">
            <button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-700"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Canvas Container */}
          <div className="absolute inset-0 flex items-center justify-center p-2 md:p-4">
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "center center",
                touchAction: "none",
              }}
              className="shadow-lg"
            >
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  const mouseEvent = new MouseEvent("mousedown", {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                  });
                  handleMouseDown(mouseEvent);
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  const mouseEvent = new MouseEvent("mousemove", {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                  });
                  handleMouseMove(mouseEvent);
                }}
                onTouchEnd={(e) => {
                  const mouseEvent = new MouseEvent("mouseup", {});
                  handleMouseUp(mouseEvent);
                }}
                onDoubleClick={(e) => {
                  if (
                    currentTool === TOOLS.SELECT &&
                    selectedShape &&
                    selectedShape.type === TOOLS.TEXT
                  ) {
                    handleTextDoubleClick(selectedShape);
                  }
                }}
                className="border border-gray-300 w-full bg-white"
                style={{
                  cursor:
                    currentTool === TOOLS.SELECT ? "default" : "crosshair",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;


