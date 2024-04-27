import React, { Fragment } from "react";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";
import './tasks.css';
import '@/widgets/TaskDetail/taskDetailStyle.css';
import TaskModel from "@/store/tasks/TaskModel"


/**
 * A task within the task details popup
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
const TaskDetail = observer((props) => {
    const task = props.data;
    const id = `task-${task.id}`;
    const checkboxId = `show-checkbox-${task.id}`;
    
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
    const dateForm = DateTime.DATE_MED_WITH_WEEKDAY;
    
        return (
            <Fragment>
                <div className="header-container">
                    <div className="task-wrapper" data-testid={"taskwrapper-"+task.title} >
                        <div className="title-wrapper">
                            {checkbox}
                            {title}
                        </div>
                    </div>
                    {props.buttons}
                </div>
                <div className="dark-section">
                    <div className="date-wrapper">
                        <div>
                            <h3>Start</h3>
                            {task.start ? 
                                dateTimeWrapper(task, "start", dateForm)
                                :
                                <p className="subtle"> Not set </p>
                            }
                        </div>
                        <div> 
                            <h3>Due</h3>
                            {task.due ? 
                                dateTimeWrapper(task, "due", dateForm)
                                :
                                <p className="subtle"> Not set </p>
                            }
                        </div>
                    </div>
                    {task.description &&
                        <Fragment>
                            <hr />
                            <p className="centered">{task.description}</p>    
                        </Fragment>
                    }
                </div>
            </Fragment>
        );
    }
})

export default TaskDetail;