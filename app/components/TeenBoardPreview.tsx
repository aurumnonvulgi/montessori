"use client";

import TeenBoardScene from "./TeenBoardScene";
import TeenBoardSceneSymbols from "./TeenBoardSceneSymbols";

type TeenBoardPreviewProps = {
  className?: string;
  scene?: "quantities" | "symbols";
};

const QUANTITIES_PREVIEW_CAMERA = {
  x: 0,
  y: 0.42,
  z: 1.1,
  fov: 52,
};

export default function TeenBoardPreview({ className, scene = "quantities" }: TeenBoardPreviewProps) {
  return (
    <div className={`h-full w-full ${className ?? ""}`}>
      {scene === "symbols" ? (
        <TeenBoardSceneSymbols interactive={false} showZoomReset={false} />
      ) : (
        <TeenBoardScene
          interactive={false}
          showZoomReset={false}
          cameraSettings={QUANTITIES_PREVIEW_CAMERA}
        />
      )}
    </div>
  );
}
