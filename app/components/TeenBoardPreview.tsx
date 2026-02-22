"use client";

import TeenBoardScene from "./TeenBoardScene";
import TeenBoardSceneSymbols from "./TeenBoardSceneSymbols";

type TeenBoardPreviewProps = {
  className?: string;
  scene?: "quantities" | "symbols";
};

const QUANTITIES_PREVIEW_CAMERA = {
  x: 0.32,
  y: 0.34,
  z: 1.05,
  fov: 50,
};

const QUANTITIES_PREVIEW_TARGET = {
  x: 0.33,
  y: 0,
  z: 0.42,
};

export default function TeenBoardPreview({ className, scene = "quantities" }: TeenBoardPreviewProps) {
  return (
    <div
      className={`pointer-events-none h-full w-full ${className ?? ""}`}
      style={{ touchAction: "pan-y" }}
    >
      {scene === "symbols" ? (
        <TeenBoardSceneSymbols interactive={false} showZoomReset={false} />
      ) : (
        <TeenBoardScene
          interactive={false}
          showZoomReset={false}
          cameraSettings={QUANTITIES_PREVIEW_CAMERA}
          cameraTarget={QUANTITIES_PREVIEW_TARGET}
        />
      )}
    </div>
  );
}
