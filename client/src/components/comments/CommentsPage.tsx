import {
useEffect,
useState
} from "react";

import CommentList from "./CommentList";
import type { Comment } from "../../types/comment";
import { Link } from "react-router-dom";

import {
commentService
} from "../../services/comment.service";


export default function CommentsPage(){

    const loadComments = async()=>{

    const response = await commentService.getComments();

    setComments(response.data);

    };
    
    const [comments,setComments] = useState<Comment[]>([]);


useEffect(()=>{

loadComments();

},[]);






return (

<div className="p-6">

<h1 className="text-2xl font-bold mb-5">
Comments
</h1>

<Link
  to="/comments/add"
  className="
  bg-blue-600
  text-white
  px-4
  py-2
  rounded-lg
  inline-block
  mb-5
  "
>
  + Add Comment
</Link>


<CommentList
comments={comments}
/>


</div>

)

}