import { TaskModel } from "@/store/tasks/TaskModel";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";
import { ReactNode } from "react";

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

export const ColorBubble = observer(({task}: {task: TaskModel}) => {
    return <div className="color-bubble-wrapper">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill={task.color}/>
        </svg>
    </div>;
});

const forms = {
    work: {
        complete: `fa-check-circle round`,
        notComplete: `fa-circle round`
    },
    due: {
        complete: `fa-check-square`,
        notComplete: `fa-square`,
    }
}

const TaskCheckbox = observer(({task, form}: {task: TaskModel, form: "work" | "due"}) => {
    const styleText = !task.complete ? {color: task.color} : {};
    const checkFormat = task.complete ? forms[form].complete : forms[form].notComplete;
    return <i className={`far fa-fw checkmark ${checkFormat}`} style={styleText}></i>;  
})

const TaskDueCheckbox = observer(({task}: {task: TaskModel}) => <TaskCheckbox task={task} form="due" />);

const WorkCheckbox = observer(({task}: {task: TaskModel}) => <TaskCheckbox task={task} form="work" />);


export const TaskTitle = observer(({task, pClasses=""}: {task: TaskModel, pClasses?: string}) => {
    const styleText = !task.complete ? {color: task.color} : {};
    return <p className={`title ${pClasses}`} style={styleText}>
            { task.complete ? <s>{task.title}</s> : task.title }
        </p>;  
})

/**
 * Displays the date and time for a task
 * 
 */
export const DateTimeWrapper = observer(({task, type, dateFormat}: {task: TaskModel, type: "start" | "due", dateFormat: DateTime}) => {
    const time = type === "start" ? task.start : task.due;
    const overdue = type === "due" && time < DateTime.now() && !task.complete;
    return (
        <time dateTime={time} className={`date-time-wrapper ${overdue && "overdue"}`}> 
            <p className="date">{time.toLocaleString(dateFormat)}</p>
            <p className="time">{time.toLocaleString(DateTime.TIME_SIMPLE)}</p>
        </time>
    );
})