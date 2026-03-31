import { useCallback, useEffect, useMemo } from "react";
import usePanelManager from "@/hooks/usePanel";
import useDatabaseWorker from "@/hooks/useWorker";
import {
  selectIsCurrentTableView,
  useDatabaseStore
} from "@/store/useDatabaseStore";
import { selectEditValues, usePanelStore } from "@/store/usePanelStore";
import EditSectionActions from "./EditSectionActions";
import EditSectionField from "./EditSectionField";
import EditSectionHeader from "./EditSectionHeader";

function EditSection() {
  const { handleEditSubmit } = useDatabaseWorker();
  const { selectedRowObject, isInserting, handleCloseEdit } = usePanelManager();
  const editValues = usePanelStore(selectEditValues);
  const setEditValues = usePanelStore((state) => state.setEditValues);
  const tablesSchema = useDatabaseStore((state) => state.tablesSchema);
  const currentTable = useDatabaseStore((state) => state.currentTable);
  const columns = useDatabaseStore((state) => state.columns);
  const currentTableSchema = currentTable
    ? tablesSchema[currentTable]
    : undefined;

  useEffect(() => {
    if (isInserting) {
      setEditValues(columns?.map(() => "") || []);
    } else if (selectedRowObject) {
      setEditValues(
        selectedRowObject.data.map((value) => value?.toString() ?? "")
      );
    }
  }, [isInserting, selectedRowObject, columns, setEditValues]);

  const handleEditInputChange = useCallback(
    (index: number, newValue: string) => {
      const currentEditValues = usePanelStore.getState().editValues;
      setEditValues(
        currentEditValues.map((value, i) => (i === index ? newValue : value))
      );
    },
    [setEditValues]
  );

  const formItems = useMemo(() => {
    if (!columns || !currentTableSchema) return null;

    const schema = currentTableSchema.schema;

    return columns.map((column, index) => {
      return (
        <EditSectionField
          key={column}
          column={column}
          columnSchema={schema[index] ?? null}
          value={editValues[index] || ""}
          onChange={(value) => handleEditInputChange(index, value)}
        />
      );
    });
  }, [columns, currentTableSchema, editValues, handleEditInputChange]);

  const isView = useDatabaseStore(selectIsCurrentTableView);

  return (
    <section className="flex h-full flex-col">
      <EditSectionHeader isInserting={isInserting} onBack={handleCloseEdit} />
      <div className="flex-1 overflow-auto">{formItems}</div>
      <EditSectionActions
        isInserting={isInserting}
        isView={isView}
        onInsertOrUpdate={() =>
          handleEditSubmit(isInserting ? "insert" : "update")
        }
        onDelete={() => handleEditSubmit("delete")}
      />
    </section>
  );
}

export default EditSection;
