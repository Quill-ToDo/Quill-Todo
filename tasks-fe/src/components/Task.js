import React, { Fragment } from "react";
import { DateTime } from "luxon";
import {
    API_URL
} from "../constants";
import axios from "axios";
import { taskStateChange } from "../static/js/modules/Events.mjs";

import CheckBox from "./CheckBox";

class Task extends React.Component {
    constructor(props) {
        super(props);
        
        this.toggleComplete = this.toggleComplete.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.delete = this.delete.bind(this);
        this.dispatchChange = this.dispatchChange.bind(this);
        this.id = "task-" + props.data.pk;
        
        this.state = {
            pk: props.data.pk,
            title: props.data.title,
            description: props.data.description,
            complete: props.data.complete,
            completedAt: props.data.completed_at,
            due: props.data.due,
            start: props.data.start,
            deleted: false,
        };  

    }

    dispatchChange () {
        // This will bubble from the component in the list even if they update on the show view
        // so that the listener in list-wrapper will hear it
        document.getElementById(this.id).dispatchEvent(taskStateChange);
    }

    async toggleComplete () {
        // Maybe manually check if there's a task with this id elsewhere on the page and update it's styling???
        // TODO re-render all sections? update state in all other task sections? Add a listener somewhere else?
        return axios.put(API_URL + this.state.pk + "/toggle-complete")
        .then((res) => {
            this.dispatchChange();
            this.setState(prevState => ({
                complete: res.data.complete, completed_at: res.data.completed_at}));
            //  TODO try just changing the styling....

        }).catch((e) => {
            console.log("Could not toggle task.")
            console.log(e)
        })
    }

    async delete () {
        console.log("Delete!!")
        return axios.delete(API_URL + this.state.pk).then(() => {
            this.setState({deleted: true})
            this.dispatchChange();
            // TODO add to alert
        }).catch((e) => {
            console.log("Could not delete task.")
            console.log(e)
        })
        // TODO delete task from calendar, grab by id(pk)
    }

    handleClick () {
        this.props.clickCallback(this.state, this.delete, this.toggleComplete);
    }

    dateTimeWrapper (time, type) {
        const converted = DateTime.fromISO(time);
        return (
            <div className={"date-time-wrapper" + (converted < DateTime.now() && !this.state.complete && type === "due" ? " overdue" : "")}> 
                <p className="date">{converted.toLocaleString(DateTime.DATE_SHORT)}</p>
                <p className="time">{converted.toLocaleString(DateTime.TIME_SIMPLE)}</p>
            </div>
        );
    }

    render () {
        if (this.state.deleted) {
            return null;
        }

        const title = <button>
                            <p className="title" data-complete={this.state.complete}>{this.state.title}</p>
                        </button>;

        const checkbox = <div className="check-box-wrapper">
                            <CheckBox 
                                title={this.state.title}
                                toggleCompleteHandler={this.toggleComplete}
                                complete={this.state.complete}
                                type={this.props.type}
                            />
                        </div>
        if (this.props.basicVersion) {
            return (
                <div className="task-wrapper" id={this.id}> 
                    {checkbox}
                    <div className="title-date-wrapper" onClick={this.handleClick}>
                        {title}
                        {this.dateTimeWrapper(this.state.due, "due")}
                    </div>
                </div>
            )
        }
        else if (this.props.buttons) {
            return (
                <Fragment>
                    <div>
                        <div className="task-wrapper">
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
                                {this.state.start !== null ? 
                                    this.dateTimeWrapper(this.state.start, "start")
                                    :
                                    <p className="subtle"> Not set </p>
                                }
                            </div>
                            <div> 
                                <h3>Due</h3>
                                {this.state.due !== null ? 
                                    this.dateTimeWrapper(this.state.due, "due")
                                    :
                                    <p className="subtle"> Not set </p>
                                }
                            </div>
                        </div>
                        {this.state.description &&
                            <Fragment>
                                <hr />
                                <p className="centered">{this.state.description}</p>    
                            </Fragment>
                        }
                    </div>
                </Fragment>
            );
        } 
    }
}

export default Task