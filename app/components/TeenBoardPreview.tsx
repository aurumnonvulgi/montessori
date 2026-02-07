"use client";

import TeenBoardScene from "./TeenBoardScene";

type TeenBoardPreviewProps = {
  className?: string;
};

export default function TeenBoardPreview({ className }: TeenBoardPreviewProps) {
  return (
    <div className={`h-full w-full ${className ?? ""}`}>
      <TeenBoardScene interactive={false} />
    </div>
  );
}
