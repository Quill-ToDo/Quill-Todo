import React, { Fragment, useContext} from "react";
// import TaskSection from './TaskSection'
import { useTaskStore } from "../store/StoreContext";
import { DateTime } from "luxon";
import '../static/css/tasks.css';
import { observer } from "mobx-react-lite";

// const ByStatusThreeSection = observer((props) => {
//     const context = useTaskStore();

//     const now = DateTime.now();

//     var overdue = context.tasks.filter(task => DateTime.fromISO(task.due) <= now );
//     var todayDue = context.tasks.filter(task => now.set({hour: 0, minute: 0, second: 0}) < DateTime.fromISO(task.due) < now );
//     var todayWork = context.tasks.filter(task => task.start && DateTime.fromISO(task.start) <= now <= DateTime.fromISO(task.due));
//     var upcoming = context.tasks.filter(task => (!task.start || now <= DateTime.fromISO(task.start) ) && now <= DateTime.fromISO(task.due));
    
//     if (!(overdue.length || todayDue.length || todayWork.length || upcoming.length)) {
//         return (
//             <section>
//                 <div className="mid-section">
//                     <p className="centered aligned">You have no tasks to work on. Try adding one!</p>
//                 </div>
//             </section>
//             );
//     }

//     return (
//         <Fragment>
//             <TaskSection 
//                 title="Overdue"
//                 sectionNum={0}
//                 toggleDuration={props.toggleDuration}
//                 sectionContent={
//                     [{
//                         "tasks": overdue,
//                         "type": "due",
//                         "emptyText": "No overdue tasks"
//                     }]
//                 }
//             />
//             <TaskSection 
//                 title="Today"
//                 sectionNum={1}
//                 toggleDuration={props.toggleDuration}
//                 sectionContent={
//                     [
//                         {
//                         "optionalTitle": "Due",
//                         "tasks": todayDue,
//                         "type": "due",
//                         "emptyText": "No tasks due today"
//                         },
//                         {
//                         "optionalTitle": "Work",
//                         "tasks": todayWork,
//                         "type": "work",
//                         "emptyText": "No tasks to work on today"
//                         }
//                     ]
//                 }
//             />
//             <TaskSection 
//                 title="Upcoming"
//                 sectionNum={2}
//                 toggleDuration={props.toggleDuration}
//                 sectionContent={
//                     [{
//                         "tasks": upcoming,
//                         "type": "due",
//                         "emptyText": "No upcoming tasks"
//                     }]
//                 }
//             />
//         </Fragment>
//     );
// });

const BigList = observer(({props}) => {
    const context = useTaskStore();
    console.log(context.tasks);
    return (
        context.isLoaded ? 
        <ul>
            {context.tasks.map(task => {
                console.log(task.title);
                return (<li> {task.title} </li>);
            })}
        </ul>
        :
        null
    );
})

const List = observer(({props}) => {
    const context = useTaskStore();
    const sectionToggleDuration = 100;
    const bindings = {
        // "by-status": <ByStatusThreeSection toggleDuration={sectionToggleDuration}/>, 
        "big-list": <BigList /> 
    };

    const type = "big-list";
    const loading = <span><p className="subtle centered aligned take-full-space">Loading tasks...</p></span>;
    // const renderedSection = <p>{context}</p>;

    // Before content is loaded show placeholder
    // TODO: if this doesn't update put the component in return 
    return (
        <div id="list-wrapper">
            {context.isLoaded ? bindings[type] : loading}
        </div>
    );
})

export default List;