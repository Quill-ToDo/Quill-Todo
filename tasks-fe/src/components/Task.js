import React, { Fragment } from "react";
import { DateTime } from "luxon";
import {
    API_URL
} from "../constants";
import axios from "axios";

import CheckBox from "./CheckBox";

class Task extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pk: props.data.pk,
            title: props.data.title,
            description: props.data.description,
            complete: props.data.complete,
            completedAt: props.data.completed_at,
            due: props.data.due,
            start: props.data.start,
        };  

        this.toggleComplete = this.toggleComplete.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    async toggleComplete () {
        // Maybe manually check if there's a task with this id elsewhere on the page and update it's styling???
        // TODO re-render all sections? update state in all other task sections? Add a listener somewhere else?
        return axios.put(API_URL + this.props.data.pk + "/toggle-complete").then((res) => {
            this.setState(prevState => ({
                complete: res.data.complete, completed_at: res.data.completed_at}));
        }).catch((e) => {
            console.log("Could not toggle task.")
            console.log(e)
        })
    }

    handleClick () {
        this.props.clickCallback(this.state);
        // Return the correct chunk here
    }

    dateTimeWrapper (time) {
        return (
            <div className="date-time-wrapper"> 
                <p className="date">{DateTime.fromISO(time).toLocaleString(DateTime.DATE_SHORT)}</p>
                <p className="time">{DateTime.fromISO(time).toLocaleString(DateTime.TIME_SIMPLE)}</p>
            </div>
        );
    }

    render () {
        const title = <button>
                            <p className="title" data-complete={this.state.complete} onClick={this.handleClick}>{this.state.title}</p>
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
                <div className="task-wrapper"> 
                    {checkbox}
                    <div className="title-date-wrapper">
                        {title}
                        {this.dateTimeWrapper(this.state.due)}
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
                                    this.dateTimeWrapper(this.state.start)
                                    :
                                    <p className="subtle"> Not set </p>
                                }
                            </div>
                            <div> 
                                <h3>Due</h3>
                                {this.state.due !== null ? 
                                    this.dateTimeWrapper(this.state.due)
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