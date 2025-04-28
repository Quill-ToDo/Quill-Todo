import React, {
    useEffect,
    useRef,
    MutableRefObject,
    useState,
    forwardRef,
    ComponentPropsWithoutRef,
} from "react";
import './TaskDetailStyle.css';
import { observer } from "mobx-react-lite";
import { ICONS, HOME_ID } from "@/util/constants";
import { ContextMenuPopup } from "@/util/Popup";
import { DRAGGABLE_HANDLE_CLASS, INTERACTABLE_ELEMENT_CLASS } from "@/util/Draggable";
import { DATETIME_FORMATS } from "@/util/DateTimeHelper";
import { assignForwardedRef, combineClassNamePropAndString } from '@util/jsTools';
import { DEFAULT_DUE_DATETIME, DEFAULT_START_DATETIME, TASK_ACTIONS, TASK_CHECKBOX_STYLES, TaskModel } from "@/store/tasks/TaskModel";
import { 
    Checkbox, 
    ColorBubble, 
    TaskDate, 
    TaskComponentAndHeader, 
    TaskDescription, 
    TaskTitle, 
    TaskWrapper,
    TaskDueDate,
    TaskStartDate
} from "@/widgets/TaskDetail/TaskComponents";
import { addAlert, NOTICE_ALERT } from "@/alerts/alertEvent";

export const TASK_DETAIL_POPUP_NAME = "Task Detail";

const TaskDetail = observer(forwardRef<any, {
    task: TaskModel,  
    closeWidget?: (() => void) | undefined,
    containerProps?: ComponentPropsWithoutRef<"div">,
}>(({
    task, 
    closeWidget, 
    containerProps,
}, forwardedRef) => {
    const previouslyFocused: MutableRefObject<null | HTMLElement> = useRef(null);
    const [showDescription, setShowDescription] = useState(true);
    const [showDue, setShowDue] = useState(true);
    const [showStart, setShowStart] = useState(true);
    const descRef = useRef(null);
    const contextMenuData = [
        {
            label: "Add due date",
            key: "add due",
            content: <>{ICONS.CALENDAR}<p>Due date</p></>,
            onClick: () => { 
                task.due = DEFAULT_DUE_DATETIME();
                task.saveEdits("due");
                setShowDue(true); 
            },
            visible: !showDue,
        },
        {
            label: "Add start date",
            key: "add start",
            content: <>{ICONS.CALENDAR}<p>Start date</p></>,
            onClick: () => { 
                task.start = DEFAULT_START_DATETIME();
                task.saveEdits("start");
                setShowDue(true); 
            },
            visible: !showStart,
        },
        {
            label: "Add description",
            key: "add description",
            content: <>{ICONS.DESCRIPTION}<p>Description</p></>,
            onClick: () => { 
                setShowDescription(true); 
            },
            visible: !showDescription,
        },
        {
            label: "Add priority",
            key: "add priority",
            content: <>{ICONS.PRIORITY}<p>Priority</p></>,
            onClick: () => addAlert(document.getElementById(HOME_ID), NOTICE_ALERT, "We haven't implemented priority yet. Oopsies"),
            visible: true,
        },
    ]

    useEffect(() => {
        setShowDue(task.due ? true : false);
        setShowStart(task.start ? true : false)
        setShowDescription(task.description.length > 0);
        // Keep track of the previously focused element
        previouslyFocused.current = document.activeElement as HTMLElement;
        return () => {
            // return focus to previous point after the popup closes
            previouslyFocused && previouslyFocused.current ? previouslyFocused.current.focus():null;
        }
    }, [task])

    return <TaskWrapper 
        {...containerProps}
        highlightable={false}
        task={task} 
        aria-label={TASK_DETAIL_POPUP_NAME}
        role="dialog"
        className={combineClassNamePropAndString(`task-detail`, containerProps as ComponentPropsWithoutRef<"div">)}
        ref={(node) => {
            assignForwardedRef(forwardedRef, node);
        }} 
    >
        <header className={DRAGGABLE_HANDLE_CLASS}>
                <div className="checkbox-color">
                    <button>
                        {ICONS.DRAG}
                    </button>
                    <ColorBubble buttonProps={{className: INTERACTABLE_ELEMENT_CLASS}} />
                    <Checkbox 
                        type={TASK_CHECKBOX_STYLES.due}
                    />
                    <TaskTitle editAllowed={true} />   
                </div>
                <div className="aligned end">
                    <ContextMenuPopup
                        renderElementToClick={(props, ref) => <button 
                                {...props.anchorProps}
                                ref={(node) => assignForwardedRef(ref, node)}
                                className={combineClassNamePropAndString("btn small square no-shadow", props.anchorProps)}
                                title="Options" 
                                aria-haspopup="menu"
                                onClick={() => {
                                        props.openPopup();
                                    }}
                                >
                                    { ICONS.MENU }
                                </button>
                        }
                        labelsAndClickCallbacks={[
                                {
                                    label: "Delete",
                                    content: <>{ ICONS.TRASH }<p>Delete task</p></>,
                                    onClick: () => { 
                                        task.deleteSelf(); 
                                        closeWidget && closeWidget(); 
                                    },
                                    visible: true,
                                }
                            ]}
                        placement={"right"}
                        alignment={"middle"}  
                    />
                    <button 
                        className="btn small square no-shadow"
                        title="Close" 
                        onClick={() => {
                            closeWidget && closeWidget();
                        }}
                    >
                        { ICONS.X }
                    </button>
                </div>
        </header>
        <section 
            className="mid-section" 
            aria-labelledby="task-show-title"
        >
            <div>
                <div className="aligned rows small gap">
                    <button className="btn x-small square">
                        {ICONS.DOWN}
                    </button>
                    <h5>Task Metadata</h5>
                </div>
                <div className="meta-data dark-section">
                    <label className="inline">Created<p>{DATETIME_FORMATS.D_t.serializer(task.createdDate)}</p></label>
                    { task.complete && <label className="inline">Completed<p>{task.completedDate ? DATETIME_FORMATS.D_t.serializer(task.completedDate): "Unknown"}</p></label> }
                </div>
            </div>
            {showStart || showDue || task.start || task.due ? 
                <div className={task.start && task.due ? `rows gap same-size` : ""}>
                        {(showStart || task.start) && <TaskComponentAndHeader 
                                fieldName="start"
                                optional={true}
                                labelElement={<h3>Start</h3>}
                                onCloseClick={(e) => {
                                    setShowStart(false);
                                    task.start = null;
                                    task.saveEdits("start");
                                }}
                            >
                                <TaskStartDate editable={true} format={DATETIME_FORMATS.D_t}/>
                            </TaskComponentAndHeader> 
                        }
                        {(showDue || task.due) && <TaskComponentAndHeader 
                                fieldName="due"
                                optional={true}
                                labelElement={<h3>Due</h3>}
                                onCloseClick={(e) => {
                                    setShowDue(false);
                                    task.due = null;
                                    task.saveEdits("due");
                                }}
                            >
                                <TaskDueDate editable={true} format={DATETIME_FORMATS.D_t}/>
                            </TaskComponentAndHeader> 
                        }
                </div>
            :
            undefined
            }
            
            { (showDescription || task.description.length > 0) && <TaskComponentAndHeader
                fieldName={"description"}
                labelElement={<h3>Description</h3>}
                optional={true}
                onCloseClick={() => { 
                    task.description = ""; 
                    task.saveEdits("description")
                    setShowDescription(false);
                 }}
            >
                <TaskDescription 
                    editAllowed={true} 
                    ref={descRef} 
                />
            </TaskComponentAndHeader>
            }
            { contextMenuData.some(entry => entry.visible) ? <div className="take-full-space centered">
                <ContextMenuPopup
                    header={<header>Add field</header>}
                    labelsAndClickCallbacks={contextMenuData}
                    renderElementToClick={(props, ref) => <button 
                            {...props.anchorProps}
                            ref={ref}
                            onClick={() => {props.openPopup();}}
                            aria-label="Add task field"
                            aria-haspopup="menu"
                            title="Add task field" 
                            className={combineClassNamePropAndString(`add-field-btn btn large centered`, props.anchorProps)} 
                            > 
                                { ICONS.PLUS }
                            </button>
                    }
                />
            </div> : undefined
            }
        </section>
    </TaskWrapper>
}))

export default TaskDetail;