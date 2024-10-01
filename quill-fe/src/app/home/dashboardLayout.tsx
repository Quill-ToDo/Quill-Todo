'use client';
import { observer } from "mobx-react-lite";
import './home.css'
import { addAlert, ERROR_ALERT, SUCCESS_ALERT } from '@/alerts/alertEvent';
import { AddNewTaskPopUp } from "@/widgets/NewTask/NewTaskPopUp";
import { ICONS } from "@util/constants";
import { useRef } from "react";
import { useTaskStore } from "./_globalStore/StoreProvider";
import { TetheredPopupOnClick } from "@util/Popup";
import { ListWidget } from "@/widgets/List/List";
import { CalendarWidget } from "@/widgets//Calendar/Calendar";
import { PORTAL_HOLDER_ID } from "../3rd-party/FloatingUiHelpers";

export const NEW_TASK_TEXT = "Add task";
export const HOME_ID = "home-wrapper";

const DashboardLayout = observer(({
    children,
}: {
    children?: React.ReactNode,
}) => {
    const taskStore = useRef(useTaskStore());
    const trashBtnRef = useRef(null);

    const widgets = children ? children :<>
        <ListWidget />
        <CalendarWidget />
    </>
    
    return (<>
            <div 
                id={HOME_ID}
                data-testid="home"
                role="none"
            >
                <menu 
                    role="menubar"
                    title="Menu" 
                    aria-orientation="vertical" 
                    id="left-menu" 
                    className="bg-green"
                >
                    <TetheredPopupOnClick
                        draggable={true}
                        useDragHandle={true}
                        renderElementToClick={(open) => <button 
                                id="add-task"
                                role="menuitem" 
                                aria-haspopup="dialog"
                                className="btn small square bg" 
                                title={NEW_TASK_TEXT} 
                                onClick={() => {
                                    taskStore.current.createNewTask();
                                    open();
                                }}
                            >
                                { ICONS.PLUS }
                            </button>
                        }
                        renderPopupContent={({closePopup}) => <AddNewTaskPopUp 
                            close={closePopup}
                            taskToCreate={taskStore.current.taskBeingCreated}
                        />}
                    />
                    <button 
                        ref={trashBtnRef}
                        role="menuitem" 
                        className="btn small square bg" 
                        title="Trash" 
                        type="button" 
                        onClick={() => addAlert(document.querySelector("#left-menu button[title='Trash']"), ERROR_ALERT, "We haven't implemented clicking on trash")}
                    >
                        { ICONS.TRASH }
                    </button>
                    <button role="menuitem" className="btn small square bg" title="Settings" type="button" onClick={() => addAlert(document.querySelector("#left-menu button[title='Settings']"), SUCCESS_ALERT, "clicky")}>
                        { ICONS.SETTINGS }
                    </button>
                    <button role="menuitem" className="btn small square bg" title="Log out" type="button" onClick={() => addAlert(document.querySelector("#left-menu button[title='Log out']"), ERROR_ALERT, "We haven't implemented users or logging out.")}>
                        { ICONS.LOG_OUT }
                    </button>
                </menu>
                {widgets}
            </div>
            <div id={PORTAL_HOLDER_ID} className="take-full-space"></div>
    </>)
})

export default DashboardLayout;
