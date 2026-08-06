export interface Comment {
  id: string;

  message: string;

  user: {
    id: string;
    fullName: string;
    email: string;
  };

  projectId?: string | null;
  taskId?: string | null;

  createdAt: string;
  updatedAt: string;
}