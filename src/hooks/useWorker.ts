import { useContext } from "react";

import DatabaseWorkerContext from "@/providers/worker/WorkerContext";

const useDatabaseWorker = () => {
  const context = useContext(DatabaseWorkerContext);

  if (context === undefined)
    throw new Error(
      "useDatabaseWorker must be used within a DatabaseWorkerProvider"
    );

  return context;
};

export default useDatabaseWorker;
