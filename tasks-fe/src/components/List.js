import axios from "axios";
import React, { Fragment } from "react";

import OneTaskSection from './OneTaskSection'
import TwoTaskSection from './TwoTaskSection'


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
    
                var section1 = "";
                if (overdue.length > 0) {
                    section1 = <section>
                                <p>hi</p>
                                <OneTaskSection 
                                    title="Overdue"
                                    class="overdue"
                                    tasks={overdue}    
                                />
                            </section>
                }
    
                resolve(
                    <Fragment>
                        {section1}
                        {/* { (today_due.length > 0 || today_work.length > 0) && 
                            <TwoTaskSection />
                        }
                        { upcoming.length > 0 &&
                            <OneTaskSection />
                        } */}
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