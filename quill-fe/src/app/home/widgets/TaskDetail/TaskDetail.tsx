import React, {
    useEffect,
    useRef,
    MutableRefObject,
    useState,
} from "react";
import './TaskDetailStyle.css';
import { observer } from "mobx-react-lite";
import { combineClassNamePropAndString, ICONS } from "@/util/constants";
import { DEFAULT_DUE_DATETIME, DEFAULT_START_DATETIME, TaskModel } from "@/store/tasks/TaskModel";
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
import { ContextMenuPopup } from "@/util/Popup";
import { addAlert, NOTICE_ALERT } from "@/alerts/alertEvent";
import { DRAGGABLE_HANDLE_CLASS } from "@/app/@util/Draggable";
import { DATETIME_FORMATS } from "@/app/@util/DateTimeHelper";
import { HOME_ID } from "../../dashboardLayout";

export const TASK_DETAIL_POPUP_NAME = "Task Detail";

const TaskDetail = observer(({
        task, 
        close,
    }: {
        task: TaskModel,  
        close?: (() => void) | undefined,
}) => {
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

    return <TaskWrapper task={task} {...{"aria-label": TASK_DETAIL_POPUP_NAME, "role": "dialog"}}>
        <header className={DRAGGABLE_HANDLE_CLASS}>
                <div className="checkbox-color">
                    <button>
                        {ICONS.DRAG}
                    </button>
                    <ColorBubble />
                    <Checkbox 
                        type={TaskModel.VisualStyles.Due}
                    />
                    <TaskTitle editAllowed={true} />   
                </div>
                <div className="aligned end">
                    <ContextMenuPopup
                        renderElementToClick={(props, ref) => <button 
                                {...props.toApply}
                                className={combineClassNamePropAndString({
                                    className: "btn small square no-shadow", 
                                    props: props.toApply
                                })}
                                title="Options" 
                                aria-haspopup="menu"
                                onClick={() => {
                                        props.openPopup();
                                    }}
                                ref={ref}
                                >
                                    { ICONS.MENU }
                                </button>
                        }
                        labelsAndClickCallbacks={[
                                {
                                    label: "Delete",
                                    content: <>{ ICONS.TRASH }<p>Delete task</p></>,
                                    onClick: () => { task.deleteSelf(); close(); },
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
                            close();
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
                            {...props.toApply}
                            ref={ref}
                            onClick={props.openPopup}
                            aria-label="Add task field"
                            aria-haspopup="menu"
                            title="Add task field" 
                            className={combineClassNamePropAndString({
                                className: `add-field-btn btn large centered`,
                                props: props.toApply,
                            })} 
                            > 
                                { ICONS.PLUS }
                            </button>
                    }
                />
            </div> : undefined
            }
        </section>
    </TaskWrapper>
})

export default TaskDetail;