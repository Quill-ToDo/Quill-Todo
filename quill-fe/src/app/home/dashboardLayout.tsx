'use client';
import { observer } from "mobx-react-lite";
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
    defaultTaskDeleteInteraction, 
    DELETE_DRAG_TYPE, 
    DeleteDragData, 
    DeleteDropData, 
    TASK_DRAG_TYPE,
 } from "../@util/DraggableTypes";

export const NEW_TASK_TEXT = "Add task";

const DashboardLayout = observer(({
    children,
}: {
    children?: React.ReactNode,
}) => {
    const taskStore = useTaskStore();
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
                                    taskStore.createNewTask();
                                    props.openPopup();
                                }}
                            >
                                { ICONS.PLUS }
                            </button>}
                        popupRenderMethod={({closePopup}, ref) => <AddNewTaskPopUp
                            ref={ref}
                            close={() => closePopup(()=> {
                                    if (taskStore && taskStore.taskBeingCreated && taskStore.taskBeingCreated.isNewAndUnsubmitted) {
                                        taskStore.taskBeingCreated.abortTaskCreation();
                                    }
                                })
                            }
                            taskToCreate={taskStore.taskBeingCreated}
                        />}
                    />
                    <DeleteTaskConfirmationPopup
                        renderAnchor={({anchorProps, openPopup}, ref) => 
                        <Draggable <DeleteDragData> 
                                itemData={{
                                    type: DELETE_DRAG_TYPE,
                                    showDropPreview: false,
                                }}
                                actionTitle="Drag to item to delete"
                                mayBeDropped={true}
                            >
                                <Droppable <DeleteDropData>
                                    itemData={{
                                        type: DELETE_DRAG_TYPE,
                                        accepts: DEFAULT_DELETE_DRAG_DATA.accepts,
                                    }}
                                    callbacksForAcceptedDragTypes={{
                                        [TASK_DRAG_TYPE]: {
                                            saveDataWhenDragEnds ({ drag, drop, e}) {
                                                if (drag && drop) {
                                                    const task = taskStore.getTaskById(drag.id);
                                                    task && defaultTaskDeleteInteraction.save && defaultTaskDeleteInteraction.save(drag, drop, {task: task, openDeleteConfirmPopup: openPopup});
                                                }
                                            },
                                    }}}
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
                        itemData={{type: "settings", showDropPreview: false,}}
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
                    <button 
                        onClick={() => {
                            taskStore.loadTasks();
                        }}
                        role="menuitem" 
                        className={"btn small square bg"} 
                        title="Re-load tasks from the server" 
                        type="button"
                        >
                        sync
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
