import axios from "axios";
import React, { Fragment } from "react";

import TaskSection from './TaskSection'

import {
    API_URL
} from "../constants";


class List extends React.Component {
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
        this.byStatusThreeSection().then(res => this.setState({ sectionData: res }) )
    }

    render() {
        var listData = this.state.sectionData
        return <div id="list-wrapper"> {listData != null ? listData : (<span><p className="subtle centered aligned take-full-space">Loading tasks...</p></span>)}</div>
    }
}

export default List;