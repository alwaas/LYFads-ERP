import CommentCard from "./CommentCard";
import type { Comment } from "../../types/comment";


interface Props{
comments:Comment[];
}


export default function CommentList({
comments
}:Props){


return (

<div className="space-y-4">

{
comments.map(comment=>(
<CommentCard
key={comment.id}
comment={comment}
/>
))
}

</div>

)

}