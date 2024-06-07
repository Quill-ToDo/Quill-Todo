import { TaskModel } from "@/store/tasks/TaskModel";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";

export const Checkbox = observer(({task, type, checkboxId}: {task: TaskModel, type: TaskModel.VisualStyles, checkboxId: string}) => {
    return <div className="check-box-wrapper">
        <input 
            type="checkbox" 
            id={checkboxId}
            onChange={() => {task.toggleComplete()}}
            checked={task.complete}
            >
        </input>
        {type === "due" ? <TaskDueCheckbox task={task} /> : <WorkCheckbox task={task} />}
    </div>;
});

const TaskDueCheckbox = observer(({task}: {task: TaskModel}) => 
    task.complete ? 
        <i className="far fa-check-square fa-fw checkmark" aria-hidden="true"></i> 
        : <i className="far fa-square fa-fw checkmark" aria-hidden="true"></i>); 


const WorkCheckbox = observer(({task}: {task: TaskModel}) => 
    task.complete ? 
        <i className="far fa-check-circle fa-fw checkmark round" aria-hidden="true"></i> 
        : <i className="far fa-circle fa-fw checkmark round" aria-hidden="true"></i>);

/**
     * Displays the date and time for a task
     * 
     */
export const DateTimeWrapper = observer(({task, type, dateFormat}: {task: TaskModel, type: "start" | "due", dateFormat: DateTime}) => {
    const time = type === "start" ? task.start : task.due;
    const overdue = type === "due" && time < DateTime.now() && !task.complete;
    return (
        <time dateTime={time} className={`date-time-wrapper ${overdue ? "overdue" : ""}`}> 
            <p className="date">{time.toLocaleString(dateFormat)}</p>
            <p className="time">{time.toLocaleString(DateTime.TIME_SIMPLE)}</p>
        </time>
    );
})