'use client'

import { observer } from "mobx-react-lite";
import './home.css'
import { useTaskStore } from "@/store/StoreProvider";
import { addAlert, ERROR_ALERT } from '@/app/home/dashboard/widgets/Alerts/alertEvent';
import TaskDetail from '@/dash/@tasks/TaskDetail';
import EditTaskModel from "@/widgets/NewTask/EditTaskModel";
import TaskCreationPopup from "@/widgets/NewTask/TaskCreationPopup";
import TaskModel from "@/store/tasks/TaskModel";

const DashboardLayout = observer(({
  children, // will be a page or nested layout
}: {
    children: React.ReactNode
}) => {
    const taskStore = useTaskStore();

    return ( 
        <div id="home-wrapper" data-testid="home">
            { taskStore.taskBeingEdited && !taskStore.taskBeingFocused ? <TaskCreationPopup taskStore={taskStore}/> : null }
            { taskStore.taskBeingFocused ? <TaskDetail taskStore={taskStore}/> : null }
            <menu role="menubar" aria-orientation="vertical" id="left-menu" className="bg-green">
                <button role="menuitem" className="btn no-shadow" title="Add task" type="button" onClick={() => {
                        new EditTaskModel();
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
