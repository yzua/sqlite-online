import { usePanelState } from "@/hooks/usePanel";
import EditSection from "./EditSection";

function EditOverlay() {
  const { isEditing } = usePanelState();

  return (
    <div
      className={`bg-background absolute inset-0 z-40 ${isEditing ? "block" : "hidden"}`}
    >
      <section className="bg-primary/5 h-full">
        <EditSection />
      </section>
    </div>
  );
}

export default EditOverlay;
