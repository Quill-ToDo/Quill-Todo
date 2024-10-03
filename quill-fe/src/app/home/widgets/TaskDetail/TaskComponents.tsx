import { ErrorsList } from "@util/FormComponents";
import { 
    TaskColorCodes, 
    TaskContext,
    TaskModel,
} from "@/store/tasks/TaskModel";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";
import { 
    ComponentPropsWithoutRef, 
    CSSProperties, 
    ForwardedRef, 
    forwardRef, 
    HTMLProps, 
    MouseEvent, 
    MutableRefObject, 
    ReactNode, 
    useCallback, 
    useContext, 
    useEffect, 
    useId, 
    useRef, 
    useState, 
} from "react";
import TaskDetail from "./TaskDetail";
import { combineClassNamePropAndString, ICONS, UNSET_TASK_TITLE_PLACEHOLDER } from "@util/constants";
import { setUpStandalonePopup, TetheredPopupOnClick } from "@/app/@util/Popup";
import './tasks.css';
import { DateFormat, PARTIAL_DATETIME_FORMATS } from "@/app/@util/DateTimeHelper";

const HOVER_CLASS = "hover";

const useTaskContextOrPassedTask = (passedTask?: TaskModel): TaskModel => {
    if (passedTask) {
        return passedTask;
    }
    else if (useContext(TaskContext)) {
        return useContext(TaskContext);
    } else {
        throw new Error("Must pass a TaskModel or call useTaskContextOrPassedTask within a TaskContext Provider.");
    }
}

/**
 * Provide context of a single task for all task-related components within
 */
export const TaskWrapper = observer((
    {
        task, 
        keyOverride,
        children,
        ...props
    } : {
        task: TaskModel, 
        keyOverride?: string,
        children: ReactNode, 
    }) => {
    const taskWrapperClass = "task-wrapper";
    const allTaskWrapperSelector = `[data-task-id="${task.id}"].${taskWrapperClass}`;
    return <TaskContext.Provider value={task}>
        <div 
            key={keyOverride ? keyOverride : task.id}
            data-task-id={task.id}
            onPointerOver={(e) => {
                document.querySelectorAll(allTaskWrapperSelector).forEach((element: Element) => {
                    // if ((e.target as HTMLElement).classList.contains(taskWrapperClass)) {
                        element.classList.add(HOVER_CLASS);
                    // }
                });
            }}
            onMouseLeave={() => {
                document.querySelectorAll(`${allTaskWrapperSelector}.${HOVER_CLASS}`).forEach((element: Element) => {
                    element.classList.remove(HOVER_CLASS);
                });
            }}
            {...props}
            className={combineClassNamePropAndString({className: `task-wrapper${task.complete ? " complete" : ""}`, props: props as HTMLProps<"any">})}
        >
            {children}
        </div>
    </TaskContext.Provider>;
});

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
        className={combineClassNamePropAndString({className: `clear floating btn x-small square`, props: props})}
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
    type: TaskModel.VisualStyles.AcceptedStyles, 
    checkboxId?: string
}) => {
    const task = useTaskContextOrPassedTask(passedTask);

    const id = checkboxId ? checkboxId : useId();
    const text = `Mark task ${task.complete ? "uncomplete" : "complete"}`;
    return <label 
            className="check-box-wrapper"
            htmlFor={id}
            title={text}
            aria-label={text}
            tabIndex={0}
            onClick={() => {
                task.toggleComplete();
            }}
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
    form: TaskModel.VisualStyles.AcceptedStyles
}) => {
    const task = useTaskContextOrPassedTask(passedTask);
    const styleText = !task.complete ? {color: task.color} : {};
    let checkboxIcon;
    switch (form) {
        case TaskModel.VisualStyles.Due:
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
}: {
    passedTask?: TaskModel,
    openColorPicker?: boolean,
}) => {
    const task = useTaskContextOrPassedTask(passedTask);

    const colorBubble = <svg 
            className="color-bubble" 
            viewBox="0 0 100 100" 
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="50" cy="50" r="50" fill={task.color}/>
        </svg>;

    return openColorPicker ? <TetheredPopupOnClick 
                renderElementToClick={(props, ref) => <div
                    className="color-bubble-wrapper centered">
                    <button
                        {...props.toApply}
                        ref={ref}
                        role="button"
                        className={combineClassNamePropAndString({
                            className: "color-bubble-input",
                            props: props.toApply})} 
                        onClick={(e) => {
                            e.preventDefault();
                            props.openPopup();
                        }}
                        title="Change task color"
                        aria-label="Task color changer"
                        aria-haspopup="dialog"
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
        ...props
    }: {
        passedTask?: TaskModel,
        openTaskDetailPopup?: boolean,
        style?: CSSProperties,
    }
) => {
    const [task, setTask] = useState(useTaskContextOrPassedTask(passedTask));
    const displayTitle = task.title ? task.title : UNSET_TASK_TITLE_PLACEHOLDER;
    const closePopupCallback = useRef((undefined as unknown) as (() => void));

    const taskDetailContent = <TaskDetail 
        task={task} 
        close={closePopupCallback.current}
    />
    const popupControls = setUpStandalonePopup({
        children: taskDetailContent,
        placement: "right",
        alignment: "middle",
        draggable: true,
        useDragHandle: true,
        ...{className: "task-detail"},
    });
    closePopupCallback.current = (popupControls.closePopup);

    return <button
            type="button"   
            onClick={popupControls.openPopup}
            ref={popupControls.setPopupPositioningAnchor}
            aria-haspopup="dialog"
            className={combineClassNamePropAndString({className: "", props: props as HTMLProps<"any">})}
        >
        <p style={props.style}> 
            { task.complete ? <s>{displayTitle}</s> : displayTitle } 
        </p>
    </button>
});

/**
 *  Render a task title that can be edited on click.
 */
const EditableTaskTitle = observer(forwardRef<HTMLElement, {passedTask?: TaskModel}>((props, ref) => {
    const task = useTaskContextOrPassedTask(props.passedTask);
    const startingText: MutableRefObject<string> = useRef(task.title);
    
    // Use input elements if editable to try and get a sort of inline effect
    const finishEditing = async () => {
        if (task.title && task.title !== startingText.current) {
            const edits = task.saveEdits("title");
            edits && edits.then(() => {
                startingText.current = task.title;
            })
        }
    }

    const errorId = `detail-${task.id}-title-errors`;

    return <label 
            className="title input-sizer stacked title-sizing"
            data-expand-content={task.title}
            >
            <textarea 
                placeholder={UNSET_TASK_TITLE_PLACEHOLDER}
                value={task.title}
                aria-label={"Title"}
                aria-invalid={!!task.validationErrors.title.length}
                aria-describedby={errorId}
                title={"Edit Title"}
                rows={1}
                onChange={(e) => {
                    if (e.target) {
                        let inputText = e.target.value;
                        task.title = inputText;
                    }
                }}
                onBlur={finishEditing}
                {...props}
            />
            {
                !!task.validationErrors.title.length && <ErrorsList
                    errors={task.validationErrors.title}
                    id={errorId}
                />
            }
    </label>
}));

/** Render a task title. Can make editable on click with editAllowed=true */
export const TaskTitle = observer((
    {
        passedTask, 
        editAllowed=false,
        style,
        ...props
    }: {
        passedTask?: TaskModel, 
        editAllowed?: boolean,
        style?: CSSProperties,
    }) => {
    const task = useTaskContextOrPassedTask(passedTask);
    const overdue = task.overdue();

    const defaultColorLogic = !task.complete && !overdue && !!task.title.length ? task.color : undefined;
    const formattedProps: ComponentPropsWithoutRef<any> = {
        ...props,
        className: `title${overdue?" overdue":""}${!!!task.title.length?" blank":""}${props&&props.className?" "+props.className:""}`,
        style: {
            color: defaultColorLogic,
            ...(style?style:undefined),
        }
    };

    // Use p element if not editable
    if (!editAllowed) {
        return <PlainTaskTitle 
            {...formattedProps}
        />;
    }
    else {
        return <EditableTaskTitle
            {...formattedProps}
        />
    }
});

//#endregion 
//#region Description 
export const TaskDescription = observer(forwardRef<HTMLObjectElement, {
    passedTask?: TaskModel, 
    editAllowed?: boolean,
    autofocus?: boolean,
} >((props, ref) => {
    const task = useTaskContextOrPassedTask(props.passedTask);
    const refToUse: MutableRefObject<HTMLObjectElement | null> | ForwardedRef<HTMLObjectElement> = ref ? ref : useRef(null);

    const propsToUse: HTMLProps<any> = {
        className: `description dark-section keep-whitespace`,
        autoFocus: props.autofocus ?  props.autofocus : false,
    };

    return (props.editAllowed && props.editAllowed) 
        ? 
        <EditableTaskDescription 
            ref={refToUse as ForwardedRef<any>} 
            {...propsToUse} 
        /> 
        : 
        <div ref={refToUse} {...propsToUse}> 
            <p>{task.description}</p>      
        </div>
    }
));

const EditableTaskDescription = observer(forwardRef<HTMLObjectElement, {
    ref: ForwardedRef<any>,
    passedTask?: TaskModel,
}>((props, ref) => {
    const task = useTaskContextOrPassedTask(props.passedTask);
    const startingText: MutableRefObject<string> = useRef(task.description);
    
    // Use input elements if editable to try and get a sort of inline effect
    const editInputRef = ref ? ref : useRef(null);
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
        <div 
            className="input-sizer take-full-width"
            data-expand-content={task.description}
        >
            <textarea 
                value={task.description}
                aria-label={"Description"}
                title={"Edit Description"}
                aria-invalid={!!task.validationErrors.description.length}
                aria-describedby={errorId}
                onChange={(e) => task.description = e.target.value}
                onBlur={finishEditing}
                {...props}
                ref={editInputRef}
            />
        </div>
            {
                !!task.validationErrors.description.length && <ErrorsList
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
        type={TaskModel.VisualStyles.Due}
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
        type={TaskModel.VisualStyles.Start}
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
    type: "start" | "due", 
    passedTask?: TaskModel, 
    editable?: boolean
}) => {
    const dueType = TaskModel.VisualStyles.Due;
    const task = useTaskContextOrPassedTask(passedTask);
    const isDueType = type === dueType;
    const overdue = isDueType && task.overdue();
    const wrapperClasses = `date-time-wrapper${overdue ? " overdue" : ""}`;
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
    return date ? <time dateTime={date.toISO()} className={wrapperClasses} suppressHydrationWarning > 
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
    const dateStringUnderEdit = isDueType ? task.dueDateStringUnderEdit : task.startDateStringUnderEdit;
    const dateErrors = (isDueType ? task.validationErrors.dueDateStringUnderEdit : task.validationErrors.startDateStringUnderEdit);
    const updateTaskDate = isDueType ? (val: string) => {task.dueDateStringUnderEdit = val} : (val: string) => {task.startDateStringUnderEdit = val};
    const dateErrorListId = useId();

    return <label
        className="date aligned rows small gap"
    >
        Date
        <div className="input-sizer stacked" data-expand-content={dateStringUnderEdit}>
            <input 
                aria-invalid={dateErrors.concat(task.validationErrors.workInterval).length !== 0} 
                value={dateStringUnderEdit}
                aria-describedby={dateErrorListId}
                aria-label={`${type} date`}
                placeholder="date e.g. 7/6/2024"
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
        </div>
        { dateErrors.length > 0 && 
            <ErrorsList errors={dateErrors} id={dateErrorListId}/> 
        }
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
    const [timeHovered, setTimeHovered] = useState(false);
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
                        <div className="input-sizer" data-expand-content={timeStringUnderEdit}>
                            <input 
                                aria-invalid={timeErrors.concat(task.validationErrors.workInterval).length !== 0} 
                                value={timeStringUnderEdit} 
                                placeholder="time e.g. 7:00"
                                onChange={(e) => {updateTaskTime(e.target.value)}}
                                onFocus={() => {setTimeHovered(true)}}
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
                        </div>
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