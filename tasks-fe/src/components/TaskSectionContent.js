import React, { Fragment } from "react";

import Task from './Task'

class TaskSectionContent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: props.title,
            tasks: props.tasks,
            empty_text: props.empty_text
        };
    }

    render () {
        var body;
        if (this.state.tasks.length === 0) {
            body = <p className="subtle centered">{this.state.empty_text}</p>;
        }
        else {
            body =  
                <ul>
                    { this.state.tasks.map((task) => {
                        return ( 
                            <li className="task" key={task.pk}>
                                <Task data={task} />
                            </li>
                        )
                    })}
                </ul>
        }

        return (
            <Fragment>
                {this.state.title !== undefined ? <h3>{this.state.title}</h3> : null}
                <div className="dark-section">
                    {body}
                </div>
            </Fragment>
        )
    }
}

export default TaskSectionContent