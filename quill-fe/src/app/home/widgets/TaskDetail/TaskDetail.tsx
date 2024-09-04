import React, {
    useEffect,
    useRef,
    MutableRefObject,
    useState,
} from "react";
import './TaskDetailStyle.css';
import { observer } from "mobx-react-lite";
import { BTN_APPEAR_ON_HOVER_CLASS, BTN_APPEAR_TARGET_CLASS, ICONS } from "@/util/constants";
import {DEFAULT_DUE_DATETIME, TaskContext, TaskModel} from "@/store/tasks/TaskModel";
import { 
    Checkbox, 
    ColorBubble, 
    TaskDate, 
    TaskComponentAndHeader, 
    TaskDescription, 
    TaskTitle, 
    TaskWrapper,
    TaskDueDate
} from "@/widgets/TaskDetail/TaskComponents";
import { ContextMenuPopup } from "@/util/Popup";
import { addAlert, NOTICE_ALERT } from "@/alerts/alertEvent";
import { DRAGGABLE_HANDLE_CLASS } from "@/app/@util/Draggable";
import { DATETIME_FORMATS } from "@/app/@util/DateTimeHelper";

export const TASK_DETAIL_POPUP_NAME = "Task Detail";

const TaskDetail = observer(({
        task, 
        close,
    }: {
        task: TaskModel,  
        close: () => void,
}) => {
    const previouslyFocused: MutableRefObject<null | HTMLElement> = useRef(null);
    const focus = useRef(null);

    const [showDescription, setShowDescription] = useState(task.description ? true : false);
    const [showDue, setShowDue] = useState(task.due ? true : false);
    const descRef = useRef(null);
    const addFieldButton = useRef(null);
    const contextMenuData = [
        {
            label: "Add due date",
            key: "add due",
            content: <>{ICONS.DESCRIPTION}<p>Due date</p></>,
            onClick: () => { 
                setShowDue(true); 
                // TODO Setting due here fucls it up
                // task.due = DEFAULT_DUE_DATETIME();
                task.saveEdits("due");
            },
            visible: !showDue,
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
            key: "add description",
            content: <>{ICONS.PRIORITY}<p>Priority</p></>,
            onClick: () => addAlert(addFieldButton.current, NOTICE_ALERT, "We haven't implemented priority yet. Oopsies"),
            visible: true,
        },
    ]

    useEffect(() => {
        // Keep track of the previously focused element and
        previouslyFocused.current = document.activeElement as HTMLElement;
        return () => {
            // return focus to previous point after the popup closes
            previouslyFocused && previouslyFocused.current ? previouslyFocused.current.focus():null;
        }
    }, [])

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
                        renderAnchorElementToClick={(open) => <button 
                                className="btn small square no-shadow"
                                title="Options" 
                                aria-haspopup="menu"
                                onClick={() => {
                                        open();
                                    }}
                                >
                                    { ICONS.MENU }
                                </button>}
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
            <div className="columns gap same-size">
                <div>
                    <h3>Start</h3>
                    <div className="dark-section">
                        <div className="date-wrapper aligned even">
                            {task.start ? 
                                <TaskDate 
                                    type={TaskModel.VisualStyles.Start}
                                /> : 
                                <p className="subtle aligned centered take-full-space"> No start date </p>
                            }
                        </div>
                    </div>
                </div>
                <div>
                    {showDue ? <TaskComponentAndHeader 
                            fieldName="due"
                            optional={true}
                            labelElement={<h3>Due</h3>}
                            onCloseClick={(e) => {
                                // TODO setting task.due fucks it up and closes the popup
                                setShowDue(false);
                                // task.due = null;
                                task.saveEdits("due");
                            }}
                        >
                            <TaskDueDate editable={true} format={DATETIME_FORMATS.D_t}/>
                        </TaskComponentAndHeader> 
                        : <>
                        <div className={`aligned centered take-full-space ${BTN_APPEAR_TARGET_CLASS}`}>
                            <p className="subtle"> No due date </p>
                            <button 
                                onClick={contextMenuData[0].onClick} 
                                className={`btn x-small floating ${BTN_APPEAR_ON_HOVER_CLASS}`}
                            >
                                {ICONS.PLUS}
                            </button>
                        </div>
                        </>
                    }
                </div>
            </div>
            { showDescription && <TaskComponentAndHeader
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
                    renderAnchorElementToClick={(openPopup) => <button 
                            ref={addFieldButton}
                            onClick={openPopup}
                            aria-label="Add task field"
                            aria-haspopup="menu"
                            title="Add task field" 
                            className={`add-field-btn btn large centered`} 
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