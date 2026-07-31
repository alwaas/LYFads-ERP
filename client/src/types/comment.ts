export interface Comment {
  id: string;
  content: string;

  author: {
    id: string;
    fullName: string;
  };

  projectId?: string;
  taskId?: string;

  createdAt: string;
  updatedAt: string;
}