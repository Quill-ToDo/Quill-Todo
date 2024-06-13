'use client'

import { observer } from "mobx-react-lite";
import './home.css'
import { useTaskStore } from "@/store/StoreProvider";
import { addAlert, ERROR_ALERT } from '@/alerts/alertEvent';
import TaskDetail from '@/widgets/TaskDetail/TaskDetail';
import NewTaskPopUp from "@/widgets/NewTask/NewTaskPopUp";
import { useFloating, offset } from "@floating-ui/react";
import EditTaskModel from "./widgets/NewTask/EditTaskModel";
import { ICONS } from "../@util/constants";


const DashboardLayout = observer(({
  children, // will be a page or nested layout
}: {
    children: React.ReactNode
}) => {
    const taskStore = useTaskStore();
    const {refs: addNewTaskFloatRefs, floatingStyles: addNewTaskFloatStyles, context: addNewTaskFloatContext} = useFloating(
        {
            placement: "right-start",
            middleware: [offset(20)],
        });
    const addNewTaskButton = <button id="add-task" role="menuitem" ref={addNewTaskFloatRefs && addNewTaskFloatRefs.setReference} className="btn small square no-shadow" title="Add task" 
                    onClick={() => {
                        if (taskStore.taskBeingEdited) {
                            const popup = document.getElementById("new-wrapper");
                            if (!popup) { return; }
                            const firstInput = popup.querySelector("input");
                            firstInput && firstInput.focus();
                        } 
                        else {
                            new EditTaskModel();
                        }}
                        }>
                    { ICONS.PLUS }
                </button>;
    const newTaskPopUp = <NewTaskPopUp taskStore={taskStore} addNewTaskFloatRefs={addNewTaskFloatRefs} addNewTaskFloatStyles={addNewTaskFloatStyles} addNewTaskFloatContext={addNewTaskFloatContext} />;
    

    return ( 
            <div id="home-wrapper" data-testid="home">
                { taskStore.taskBeingEdited && newTaskPopUp }
                <menu role="menubar" aria-orientation="vertical" id="left-menu" className="bg-green">
                    { addNewTaskButton }
                    <button role="menuitem" className="btn small square no-shadow" title="Log out" type="button" onClick={() => addAlert(document.querySelector("#left-menu button[title='Log out']"), ERROR_ALERT, "We haven't implemented users or logging out.")}>
                        <i className="fas fa-power-off fa-fw"></i>
                    </button>
                </menu>
                {children}
            </div>
    )
})

export default DashboardLayout;
