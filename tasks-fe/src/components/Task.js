import React from "react";
import { DateTime } from "luxon";
import {
    API_URL
} from "../constants";
import axios from "axios";

class Task extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pk: props.data.pk,
            title: props.data.title,
            complete: props.data.complete,
            description: props.data.description,
            due: props.data.due,
            start: props.data.start,
            type: "due"
        };  

        // Ensure that "this" works properly in this method
        this.toggleComplete = this.toggleComplete.bind(this);
    }

    async toggleComplete () {
        return axios.put(API_URL + this.state.pk + "/toggle-complete").then(() => {
            this.setState(prevState => ({
                complete: !prevState.complete}));
        })
        // TODO re-render all? update state in all other task sections?
    }

    render () {
        return (
            <div className="task-wrapper">
                <div className="check-box-wrapper"> 
                    <input 
                        type="checkbox" 
                        aria-labelledby={this.state.title} 
                        onChange={this.toggleComplete}
                        data-complete={this.state.complete}
                        >
                    </input>
                    <span className={this.state.type === "due" ? "checkmark" : "checkmark round"}></span>
                </div>
                <div className="title-date-wrapper">
                    <button className="plain-formatting">
                        <p className="title" data-complete={this.state.complete}>{this.state.title}</p>
                    </button>
                    <div className="date-time-wrapper"> 
                        <p className="date">{DateTime.fromISO(this.state.due).toLocaleString(DateTime.DATE_SHORT)}</p>
                        <p className="time">{DateTime.fromISO(this.state.due).toLocaleString(DateTime.TIME_SIMPLE)}</p>
                    </div>
                </div>
            </div>
        )
    } 

}

export default Task