import React, { Fragment } from "react";

import Task from './Task'

function TaskSectionContent (props) {
    var body;
    if (props.tasks.length === 0) {
        body = <p className="subtle centered">{props.emptyText}</p>;
    }

    else {
        body =  
            <ul>
                { props.tasks.map((task) => {
                    return ( 
                        <li className="task" key={task.pk}>
                            <Task
                                data={task}
                                basicVersion={true}
                                clickCallback={props.TaskClickCallback}
                                type="due"
                            />
                        </li>
                    )
                })}
            </ul>
    }

    return (
        <Fragment>
            {props.title !== undefined ? <h3>{props.title}</h3> : null}
            <div className="dark-section">
                {body}
            </div>
        </Fragment>
    )
}

export default TaskSectionContent