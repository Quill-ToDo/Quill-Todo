'use client'

import { observer } from "mobx-react-lite";
import './home.css'
import { addAlert, ERROR_ALERT } from '@/alerts/alertEvent';
import NewTaskPopUp from "@/widgets/NewTask/NewTaskPopUp";
import { offset, UseDismissProps, UseFloatingOptions } from "@floating-ui/react";
import { ICONS } from "../@util/constants";
import { PositionedPopupAndReferenceElement } from "../@util/FloatingUiHelpers";
import { useRef, useState } from "react";
import { useTaskStore } from "./_globalStore/StoreProvider";


const DashboardLayout = observer(({
  children, // will be a page or nested layout
}: {
    children: React.ReactNode
}) => {
    const [showNewTaskPopupFromMenuButton, setShowNewTaskPopupFromMenuButton] = useState(false);
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

    const taskStore = useRef(useTaskStore());
    
    return ( 
            <div id="home-wrapper" data-testid="home">
                <menu role="menubar" aria-orientation="vertical" id="left-menu" className="bg-green">
                    <PositionedPopupAndReferenceElement
                        popupPositioningOptions={newTaskPopupPositioning}
                        dismissPopupOptions={dismissOptions}
                        refElement={<button id="add-task" role="menuitem" className="btn small square bg" title="Add task" 
                            onClick={() => {
                                taskStore.current.createNewTask();
                                setShowNewTaskPopupFromMenuButton(true);
                                } }>
                            { ICONS.PLUS }
                        </button>}
                        popupElement={ 
                            <NewTaskPopUp 
                                close={() => {
                                    setShowNewTaskPopupFromMenuButton(false);
                                    const taskBeingCreated = taskStore.current.taskBeingCreated;
                                    if (taskBeingCreated && taskBeingCreated.isNewAndUnsubmitted) {
                                        taskBeingCreated.abortTaskCreation();
                                    }
                                }}
                                taskToCreate={taskStore.current.taskBeingCreated}
                            />
                        }
                    />
                    <button role="menuitem" className="btn small square bg" title="Log out" type="button" onClick={() => addAlert(document.querySelector("#left-menu button[title='Log out']"), ERROR_ALERT, "We haven't implemented users or logging out.")}>
                        <i className="fas fa-power-off fa-fw"></i>
                    </button>
                </menu>
                {children}
            </div>
    )
})

export default DashboardLayout;
