'use client'

import { observer } from "mobx-react-lite";
import './home.css'
import { useTaskStore } from "@/store/StoreProvider";
import { addAlert, ERROR_ALERT } from '@/app/home/dashboard/widgets/Alerts/alertEvent';
import TaskDetail from '@/dash/@tasks/TaskDetail';
import EditTaskModel from "@/widgets/NewTask/EditTaskModel";
import NewTaskPopUp from "@/widgets/NewTask/NewTaskPopUp";
import { ICONS } from "../constants";

const DashboardLayout = observer(({
  children, // will be a page or nested layout
}: {
    children: React.ReactNode
}) => {
    const taskStore = useTaskStore();

    return ( 
        <div id="home-wrapper" data-testid="home">
            { taskStore.taskBeingEdited && !taskStore.taskBeingFocused ? <NewTaskPopUp taskStore={taskStore}/> : null }
            { taskStore.taskBeingFocused ? <TaskDetail taskStore={taskStore}/> : null }
            <menu role="menubar" aria-orientation="vertical" id="left-menu" className="bg-green">
                <button role="menuitem" className="btn small square no-shadow" title="Add task" type="button" onClick={() => {
                        new EditTaskModel();
                    }}>
                    { ICONS.PLUS }
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
