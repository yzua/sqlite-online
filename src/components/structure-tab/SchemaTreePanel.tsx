import SchemaTree from "./SchemaTree";

export default function SchemaTreePanel() {
  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-y-auto">
        <SchemaTree />
      </div>
    </div>
  );
}
