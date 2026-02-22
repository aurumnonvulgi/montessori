import MaterialTeachersGuide from "./MaterialTeachersGuide";
import { NUMBER_RODS_TEACHERS_GUIDE } from "../data/materialTeachersGuides";

type NumberRodsTeachersGuideProps = {
  className?: string;
  autoPreviewOnVisible?: boolean;
};

export default function NumberRodsTeachersGuide({
  className = "",
  autoPreviewOnVisible = false,
}: NumberRodsTeachersGuideProps) {
  return (
    <MaterialTeachersGuide
      guide={NUMBER_RODS_TEACHERS_GUIDE}
      className={className}
      autoPreviewOnVisible={autoPreviewOnVisible}
    />
  );
}
