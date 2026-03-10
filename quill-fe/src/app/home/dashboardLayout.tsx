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
import { ICONS, HOME_ID } from "@/app/util/constants";
import { Draggable, DraggableRenderMethod, Droppable, DroppableRenderMethod } from "@/app/util/Draggable";
import { AttachedPopupOnClick } from "@/app/util/Popup";
import { combineClassNamePropAndString } from '@/app/util/jsTools';
import { 
    DEFAULT_DELETE_DRAG_DATA, 
    defaultTaskDeleteInteraction, 
    DELETE_DRAGDROP_TYPE, 
    DeleteDragData, 
    DeleteDropData, 
    TASK_DRAGDROP_TYPE,
 } from "../util/DraggableTypes";

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
                        anchorRenderMethod={({openPopup, ...props}, ref) => <button 
                                ref={ref}
                                {...props}
                                id="add-task"
                                role="menuitem" 
                                aria-haspopup="dialog"
                                className={combineClassNamePropAndString("btn small square bg", props)}
                                title={NEW_TASK_TEXT} 
                                onClick={() => {
                                    taskStore.createNewTask();
                                    openPopup();
                                }}
                            >
                                { ICONS.PLUS }
                            </button>}
                        popupRenderMethod={({closePopup, ...props}, ref) => <AddNewTaskPopUp
                            ref={ref}
                            close={() => closePopup(()=> {
                                    if (taskStore && taskStore.taskBeingCreated && taskStore.taskBeingCreated.isNewAndUnsubmitted) {
                                        taskStore.taskBeingCreated.abortTaskCreation();
                                    }
                                })
                            }
                            taskToCreate={taskStore.taskBeingCreated}
                            {...props}
                        />}
                    />
                    <DeleteTaskConfirmationPopup
                        renderAnchor={({openPopup, ...props}, anchorRef) => <DraggableRenderMethod <DeleteDragData> 
                            ref={anchorRef}
                            {...props}
                            itemData={{
                                type: DELETE_DRAGDROP_TYPE,
                                showDropPreview: false,
                            }}
                            actionTitle="Drag to item to delete"
                            droppable={true}
                            render={(draggableProps, draggableRef) => <DroppableRenderMethod <DeleteDropData>
                                {...draggableProps}
                                ref={draggableRef}
                                itemData={{
                                    type: DELETE_DRAGDROP_TYPE,
                                    accepts: DEFAULT_DELETE_DRAG_DATA.accepts,
                                }}
                                callbacksForAcceptedDragTypes={{
                                    [TASK_DRAGDROP_TYPE]: {
                                        saveDataWhenDragEnds ({ drag, drop, e}) {
                                            if (drag && drop) {
                                                const task = taskStore.getTaskById(drag.id);
                                                task && defaultTaskDeleteInteraction.save && defaultTaskDeleteInteraction.save({drag, drop, task: task, openDeleteConfirmPopup: openPopup});
                                            }
                                        },
                                        setDataWhenDragOver({ drag, drop, e }) {
                                            
                                        },
                                        resetDataWhenDragOff({ drag, drop, e }) {
                                            
                                        },
                                    }}}
                                render={(droppableProps, droppableRef) => <button 
                                    ref={droppableRef}
                                    {...droppableProps}
                                    onClick={() => {
                                        addAlert(document.getElementById(HOME_ID), "notice", "Drag a task to the trash or drag the trash to a task to delete it!");
                                    }}
                                    role="menuitem" 
                                    className={combineClassNamePropAndString("btn small square bg", droppableProps)} 
                                    title="Trash" 
                                    type="button"
                                    >
                                    { ICONS.TRASH }
                                </button>}
                            />                                
                        }
                    />}
                /> 
                    <Draggable
                        itemData={{type: "settings", showDropPreview: false,}}
                        actionTitle="Drag settings button"
                        droppable={true}
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
