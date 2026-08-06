import type { ProjectTimeline } from "../../types/projectTimeline";

type Props = {
  timeline: ProjectTimeline;
};

export default function ProjectTimeline({ timeline }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">

      <h2 className="text-2xl font-bold mb-6">
        Project Timeline
      </h2>

      <div className="grid md:grid-cols-2 gap-6">

        <div>
          <h3 className="font-semibold text-lg mb-3">
            Milestones
          </h3>

          {timeline.milestones.length === 0 ? (
            <p className="text-gray-500">
              No milestones found.
            </p>
          ) : (
            <div className="space-y-3">
              {timeline.milestones.map((m) => (
                <div
                  key={m.id}
                  className="border rounded-lg p-3"
                >
                  <p className="font-semibold">
                    {m.title}
                  </p>

                  <p className="text-sm text-gray-500">
                    Deadline:
                    {" "}
                    {m.deadline
                      ? new Date(
                          m.deadline
                        ).toLocaleDateString()
                      : "-"}
                  </p>

                  <p className="text-sm">
                    {m.completedAt
                      ? "Completed"
                      : "Pending"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-3">
            Tasks
          </h3>

          {timeline.tasks.length === 0 ? (
            <p className="text-gray-500">
              No tasks found.
            </p>
          ) : (
            <div className="space-y-3">
              {timeline.tasks.map((task) => (
                <div
                  key={task.id}
                  className="border rounded-lg p-3"
                >
                  <p className="font-semibold">
                    {task.title}
                  </p>

                  <p className="text-sm">
                    Status: {task.status}
                  </p>

                  <p className="text-sm">
                    Priority: {task.priority}
                  </p>

                  <p className="text-sm">
                    Assigned:
                    {" "}
                    {task.employee?.user.fullName ??
                      "-"}
                  </p>

                  <p className="text-sm text-gray-500">
                    Due:
                    {" "}
                    {task.dueDate
                      ? new Date(
                          task.dueDate
                        ).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}