import { ErrorsList } from "@util/FormComponents";
import { 
    TaskColorCodes, 
    TaskContext,
    TaskModel,
} from "@/store/tasks/TaskModel";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";
import { ComponentPropsWithoutRef, CSSProperties, ForwardedRef, forwardRef, HTMLProps, MouseEvent, MutableRefObject, ReactNode, Ref, RefObject, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import TaskDetail from "./TaskDetail";
import { combineClassNamePropAndString, ICONS, UNSET_TASK_TITLE_PLACEHOLDER } from "@util/constants";
import { PopupOnClick } from "@/app/@util/Popup";
import './tasks.css';

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
                console.debug(e)
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

export const TaskComponentAndHeader = observer(({
    labelElement,
    fieldName,
    optional=false,
    onCloseClick,
    children,
}: {
    labelElement: ReactNode,
    fieldName: "title" | "color" | "description" | "start time" | "start date" | "due time" | "due date",
    optional?: boolean,
    onCloseClick: (e: MouseEvent) => void,
    children: ReactNode,
}) => {
    return <div
        className="field"
    >
        <div 
            className="rows take-full-space space-between"
        >
            { labelElement }
            <div className="field-btns">
                { optional && 
                    <button 
                        title={`Clear ${fieldName}`}
                        className={`btn x-small square`}
                        onClick={(e: MouseEvent) => onCloseClick(e)}
                        >
                        {ICONS.X}
                    </button>
                }
            </div>
        </div>
        <div>
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
    return <label 
            className="check-box-wrapper"
            htmlFor={id}
            title={`Mark task ${task.complete ? "uncomplete" : "complete"}`}
            aria-label="task checkbox"
            tabIndex={0}
            onClick={() => task.toggleComplete()}
        >
        <input 
            type="checkbox" 
            aria-label="task checkbox"
            id={id}
            onChange={() => {task.toggleComplete()}}
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

    const close = useCallback(() => {
        if (task.color != startingTaskColor.current) {
            task.saveToServer({color: task.color});
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
            className="color-bubble-wrapper color-bubble" 
            viewBox="0 0 100 100" 
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="50" cy="50" r="50" fill={task.color}/>
        </svg>;

    return openColorPicker ? <PopupOnClick 
                renderElementToClick={(open) => <div
                    className="color-bubble-wrapper">
                    <input
                        type="color"
                        role="button"
                        className="color-bubble-input" 
                        onClick={(e) => {
                            e.preventDefault();
                            open();
                        }}
                        title="Change task color"
                        aria-label="Task color changer"
                        >
                    </input>
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
    const task = useTaskContextOrPassedTask(passedTask);
    const displayTitle = task.title ? task.title : UNSET_TASK_TITLE_PLACEHOLDER;

    return (
    <PopupOnClick 
        renderElementToClick={(openPopup) => 
                <button
                    type="button"
                    onClick={openPopup}
                    className={combineClassNamePropAndString({className: "", props: props as HTMLProps<"any">})} 
                >
                    <p style={props.style}> 
                        { task.complete ? <s>{displayTitle}</s> : displayTitle } 
                    </p>
                </button>
        }
        renderPopupContent={({closePopup}) => <TaskDetail 
                task={task} 
                close={closePopup}
            />}
        placement="right"
        alignment="middle"
        draggable={true}
        useDragHandle={true}
        {...{className: "task-detail"}}
    />
)});

const EditableTaskTitle = observer(forwardRef<HTMLElement, {passedTask?: TaskModel}>((props, ref) => {
    const task = useTaskContextOrPassedTask(props.passedTask);
    const startingText: MutableRefObject<string> = useRef(task.title);
    
    // Use input elements if editable to try and get a sort of inline effect
    const finishEditing = () => {
        if (task.title && task.title !== startingText.current) {
            task.saveToServer({title: task.title});
        }
    }

    const errorId = `detail-${task.id}-title-errors`;

    return <label 
            className="input-sizer stacked title-sizing"
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
    const startingText: RefObject<string> = useRef(task.title);
    
    // Use input elements if editable to try and get a sort of inline effect
    const editInputRef = ref ? ref : useRef(null);
    const errorId = useId();
    const finishEditing = () => {
        if (editInputRef.current && editInputRef.current.value !== startingText.current) {
            task.saveToServer({description: editInputRef.current.value});
        }
    }

    useEffect(() => {
        editInputRef && editInputRef.current ? (editInputRef.current as HTMLElement).focus():null;
    }, [])

    return <div>
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
            {
                !!task.validationErrors.description.length && <ErrorsList
                    errors={task.validationErrors.description}
                    id={errorId}
                />
            }
    </div>
}));
//#endregion 
//#region Date / Time
/**
 * Displays the date and time for a task
 * 
 */
export const DateTimeWrapper = observer(({
    passedTask, 
    type, 
    dateFormat=DateTime.DATE_SIMPLE
}: {
    passedTask?: TaskModel, 
    type: "start" | "due", 
    dateFormat?: object
}) => {
    const task = useTaskContextOrPassedTask(passedTask);
    const date = type === TaskModel.VisualStyles.Start ? task.start : task.due;
    const overdue = type === TaskModel.VisualStyles.Due && task.overdue();
    return (
        <time dateTime={date} className={`date-time-wrapper${overdue ? " overdue" : ""}`} suppressHydrationWarning > 
            <p className="date">{date.toLocaleString(dateFormat)}</p>
            <p className="time">{date.toLocaleString(DateTime.TIME_SIMPLE)}</p>
        </time>
    );
});
//#endregion 