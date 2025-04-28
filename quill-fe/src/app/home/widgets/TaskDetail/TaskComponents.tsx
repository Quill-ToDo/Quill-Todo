import { ErrorsList, ResizableInput } from "@util/FormComponents";
import { 
    AcceptedTaskCheckboxStyles,
    TASK_ACCEPTED_DRAG_TYPES,
    TASK_ACTIONS,
    TASK_CHECKBOX_STYLES,
    TASK_DRAG_TYPE,
    TaskColorCodes, 
    TaskContext,
    TaskModel,
} from "@/store/tasks/TaskModel";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";
import { 
    ComponentPropsWithoutRef, 
    Dispatch, 
    ForwardedRef, 
    forwardRef, 
    ForwardRefRenderFunction, 
    MouseEvent, 
    MutableRefObject, 
    ReactNode, 
    SetStateAction, 
    useCallback, 
    useContext, 
    useEffect, 
    useId, 
    useRef, 
    useState, 
} from "react";
import TaskDetail from "./TaskDetail";
import { ICONS, UNSET_TASK_TITLE_PLACEHOLDER } from "@util/constants";
import { assignForwardedRef, combineClassNamePropAndString } from '@util/jsTools';
import { AnchorWithStandalonePopupAttached, AttachedPopupOnClick } from "@/util/Popup";
import './tasks.css';
import { DateFormat, PARTIAL_DATETIME_FORMATS } from "@/util/DateTimeHelper";
import { DraggableContext } from "@/app/3rd-party/DndKit";
import { Droppable, INTERACTABLE_ELEMENT_CLASS } from "@/app/@util/Draggable";

const TASK_WRAPPER_CLASS = "task-wrapper";


const useTaskContextOrPassedTask = (passedTask?: TaskModel): TaskModel => {
    if (passedTask) {
        return passedTask;
    }
    const t = useContext(TaskContext);
    if (t) {
        return t;
    } else {
        throw new Error("Must pass a TaskModel or call useTaskContextOrPassedTask within a TaskContext Provider.");
    }
}

export const TaskBeingDragged = observer(forwardRef((
{
    task, 
    type,
    ...props
}: {
    task: TaskModel, 
    type: AcceptedTaskCheckboxStyles,
}, ref: ForwardedRef<any>) => {
    const t = useTaskContextOrPassedTask(task);
    if (!t) {
        return;
    }

    return <TaskWrapper
        {...props}
        className={combineClassNamePropAndString("dragging rows centered gap", props)}
        task={t}
        ref={ref}
    >
        <Checkbox type={type}/>
        <TaskTitle/>
    </TaskWrapper>
}));


export const DeleteTaskConfirmationPopup = observer(({
        renderAnchor
    }: {
        renderAnchor: (setTaskToDelete: Dispatch<SetStateAction<TaskModel | null>>) => ReactNode
    }) => {
    const [task, setTask] = useState<null | TaskModel>(null);

    return <AttachedPopupOnClick 
        renderElementToClick={(props, ref) => renderAnchor(setTask)}
        renderPopupContent={(closePopup) => task ? <section 
            className={"mid-section confirmation"}
        >
            <p>Are you sure you want to delete this task?</p>
            <br />
            <PlainTaskTitle passedTask={task}/>
            <br />
            <div className={"rows gap centered"}>
                <button 
                    className={"btn med"} 
                    onClick={ () => closePopup}
                >Cancel</button>
                <button className={"btn med  bg"} type={"submit"} autoFocus={true} onClick={() => {task.deleteSelf();}}>Delete</button>
            </div>
        </section> : <></>}
    />
});

/**
 * Provide context of a single task for all task-related components within.
 * @param droppable Whether or not this task should accept draggable items being dropped on it
 */
export const TaskWrapper = observer(forwardRef((
    {
        task, 
        keyOverride,
        children,
        droppable=true,
        highlightable=true,
        ...props
    } : {
        task: TaskModel, 
        keyOverride?: string,
        children: ReactNode, 
        droppable?:  boolean,
        highlightable?: boolean,
    } & ComponentPropsWithoutRef<"div">, ref: ForwardedRef<HTMLDivElement>) => {

    const dragContext = useContext(DraggableContext);

    let renderContent: ForwardRefRenderFunction<HTMLDivElement, ComponentPropsWithoutRef<"div">> = (props, ref) => <div 
        {...props}
        ref={(ele) => {
            assignForwardedRef(ref, ele);
        }}
        key={keyOverride ? keyOverride : task.id}
        onMouseEnter={(e) => {
            if (!dragContext.isDragging) {
                task.highlighted = true;
            }
        }}
        onMouseLeave={(e) => {
            if (!dragContext.isDragging) {
                task.highlighted = false;
            }
        }}
        className={combineClassNamePropAndString(
            `${TASK_WRAPPER_CLASS}${task.complete ? " complete" : ""}${task.overdue() ? " overdue" : ""}${highlightable && task.highlighted ? " highlighted" : ""}`, 
            props
        )}
    >
        {children}
    </div>;

    // let content = useCallback((props: ComponentPropsWithoutRef<"div">, ref: ForwardedRef<HTMLDivElement>) => renderContent(props, ref), [props, ref]);
    // droppable ? 
    // <DeleteTaskConfirmationPopup 
    //     renderAnchor={(setTask) => <Droppable 
    //         itemType={TASK_DRAG_TYPE}
    //         itemData={{id: task.id}}
    //         onDrop={({drop}) => {
    //             if (drop && drop.type === TASK_ACTIONS.delete) {
    //                 setTask(task);
    //             }
    //         }}
    //         acceptedItemTypes={TASK_ACCEPTED_DRAG_TYPES}
    //         renderDroppableItem={(droppableProps, droppableRef) => {
    //             return renderContent({
    //                 ...props,
    //                 ...droppableProps,
    //                 // ...deleteConfirmationSetup.getReferenceProps,
    //                 className: combineClassNamePropAndString(props.className ? props.className : "", droppableProps),
    //             }, (ele) => {
    //                 assignForwardedRef(droppableRef, ele);
    //                 assignForwardedRef(ref, ele);
    //                 // assignForwardedRef(deleteConfirmationSetup.setPopupPositioningAnchor, ele);
    //             });
    //         }}
    //     />}
    // /> : 
    // renderContent(props, ref);

    return <TaskContext.Provider value={task}>
        { renderContent(props, ref) }
    </TaskContext.Provider>;
}));

/**
 * This will render a button that will clear <fieldName> provided an onClick method to do so. 
 * Give a parent element the class BTN_APPEAR_TARGET_CLASS so that the clear button will appear when 
 * that element is being hovered.
 */
const ClearTaskFieldButton = observer(({
    fieldName,
    onClick,
    ...props
} : {
    fieldName: string,
    onClick: (e: MouseEvent) => void,
}) => {
    return <button 
        {...props}
        title={`Remove ${fieldName}`}
        className={combineClassNamePropAndString(`clear floating btn x-small square`, props)}
        onClick={(e) => {onClick(e)}}
        >
        {ICONS.X}
    </button>
})

export const TaskComponentAndHeader = observer(({
    labelElement,
    fieldName,
    optional=false,
    onCloseClick,
    children,
}: {
    labelElement: ReactNode,
    fieldName: "title" | "color" | "description" | "start" | "due",
    optional?: boolean,
    onCloseClick: (e: MouseEvent) => void,
    children: ReactNode,
}) => {
    const [hovered, setHovered] = useState(false);

    return <div
        className={`field ${fieldName}`}
        onMouseEnter={() => {
            setHovered(true);
        }}
        onMouseLeave={() => {
            setHovered(false);
        }}
    >
        <div 
            className="rows space-between"
        >
            { labelElement }
            <div className="field-btns">
                { optional && 
                    <ClearTaskFieldButton fieldName={fieldName} onClick={onCloseClick} {...{className: hovered ? "hover" : ""}}/>
                }
            </div>
        </div>
        <div className="dark-section">
            { children }
        </div>
    </div>
});

//#region Checkbox
export const Checkbox = observer(({
    passedTask, 
    type, 
    checkboxId
}: {
    passedTask?: TaskModel, 
    type: AcceptedTaskCheckboxStyles, 
    checkboxId?: string
}) => {
    const task = useTaskContextOrPassedTask(passedTask);

    const id = checkboxId ? checkboxId : useId();
    const text = `Mark task ${task.complete ? "uncomplete" : "complete"}`;
    return <label 
            className={`check-box-wrapper ${INTERACTABLE_ELEMENT_CLASS}`}
            htmlFor={id}
            title={text}
            aria-label={text}
            tabIndex={0}
        >
        <input 
            type="checkbox" 
            id={id}
            onChange={() => {
                task.toggleComplete();
            }}
            checked={task.complete}
            >
        </input>
        <TaskCheckbox form={type} /> 
    </label>;
});

const TaskCheckbox = observer(({
    passedTask, 
    form
}: {
    passedTask?: TaskModel, 
    form: AcceptedTaskCheckboxStyles
}) => {
    const task = useTaskContextOrPassedTask(passedTask);
    const styleText = !task.complete ? {color: task.color} : {};
    let checkboxIcon;
    switch (form) {
        case TASK_CHECKBOX_STYLES.due:
            checkboxIcon = task.complete ? `fa-check-square` : `fa-square`;
            break;
        default:
            checkboxIcon = task.complete ? `fa-check-circle round` : `fa-circle round`;
            break;
    }
    const checkFormat = task.complete ? checkboxIcon : checkboxIcon;
    return <i className={`far fa-fw checkmark ${checkFormat}`} style={styleText}></i>;  
});

//#endregion 
//#region Color Picker
const ColorGridPicker = observer(({task, closePicker}: {
    task: TaskModel, 
    closePicker: () => void, 
}) => {
    const errorId = useId();
    const inputRef = useRef(null);
    const startingTaskColor = useRef(task.color);

    const close = useCallback(async () => {
        if (task.color != startingTaskColor.current) {
            const edits = task.saveEdits("color");
            edits && edits.then(() => {
                startingTaskColor.current = task.color;
            })
        }
        closePicker();
    }, [task.color, startingTaskColor]);

    return <div 
                className="color-picker max-width-height"
                onMouseLeave={() => task.color = startingTaskColor.current}
        > 
            <div className="colors max-width-height">
            { TaskColorCodes.map((colorCol: {key: string, data: string[]}) => 
                <div 
                    className="color-picker-col" 
                    key={`${colorCol.key}`}> 
                        { colorCol.data.map((color: string) => 
                        <button
                            className="color-square max-width-height"
                            style={{backgroundColor: color}} 
                            key={color} 
                            onMouseEnter={() => {
                                task.colorStringUnderEdit = color;
                            }}
                            onClick={() => {
                                close();
                            }}
                        ></button>
                    )}
            </div>          
            )}
            </div>
            <div className="name-and-errors max-width-height">
                <input 
                    className="max-width-height"
                    autoFocus={true}
                    value={task.colorStringUnderEdit} 
                    onChange={(e) => {
                        task.colorStringUnderEdit = e.target.value;
                    }}
                    ref={inputRef}
                    aria-invalid={!!task.validationErrors.colorStringUnderEdit.length}
                    aria-describedby={errorId}
                >    
                </input>
                { !!task.validationErrors.colorStringUnderEdit.length && <ErrorsList 
                    errors={task.validationErrors.colorStringUnderEdit}
                    id={errorId}
                    {...{className: "max-width-height"}}
                />}
            </div>
        </div>
})

export const ColorBubble = observer(({
    passedTask,
    openColorPicker=true,
    buttonProps,
}: {
    passedTask?: TaskModel,
    openColorPicker?: boolean,
    buttonProps?: ComponentPropsWithoutRef<"button">,
}) => {
    const task = useTaskContextOrPassedTask(passedTask);

    const colorBubble = <svg 
            className="color-bubble" 
            viewBox="0 0 100 100" 
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="50" cy="50" r="50" fill={task.color}/>
        </svg>;

    return openColorPicker ? <AttachedPopupOnClick 
                renderElementToClick={(popupProps, ref) => <div
                    className="color-bubble-wrapper centered">
                    <button
                        {...popupProps.anchorProps}
                        {...buttonProps}
                        ref={ref}
                        className={combineClassNamePropAndString(
                            combineClassNamePropAndString("color-bubble-input", popupProps.anchorProps),
                            buttonProps
                        )} 
                        onClick={(e) => {
                            e.preventDefault();
                            popupProps.openPopup();
                        }}
                        title="Change task color"
                        // role="button"
                        // aria-label="Task color changer"
                        // aria-haspopup="dialog"
                        >
                    </button>
                    {colorBubble}
                    </div>}
                renderPopupContent={({closePopup}) => <ColorGridPicker 
                    task={task} 
                    closePicker={closePopup} 
                    {...{className: "max-width-height"}}
                    />}
                position={"positioned"} 
                placement={"bottom"}
            />
            : 
            colorBubble;
});
//#endregion 
//#region Title
/** Render a task title that cannot be edited.
 * If indicated by openTaskDetailPopup, will open details popup for that task on click.
 */
const PlainTaskTitle = observer((
    {
        passedTask,
        openTaskDetailPopup=true,
        ...props
    }: {
        passedTask?: TaskModel,
        openTaskDetailPopup?: boolean,
    }
) => {
    const [task, setTask] = useState(useTaskContextOrPassedTask(passedTask));
    const displayTitle = task.title ? task.title : UNSET_TASK_TITLE_PLACEHOLDER;

    let toReturn: ReactNode = <p 
        {...props}
    > 
        { task.complete ? <s>{displayTitle}</s> : displayTitle } 
    </p>;
    if (openTaskDetailPopup) {
        return <AnchorWithStandalonePopupAttached
                placement="right"
                alignment= "middle"
                draggable={true}
                useDragHandle={true}
                renderElementToClick={({openPopup, anchorProps}, ref) => <button
                        {...anchorProps}
                        onClick={(e) => {
                            anchorProps.onClick && anchorProps.onClick(e);
                            openPopup();
                        }}
                        title={"Open task details"}
                        ref={(node) => {assignForwardedRef(ref, node);}}
                    >
                        {toReturn}
                    </button>
                    }
            renderPopupContent={({closePopup, popupContainerProps}, ref) => 
                <TaskDetail 
                    task={task} 
                    closeWidget={closePopup}
                    containerProps={popupContainerProps}
                    ref={ref}
                />}
        />;
    }
    return toReturn;
});

/**
 *  Render a task title that can be edited on click.
 */
const EditableTaskTitle = observer(forwardRef<HTMLElement, {passedTask?: TaskModel}>((props, ref) => {
    const task = useTaskContextOrPassedTask(props.passedTask);
    const invalid = !!task.validationErrors.title.length;
    
    // Use input elements if editable to try and get a sort of inline effect
    const errorId = `detail-${task.id}-title-errors`;

    return <>
        <ResizableInput
            {...props}
            version="textarea"
            forwardedRef={(node) => assignForwardedRef(ref, node)}
            value={task.title}
            placeholder={UNSET_TASK_TITLE_PLACEHOLDER}
            aria-label={"Title"}
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : undefined}
            title={"Edit Title"}
            rows={1}
            onChange={(e) => {
                    let inputText = e.target.value;
                    task.title = inputText;
                    task.saveEdits("title");
            }}
        />
            {
                !!task.validationErrors.title.length && <ErrorsList
                errors={task.validationErrors.title}
                id={errorId}
                />
            }         
        </>
}));

/** Render a task title. Can make editable on click with editAllowed=true */
export const TaskTitle = observer((
    {
        passedTask, 
        editAllowed=false,
        ...props
    }: {
        passedTask?: TaskModel, 
        editAllowed?: boolean,
    } & ComponentPropsWithoutRef<any>) => {
    const task = useTaskContextOrPassedTask(passedTask);
    const overdue = task.overdue();

    const defaultColorLogic = !task.complete && !overdue && !!task.title.length ? task.color : undefined;
    const formattedProps: ComponentPropsWithoutRef<any> = {
        ...props,
        className: combineClassNamePropAndString(`title${overdue?" overdue":""}${!!!task.title.length?" blank":""}`, props),
        style: {
            color: defaultColorLogic,
            ...(props && props.style ? props.style: undefined),
        }
    };

    if (!editAllowed) {
        return <PlainTaskTitle 
            {...formattedProps}
        />;
    }
    return <EditableTaskTitle
        {...formattedProps}
    />
});

//#endregion 
//#region Description 
export const TaskDescription = observer(forwardRef<HTMLObjectElement, {
    passedTask?: TaskModel, 
    editAllowed?: boolean,
    autofocus?: boolean,
} >((props, ref) => {
    const task = useTaskContextOrPassedTask(props.passedTask);

    const propsToUse: ComponentPropsWithoutRef<any> = {
        className: `description dark-section keep-whitespace`,
        autoFocus: props.autofocus ?  props.autofocus : false,
    };

    return (props.editAllowed && props.editAllowed) 
        ? 
        <EditableTaskDescription 
            ref={(node: HTMLElement) => assignForwardedRef(ref, node)} 
            {...propsToUse} 
        /> 
        : 
        <div ref={(node) => assignForwardedRef(ref, node)} {...propsToUse}> 
            <p>{task.description}</p>      
        </div>
    }
));

const EditableTaskDescription = observer(forwardRef(({...props}: { passedTask?: TaskModel}, ref) => {
    const task = useTaskContextOrPassedTask(props.passedTask);
    const invalid = !!task.validationErrors.description.length;
    const startingText: MutableRefObject<string> = useRef(task.description);
    
    // Use input elements if editable to try and get a sort of inline effect
    const editInputRef: MutableRefObject<HTMLElement | null> = useRef(null);
    const errorId = useId();
    const finishEditing = () => {
        if (task.description !== startingText.current) {
            const edits = task.saveEdits("description");
            edits && edits.then(() => {
                startingText.current = task.description;
            })
        }
    }

    useEffect(() => {
        editInputRef && editInputRef.current ? (editInputRef.current as HTMLElement).focus():null;
    }, [])

    return <>
        <ResizableInput 
            version="textarea"
            value={task.description}
            aria-label={"Description"}
            title={"Edit Description"}
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : undefined}
            onChange={(e) => task.description = e.target.value}
            onBlur={finishEditing}
            {...props}
            ref={(node: HTMLElement) => {
                assignForwardedRef(editInputRef, node);
                assignForwardedRef(ref, node);

            }}
        
        />
        { invalid && <ErrorsList
            errors={task.validationErrors.description}
            id={errorId}
        />
        }
    </>
}));
//#endregion 
//#region Date / Time
export const TaskDueDate = observer(({
    format,
    passedTask,
    editable,
} : {
    format: DateFormat,
    passedTask?: TaskModel,
    editable?: boolean,
}) => {
    const task = useTaskContextOrPassedTask(passedTask);

    return <TaskDate 
        type={TASK_CHECKBOX_STYLES.due}
        passedTask={task}
        editable={editable}
    />
})

export const TaskStartDate = observer(({
    format,
    passedTask,
    editable,
} : {
    format: DateFormat,
    passedTask?: TaskModel,
    editable?: boolean,

}) => {
    const task = useTaskContextOrPassedTask(passedTask);
    return <TaskDate 
        type={TASK_CHECKBOX_STYLES.start}
        passedTask={task}
        editable={editable}
    />
})

/**
 * Displays the date and time for a task
 * 
 */
export const TaskDate = observer(({
    passedTask, 
    type, 
    editable=false,
}: {
    type: AcceptedTaskCheckboxStyles, 
    passedTask?: TaskModel, 
    editable?: boolean
}) => {
    const dueType = TASK_CHECKBOX_STYLES.due;
    const task = useTaskContextOrPassedTask(passedTask);
    const isDueType = type === dueType;
    const overdue = isDueType && task.overdue();
    const wrapperClasses = `date-time-wrapper`;
    if (editable) {
        return <EditableTaskDate 
            task={task}
            isDueType={isDueType}
            wrapperClasses={wrapperClasses}
            type={type}
        />
    }
    return <PlainTaskDate 
        task={task}
        isDueType={isDueType}
        wrapperClasses={wrapperClasses}
    />;
});

type DateImplementationParams = {
    task: TaskModel,
    wrapperClasses: string,
    isDueType: boolean,
}

const PlainTaskDate = observer(({
    task, 
    wrapperClasses, 
    isDueType,
}: DateImplementationParams) => {
    const date = isDueType ? task.due : task.start;
    return date ? <time dateTime={date.toISO() as string} className={wrapperClasses} suppressHydrationWarning > 
        <p className="date">{date.toLocaleString(PARTIAL_DATETIME_FORMATS.D.token)}</p>
        <p className="time">{date.toLocaleString(PARTIAL_DATETIME_FORMATS.t.token)}</p>
    </time> : <></>
});


const EditableTaskDate = observer(({
    task, 
    isDueType,
    type,
    wrapperClasses,
}: DateImplementationParams & {type: "start" | "due"}) => {
    const dateField = isDueType ? task.due : task.start;
    const startingDate = useRef(dateField);
    const workIntervalErrorListId = useId();

    return <div className={`${wrapperClasses}`}>
        <EditableDatePortion
            type={type}
            task={task}
            isDueType={isDueType}
            dateField={dateField}
            startingDate={startingDate}
        />
        <EditableTimePortion 
            type={type}
            task={task}
            isDueType={isDueType}
            dateField={dateField}
            startingDate={startingDate}
        />
        { task.validationErrors.workInterval.length > 0 && 
            <ErrorsList errors={task.validationErrors.workInterval} id={workIntervalErrorListId}/> 
        }
    </div>
});

const EditableDatePortion = observer(({
    task,
    isDueType,
    dateField,
    startingDate,
    type,
}: {
    task: TaskModel,
    isDueType: boolean,
    dateField: DateTime<boolean> | null,
    startingDate: MutableRefObject<DateTime<boolean> | null>,
    type: "due" | "start",
}) => {
    const dateStringUnderEdit = isDueType ? task.due?.toFormat("yyyy-mm-dd") : task.start?.toFormat("yyyy-mm-dd");
    const dateErrors = (isDueType ? task.validationErrors.dueDateStringUnderEdit : task.validationErrors.startDateStringUnderEdit).concat(task.validationErrors.workInterval);
    const updateTaskDate = isDueType ? (val: string) => {task.dueDateStringUnderEdit = val} : (val: string) => {task.startDateStringUnderEdit = val};
    const dateErrorListId = useId();

    return <label
        className="date aligned rows small gap"
    >
        Date
        <ResizableInput 
            version="input"
            type="date"
            width="narrow"
            aria-invalid={dateErrors.length !== 0} 
            value={dateStringUnderEdit}
            // aria-describedby={dateErrorListId}
            // aria-label={`${type} date`}
            // placeholder="date e.g. 7/6/2024"
            onChange={(e) => {
                if (e.target) {
                    updateTaskDate(e.target.value);
                }
            }}
            onBlur={(e) => {
                if (dateField !== startingDate.current && task.isValid) {
                    task.saveEdits(type);
                }
            }}
        />
        {/* { dateErrors.length > 0 && 
            <ErrorsList errors={dateErrors} id={dateErrorListId}/> 
        } */}
    </label>
})

const EditableTimePortion = observer(({
    task,
    isDueType,
    dateField,
    startingDate,
    type,
}: {
    task: TaskModel,
    isDueType: boolean,
    dateField: DateTime<boolean> | null,
    startingDate: MutableRefObject<DateTime<boolean> | null>,
    type: "due" | "start",
}) => {
    const showTime = isDueType ? task.showDueTime : task.showStartTime;
    const timeInputRef: MutableRefObject<HTMLInputElement | null> = useRef(null); 
    const [timeHovered, setTimeHovered] = useState(false);
    const datetime = isDueType ? task.due : task.start;
    const timeStringUnderEdit = isDueType ? task.dueTimeStringUnderEdit : task.startTimeStringUnderEdit;
    const timeErrors = isDueType ? task.validationErrors.dueTimeStringUnderEdit : task.validationErrors.startTimeStringUnderEdit;
    const timeErrorListId = useId();
    const updateTaskTime = isDueType ? (val: string) => {task.dueTimeStringUnderEdit = val;} : (val: string) => {task.startTimeStringUnderEdit = val;};
    const setShowTaskTime = isDueType ? (val: boolean) => {
        task.showDueTime = val;
        task.saveEdits("showDueTime");
    } : (val: boolean) => {
        task.showStartTime = val;
        task.saveEdits("showStartTime");
    };

    return showTime ? <div 
        className={`aligned rows small gap relative centered`}
        onMouseEnter={() => {
            setTimeHovered(true)}}
        onMouseLeave={() => {
            setTimeHovered(false)}}
        >
            <label
                className="time aligned rows small gap" 
                >
                    Time
                    <div className={`aligned `}>
                        <ResizableInput
                            version="input"
                            width="narrow"
                            type="time"
                            // Value in 24 hour time string for time input to translate it into whatever the user has set.
                            value={datetime?.toLocaleString(DateTime.TIME_24_SIMPLE)} 
                            onChange={(e) => {
                                updateTaskTime(e.target.value);
                            }}
                            aria-invalid={timeErrors.concat(task.validationErrors.workInterval).length !== 0} 
                            onFocus={() => { setTimeHovered(true) }}
                            onBlur={(e) => {
                                setTimeHovered(false);
                                if (startingDate && dateField !== startingDate.current) {
                                    task.saveEdits(type);
                                }
                                else {
                                    task.abortEdits(type);
                                }
                            }}
                        />
                        <ClearTaskFieldButton 
                            fieldName={`${type} time`}
                            onClick={() => {
                                setShowTaskTime(false);
                            }}
                            {...{className: `right appear-on-hover${timeHovered ? " hover":""}`}}
                            />
                    </div>
                    { timeErrors.length > 0 && 
                        <ErrorsList errors={timeErrors} id={timeErrorListId}/>
                    } 
                </label> 
            </div>
            : <button 
            className="btn small text" 
            style={{
                color: "inherit"
            }}
            onClick={() => {setShowTaskTime(true);}}
            >
                Add time
            </button> 
})
//#endregion 