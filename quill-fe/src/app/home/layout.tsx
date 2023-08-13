'use client'
// import TaskCreatePopup from "./Widgets/TaskCreationPopup/TaskCreationPopup.js";
import { observer } from "mobx-react-lite";
import { useTaskStore } from "./_globalStore/RootStore";
import { addAlert, ERROR_ALERT } from './alerts/alertEvent.js';

const DashboardLayout = observer(({
  children, // will be a page or nested layout
}: {
    children: React.ReactNode
}) => {
    const taskStore = useTaskStore();

    return ( 
        <div id="home-wrapper" data-testid="home">
            { taskStore.taskBeingEdited && !taskStore.taskBeingFocused ? <TaskCreatePopup taskStore={taskStore}/> : null }
            { taskStore.taskBeingFocused ? <ShowTask taskStore={taskStore}/> : null }
            <menu role="menubar" aria-orientation="vertical" id="left-menu" className="menu">
                <button role="menuitem" className="btn no-shadow" title="Add task" type="button" onClick={() => {
                    taskStore.createInProgressTask();
                    }}>
                    <i className = "fas fa-plus fa-fw"> </i>
                </button>
                <button role="menuitem" className="btn btn no-shadow" title="Log out" type="button" onClick={() => addAlert(document.querySelector("#left-menu button[title='Log out']"), ERROR_ALERT, "We haven't implemented users or logging out.")}>
                    <i className="fas fa-power-off fa-fw"></i>
                </button>
            </menu>
            {children}
        </div>
    )
})

export default DashboardLayout;
