'use client'

import { observer } from "mobx-react-lite";
import './home.css'
import { addAlert, ERROR_ALERT } from '@/alerts/alertEvent';
import { AddNewTaskPopUp } from "@/widgets/NewTask/NewTaskPopUp";
import { offset, UseDismissProps, UseFloatingOptions } from "@floating-ui/react";
import { ICONS } from "../@util/constants";
import { PositionedPopupAndReferenceElement } from "../@util/FloatingUiHelpers";
import { useEffect, useRef, useState } from "react";
import { useTaskStore } from "./_globalStore/StoreProvider";
import Sortable from 'sortablejs';


const DashboardLayout = observer(({
  children, // will be a page or nested layout
}: {
    children: React.ReactNode
}) => {
    const [showNewTaskPopupFromMenuButton, setShowNewTaskPopupFromMenuButton] = useState(false);
    const taskStore = useRef(useTaskStore());
    const trashBtnRef = useRef(null);
    const newTaskPopupPositioning: UseFloatingOptions = {
        open: showNewTaskPopupFromMenuButton,
        onOpenChange: setShowNewTaskPopupFromMenuButton,
        placement: "right-start",
        middleware: [offset(20)],
    };
    const dismissOptions: UseDismissProps = {
        outsidePress: false,
        referencePress: false,
        bubbles: false,
    }

    useEffect(() => {
        Sortable.create(trashBtnRef.current, {
            group: {
                name: "trash",
                pull: false,
                put: true,
            },
            onAdd: (evt) => {
                if (evt.originalEvent.dataTransfer.types.includes("taskId")) {
                    const id = evt.originalEvent.dataTransfer.getData("taskId");
                    const task = taskStore.current.getTaskWithId(id);
                    task && taskStore.current.delete(task);
                }
            }
        });
    })
    
    return ( 
            <div id="home-wrapper" data-testid="home">
                <menu role="menubar" aria-orientation="vertical" id="left-menu" className="bg-green">
                    <PositionedPopupAndReferenceElement
                        popupPositioningOptions={newTaskPopupPositioning}
                        dismissPopupOptions={dismissOptions}
                        renderRef={(ref, props) => {
                        return <button 
                            id="add-task"
                            ref={ref} 
                            role="menuitem" 
                            className="btn small square bg" 
                            title="Add task" 
                            onClick={() => {
                                taskStore.current.createNewTask();
                                setShowNewTaskPopupFromMenuButton(true);
                                }}
                                {...props}
                                >
                            { ICONS.PLUS }
                        </button>
                        }}
                        popupElement={ 
                            <AddNewTaskPopUp 
                                close={() => {
                                    setShowNewTaskPopupFromMenuButton(false);
                                }}
                                taskToCreate={taskStore.current.taskBeingCreated}
                            />
                        }
                    />
                    <button 
                        ref={trashBtnRef}
                        role="menuitem" 
                        className="btn small square bg" 
                        title="Trash" 
                        type="button" 
                        onClick={() => addAlert(document.querySelector("#left-menu button[title='Trash']"), ERROR_ALERT, "We haven't implemented clicking on trash")}
                        // onDragOver={(ev) => {
                        //     ev.preventDefault();
                        //     ev.dataTransfer.dropEffect = "move";
                        //     const tasksOnPage = document.querySelectorAll(`[data-task-id="${ev.dataTransfer.getData("taskId")}"]`);
                        //     tasksOnPage.forEach((element) => { element.classList.add("hidden")});
                        // }}
                        // onDragLeave={(ev) => {
                        //     ev.preventDefault();
                        //     const tasksOnPage = document.querySelectorAll(`[data-task-id="${ev.dataTransfer.getData("taskId")}"]`);
                        //     tasksOnPage.forEach((element) => { element.classList.remove("hidden")});
                        // }}
                        // onDrop={(ev) => {
                        //     if (ev.dataTransfer.types.includes("taskId")) {
                        //         ev.preventDefault();
                        //         const id = ev.dataTransfer.getData("taskId");
                        //         const task = taskStore.current.getTaskWithId(id);
                        //         task && taskStore.current.delete(task);
                        //     }
                        // }}
                    >
                        { ICONS.TRASH }
                    </button>
                    <button role="menuitem" className="btn small square bg" title="Log out" type="button" onClick={() => addAlert(document.querySelector("#left-menu button[title='Log out']"), ERROR_ALERT, "We haven't implemented users or logging out.")}>
                        { ICONS.LOG_OUT }
                    </button>
                </menu>
                {children}
            </div>
    )
})

export default DashboardLayout;
