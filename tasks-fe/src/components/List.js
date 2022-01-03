import React, { Fragment, useContext} from "react";
// import TaskSection from './TaskSection'
import { useTaskStore } from "../store/StoreContext"

import '../static/css/tasks.css';
import { observer } from "mobx-react-lite";

// const ByStatusThreeSection = observer((props) => {
//     const context = useContext(StoreContext);

//     var overdue = context.overdue;
//     var today_due = context.today_due;
//     var today_work = context.today_work;
//     var upcoming = context.upcoming;
    
//     if (overdue.length === 0 && today_due.length === 0 && today_work.length === 0 && upcoming.length === 0) {
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
//                 TaskClickCallback={props.TaskClickCallback}
//                 sectionContent={
//                     [{
//                         "tasks": overdue,
//                         "type": "due",
//                         "empty_text": "No overdue tasks"
//                     }]
//                 }
//             />
//             <TaskSection 
//                 title="Today"
//                 sectionNum={1}
//                 TaskClickCallback={props.TaskClickCallback}
//                 sectionContent={
//                     [
//                         {
//                         "optional_title": "Due",
//                         "tasks": today_due,
//                         "type": "due",
//                         "empty_text": "No tasks due today"
//                         },
//                         {
//                         "optional_title": "Work",
//                         "tasks": today_work,
//                         "type": "work",
//                         "empty_text": "No tasks to work on today"
//                         }
//                     ]
//                 }
//             />
//             <TaskSection 
//                 title="Upcoming"
//                 sectionNum={2}
//                 TaskClickCallback={props.TaskClickCallback}
//                 sectionContent={
//                     [{
//                         "tasks": upcoming,
//                         "type": "due",
//                         "empty_text": "No upcoming tasks"
//                     }]
//                 }
//             />
//         </Fragment>
//     );
// });

const BigList = observer((props) => {
    const context = useTaskStore();
    console.log(context.tasks);
    return (
        context.isLoaded ? 
        <ul>
            {context.tasks.map((pk, task) => {
                return <li> {task.title} </li>;
            })}
        </ul>
        :
        null
    );
})

const List = observer((props) => {
    const context = useTaskStore();
    console.log(context.tasks);
    // const bindings = {
    //     "by-status": ByStatusThreeSection, 
    //     "big-list": BigList
    // };
    const type = "big-list";
    const loading = <span><p className="subtle centered aligned take-full-space">Loading tasks...</p></span>;
    // const renderedSection = <p>{context}</p>;

    // Before content is loaded show placeholder
    return (
        <div id="list-wrapper">
            {context.isLoaded ? loading : BigList(props)}
        </div>
    );
})

export default List;