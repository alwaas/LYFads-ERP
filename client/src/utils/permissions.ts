import { ROLES } from "../constants/roles";

export const permissions = {
  projects: {
    view: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.MANAGER,
      ROLES.EMPLOYEE,
    ],

    create: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.MANAGER,
    ],

    edit: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.MANAGER,
    ],

    delete: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
    ],
  },
};