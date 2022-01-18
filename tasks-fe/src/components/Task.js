import React, { Fragment } from "react";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";

const dateTimeWrapper = (task, time, type, dateForm) => {
    const converted = DateTime.fromISO(time);
    
    return (
        <time dateTime={converted} className={"date-time-wrapper" + (converted < DateTime.now() && !task.complete && type === "due" ? " overdue" : "")}> 
            <p className="date">{converted.toLocaleString(dateForm)}</p>
            <p className="time">{converted.toLocaleString(DateTime.TIME_SIMPLE)}</p>
        </time>
    );
}

const Task = observer((props) => {
    const task = props.data;
    const id = "task-" + task.id;
    const checkboxId = (props.basicVersion ? "list" : "show")+ "-checkbox-"+task.id;
    
    // Props: 
    // props.data.title
    // props.data.complete
    // props.data.due
    // props.data.start
    // props.data.description
    // props.data.completed_at
    // props.basicVersion
    // ^ whether it is basic (in the list) or not (in show)
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
    const dateForm = props.basicVersion? DateTime.DATE_SHORT : DateTime.DATE_MED_WITH_WEEKDAY;

    if (props.basicVersion) {
        return (
            <div className="task-wrapper" id={id} key={task.id}> 
                {checkbox}
                <button role="link" className="title-date-wrapper" onClick={() => task.setFocus()}>
                    {title}
                    {dateTimeWrapper(task, task.due, "due", dateForm)}
                </button>
            </div>
        )
    }
    else if (props.buttons) {
        return (
            <Fragment>
                <div className="title-button-wrapper">
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
                            {task.start !== null ? 
                                dateTimeWrapper(task, task.start, "start", dateForm)
                                :
                                <p className="subtle"> Not set </p>
                            }
                        </div>
                        <div> 
                            <h3>Due</h3>
                            {task.due !== null ? 
                                dateTimeWrapper(task, task.due, "due", dateForm)
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

export default Task