import { useNavigate } from "react-router-dom";
import { useState } from "react";

import CommentForm from "../../components/comments/CommentForm";
import { commentService } from "../../services/comment.service";


export default function AddCommentPage() {

  const navigate = useNavigate();

  const [loading,setLoading] = useState(false);



  const handleSubmit = async (
    data:{
      content:string;
    }
  ) => {

    try {

      setLoading(true);


      await commentService.createComment(data);


      alert(
        "Comment created successfully."
      );


      navigate("/comments");


    } catch(error){

      console.error(error);

      alert(
        "Failed to create comment."
      );


    } finally {

      setLoading(false);

    }

  };



  return (

    <div className="p-6 max-w-3xl mx-auto">

      <h1 className="text-2xl font-bold mb-6">
        Add Comment
      </h1>


      <CommentForm
        onSubmit={handleSubmit}
        loading={loading}
      />

    </div>

  );
}