import React, { Fragment} from "react";
import TaskSection from './TaskSection'
import '../../../static/css/tasks.css';
import { observer } from "mobx-react-lite";


/**
 * A format for task list contents where tasks are separated into overdue, today, and upcoming sections.
 * 
 * --- 
 * 
 * *Required props:*
 *  - **store** : TaskStore - The store to pull tasks from
 * - **toggleDuration** : int - The time the sections should take to collapse in millis 
 */ 
const ByStatusThreeSection = observer((props) => {
    const byStatus = props.store.byStatus;
    const overdue = byStatus["overdue"];
    const todayDue = byStatus["todayDue"];
    const todayWork = byStatus["todayWork"];
    const upcoming = byStatus["upcoming"];


    if (!(overdue.length || todayDue.length || todayWork.length || upcoming.length)) {
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
                toggleDuration={props.toggleDuration}
                sectionContent={
                    [{
                        "tasks": overdue,
                        "type": "due",
                        "emptyText": "No overdue tasks"
                    }]
                }
            />
            <TaskSection 
                title="Today"
                sectionNum={1}
                toggleDuration={props.toggleDuration}
                sectionContent={
                    [
                        {
                        "optionalTitle": "Due",
                        "tasks": todayDue,
                        "type": "due",
                        "emptyText": "No tasks due today"
                        },
                        {
                        "optionalTitle": "Work",
                        "tasks": todayWork,
                        "type": "work",
                        "emptyText": "No tasks to work on today"
                        }
                    ]
                }
            />
            <TaskSection 
                title="Upcoming"
                sectionNum={2}
                toggleDuration={props.toggleDuration}
                sectionContent={
                    [{
                        "tasks": upcoming,
                        "type": "due",
                        "emptyText": "No upcoming tasks"
                    }]
                }
            />
        </Fragment>
    );
});

/**
 * The list view for tasks.
 * 
 * ---
 * 
 * *Required props:*
 *  - **store** : TaskStore - The store to display tasks from.
 */
const List = observer((props) => {
    // How long sections should take to collapse in millis
    const sectionToggleDuration = 100;

    // All possible views for the list
    const possibleListFormats = {
        "by-status": <ByStatusThreeSection toggleDuration={sectionToggleDuration} store={props.store}/>
    };

    const listFormat = "by-status";
    const loading = 
        <div className="loading-wrapper take-full-space">
            <div>
                <i className="fas fa-list-alt loading-icon fa-4x" aria-hidden="true"></i>
                <p className="">Loading list...</p>
            </div>
        </div>;

    // Before content is loaded show placeholder
    return (
        <section id="list-wrapper" aria-label="Task list">
            {props.store.isLoaded ? possibleListFormats[listFormat] : loading}
        </section>
    );
})

export default List;