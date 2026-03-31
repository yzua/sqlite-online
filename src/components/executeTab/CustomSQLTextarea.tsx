import { darcula } from "@uiw/codemirror-theme-darcula";

import CodeMirror from "@uiw/react-codemirror";
import { useCallback } from "react";
import useTheme from "@/hooks/useTheme";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { useSqlEditorConfig } from "./useSqlEditorConfig";

function CustomSQLTextarea() {
  const { theme } = useTheme();
  const customQuery = useDatabaseStore((state) => state.customQuery);
  const setCustomQuery = useDatabaseStore((state) => state.setCustomQuery);
  const tablesSchema = useDatabaseStore((state) => state.tablesSchema);
  const extensions = useSqlEditorConfig(customQuery, tablesSchema);

  const handleChange = useCallback(
    (newValue: string) => {
      if (newValue !== customQuery) {
        setCustomQuery(newValue);
      }
    },
    [customQuery, setCustomQuery]
  );

  return (
    <CodeMirror
      value={customQuery}
      height="100%"
      extensions={extensions}
      onChange={handleChange}
      className="h-full w-full"
      theme={theme === "dark" ? darcula : "light"}
    />
  );
}

export default CustomSQLTextarea;
