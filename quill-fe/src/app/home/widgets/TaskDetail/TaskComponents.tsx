import { ErrorsList, ResizableInput } from "@/app/util/FormComponents";
import Loading from "./loading.js";
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
    LegacyRef, 
    MouseEvent, 
    MutableRefObject, 
    ReactNode, 
    Ref, 
    Suspense, 
    useCallback, 
    useContext, 
    useId, 
    useRef, 
    useState, 
} from "react";
import TaskDetail, { TASK_DETAIL_POPUP_CLASS } from "./TaskDetail";
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
    POPUP_SMALL_CLASS,
    PADDING_CLASS,
    LOADING_CLASS,
} from "@/app/util/constants";
import { mergeRefs, combineClassNamePropAndString } from '@/app/util/jsTools';
import { AnchorRenderMethod, AnchorWithPersistentPopupAttached, AttachedPopupOnClick } from "@/app/util/Popup";
import './tasks.css';
import { 
    DateFormat, 
    DraggedDatePresentation, 
    PARTIAL_DATETIME_FORMATS
 } from "@/app/util/DateTimeHelper";
import { Draggable, DraggableParams, Droppable, DroppableParams, DroppableRenderMethod, INTERACTABLE_ELEMENT_CLASS } from "@/app/util/Draggable";
import { useMergeRefs } from "@floating-ui/react";
import { 
    DATE_DRAGDROP_TYPE, 
    DATE_FIELD_DRAGDROP_TYPE, 
    DEFAULT_DATE_FIELD_DRAG_DATA, 
    DEFAULT_TASK_DRAG_DATA, 
    DELETE_DRAGDROP_TYPE, 
    TASK_DRAGDROP_TYPE, 
    DateFieldDropData, 
    TaskDropData,
    DateFieldDragData,
    defaultTaskDeleteInteraction,
    defaultChangeTaskFieldToEndOrStartOfDay,
    defaultTaskDateClearInteraction,
    defaultChangeTaskFieldToDate,
} from "@/app/util/DraggableTypes";
import { DraggableContext } from "@/app/3rd-party/DndKit";
import { useTaskStore } from "../../_globalStore/StoreProvider";

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
export const DeleteTaskConfirmationPopup = observer(({
        renderAnchor
    }: {
        renderAnchor : AnchorRenderMethod
    }) => {
    const [taskToDelete, setTaskToDelete] = useState<null | TaskModel>(null);
    // const { setPersistentPopupContent } = useContext(PersistentPopupContext);

    // When the task here changes, set a new popup render method to reflect it
    // useEffect(() => {
    //     if (taskToDelete) {
    //         setPersistentPopupContent(getPopupContent())
    //     }
    // }, [taskToDelete])
    return <AnchorWithPersistentPopupAttached 
        anchorRenderMethod={({openPopup, ...props}, ref) => renderAnchor({
                ...props,
                // Make the callback for after the popup is opened setting the task for the popup data
                openPopup: (getTask: () => TaskModel) => {
                    const passedTask = getTask ? getTask() : null;
                    setTaskToDelete(passedTask);
                    openPopup();
                },
            }, ref)
        }
        popupRenderMethod={({closePopup, ...popupProps}, ref) => {
            return taskToDelete ? <section 
                ref={ref}
                {...popupProps}
                className={combineClassNamePropAndString(`${MID_SECTION_CLASS} confirmation`, popupProps)}
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
            </section> : <></>
        }}
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
    } & ComponentPropsWithoutRef<"div">, forwardedTaskWrapperRef: ForwardedRef<HTMLDivElement>) => {

    const dragContext = useContext(DraggableContext);

    let renderTaskWrapper: ForwardRefRenderFunction<HTMLDivElement, ComponentPropsWithoutRef<"div">> = (props, ref) => <div 
        {...props}
        ref={ref}
        key={keyOverride ? keyOverride : `wrapper-${task.id}`}
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
            // Task wrapper is drop container for task deletion
            <DeleteTaskConfirmationPopup 
                renderAnchor={({openPopup: openDeleteConfirmPopup, ...deleteConfirmPopupAnchorProps}, deleteConfirmPopupAnchorRef) => 
                    <DroppableRenderMethod <TaskDropData>
                        itemData={{
                            showDropPreview: true,
                            type: TASK_DRAGDROP_TYPE,
                            id: task.id,
                            accepts: DEFAULT_TASK_DRAG_DATA.accepts,
                        }}
                        callbacksForAcceptedDragTypes={{
                            [DELETE_DRAGDROP_TYPE]: { 
                                saveDataWhenDragEnds({drag, drop}) {
                                    drag && drop && defaultTaskDeleteInteraction.save 
                                    && defaultTaskDeleteInteraction.save({task, openDeleteConfirmPopup, drag, drop})
                                },
                                resetDataWhenDragOff({ drag, drop, e }) {
                                    drag && drop && defaultTaskDeleteInteraction.reset 
                                    && defaultTaskDeleteInteraction.reset({task, openDeleteConfirmPopup, drag, drop})
                                },
                                setDataWhenDragOver({ drag, drop, e }) {
                                    drag && drop && defaultTaskDeleteInteraction.set 
                                    && defaultTaskDeleteInteraction.set({task, openDeleteConfirmPopup, drag, drop})
                                },
                            },
                        }}
                        {...props}
                        // merge refs not working here
                        // ref={mergeRefs(deleteConfirmPopupAnchorRef, forwardedTaskWrapperRef)}
                        ref={forwardedTaskWrapperRef}
                        render={(props, ref) => renderTaskWrapper({
                                ...props,
                                ...deleteConfirmPopupAnchorProps,
                                ...(props.className && deleteConfirmPopupAnchorProps.className && {className: combineClassNamePropAndString(props.className, deleteConfirmPopupAnchorProps)})
                            }, 
                            ref)}
                    /> 
                }
            />
        : 
        renderTaskWrapper(props, forwardedTaskWrapperRef);

    return <TaskContext.Provider value={task}>
        <Suspense fallback={<Loading/>}>
            { mightBeDroppable }
        </Suspense>
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
/**
 * Dragging the task checkbox treats it as a draggale task due date
 */
export const TaskCheckbox = observer(({
    task, 
    draggable=false,
    type, 
    checkboxId,
    tabIndex,
}: {
    type: TaskDateFields,
    draggable?: boolean, 
    task?: TaskModel, 
    checkboxId?: string,
    tabIndex?: number,
}) => {
    const t = useTaskContextOrPassedTask(task);

    const id = checkboxId ? checkboxId : useId();
    const text = `Mark task ${t.complete ? "incomplete" : "complete"}`;
    const maybeDraggable = draggable && t.due ? <DraggableDroppableDateField 
        draggableComponentProps={{draggedPresentation: <Checkbox type="due" task={t}/>}}
        task={t}
        data={{
            taskId: t.id,
            date: t.due,
            fieldType: type,
            showDropPreview: true,
        }}
    >
            <TaskCheckbox type="due" task={task} tabIndex={tabIndex}/>
        </DraggableDroppableDateField> 
    : <label 
            className={`check-box-wrapper ${INTERACTABLE_ELEMENT_CLASS}`}
            htmlFor={id}
            title={text}
            aria-label={text}
            tabIndex={tabIndex}
        >
        <input 
            type="checkbox" 
            id={id}
            checked={t.complete}
            onChange={() => {
                t.toggleComplete();
            }}
            >
        </input>
        <Checkbox task={t} type={type} /> 
    </label>;
    return maybeDraggable;
});

const Checkbox = observer(({
    task, 
    type
}: {
    task?: TaskModel, 
    type: TaskDateFields,
}) => {
    const t = useTaskContextOrPassedTask(task);
    const styleText = !t.complete ? {color: t.color} : {};
    let checkboxIcon;
    switch (type) {
        case "due":
            checkboxIcon = t.complete ? `fa-check-square` : `fa-square`;
            break;
        default:
            checkboxIcon = t.complete ? `fa-check-circle round` : `fa-circle round`;
            break;
    }
    const checkFormat = t.complete ? checkboxIcon : checkboxIcon;
    return <i className={`far fa-fw checkmark ${checkFormat}`} style={styleText}></i>;  
});

//#endregion 
//#region Color Picker
const ColorGridPicker = observer(forwardRef<any, {
    task: TaskModel, 
    closePicker: Function, 
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
                anchorRenderMethod={({openPopup, ...props}, ref) => <div
                    className={`color-bubble-wrapper ${CENTERED_CLASS}`}>
                    <button
                        {...props}
                        {...buttonProps}
                        ref={ref as ForwardedRef<HTMLButtonElement>}
                        className={combineClassNamePropAndString(`color-bubble-input ${props.className}`, buttonProps)} 
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
                popupRenderMethod={({closePopup, ...props}, ref) => <ColorGridPicker 
                    ref={ref}
                    task={task} 
                    closePicker={closePopup} 
                    {...props}
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
        ...passedProps
    }, forwardedRef
) => {
    const [task] = useState(useTaskContextOrPassedTask(passedTask));
    const displayTitle = task.title ? task.title : UNSET_TASK_TITLE_PLACEHOLDER;

    let toReturn: ReactNode = <p 
        ref={forwardedRef as LegacyRef<any>}
        {...passedProps}
    > 
        { task.complete ? <s>{displayTitle}</s> : displayTitle } 
    </p>;

    if (openTaskDetailPopup) {
        return <AnchorWithPersistentPopupAttached
            closeWhenClickOutside={false}
            alignment="end"
            placement="auto"
            popupMargin={10}
            draggable={true}
            useDragHandle={true}
            anchorRenderMethod={({openPopup, ...props}, anchorRef) => <button
                    ref={anchorRef as ForwardedRef<HTMLButtonElement>}
                    {...props}
                    onClick={(e) => {
                        props.onClick && props.onClick(e);
                        openPopup();
                    }}
                    title={"Open task details"}
                    >
                        {toReturn}
                </button>
            }
            popupRenderMethod={({closePopup, ...props}, popupRef) => <div
                    ref={popupRef}
                    {...props}
                    className={combineClassNamePropAndString(TASK_DETAIL_POPUP_CLASS, props)}
                >
                    <TaskDetail 
                        task={task} 
                        closeWidget={closePopup}
                />
            </div>}
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
    task?: TaskModel,
    editable?: boolean,
}

export const TaskDueDate = observer(({
    format,
    task,
    editable,
    droppable,
    ...props
} : TaskDateParams) => {
    const t = useTaskContextOrPassedTask(task);
    return <TaskDate 
        {...props} 
        { ...(droppable === undefined && editable && { droppable: true })}
        type={"due"}
        task={t}
        editable={editable}
    />
})

export const TaskStartDate = observer(({
    format,
    task,
    editable,
    droppable,
    ...props
} : TaskDateParams) => {
    const t = useTaskContextOrPassedTask(task);
    return <TaskDate
        {...props} 
        { ...(droppable === undefined && editable && { droppable: true })}
        type={"start"}
        task={t}
        editable={editable}
    />
})

/**
 * Displays the date and time for a task
 * 
 */
export const TaskDate = observer(({
    type, 
    task,
    droppable=false,
    editable=false,
}: {
    type: TaskDateFields, 
    editable?: boolean,
    droppable?: boolean,
} & TaskDateParams) => {
    const t = useTaskContextOrPassedTask(task);
    const wrapperClasses = `date-time-wrapper`;
    if (editable) {
        return <EditableTaskDate 
            droppable={droppable}
            task={t}
            wrapperClasses={wrapperClasses}
            type={type}
        />
    }
    return <PlainTaskDate 
        task={t}
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
    return date ? <label>{type}<time dateTime={date.toISO() as string} className={wrapperClasses} suppressHydrationWarning > 
        <p className={DATE_CLASS}>{date.toLocaleString(PARTIAL_DATETIME_FORMATS.D.token)}</p>
        {showTime && <p className={TIME_CLASS}>{date.toLocaleString(PARTIAL_DATETIME_FORMATS.t.token)}</p>}
    </time></label> : <></>
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
        type: DATE_FIELD_DRAGDROP_TYPE,
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

    const draggedPresentation = <div className={`dragged-task-date ${ROWS_CLASS} ${ROWS_OR_COLS_WITH_GAP_CLASS} ${POPUP_SMALL_CLASS} ${ALIGNED_CLASS} ${PADDING_CLASS}`}>
        {type === "start" ? <TaskGantLineStart task={task}/> : <TaskCheckbox type="due" task={task}/> }
        <div>
            <p>{type}:</p> 
            <p>{dateField?.toLocaleString(DateTime.DATETIME_SHORT)}</p>
        </div>
    </div>
    const maybeDraggable = draggable ? <Draggable <DateFieldDragData>
        actionTitle="Drag date"
        droppable={true}
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
                [DATE_DRAGDROP_TYPE]: {
                    setDataWhenDragOver({ drag, drop }) {
                        defaultChangeTaskFieldToEndOrStartOfDay.set && defaultChangeTaskFieldToEndOrStartOfDay.set({task, drag, drop});
                    },
                    resetDataWhenDragOff({ drag, drop }) {
                        defaultChangeTaskFieldToEndOrStartOfDay.reset && defaultChangeTaskFieldToEndOrStartOfDay.reset({task, drag, drop}); 
                    },
                    saveDataWhenDragEnds({ drag, drop, e }) {
                        defaultChangeTaskFieldToEndOrStartOfDay.save && defaultChangeTaskFieldToEndOrStartOfDay.save({task, drag, drop})
                    },
                }, 
                [DELETE_DRAGDROP_TYPE]: {
                    setDataWhenDragOver({ drag, drop }) {
                        defaultTaskDateClearInteraction.set && defaultTaskDateClearInteraction.set({task, drag, drop})
                    },
                    resetDataWhenDragOff({ drag, drop, e }) {
                        defaultTaskDateClearInteraction.reset && defaultTaskDateClearInteraction.reset({task, drag, drop})
                    },
                    saveDataWhenDragEnds({ drag, drop, e }) {
                        defaultTaskDateClearInteraction.save && defaultTaskDateClearInteraction.save({task, drag, drop})
                    },
                }, 
                [DATE_FIELD_DRAGDROP_TYPE]: {
                    setDataWhenDragOver({ drag, drop }) {
                        defaultChangeTaskFieldToDate.set && defaultChangeTaskFieldToDate.set({task, drag, drop});
                    },
                    resetDataWhenDragOff({drag, drop}) {
                        defaultChangeTaskFieldToDate.reset && defaultChangeTaskFieldToDate.reset({task, drag, drop});
                    },
                    saveDataWhenDragEnds({ drag, drop, e }) {
                        defaultChangeTaskFieldToDate.save && defaultChangeTaskFieldToDate.save({task, drag, drop});
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

export const TaskGantLine = observer(forwardRef<HTMLButtonElement, {
    task: TaskModel, 
    showStart: boolean, 
    showDue: boolean,
    startTabIndex?: number,
    dueTabIndex?: number,
}&ComponentPropsWithoutRef<"button">>(({
    task, 
    showStart, 
    showDue, 
    startTabIndex, 
    dueTabIndex, 
    ...props}, 
ref) => {
    return (<button 
            ref={ref}
            {...props}
            className={combineClassNamePropAndString(`${ROWS_CLASS} ${ALIGNED_CLASS} ${CENTERED_CLASS} line-holder`, props)}
        >
            {showStart && task.start && (!task.due || task.start < task.due) && <TaskGantLineStart task={task} tabIndex={startTabIndex}/>}
            {showDue && task.due && task.start && task.start > task.due && <TaskCheckbox type="due" task={task} draggable={true} tabIndex={dueTabIndex} />}
            {task.start && <div 
                className="color-bar horizontal" 
                {...(!task.complete && {style: {backgroundColor: task.color}})}
                /> }
            {/* Allow the start to come on the other side of the gant line is the task is in error and start > due */}
            {showStart && task.due && task.start && task.start > task.due && <TaskGantLineStart task={task} tabIndex={startTabIndex}/>}
            {showDue && task.due && (!task.start || task.start < task.due) && <TaskCheckbox type="due" task={task} draggable={true} tabIndex={dueTabIndex}/>}
        </button>
    ) 
}))

export const TaskGantLineStart = observer(({task, tabIndex}: {task: TaskModel, tabIndex?: number}) => {
    if (!task.start) {
        return;
    }
    return <Draggable <DateFieldDragData>
        itemData={{
            type: DATE_FIELD_DRAGDROP_TYPE,
            date: task.start,
            showDropPreview: true,
            taskId: task.id,
            fieldType: "start",
        }}
        actionTitle="Change task start"
        droppable={true}
        tabIndex={tabIndex}
        className="start"
    >
        <div className={`spacer ${CENTERED_CLASS}`} />
        <div className="color-bar start"
            {...(!task.complete && {style: {backgroundColor: task.color}})}
        />
    </Draggable>
})

export const DraggableDroppableDateField = observer((
    {
        task,
        data,
        children,
        draggableComponentProps,
        droppableComponentProps,
    }
    : 
    {
        task: TaskModel,
        data: Omit<DateFieldDragData, "type">,
        children: ReactNode,
        draggableComponentProps?: Partial<DraggableParams<DateFieldDragData>>,
        droppableComponentProps?: Partial<DroppableParams<DateFieldDropData>>,
    }) => {
        const taskStore = useTaskStore();

    return <Droppable <DateFieldDropData>
            {...droppableComponentProps}
            collisionPriority={30}
            itemData={{
                ...data,
                type: DATE_FIELD_DRAGDROP_TYPE,
                accepts: DEFAULT_DATE_FIELD_DRAG_DATA.accepts,
            }}
            callbacksForAcceptedDragTypes={{
                [DATE_FIELD_DRAGDROP_TYPE]: {
                    // Task due ot start is dragged ot this due or start
                    // Change start of due of dragged task to this date time
                    setDataWhenDragOver: ({drag, drop}) => {
                        if (drag && drop) {
                            const droppedTask = taskStore.getTaskById(drag.taskId);
                            droppedTask && defaultChangeTaskFieldToDate.set({task: droppedTask, drag, drop})
                        }
                    }, 
                    resetDataWhenDragOff({ drag, drop }) {
                        if (drag && drop) {
                            const taskId = drag.taskId;
                            const droppedTask = taskStore.getTaskById(taskId);
                            droppedTask && defaultChangeTaskFieldToDate.reset({task: droppedTask, drag, drop})
                        }
                    },
                    saveDataWhenDragEnds({ drag, drop, e }) {
                        const taskId = drag.taskId;
                        const droppedTask = taskStore.getTaskById(taskId);
                        droppedTask && defaultChangeTaskFieldToDate.save({task: droppedTask, drag, drop})
                    },
                }, 
                [DATE_DRAGDROP_TYPE]: {
                    // Date without time is dragged to this due or start
                    // Change this tasks due or start to the passedDate
                    setDataWhenDragOver({drag, drop}) {
                        defaultChangeTaskFieldToEndOrStartOfDay.set({task, drag, drop});
                    }, 
                    resetDataWhenDragOff({drag, drop}) {
                        defaultChangeTaskFieldToEndOrStartOfDay.reset({task, drag, drop});
                    },
                    saveDataWhenDragEnds({drag, drop}) {
                        defaultChangeTaskFieldToEndOrStartOfDay.save({task, drag, drop});
                    },
                }, 
                [DELETE_DRAGDROP_TYPE]: {
                    setDataWhenDragOver({drag, drop}) {
                        defaultTaskDateClearInteraction.set({task, drag, drop});
                    }, 
                    resetDataWhenDragOff({drag, drop}) {
                        defaultTaskDateClearInteraction.reset({task, drag, drop});
                    },
                    saveDataWhenDragEnds({drag, drop}) {
                        defaultTaskDateClearInteraction.save({task, drag, drop});
                    },
            }
            }
        }
        >
            <Draggable <DateFieldDragData>
                {...draggableComponentProps}
                actionTitle={`Change task ${data.fieldType} date`}
                itemData={{
                    ...data,
                    type: DATE_FIELD_DRAGDROP_TYPE,
                }}
                droppable={true}
                draggedPresentation={draggableComponentProps && draggableComponentProps.draggedPresentation ? 
                        draggableComponentProps.draggedPresentation 
                        : <DraggedDatePresentation date={data.date}/>
                }
            >
                    { children }
            </Draggable>
        </Droppable>
})
