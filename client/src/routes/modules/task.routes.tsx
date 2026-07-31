import { Route } from "react-router-dom";

import TasksPage from "../../pages/tasks/TasksPage";
import AddTaskPage from "../../pages/tasks/AddTaskPage";
import EditTaskPage from "../../pages/tasks/EditTaskPage";
import ViewTaskPage from "../../pages/tasks/ViewTaskPage";

import { PATHS } from "../config/paths";

export function TaskRoutes() {
  return (
    <>
      <Route
        path={PATHS.TASKS}
        element={<TasksPage />}
      />

      <Route
        path={PATHS.ADD_TASK}
        element={<AddTaskPage />}
      />

      <Route
        path={PATHS.EDIT_TASK}
        element={<EditTaskPage />}
      />

      <Route
        path={PATHS.VIEW_TASK}
        element={<ViewTaskPage />}
      />
    </>
  );
}