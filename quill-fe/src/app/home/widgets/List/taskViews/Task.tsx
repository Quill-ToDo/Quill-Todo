import React, { Fragment } from "react";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";
import './tasks.css';
import '@/widgets/TaskDetail/taskDetailStyle.css';
import TaskModel from "@/store/tasks/TaskModel"

/**
 * Displays the date and time of the task.
 * 
 * @param {Task} task The task to render the date and time for
 * @param {string} type The type of the task ("due" or "work") 
 * @param {*} dateForm The Luxon format of the date to display
 * @returns 
 */
const dateTimeWrapper = (task : TaskModel, type : string, dateForm : DateTime) => {
    const time = type === "start" ? task.start : task.due ;
    const converted = DateTime.fromISO(time);
    
    return (
        <time dateTime={converted} className={"date-time-wrapper" + (converted < DateTime.now() && !task.complete && type === "due" ? " overdue" : "")}> 
            <p className="date">{converted.toLocaleString(dateForm)}</p>
            <p className="time">{converted.toLocaleString(DateTime.TIME_SIMPLE)}</p>
        </time>
    );
}

/**
 * A task within the list
 * 
 * ---
 * 
 * *Required props:*
 *  - **data** : Task - The data of the task to render.
 *    Important fields:
 *      - title
 *      - complete
 *      - due
 *      - start
 *      - description
 *      - completed_at
 */
const Task = observer((props) => {
    const task = props.data;
    const id = `task-${task.id}`;
    const checkboxId = `list-checkbox-${task.id}`;
    
    const classAddition = task.complete ? "complete" : "";
    const title = (
            <label htmlFor={checkboxId} onClick={(e) => {e.preventDefault()}}>
                {task.complete ? <p id={"task-title-" + task.id} className={"title " + classAddition}><s>{task.title}</s></p>
                : <p id={"task-title-" + task.id} className={"title " + classAddition}>{task.title}</p>}    
            </label>
    );
    const workCheckbox = task.complete ? <i className="far fa-check-circle fa-fw checkmark round" aria-hidden="true"></i> 
        : <i className="far fa-circle fa-fw checkmark round" aria-hidden="true"></i>;
    const dueCheckbox = task.complete ? <i className="far fa-check-square fa-fw checkmark" aria-hidden="true"></i> 
        : <i className="far fa-square fa-fw checkmark" aria-hidden="true"></i>; 
    const checkbox = (
        <div className="check-box-wrapper">
            <input 
                type="checkbox" 
                id={checkboxId}
                onChange={() => {task.toggleComplete()}}
                checked={task.complete}
            >
            </input>
            {props.type === "due" ? dueCheckbox : workCheckbox}
        </div>
    );
    const dateForm = DateTime.DATE_SHORT;

    return (
        <div className={`task-wrapper${task.complete ? " complete" : ""}`} id={id} key={task.id}> 
            {checkbox}
            <button role="link" className="title-date-wrapper" onClick={() => task.setFocus()}>
                {title}
                {dateTimeWrapper(task, "due", dateForm)}
            </button>
        </div>
    )
})

export default Task