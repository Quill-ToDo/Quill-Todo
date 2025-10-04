'use client';
import { observer } from "mobx-react-lite";
import { useRef } from "react";
import './home.css'
// Internal 3rd party implementations, would be good to remove somehow
import { PORTAL_HOLDER_ID } from "../3rd-party/FloatingUiHelpers";
import { DraggingContent } from "../3rd-party/DndKit";
// Quill 
import { addAlert, ERROR_ALERT, NOTICE_ALERT } from '@/alerts/alertEvent';
import { TASK_ACTIONS, TASK_DRAG_TYPE } from "@/store/tasks/TaskModel";
import { useTaskStore } from "@/store/StoreProvider";
// Widgets
import { AddNewTaskPopUp } from "@/widgets/NewTask/NewTaskPopUp";
import { DeleteTaskConfirmationPopup } from "@/widgets/TaskDetail/TaskComponents";
import { ListWidget } from "@/widgets/List/List";
import { CalendarWidget } from "@/widgets/Calendar/Calendar";
// Utils
import { ICONS, HOME_ID } from "@/util/constants";
import { Draggable, Droppable } from "@/util/Draggable";
import { AttachedPopupOnClick } from "@/util/Popup";
import { combineClassNamePropAndString, assignForwardedRef } from '@/util/jsTools';

export const NEW_TASK_TEXT = "Add task";

const DashboardLayout = observer(({
    children,
}: {
    children?: React.ReactNode,
}) => {
    const taskStore = useRef(useTaskStore());
    const trashBtnRef = useRef<HTMLButtonElement | null>(null);
    const widgets = children ? children :<>
        <ListWidget />
        <CalendarWidget />
    </>
    
    return (<>
            <div 
                id={HOME_ID}
                data-testid="home"
            >
                <menu 
                    role="menubar"
                    title="Menu" 
                    aria-orientation="vertical" 
                    id="left-menu" 
                    className="bg-green"
                >
                    <AttachedPopupOnClick
                        draggable={true}
                        useDragHandle={true}
                        renderElementToClick={(props, ref) => <button 
                                {...props.anchorProps}
                                ref={ref}
                                id="add-task"
                                role="menuitem" 
                                aria-haspopup="dialog"
                                className={combineClassNamePropAndString("btn small square bg", props.anchorProps)}
                                title={NEW_TASK_TEXT} 
                                onClick={() => {
                                    taskStore.current.createNewTask();
                                    props.openPopup();
                                }}
                            >
                                { ICONS.PLUS }
                            </button>}
                        renderPopupContent={({closePopup, popupContainerProps}, ref) => <AddNewTaskPopUp
                            ref={ref}
                            {...popupContainerProps}
                            close={() => closePopup(()=> {
                                    if (taskStore.current && taskStore.current.taskBeingCreated && taskStore.current.taskBeingCreated.isNewAndUnsubmitted) {
                                        taskStore.current.taskBeingCreated.abortTaskCreation();
                                    }
                                })
                            }
                            taskToCreate={taskStore.current.taskBeingCreated}
                        />}
                    />
                    <DeleteTaskConfirmationPopup
                        renderAnchor={(setTaskToDelete) => <Draggable 
                                actionTitle="Drag to item to delete"
                                droppable={true}
                                itemType={TASK_ACTIONS.delete}
                                renderDraggableItem={(props, ref) => {
                                    return <Droppable 
                                        {...props}
                                        ref={ref}
                                        acceptedItemTypes={[TASK_DRAG_TYPE]}
                                        itemType={TASK_ACTIONS.delete}
                                        onDrop={({drag}) => {
                                            if (drag && drag.type === TASK_DRAG_TYPE) {
                                                const droppedTaskId = drag.value.id; 
                                                const droppedTask = taskStore.current.getTaskById(droppedTaskId);
                                                if (droppedTask) {
                                                    // const popupSetup = getDeleteConfirmationPopupSetup(droppedTask);
                                                    // popupSetup.openPopup();
                                                    setTaskToDelete(droppedTask);
                                                }
                                            }
                                        }}
                                        renderDroppableItem={(props, ref) => <button 
                                            {...props}
                                            ref={(node) => {
                                                assignForwardedRef(trashBtnRef, node);
                                                assignForwardedRef(ref, node);
                                            }}
                                            onClick={() => {
                                                addAlert(trashBtnRef.current, "notice", "Drag a task to the trash or drag the trash to a task to delete it!");
                                            }}
                                            role="menuitem" 
                                            className={combineClassNamePropAndString("btn small square bg", props)} 
                                            title="Trash" 
                                            type="button"
                                        >
                                            { ICONS.TRASH }
                                        </button>
                                        }
                                    />
                                }}
                            />
                        }
                    /> 
                    
                    <button role="menuitem" className="btn small square bg" title="Settings" type="button" onClick={() => addAlert(document.querySelector("#left-menu button[title='Settings']"), NOTICE_ALERT, "We haven't implemented settings yet.")}>
                        { ICONS.SETTINGS }
                    </button>
                    <button role="menuitem" className="btn small square bg" title="Log out" type="button" onClick={() => addAlert(document.querySelector("#left-menu button[title='Log out']"), ERROR_ALERT, "We haven't implemented users or logging out.")}>
                        { ICONS.LOG_OUT }
                    </button>
                </menu>
                {widgets}
                <div id={PORTAL_HOLDER_ID}></div>
            </div>
            {/* Any content being dragged. This must stay mounted */}
            <DraggingContent/>
    </>)
})

export default DashboardLayout;
