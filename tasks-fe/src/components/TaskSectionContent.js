import React, { Fragment } from "react";

import Task from './Task'

function TaskSectionContent (props) {
    return (
        <Fragment>
            {props.title !== undefined ? <h3>{props.title}</h3> : null}
            <div className="dark-section">
                {props.tasks.length === 0 ? 
                <p className="subtle centered">{props.emptyText}</p>
                :
                <ul>
                    { props.tasks.map((task) => {
                        return ( 
                            <li className="task" key={task.pk}>
                                <Task
                                    data={task}
                                    basicVersion={true}
                                    clickCallback={props.TaskClickCallback}
                                    type={props.type}
                                />
                            </li>
                        )
                    })}
                </ul>}
            </div>
        </Fragment>
    )
}

export default TaskSectionContent