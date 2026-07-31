import { Route } from "react-router-dom";

import ProjectsPage from "../../pages/projects/ProjectsPage";
import AddProjectPage from "../../pages/projects/AddProjectPage";
import EditProjectPage from "../../pages/projects/EditProjectPage";
import ViewProjectPage from "../../pages/projects/ViewProjectPage";

import { PATHS } from "../config/paths";

export function ProjectRoutes() {
  return (
    <>
      <Route
        path={PATHS.PROJECTS}
        element={<ProjectsPage />}
      />

      <Route
        path={PATHS.ADD_PROJECT}
        element={<AddProjectPage />}
      />

      <Route
        path={PATHS.EDIT_PROJECT}
        element={<EditProjectPage />}
      />

      <Route
        path={PATHS.VIEW_PROJECT}
        element={<ViewProjectPage />}
      />
    </>
  );
}