'use client'

// import TaskCreatePopup from "./Widgets/TaskCreationPopup/TaskCreationPopup.js";
import { observer } from "mobx-react-lite";
import { useTaskStore } from "@/store/StoreProvider";
import { addAlert, ERROR_ALERT } from './alerts/alertEvent.js';

const DashboardLayout = observer(({
  children, // will be a page or nested layout
}: {
    children: React.ReactNode
}) => {
    const taskStore = useTaskStore();

    return ( 
        <div id="home-wrapper" className="margin-0 bg-slate inset bottom-0 height-100" data-testid="home">
            {/* { taskStore.taskBeingEdited && !taskStore.taskBeingFocused ? <TaskCreatePopup taskStore={taskStore}/> : null }
            { taskStore.taskBeingFocused ? <ShowTask taskStore={taskStore}/> : null } */}
            <menu role="menubar" aria-orientation="vertical" id="left-menu" className="bg-green">
                <button role="menuitem" className="btn no-shadow" title="Add task" type="button" onClick={() => {
                    taskStore.createInProgressTask();
                    }}>
                    <i className = "fas fa-plus fa-fw"> </i>
                </button>
                <button role="menuitem" className="btn btn no-shadow" title="Log out" type="button" onClick={() => addAlert(document.querySelector("#left-menu button[title='Log out']"), ERROR_ALERT, "We haven't implemented users or logging out.")}>
                    <i className="fas fa-power-off fa-fw"></i>
                </button>
            </menu>
            <p className="text-3xl font-bold underline  margin-0 bg-bg inset bottom-0 height-100"> hello bitch!!! </p>
            {children}
        </div>
    )
})

export default DashboardLayout;
