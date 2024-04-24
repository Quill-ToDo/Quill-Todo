import React, { Fragment} from "react";
import TaskSection from './TaskSection'
import { observer } from "mobx-react-lite";
import { DateTime } from "luxon";
import TaskModel from "@/app/home/_globalStore/tasks/TaskModel";
import { timeOccursBeforeEOD, timeOccursBetweenNowAndEOD } from "@/app/@utilities/DateTimeHelper";
import './list.css'


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
    const tasks : TaskModel[] = props.store.tasksInRange(DateTime.now().minus({years:10}), DateTime.now().plus({years:10}));
    const now = DateTime.now();
    const sorted = (taskList : TaskModel[]) => {
        return taskList.toSorted((a, b) => { 
            if (a.complete === b.complete) {

                return a.due < b.due ? -1 : 1;
            } 
            return a.complete ? 1 : -1; 
        })
    };
    const overdue = sorted(tasks.filter(task => task.due <= now));
    const todayDue = sorted(tasks.filter(task => timeOccursBetweenNowAndEOD(task.due)));
    const todayWork = sorted(tasks.filter(task => 
        (task.start && task.start <= now) 
        && (now < task.due)
        && !(timeOccursBetweenNowAndEOD(task.due))
        ));
    const upcoming = sorted(tasks.filter(task => 
        (!task.start || now <= task.start) && !(timeOccursBeforeEOD(task.due))
        ));


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