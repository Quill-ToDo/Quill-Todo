import React, {
    useEffect,
    useRef,
    MutableRefObject,
    useState,
} from "react";
import './TaskDetailStyle.css';
import { observer } from "mobx-react-lite";
import { ICONS } from "@/util/constants";
import {TaskContext, TaskModel} from "@/store/tasks/TaskModel";
import { 
    Checkbox, 
    ColorBubble, 
    DateTimeWrapper, 
    TaskComponentAndHeader, 
    TaskDescription, 
    TaskTitle, 
    TaskWrapper
} from "@/widgets/TaskDetail/TaskComponents";
import { ContextMenuPopup } from "@/util/Popup";
import { addAlert, NOTICE_ALERT } from "@/alerts/alertEvent";
import { DRAGGABLE_HANDLE_CLASS } from "@/app/@util/Draggable";

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
    const descRef = useRef(null);
    const addFieldButton = useRef(null);
    const contextMenuData = [
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
                    {ICONS.DRAG}
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
                                title="Pin window" 
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
            role="dialog"
            aria-labelledby="task-show-title"
        >
            <div className="columns gap same-size">
                <div>
                    <h3>Start</h3>
                    <div className="dark-section">
                        <div className="date-wrapper aligned even">
                            {task.start ? 
                                <DateTimeWrapper 
                                    type={TaskModel.VisualStyles.Start}
                                /> : 
                                <p className="subtle"> Not set </p>
                            }
                        </div>
                    </div>
                </div>
                <div>
                    <h3>Due</h3>
                    <div className="dark-section">
                        {task.due ? 
                        <DateTimeWrapper  
                            type={TaskModel.VisualStyles.Due}
                        /> :
                        <p className="subtle"> Not set </p>
                    }
                    </div>
                </div>
            </div>
            { showDescription && <TaskComponentAndHeader
                fieldName={"description"}
                labelElement={<h3>Description</h3>}
                optional={true}
                onCloseClick={() => { task.description = ""; setShowDescription(false); }}
            >
                <TaskDescription 
                    editAllowed={true} 
                    ref={descRef} 
                />
            </TaskComponentAndHeader>
            }
            {
                contextMenuData.some(entry => entry.visible) ? <div className="take-full-space centered">
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