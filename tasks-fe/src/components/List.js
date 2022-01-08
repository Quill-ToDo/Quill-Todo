import React, { Fragment} from "react";
import TaskSection from './TaskSection'
import '../static/css/tasks.css';
import { observer } from "mobx-react-lite";

const ByStatusThreeSection = observer((props) => {
    const byStatus = props.store.byStatus();
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

const List = observer((props) => {
    const sectionToggleDuration = 100;
    const bindings = {
        "by-status": <ByStatusThreeSection toggleDuration={sectionToggleDuration} store={props.store}/>
    };

    const type = "by-status";
    const loading = 
        <div className="loading-wrapper take-full-space">
            <div>
                <i className="fas fa-feather-alt loading-icon fa-2x"></i>
                <p className="">Loading tasks...</p>
            </div>
        </div>;

    // Before content is loaded show placeholder
    return (
        <section id="list-wrapper" aria-label="Task list">
            {props.store.isLoaded ? bindings[type] : loading}
        </section>
    );
})

export default List;