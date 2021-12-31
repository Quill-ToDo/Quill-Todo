import axios from "axios";
import React, { Fragment } from "react";
import TaskSection from './TaskSection'

import '../static/css/tasks.css';

import {
    API_URL
} from "../static/js/modules/TaskApi";


class List extends React.Component {
    // Todo: logic to determine which list gets loaded will go here eventually

    constructor (props) {
        super(props)
        this.refresh = this.refresh.bind(this);
        this.byStatusThreeSection = this.byStatusThreeSection.bind(this);

        this.state = { 
            renderedSection: <span><p className="subtle centered aligned take-full-space">Loading tasks...</p></span>,
            selectedSection: "by-status",
            // This is just toggled back and forth, if it doesn't match the val of the prop passed in for 
            // needsRefresh then the list is refreshed and the value is changed to match the prop passed in.
            needsRefresh: props.needsRefresh
        }

        this.sectionData = null;
        this.bindings = {"by-status" : this.byStatusThreeSection};

    }

    componentDidUpdate (prevProps, prevState) {
        if (this.props.needsRefresh !== this.state.needsRefresh) {
            this.setState({needsRefresh: this.props.needsRefresh})
            this.refresh();
        }
    }

    async fetchTasks (section) {
        return axios.get(API_URL + section);
    }
    
    byStatusThreeSection(data) {
        var overdue = data.overdue;
        var today_due = data.today_due;
        var today_work = data.today_work;
        var upcoming = data.upcoming;
        
        if (overdue.length === 0 && today_due.length === 0 && today_work.length === 0 && upcoming.length === 0) {
            return (
                <section>
                    <div className="mid-section">
                        <p className="centered aligned">You have no tasks to work on. Try adding one!</p>
                    </div>
                </section>
                );
        }

        return (
            <Fragment>
                <TaskSection 
                    title="Overdue"
                    sectionNum={0}
                    TaskClickCallback={this.props.TaskClickCallback}
                    sectionContent={
                        [{
                            "tasks": overdue,
                            "type": "due",
                            "empty_text": "No overdue tasks"
                        }]
                    }
                />
                <TaskSection 
                    title="Today"
                    sectionNum={1}
                    TaskClickCallback={this.props.TaskClickCallback}
                    sectionContent={
                        [
                            {
                            "optional_title": "Due",
                            "tasks": today_due,
                            "type": "due",
                            "empty_text": "No tasks due today"
                            },
                            {
                            "optional_title": "Work",
                            "tasks": today_work,
                            "type": "work",
                            "empty_text": "No tasks to work on today"
                            }
                        ]
                    }
                />
                <TaskSection 
                    title="Upcoming"
                    sectionNum={2}
                    TaskClickCallback={this.props.TaskClickCallback}
                    sectionContent={
                        [{
                            "tasks": upcoming,
                            "type": "due",
                            "empty_text": "No upcoming tasks"
                        }]
                    }
                />
            </Fragment>
        );
    }

    refresh () {
        this.fetchTasks(this.state.selectedSection).then(res => {
            if (res.data !== this.sectionData) {
                this.sectionData = res.data;
                const renderedSection = this.bindings[this.state.selectedSection](res.data);
                this.setState({ renderedSection: renderedSection});
            }
        }).catch((e) => {
            console.log("Could not render list: " + e);
        });
    }

    componentDidMount() {
        // Load in section data after mounting
        this.refresh();
    }

    render() {
        // Before content is loaded show placeholder
        return <div id="list-wrapper">{this.state.renderedSection}</div>
    }
}

export default List;