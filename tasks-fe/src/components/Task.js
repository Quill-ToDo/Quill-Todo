import React, { Fragment } from "react";
import { DateTime } from "luxon";

const dateTimeWrapper = (task, time, type) => {
    const converted = DateTime.fromISO(time);
    return (
        <div className={"date-time-wrapper" + (converted < DateTime.now() && !task.complete && type === "due" ? " overdue" : "")}> 
            <p className="date">{converted.toLocaleString(DateTime.DATE_SHORT)}</p>
            <p className="time">{converted.toLocaleString(DateTime.TIME_SIMPLE)}</p>
        </div>
    );
}

const Task = (props) => {
    const task = props.data;
    const id = "task-" + task.pk;
    
    // Props: 
    // props.data.title
    // props.data.complete
    // props.data.due
    // props.data.start
    // props.data.description
    // props.data.completed_at
    // props.basicVersion
    // ^ whether it is basic (in the list) or not (in show)
    const title = (
        <button>
            <p className="title" data-complete={task.complete}>{task.title}</p>
        </button>
    );

    const checkbox = (
        <div className="check-box-wrapper">
            <input 
                type="checkbox" 
                aria-labelledby={task.title} 
                onChange={() => { task.toggleComplete()}}
                data-complete={task.complete}
                >
            </input>
            <span className={props.type === "due" ? "checkmark" : "checkmark round"}></span>
        </div>
    );

    if (props.basicVersion) {
        return (
            <div className="task-wrapper" id={id}> 
                {checkbox}
                <div className="title-date-wrapper" onClick={() => task.setFocus()}>
                    {title}
                    {dateTimeWrapper(task, task.due, "due")}
                </div>
            </div>
        )
    }
    else if (props.buttons) {
        return (
            <Fragment>
                <div>
                    <div className="task-wrapper" >
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
                            {task.start !== null ? 
                                dateTimeWrapper(task, task.start, "start")
                                :
                                <p className="subtle"> Not set </p>
                            }
                        </div>
                        <div> 
                            <h3>Due</h3>
                            {task.due !== null ? 
                                dateTimeWrapper(task, task.due, "due")
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
}

export default Task