import api from "./api";

export const commentService = {

  getComments: async () => {
    const response = await api.get("/comments");
    return response.data;
  },


  getComment: async (id:string) => {
    const response = await api.get(`/comments/${id}`);
    return response.data;
  },


  createComment: async(data:any)=>{
    const response = await api.post(
      "/comments",
      data
    );

    return response.data;
  },


  updateComment: async(
    id:string,
    data:any
  )=>{
    const response = await api.patch(
      `/comments/${id}`,
      data
    );

    return response.data;
  },


  deleteComment: async(id:string)=>{

    const response = await api.delete(
      `/comments/${id}`
    );

    return response.data;

  }

};