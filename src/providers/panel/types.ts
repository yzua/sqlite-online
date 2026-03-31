import type { SqlValue } from "sql.js";

export interface SelectedRowObject {
  data: SqlValue[];
  index: number;
  primaryValue: SqlValue | null;
}
