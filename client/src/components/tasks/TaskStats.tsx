import type { Task } from "../../types/task";

type Props = {
  tasks: Task[];
};

function TaskStats({ tasks }: Props) {
  const totalTasks = tasks.length;

  const todoTasks = tasks.filter(
    (task) => task.status === "TODO"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const reviewTasks = tasks.filter(
    (task) => task.status === "REVIEW"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;

  const cards = [
    {
      title: "Total Tasks",
      value: totalTasks,
      color: "bg-blue-500",
    },
    {
      title: "To Do",
      value: todoTasks,
      color: "bg-gray-500",
    },
    {
      title: "In Progress",
      value: inProgressTasks,
      color: "bg-yellow-500",
    },
    {
      title: "Review",
      value: reviewTasks,
      color: "bg-purple-500",
    },
    {
      title: "Completed",
      value: completedTasks,
      color: "bg-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.color} text-white rounded-xl shadow p-5`}
        >
          <p className="text-sm opacity-90">
            {card.title}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}

export default TaskStats;