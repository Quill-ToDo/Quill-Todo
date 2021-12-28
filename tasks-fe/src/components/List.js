import axios from "axios";
import React, { Fragment } from "react";

import TaskSection from './TaskSection'

import {
    API_URL
} from "../constants";


class List extends React.Component {
    // Todo: logic to determine which list gets loaded will go here eventually

    constructor () {
        super()
        this.state = { sectionData: null }
    }
    
    byStatusThreeSection() {
        return new Promise((resolve, reject) => {
            axios.get(API_URL + 'by-status').then(r => {
                var data = r.data;
                var overdue = data.overdue;
                var today_due = data.today_due;
                var today_work = data.today_work;
                var upcoming = data.upcoming;
                
                if (!overdue && !today_due && !today_work && !upcoming) {
                    resolve(<p>You have no tasks to work on. Try adding one!</p>);
                }
    
                resolve (
                    <Fragment>
                        <TaskSection 
                            title="Overdue"
                            section_num={0}
                            TaskClickCallback={this.props.TaskClickCallback}
                            section_content={
                                [{
                                    "tasks": overdue,
                                    "empty_text": "No overdue tasks"
                                }]
                            }
                        />
                        <TaskSection 
                            title="Today"
                            section_num={1}
                            TaskClickCallback={this.props.TaskClickCallback}
                            section_content={
                                [
                                    {
                                    "optional_title": "Due",
                                    "tasks": today_due,
                                    "empty_text": "No tasks due today"
                                    },
                                    {
                                    "optional_title": "Work",
                                    "tasks": today_work,
                                    "empty_text": "No tasks to work on today"
                                    }
                                ]
                            }
                        />
                        <TaskSection 
                            title="Upcoming"
                            section_num={2}
                            TaskClickCallback={this.props.TaskClickCallback}
                            section_content={
                                [{
                                    "tasks": upcoming,
                                    "empty_text": "No upcoming tasks"
                                }]
                            }
                        />
                    </Fragment>
                );
            }).catch((e) => {
                console.log("Could not render list: " + e);
                reject(e);
            })
        });
    }

    componentDidMount() {
        // Load in section data after mounting
        this.byStatusThreeSection().then(res => this.setState({ sectionData: res }) )
    }

    render() {
        // Before content is loaded show placeholder
        var listData = this.state.sectionData
        return <div id="list-wrapper"> {listData != null ? listData : (<span><p className="subtle centered aligned take-full-space">Loading tasks...</p></span>)}</div>
    }
}

export default List;