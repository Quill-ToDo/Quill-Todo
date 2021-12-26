import React from "react";

import Task from './Task'

class OneTaskSection extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: props.title,
            class: props.class,
            tasks: props.tasks
        };  
    }

    render () {
        return (
            <div className="{this.state.className} mid-section">
                <div className="expandable-section-header">
                    <div className="expand-symbol"></div>
                    <h2>{this.state.title}</h2>
                </div>
                <div className="section-collapsible">
                    <div className="dark-section">
                    { this.state.tasks.length > 0 &&
                        <ul>
                            { this.state.tasks.map((task) => {
                                return ( 
                                    <li className="task">
                                        <Task 
                                            data={task}
                                        />
                                    </li>
                                )
                            })}
                        </ul>
                    }
                    { this.state.tasks.length === 0 &&
                        <p className="subtle centered">No upcoming tasks!</p>
                    }
                    </div>
                </div>
            </div>
        );
    }
}

export default OneTaskSection;