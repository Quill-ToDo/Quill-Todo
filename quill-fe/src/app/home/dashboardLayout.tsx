'use client';
import { observer } from "mobx-react-lite";
import { useRef } from "react";
import './home.css'
// Internal 3rd party implementations, would be good to remove somehow
import { PORTAL_HOLDER_ID } from "../3rd-party/FloatingUiHelpers";
import { DraggingContent } from "../3rd-party/DndKit";
// Quill 
import { addAlert, ERROR_ALERT, NOTICE_ALERT } from '@/alerts/alertEvent';
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
import { combineClassNamePropAndString } from '@/util/jsTools';
import { 
    DEFAULT_DELETE_DRAG_DATA, 
    DELETE_DRAG_TYPE, 
    DeleteDragData, 
    DeleteDropData, 
    TASK_DRAG_TYPE
 } from "../@util/DraggableTypes";

export const NEW_TASK_TEXT = "Add task";

const DashboardLayout = observer(({
    children,
}: {
    children?: React.ReactNode,
}) => {
    const taskStore = useRef(useTaskStore());
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
                        closeWhenClickOutside={false}
                        useDragHandle={true}
                        anchorRenderMethod={(props, ref) => <button 
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
                        popupRenderMethod={({closePopup}, ref) => <AddNewTaskPopUp
                            ref={ref}
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
                        renderAnchor={({anchorProps, openPopup}, ref) => 
                        <Draggable <DeleteDragData> 
                                itemData={{
                                    type: DELETE_DRAG_TYPE,
                                }}
                                actionTitle="Drag to item to delete"
                                mayBeDropped={true}
                            >
                                <Droppable <DeleteDropData>
                                    itemData={{
                                        type: DELETE_DRAG_TYPE,
                                        accepts: DEFAULT_DELETE_DRAG_DATA.accepts,
                                    }}
                                    callbacksForAcceptedDragTypes={[{
                                        type: TASK_DRAG_TYPE,
                                        dragEnd: ({drag}) => {
                                            if (drag && drag.type === TASK_DRAG_TYPE) {
                                                const droppedTaskId = drag.value.id; 
                                                const droppedTask = taskStore.current.getTaskById(droppedTaskId);
                                                if (droppedTask) {
                                                    openPopup(() => droppedTask);
                                                }
                                            }
                                        }
                                    }]}
                                >
                                    <button 
                                        ref={ref}
                                        {...anchorProps}
                                        onClick={() => {
                                            addAlert(document.getElementById(HOME_ID), "notice", "Drag a task to the trash or drag the trash to a task to delete it!");
                                        }}
                                        role="menuitem" 
                                        className={combineClassNamePropAndString("btn small square bg", anchorProps)} 
                                        title="Trash" 
                                        type="button"
                                        >
                                        { ICONS.TRASH }
                                    </button>
                                </Droppable>
                            </Draggable>
                        }
                    /> 
                    <Draggable
                        itemData={{type: "settings"}}
                        actionTitle="Drag settings button"
                        mayBeDropped={true}
                    >
                        <button 
                            role="menuitem" 
                            className={"btn small square bg"}
                            title="Settings" 
                            type="button" 
                            onClick={() => addAlert(document.querySelector("#left-menu button[title='Settings']"), NOTICE_ALERT, "We haven't implemented settings yet.")}
                            >
                                { ICONS.SETTINGS }
                            </button>
                    </Draggable>
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
