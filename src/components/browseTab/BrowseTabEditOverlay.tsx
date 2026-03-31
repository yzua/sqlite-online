import EditSection from "./EditSection";

interface BrowseTabEditOverlayProps {
  isEditing: boolean;
}

function BrowseTabEditOverlay({ isEditing }: BrowseTabEditOverlayProps) {
  return (
    <div
      className={`bg-background absolute top-0 right-0 z-40 h-full w-full ${isEditing ? "block" : "hidden"}`}
    >
      <section className="bg-primary/5 h-full">
        <EditSection />
      </section>
    </div>
  );
}

export default BrowseTabEditOverlay;
