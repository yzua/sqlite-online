import SchemaTree from "./SchemaTree";

export default function SchemaTreePanel() {
  return (
    <div className="h-full min-w-0 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <SchemaTree />
      </div>
    </div>
  );
}
