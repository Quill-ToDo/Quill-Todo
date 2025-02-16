import { 
    ComponentPropsWithoutRef,
    useRef, 
    useState 
} from "react";
import { observer } from "mobx-react-lite";
import './NewTask.css';
import { ICONS } from "@/util/constants";
import { combineClassNamePropAndString } from '@util/jsTools';
import { 
    ColorBubble, 
    TaskComponentAndHeader, 
    TaskDescription, 
    TaskDueDate, 
    TaskStartDate, 
    TaskTitle 
} from "@/widgets/TaskDetail/TaskComponents";
import { FormField } from "@util/FormComponents";
import { DEFAULT_DUE_DATETIME, DEFAULT_START_DATETIME, TaskContext, TaskModel } from "@/store/tasks/TaskModel";
import { DRAGGABLE_HANDLE_CLASS } from "@/app/@util/Draggable";
import { DATETIME_FORMATS } from "@/app/@util/DateTimeHelper";
import { ContextMenuPopup } from "@/app/@util/Popup";

const OUTER_WRAPPER_NAME = "new-wrapper";
export const NEW_TASK_POPUP_TITLE = "New Task";
export const ADD_BUTTON_TEXT = "Create Task";

/**
 * A form to create a new task. 
 * It surfaces and edits the editable fields of a task that has already been created 
 * and is marked as "beingCreated"
 * in TaskStore.
 */
export const AddNewTaskPopUp = observer(({
    close, 
    taskToCreate,
    ...props
}: {
        close: () => void,
        taskToCreate: TaskModel | null, 
    } & ComponentPropsWithoutRef<"section">) => {
    const formRef = useRef(null);
    const [showDue, setShowDue] = useState(true);
    const [showStart, setShowStart] = useState(true);
    const [showDescription, setShowDescription] = useState(true);

    const contextMenuData = [
        {
            label: "Add due date",
            key: "add due",
            content: <>{ICONS.CALENDAR}<p>Due date</p></>,
            onClick: () => { 
                if (taskToCreate) {
                    taskToCreate.due = DEFAULT_DUE_DATETIME();
                } 
                setShowDue(true); 
            },
            visible: !showDue,
        },
        {
            label: "Add start date",
            key: "add start",
            content: <>{ICONS.CALENDAR}<p>Start date</p></>,
            onClick: () => { 
                if (taskToCreate) {
                    taskToCreate.start = DEFAULT_START_DATETIME();
                }
                setShowStart(true); 
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
    ]

    return (!taskToCreate ? <></> : <TaskContext.Provider value={taskToCreate} >
        <section 
            className={OUTER_WRAPPER_NAME}
            aria-labelledby="new-task-title"
            {...props}
            >
            <header 
                className={DRAGGABLE_HANDLE_CLASS}
                title="Move window"    
            >
                <div className="aligned rows gap">
                    {ICONS.DRAG}
                    <h2 id="new-task-title">{NEW_TASK_POPUP_TITLE}</h2>
                </div>
                <button className="btn small square end" title="Close" onClick={() => {
                    taskToCreate && taskToCreate.abortTaskCreation();
                    close();
                }}>
                    { ICONS.X }
                </button>
            </header>
            <section className="mid-section" aria-labelledby="popup-title">
                <form 
                    id="add-taskToCreate" 
                    ref={formRef}
                    className="form"
                    onSubmit={(e) =>  {
                        e.preventDefault();
                        if (taskToCreate) { 
                            if (taskToCreate.isValid) {
                                taskToCreate.submitNewTask().then(((value) => {
                                    close();
                                })); 
                            }
                            else {
                                let focusEle = (e.target as HTMLElement).querySelector(`[aria-invalid="true"]`);
                                !!focusEle && focusEle.focus();
                            }
                        }
                    }}
                >
                    <div id="title-color" className="rows gap">
                        <FormField 
                            name="Color"
                            required={true}
                            element={<ColorBubble />}
                            labelProps={{className: "aligned"}}
                            />
                        <FormField
                            name="Title"
                            required={true}
                            element={<TaskTitle editAllowed={true} {...{autoFocus: true}}/>}
                        />
                    </div>
                    { showDescription &&
                        <TaskComponentAndHeader
                            fieldName={"description"}
                            optional={true}
                            labelElement={<label>
                                    Description
                                </label>}
                                onCloseClick={() => {
                                    setShowDescription(false);
                                    taskToCreate.description = "";
                                }}
                                >
                                <TaskDescription
                                    editAllowed={true}
                                    />
                        </TaskComponentAndHeader>
                    }
                    <div className={showDue && showStart ? `rows gap same-size` : ""}>
                        { showStart && 
                            <TaskComponentAndHeader
                            fieldName={"start"}
                            optional={true}
                            labelElement={<label>
                                    Start
                                </label>}
                                onCloseClick={() => {
                                    setShowStart(false);
                                    taskToCreate.start = null;
                                }}
                                >
                                <TaskStartDate 
                                    editable={true}
                                    format={DATETIME_FORMATS.D_t}
                                    />
                            </TaskComponentAndHeader>
                        }
                        { showDue &&
                            <TaskComponentAndHeader
                                fieldName={"due"}
                                optional={true}
                                labelElement={<label>
                                    Due
                                </label>}
                                onCloseClick={() => {
                                    setShowDue(false);
                                    taskToCreate.due = null;
                                }}
                                >
                                <TaskDueDate 
                                    editable={true}
                                    format={DATETIME_FORMATS.D_t}
                                    />
                            </TaskComponentAndHeader>
                        }
                    </div>
                    { contextMenuData.some(entry => entry.visible) ? <div className="take-full-space centered">
                        <ContextMenuPopup
                            header={<header>Add field</header>}
                            labelsAndClickCallbacks={contextMenuData}
                            renderElementToClick={(props, ref) => <button 
                                    {...props.anchorProps}
                                    ref={ref}
                                    onClick={() => {props.openPopup();}}
                                    type="button"
                                    aria-label="Add task field"
                                    aria-haspopup="menu"
                                    title="Add task field" 
                                    className={combineClassNamePropAndString(`add-field-btn btn small centered take-full-space`, props.anchorProps)} 
                                    > 
                                        { ICONS.PLUS }
                                    </button>
                            }
                        />
                    </div> : undefined
                    }
                    <div className="centered">
                        <button id="add-btn" className="btn large text" type="submit" formNoValidate={true}>{ADD_BUTTON_TEXT}</button>
                    </div>
                </form>
            </section>
        </section>
    </TaskContext.Provider>
    )
})