import { ErrorsList, ResizableInput } from "@util/FormComponents";
import { 
    TaskColorCodes, 
    TaskContext,
    TaskDateFields,
    TaskModel,
} from "@/store/tasks/TaskModel";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";
import { 
    ChangeEvent,
    ComponentPropsWithoutRef, 
    FormEvent, 
    ForwardedRef, 
    forwardRef, 
    ForwardRefRenderFunction, 
    MouseEvent, 
    MutableRefObject, 
    ReactNode, 
    Ref, 
    useCallback, 
    useContext, 
    useEffect, 
    useId, 
    useRef, 
    useState, 
} from "react";
import TaskDetail from "./TaskDetail";
import { 
    ALIGNED_CLASS, 
    CENTERED_CLASS, 
    DARK_SECTION_CLASS, 
    DATE_CLASS,  
    ROWS_CLASS, 
    ROWS_OR_COLS_WITH_SPACE_BETWEEN_CLASS, 
    ROWS_OR_COLS_WITH_GAP_CLASS, 
    ICONS, 
    MID_SECTION_CLASS, 
    RELATIVE_CLASS, 
    TIME_CLASS, 
    UNSET_TASK_TITLE_PLACEHOLDER,
    TAKE_FULL_SPACE_CLASS,
} from "@util/constants";
import { combineClassNamePropAndString } from '@util/jsTools';
import { AnchorWithPersistentPopupAttached, AttachedPopupOnClick, PopupRenderMethod } from "@/util/Popup";
import './tasks.css';
import { 
    DateFormat, 
    DraggedDatePresentation, 
    PARTIAL_DATETIME_FORMATS
 } from "@/util/DateTimeHelper";
import { DraggableContext } from "@/app/3rd-party/DndKit";
import { Draggable, Droppable, INTERACTABLE_ELEMENT_CLASS } from "@/app/@util/Draggable";
import { useMergeRefs } from "@floating-ui/react";
import { PersistentPopupContext } from "@/app/3rd-party/FloatingUiHelpers";
import { 
    DATE_DRAG_TYPE, 
    DATE_FIELD_DRAG_TYPE, 
    DEFAULT_DATE_FIELD_DRAG_DATA, 
    DEFAULT_TASK_DRAG_DATA, 
    DELETE_DRAG_TYPE, 
    TASK_DRAG_TYPE, 
    DateFieldDropData, 
    TaskDropData,
    DateFieldDragData,
    defaultTaskDeleteInteraction,
    defaultChangeTaskFieldToEndOrStartOfDay,
    defaultTaskDateClearInteraction,
    defaultChangeTaskFieldToDate,
} from "@/app/@util/DraggableTypes";

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
    type?: TaskDateFields,
}, ref: ForwardedRef<any>) => {
    const t = useTaskContextOrPassedTask(task);
    if (!t) {
        return;
    }

    return <TaskWrapper
        droppable={false}
        {...props}
        className={combineClassNamePropAndString(`dragging ${CENTERED_CLASS} ${ROWS_CLASS} ${ROWS_OR_COLS_WITH_GAP_CLASS}`, props)}
        task={t}
        ref={ref}
    >
        <Checkbox 
            type={type ? type : "due" }
        />
        <TaskTitle/>
    </TaskWrapper>
}));


/**
 * Render a persistent popup that will ask if the user wants to delete the selected task.
 * The task is passed by passing it in a callback method getTask to openPopup callback
 * in the anchorRenderMethod
 */
export const DeleteTaskConfirmationPopup = observer(forwardRef(({
        renderAnchor
    }: {
        renderAnchor: ForwardRefRenderFunction<HTMLButtonElement, {
            openPopup: (getTask: () => TaskModel) => void;
            anchorProps: ComponentPropsWithoutRef<any>;
        }>
    }, forwardedAnchorRef) => {
    const [taskToDelete, setTaskToDelete] = useState<null | TaskModel>(null);
    const { setPopupProps } = useContext(PersistentPopupContext);

    // When the task here changes, set a new popup render method to reflect it
    useEffect(() => {
        if (taskToDelete) {
            setPopupProps((prev)=> {
                return {
                    ...prev,
                    popupRenderMethod: getPopupContent,
                }
            })
        }
    }, [taskToDelete])

    const getPopupContent: PopupRenderMethod = ({closePopup}, ref) => {
        return taskToDelete ? <section 
            className={`${MID_SECTION_CLASS} confirmation`}
            ref={ref}
        >
            <p>Are you sure you want to delete this task?</p>
            <br />
            { taskToDelete && <TaskTitle passedTask={taskToDelete} className={CENTERED_CLASS}/> }
            <br />
            <div className={`${ROWS_CLASS} ${ROWS_OR_COLS_WITH_GAP_CLASS} ${CENTERED_CLASS}`}>
                <button 
                    className={"btn med"} 
                    onClick={ () => {closePopup()} }
                >
                    Cancel
                </button>
                <button 
                    className={"btn med bg"} 
                    type={"submit"} 
                    onClick={() => {
                        if (taskToDelete) {
                            taskToDelete.deleteSelf();
                        }
                        closePopup();
                    }}
                >
                    Delete
                </button>
            </div>
        </section> : <></>}

    return <AnchorWithPersistentPopupAttached 
        anchorRenderMethod={({anchorProps, openPopup}, ref) => renderAnchor({
                anchorProps,
                // Make the callback for after the popup is opened setting the task for the popup data
                openPopup: (getTask: () => TaskModel) => {
                    const passedTask = getTask ? getTask() : null;
                    setTaskToDelete(passedTask);
                    openPopup();
                },
            }, ref)
        }
        popupRenderMethod={(props, ref) => getPopupContent(props, ref)}
    />
}));

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
    } & ComponentPropsWithoutRef<"div">, forwardedRef: ForwardedRef<HTMLDivElement>) => {

    const dragContext = useContext(DraggableContext);

    let renderTaskWrapper: ForwardRefRenderFunction<HTMLDivElement, ComponentPropsWithoutRef<"div">> = (props, ref) => <div 
        {...props}
        ref={ref}
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
            `${TASK_WRAPPER_CLASS}
            ${task.complete ? " complete" : ""}
            ${task.overdue ? " overdue" : ""}
            ${highlightable && task.highlighted ? " highlighted" : ""}
            ${task.isValid ? "" : " error"}`, 
            props
        )}
    >
        {children}
    </div>;

    const mightBeDroppable = 
        droppable ? 
            <DeleteTaskConfirmationPopup 
                renderAnchor={({openPopup: openDeleteConfirmPopup, anchorProps: deleteConfirmPopupAnchorProps}, deleteConfirmPopupAnchorRef) => 
                    <Droppable <TaskDropData>
                        itemData={{
                            type: TASK_DRAG_TYPE,
                            id: task.id,
                            accepts: DEFAULT_TASK_DRAG_DATA.accepts,
                        }}
                        callbacksForAcceptedDragTypes={{
                            [DELETE_DRAG_TYPE]: { 
                                saveDataWhenDragEnds({drag, drop, e}) {
                                    // defaultTypeInteractionSave && defaultTypeInteractionSave({DeleteData: drop, TaskData: drag, task, openDeleteConfirmPopup});
                                    defaultTaskDeleteInteraction.save && defaultTaskDeleteInteraction.save(drop, drag, {task, openDeleteConfirmPopup})
                                },
                            },
                        }}
                        > 
                            { renderTaskWrapper({
                                ...props,
                                ...deleteConfirmPopupAnchorProps,
                                ...(props.className && deleteConfirmPopupAnchorProps.className && {className: combineClassNamePropAndString(props.className, deleteConfirmPopupAnchorProps)})
                            }, 
                            deleteConfirmPopupAnchorRef as ForwardedRef<HTMLDivElement>)
                            }
                    </Droppable>
                }
            />
        : 
        renderTaskWrapper(props, forwardedRef);

    return <TaskContext.Provider value={task}>
        { mightBeDroppable }
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
            className={`${ROWS_CLASS} ${ROWS_OR_COLS_WITH_SPACE_BETWEEN_CLASS}`}
        >
            { labelElement }
            <div className="field-btns">
                { optional && 
                    <ClearTaskFieldButton fieldName={fieldName} onClick={onCloseClick} {...{className: hovered ? "hover" : ""}}/>
                }
            </div>
        </div>
        <div className={DARK_SECTION_CLASS}>
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
    type: TaskDateFields, 
    passedTask?: TaskModel, 
    checkboxId?: string
}) => {
    const task = useTaskContextOrPassedTask(passedTask);

    const id = checkboxId ? checkboxId : useId();
    const text = `Mark task ${task.complete ? "incomplete" : "complete"}`;
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
        <TaskCheckbox passedTask={task} type={type} /> 
    </label>;
});

const TaskCheckbox = observer(({
    passedTask, 
    type
}: {
    passedTask?: TaskModel, 
    type: TaskDateFields,
}) => {
    const task = useTaskContextOrPassedTask(passedTask);
    const styleText = !task.complete ? {color: task.color} : {};
    let checkboxIcon;
    switch (type) {
        case "due":
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
const ColorGridPicker = observer(forwardRef<any, {
    task: TaskModel, 
    closePicker: () => void, 
    props?: ComponentPropsWithoutRef<any>
}>(({task, closePicker, ...props}, forwardedRef) => {
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
            ref={forwardedRef}
            {...props}
            onMouseLeave={() => task.color = startingTaskColor.current}
            className={combineClassNamePropAndString("color-picker", props)}
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
}))

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
                anchorRenderMethod={({anchorProps, openPopup}, ref) => <div
                    className={`color-bubble-wrapper ${CENTERED_CLASS}`}>
                    <button
                        {...anchorProps}
                        {...buttonProps}
                        ref={ref}
                        className={combineClassNamePropAndString(
                            combineClassNamePropAndString("color-bubble-input", anchorProps),
                            buttonProps
                        )} 
                        onClick={(e) => {
                            e.preventDefault();
                            openPopup();
                        }}
                        title="Change task color"
                        // role="button"
                        // aria-label="Task color changer"
                        // aria-haspopup="dialog"
                        >
                    </button>
                    {colorBubble}
                    </div>}
                popupRenderMethod={({closePopup}, ref) => <ColorGridPicker 
                    ref={ref}
                    task={task} 
                    closePicker={closePopup} 
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
const PlainTaskTitle = observer(forwardRef<HTMLTextAreaElement, {
        passedTask?: TaskModel,
        openTaskDetailPopup?: boolean,
    } & ComponentPropsWithoutRef<any>>((
    {
        passedTask,
        openTaskDetailPopup=true,
        ...props
    }, ref
) => {
    const [task] = useState(useTaskContextOrPassedTask(passedTask));
    const displayTitle = task.title ? task.title : UNSET_TASK_TITLE_PLACEHOLDER;
    const popupForwardedRef = useRef<HTMLElement | null>(null);
    const mergedRef = useMergeRefs([popupForwardedRef, ref]);

    let toReturn: ReactNode = <p 
        {...props}
    > 
        { task.complete ? <s>{displayTitle}</s> : displayTitle } 
    </p>;

    if (openTaskDetailPopup) {
        return <AnchorWithPersistentPopupAttached
                closeWhenClickOutside={false}
                alignment="middle"
                placement="auto"
                popupMargin={10}
                draggable={true}
                useDragHandle={true}
                anchorRenderMethod={({openPopup, anchorProps}, ref) => <button
                        {...props}
                        {...anchorProps}
                        className={combineClassNamePropAndString(props.className, anchorProps)}
                        onClick={(e) => {
                            anchorProps.onClick && anchorProps.onClick(e);
                            openPopup();
                        }}
                        title={"Open task details"}
                        ref={ref}
                    >
                        {toReturn}
                    </button>
                    }
            popupRenderMethod={({closePopup}, ref) => {
                if (ref) {
                    popupForwardedRef.current = (ref as MutableRefObject<any>).current;
                }
                return <TaskDetail 
                        task={task} 
                        closeWidget={closePopup}
                        ref={mergedRef}
                />}
            }
        />;
    }
    return toReturn;
}));

/**
 *  Render a task title that can be edited on click.
 */
const EditableTaskTitle = observer(forwardRef<HTMLTextAreaElement, {passedTask?: TaskModel}>(({passedTask, ...props}, ref) => {
    const task = useTaskContextOrPassedTask(passedTask);
    const invalid = !!task.validationErrors.title.length;
    const input = useRef<null | HTMLTextAreaElement>(null);
    const inputRef = useMergeRefs([ref, input]) as Ref<HTMLTextAreaElement> as MutableRefObject<HTMLTextAreaElement>;
    
    // Use input elements if editable to try and get a sort of inline effect
    const errorId = `detail-${task.id}-title-errors`;

    return <>
    <ResizableInput
            {...props}
            version="textarea"
            ref={inputRef}
            value={task.title}
            placeholder={UNSET_TASK_TITLE_PLACEHOLDER}
            aria-label={"Title"}
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : undefined}
            title={"Edit Title"}
            rows={1}
            onBeforeInputCapture={(e: FormEvent<HTMLTextAreaElement>) => {
                if ((e.nativeEvent as InputEvent).data === `\n`) {
                    input && input.current && input.current.blur();
                }
            }}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                let inputText = e.target.value;
                if (!inputText.endsWith(`\n`)) {
                    task.title = inputText;
                    task.saveEdits("title");
                }
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
export const TaskTitle = observer(forwardRef<HTMLTextAreaElement, {
        passedTask?: TaskModel, 
        editAllowed?: boolean,
    } & ComponentPropsWithoutRef<any>>((
    {
        passedTask, 
        editAllowed=false,
        ...props
    }, ref) => {
    const task = useTaskContextOrPassedTask(passedTask);
    const overdue = task.overdue;

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
            ref={ref}
            passedTask={task}
        />;
    }
    return <EditableTaskTitle
            {...formattedProps}
            passedTask={task}
            ref={ref}
    />
}));

//#endregion 
//#region Description 
export const TaskDescription = observer(forwardRef<HTMLObjectElement, {
    passedTask?: TaskModel, 
    editAllowed?: boolean,
}>((props, ref) => {
    const task = useTaskContextOrPassedTask(props.passedTask);

    const propsToUse: ComponentPropsWithoutRef<any> = {
        className: `description ${DARK_SECTION_CLASS} keep-whitespace`,
    };

    return (props.editAllowed && props.editAllowed) 
        ? 
        <EditableTaskDescription 
            ref={ref} 
            {...propsToUse} 
        /> 
        : 
        <div ref={ref} {...propsToUse}> 
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

    return <>
        <ResizableInput 
            version="textarea"
            value={task.description}
            aria-label={"Description"}
            title={"Edit Description"}
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : undefined}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => task.description = e.target.value}
            onBlur={finishEditing}
            {...props}
            ref={useMergeRefs([editInputRef, ref])}
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
type TaskDateParams = {
    droppable?: boolean,
    format?: DateFormat,
    passedTask?: TaskModel,
    editable?: boolean,
}

export const TaskDueDate = observer(({
    format,
    passedTask,
    editable,
    droppable,
    ...props
} : TaskDateParams) => {
    const task = useTaskContextOrPassedTask(passedTask);
    return <TaskDate 
        {...props} 
        { ...(droppable === undefined && editable && { droppable: true })}
        type={"due"}
        passedTask={task}
        editable={editable}
    />
})

export const TaskStartDate = observer(({
    format,
    passedTask,
    editable,
    droppable,
    ...props
} : TaskDateParams) => {
    const task = useTaskContextOrPassedTask(passedTask);
    return <TaskDate
        {...props} 
        { ...(droppable === undefined && editable && { droppable: true })}
        type={"start"}
        passedTask={task}
        editable={editable}
    />
})

/**
 * Displays the date and time for a task
 * 
 */
export const TaskDate = observer(({
    type, 
    passedTask,
    droppable=false,
    editable=false,
}: {
    type: TaskDateFields, 
    editable?: boolean,
    droppable?: boolean,
} & TaskDateParams) => {
    const task = useTaskContextOrPassedTask(passedTask);
    const wrapperClasses = `date-time-wrapper`;
    if (editable) {
        return <EditableTaskDate 
            droppable={droppable}
            task={task}
            wrapperClasses={wrapperClasses}
            type={type}
        />
    }
    return <PlainTaskDate 
        task={task}
        wrapperClasses={wrapperClasses}
        type={type}
    />;

});

type DateImplementationParams = {
    task: TaskModel,
    wrapperClasses: string,
    type: TaskDateFields,
}

const PlainTaskDate = observer(({
    task, 
    wrapperClasses, 
    type,
}: DateImplementationParams) => {
    const date = type === "due" ? task.due : task.start;
    const showTime = type === "due" ? task.showDueTime : task.showStartTime;
    return date ? <time dateTime={date.toISO() as string} className={wrapperClasses} suppressHydrationWarning > 
        <p className={DATE_CLASS}>{date.toLocaleString(PARTIAL_DATETIME_FORMATS.D.token)}</p>
        {showTime && <p className={TIME_CLASS}>{date.toLocaleString(PARTIAL_DATETIME_FORMATS.t.token)}</p>}
    </time> : <></>
});


const EditableTaskDate = observer(({
    droppable=true,
    draggable=true,
    task, 
    type,
    wrapperClasses,
}: DateImplementationParams & {
    droppable?: boolean,
    draggable?: boolean,
}) => {
    const dateField = type === "due" ? task.due : task.start;
    const startingDate = useRef(dateField);

    const content = <div className={`${wrapperClasses}`}>
        <EditableDatePortion
            type={type}
            task={task}
            startingDate={startingDate}
            wrapperClasses={wrapperClasses}
        />
        <EditableTimePortion 
            type={type}
            task={task}
            startingDate={startingDate}
            wrapperClasses={wrapperClasses}

        />
    </div>
    
    const sharedDragDropProps = {
        type: DATE_FIELD_DRAG_TYPE,
        fieldType: type, 
        taskId: task.id,
        date: dateField as DateTime<boolean>,
        showDropPreview: true,
    }

    const resetDate = () => {
        if (type === "start") {
            task.start = startingDate.current;  
        } else {
            task.due = startingDate.current;
        }
    }

    const draggedPresentation = <DraggedDatePresentation date={dateField} includeTime={!!dateField && dateField.hour !== 0 && dateField.minute !== 0} />
    const maybeDraggable = draggable ? <Draggable <DateFieldDragData>
        actionTitle="Drag date"
        mayBeDropped={true}
        itemData={sharedDragDropProps}
        draggedPresentation={draggedPresentation}
    >
        {content}
    </Draggable>: content;
    
    return droppable ? 
        <Droppable<DateFieldDropData>
            itemData={{
                ...sharedDragDropProps,
                accepts: DEFAULT_DATE_FIELD_DRAG_DATA.accepts,
            }}
            className={`${TAKE_FULL_SPACE_CLASS}`}
            callbacksForAcceptedDragTypes={{
                [DATE_DRAG_TYPE]: {
                    setDataWhenDragOver({ drag, drop }) {
                        defaultChangeTaskFieldToEndOrStartOfDay.set && defaultChangeTaskFieldToEndOrStartOfDay.set(drag, drop, {task});
                    },
                    resetDataWhenDragOff({ drop }) {
                        if (startingDate.current !== dateField && (!drop || drop.taskId !== task.id) ) {
                            // If date is not over the droppable area, revert to the starting date time
                            resetDate();
                        }
                    },
                }, 
                [DELETE_DRAG_TYPE]: {
                    setDataWhenDragOver({ drag, drop }) {
                        defaultTaskDateClearInteraction.set && defaultTaskDateClearInteraction.set(drag, drop, {task})
                    },
                }, 
                [DATE_FIELD_DRAG_TYPE]: {
                    setDataWhenDragOver({ drag, drop }) {
                        defaultChangeTaskFieldToDate.set && defaultChangeTaskFieldToDate.set(drag, drop, {task});
                    },
                    resetDataWhenDragOff({drag, drop}) {
                        defaultChangeTaskFieldToDate.reset && defaultChangeTaskFieldToDate.reset(drag, drop, {task});
                    },
                },
            }}
        >
            {maybeDraggable}
        </Droppable>
    : content;
});

const EditableDatePortion = observer(({
    task,
    startingDate,
    type,
}: DateImplementationParams & {
    startingDate: MutableRefObject<DateTime<boolean> | null>,
}) => {
    const isDueType = type === "due";
    const currentlySetDateTime = isDueType ? task.due : task.start;
    const dateErrors = (isDueType ? task.validationErrors.due : task.validationErrors.start).concat(task.validationErrors.workInterval);
    const updateTaskDate = isDueType ? (val: DateTime) => {     
            task.due = val;} 
        : (val: DateTime) => {
            task.start = val;
    };
    const dateErrorListId = useId();

    return <label
        className={`${DATE_CLASS} ${ALIGNED_CLASS} ${ROWS_CLASS} ${ROWS_OR_COLS_WITH_GAP_CLASS} small`}
    >
        Date
        <ResizableInput 
            version="input"
            type="date"
            aria-invalid={dateErrors.length !== 0} 
            { ...(currentlySetDateTime && {value: currentlySetDateTime.toFormat("yyyy-MM-dd")})}
            aria-describedby={dateErrorListId}
            // aria-label={`${type} date`}
            // placeholder="date e.g. 7/6/2024"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                if (e.target) {
                    // Get the date portion from the editable date box and set the time from the existing task DateTime
                    const day = DateTime.fromMillis(e.target.valueAsNumber).plus({day: 1});
                    const dateTime = currentlySetDateTime ? day.set({hour: currentlySetDateTime.hour, minute: currentlySetDateTime.minute, second: currentlySetDateTime.second}) : day;
                    if (dateTime) {
                        updateTaskDate(dateTime);
                        if (dateTime !== startingDate.current && task.isValid) {
                            task.saveEdits(type);
                        }
                    }
                }
            }}
        />
        { dateErrors.length > 0 && 
            <ErrorsList errors={dateErrors} id={dateErrorListId}/> 
        }
    </label>
})

const EditableTimePortion = observer(({
    task,
    startingDate,
    type,
}: DateImplementationParams & {
    startingDate: MutableRefObject<DateTime<boolean> | null>,
}) => {
    const isDueType = type === "due";
    const dateField = isDueType ? task.due : task.start; 
    const showTime = isDueType ? task.showDueTime : task.showStartTime;
    const [timeHovered, setTimeHovered] = useState(false);
    const updateTaskTime = isDueType ? (val: DateTime) => {
        task.due = val;
    } : (val: DateTime) => {
        task.start = val;
    };
    const setShowTaskTime = isDueType ? (val: boolean) => {
        task.showDueTime = val;
        task.saveEdits("showDueTime");
    } : (val: boolean) => {
        task.showStartTime = val;
        task.saveEdits("showStartTime");
    };

    return showTime ? <div 
        className={`${ALIGNED_CLASS} ${ROWS_CLASS} ${ROWS_OR_COLS_WITH_GAP_CLASS} small ${RELATIVE_CLASS} ${CENTERED_CLASS}`}
        onMouseEnter={() => {
            setTimeHovered(true)}}
        onMouseLeave={() => {
            setTimeHovered(false)}}
        >
            <label
                className={`${TIME_CLASS} ${ALIGNED_CLASS} ${ROWS_CLASS} ${ROWS_OR_COLS_WITH_GAP_CLASS} small`} 
                >
                    Time
                    <div className={ALIGNED_CLASS}>
                        <ResizableInput
                            version="input"
                            type="time"
                            // Value in 24 hour time string for time input to translate it into whatever the user has set.
                            value={(isDueType ? task.due : task.start)?.toLocaleString(DateTime.TIME_24_SIMPLE)} 
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const dateTime = DateTime.fromMillis((new Date(`${dateField?.toFormat("yyyy-MM-dd")}T${e.target.value}:00`).valueOf()));
                                updateTaskTime(dateTime);
                                if (startingDate && dateTime !== startingDate.current) {
                                    task.saveEdits(type);
                                }
                                else {
                                    task.abortEdits(type);
                                }
                            }}
                            onFocus={() => { setTimeHovered(true) }}
                            onBlur={(e: ChangeEvent<HTMLInputElement>) => {
                                setTimeHovered(false);
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