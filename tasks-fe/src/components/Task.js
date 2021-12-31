import React, { Fragment } from "react";
import { DateTime } from "luxon";

import { toggleComplete } from "../static/js/modules/TaskApi.mjs";

class Task extends React.Component {
    constructor(props) {
        super(props);
        this.handleListTaskClick = this.handleListTaskClick.bind(this);
        // Things that won't change
        this.pk = props.data.pk;
        this.id = "task-" + this.pk;
        this.ref = React.createRef();
        
        // Props: 
        // props.data.title
        // props.data.complete
        // props.data.due
        // props.data.start
        // props.data.description
        // props.data.completed_at
        // props.basicVersion
        // ^ whether it is basic (in the list) or not (in show)
    }

    handleListTaskClick () {
        // This should only be called when you click on a task in the list
        this.props.clickCallback(this.pk);
    }

    dateTimeWrapper (time, type) {
        const converted = DateTime.fromISO(time);
        return (
            <div className={"date-time-wrapper" + (converted < DateTime.now() && !this.props.data.complete && type === "due" ? " overdue" : "")}> 
                <p className="date">{converted.toLocaleString(DateTime.DATE_SHORT)}</p>
                <p className="time">{converted.toLocaleString(DateTime.TIME_SIMPLE)}</p>
            </div>
        );
    }

    // componentDidUpdate (prevProps, prevState) {
    //  If we want to update calendar one task at a time we could consider doing it from here
    // }

    render () {
        const title = <button>
                            <p className="title" data-complete={this.props.data.complete}>{this.props.data.title}</p>
                        </button>;

        const checkbox = <div className="check-box-wrapper">
                            <input 
                                type="checkbox" 
                                aria-labelledby={this.props.data.title} 
                                onChange={() => {toggleComplete(this.pk, this.ref.current)}}
                                data-complete={this.props.data.complete}
                                >
                            </input>
                            <span className={this.props.type === "due" ? "checkmark" : "checkmark round"}></span>
                        </div>;

        if (this.props.basicVersion) {
            return (
                <div className="task-wrapper" ref={this.ref} id={this.id}> 
                    {checkbox}
                    <div className="title-date-wrapper" onClick={this.handleListTaskClick}>
                        {title}
                        {this.dateTimeWrapper(this.props.data.due, "due")}
                    </div>
                </div>
            )
        }
        else if (this.props.buttons) {
            return (
                <Fragment>
                    <div>
                        <div className="task-wrapper" ref={this.ref} >
                            <div className="title-wrapper">
                                {checkbox}
                                {title}
                            </div>
                        </div>
                        {this.props.buttons}
                    </div>
                    <div className="dark-section">
                        <div className="date-wrapper">
                            <div>
                                <h3>Start</h3>
                                {this.props.data.start !== null ? 
                                    this.dateTimeWrapper(this.props.data.start, "start")
                                    :
                                    <p className="subtle"> Not set </p>
                                }
                            </div>
                            <div> 
                                <h3>Due</h3>
                                {this.props.data.due !== null ? 
                                    this.dateTimeWrapper(this.props.data.due, "due")
                                    :
                                    <p className="subtle"> Not set </p>
                                }
                            </div>
                        </div>
                        {this.props.data.description &&
                            <Fragment>
                                <hr />
                                <p className="centered">{this.props.data.description}</p>    
                            </Fragment>
                        }
                    </div>
                </Fragment>
            );
        } 
    }
}

export default Task