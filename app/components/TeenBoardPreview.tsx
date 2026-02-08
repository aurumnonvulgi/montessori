"use client";

import TeenBoardScene from "./TeenBoardScene";
import TeenBoardSceneSymbols from "./TeenBoardSceneSymbols";

type TeenBoardPreviewProps = {
  className?: string;
  scene?: "quantities" | "symbols";
};

export default function TeenBoardPreview({ className, scene = "quantities" }: TeenBoardPreviewProps) {
  return (
    <div className={`h-full w-full ${className ?? ""}`}>
      {scene === "symbols" ? (
        <TeenBoardSceneSymbols interactive={false} />
      ) : (
        <TeenBoardScene interactive={false} />
      )}
    </div>
  );
}
