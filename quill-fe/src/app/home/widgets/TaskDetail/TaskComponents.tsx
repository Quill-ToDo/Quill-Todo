import { ErrorsList } from "@util/FormComponents";
import { TaskColorCodes, TaskContext, TaskModel } from "@/store/tasks/TaskModel";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";
import { ComponentProps, ComponentPropsWithoutRef, forwardRef, HTMLProps, MouseEvent, MouseEventHandler, PropsWithoutRef, PropsWithRef, ReactNode, RefObject, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import TaskDetail from "./TaskDetail";
import { combineClassNamePropAndString, ICONS, UNSET_TASK_TITLE_PLACEHOLDER } from "@util/constants";
import { ContextMenuPopup, PopupOnClick } from "@/app/@util/Popup";

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

export const TaskWrapper = observer((
    {
        task, 
        properties, 
        keyOverride,
        children,
    } : {
        task: TaskModel, 
        properties?: ComponentPropsWithoutRef<"div">
        keyOverride?: string,
        children: ReactNode, 
    }) => {

    return <TaskContext.Provider value={task}>
    <div 
        key={keyOverride ? keyOverride : task.id}
        data-task-id={task.id}
        onMouseEnter={() => {
            document.querySelectorAll(`[data-task-id="${task.id}"]`).forEach((element: Element) => {
                element.classList.add(HOVER_CLASS);
            });
        }}
        onMouseLeave={() => {
            document.querySelectorAll(`[data-task-id="${task.id}"]`).forEach((element: Element) => {
                element.classList.remove(HOVER_CLASS);
            });
        }}
        {...properties}
        className={combineClassNamePropAndString({className: `task-wrapper${task.complete ? " complete" : ""}`, props: properties as HTMLProps<"any">})}
        >
        {children}
    </div>
</TaskContext.Provider>;
});

type updateParams = {
    task: TaskModel; 
    update: any;
};

const taskFields = {
    "title": {
        name: "Title",
        update: ({task, update}: updateParams) => {task.title = update;},
    },
    "color": {
        name: "Color",
        update: ({task, update}: updateParams) => {task.color = update;},
    },
}

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
export const Checkbox = observer(({task, type, checkboxId}: {task: TaskModel, type: TaskModel.VisualStyles, checkboxId?: string}) => {
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
        {type === "due" ? <TaskCheckbox task={task} form="due" /> : <TaskCheckbox task={task} form="work" />}
    </label>;
});

const TaskCheckbox = observer(({task, form}: {task: TaskModel, form: "work" | "due"}) => {
    const styleText = !task.complete ? {color: task.color} : {};
    const checkFormat = task.complete ? checkboxIconOptions[form].complete : checkboxIconOptions[form].notComplete;
    return <i className={`far fa-fw checkmark ${checkFormat}`} style={styleText}></i>;  
});

const checkboxIconOptions = {
    work: {
        complete: `fa-check-circle round`,
        notComplete: `fa-circle round`
    },
    due: {
        complete: `fa-check-square`,
        notComplete: `fa-square`,
    }
};
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
        > 
            <div className="colors max-width-height">
            { TaskColorCodes.map((colorCol: {key: string, data: string[]}) => 
                <div 
                    className="color-picker-col" 
                    key={`${colorCol.key}`}> 
                        { colorCol.data.map((color: string) => 
                        <div
                        className="color-square max-width-height"
                        style={{backgroundColor: color}} 
                        key={color} 
                        onMouseEnter={() => {
                            task.colorStringUnderEdit = color;
                        }}
                        onClick={() => {
                            close();
                        }}
                        ></div>
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

export const ColorBubble = observer(({passedTask}: {passedTask?: TaskModel}) => {
    const task = useTaskContextOrPassedTask(passedTask);

    return <PopupOnClick 
            renderElementToClick={(open) => <div
                className="color-bubble-wrapper">
                <input
                    type="color"
                    className="color-bubble-input" 
                    onClick={(e) => {
                        e.preventDefault();
                        open();
                    }}
                    title="Change task color"
                    aria-label="Task color changer"
                    >
                </input>
                <svg 
                    className="color-bubble" 
                    viewBox="0 0 100 100" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle cx="50" cy="50" r="50" fill={task.color}/>
                </svg>
            </div>
        }
        renderPopupContent={(close) => <ColorGridPicker 
            task={task} 
            closePicker={close} 
        {...{className: "max-width-height"}}    
        />}
    ></PopupOnClick>;
});
//#endregion 
//#region Title
const PlainTaskTitle = observer((
    {
        passedTask,
        props,
    }: {
        passedTask?: TaskModel,
        props?: ComponentPropsWithoutRef<"p">,
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
        renderPopupContent={(closePopup) => <TaskDetail 
                task={task} 
                close={closePopup} 
            />}
        placement="right"
        alignment="middle"
        {...{className: "task-detail"}}
        ></PopupOnClick>
)});

const EditableTaskTitle = observer((
    {
        passedTask,
        props,
    }: {
        passedTask?: TaskModel,
        props: ComponentProps<"input">,
    }
) => {
    const task = useTaskContextOrPassedTask(passedTask);
    const startingText: RefObject<string> = useRef(task.title);
    
    // Use input elements if editable to try and get a sort of inline effect
    const editInputRef: RefObject<HTMLInputElement> = useRef(null);
    const finishEditing = () => {
        if (editInputRef.current && editInputRef.current.value !== startingText.current) {
            task.saveToServer({title: editInputRef.current.value});
        }
    }

    const errorId = `detail-${task.id}-title-errors`;

    return <div>
            <input 
                placeholder={UNSET_TASK_TITLE_PLACEHOLDER}
                value={task.title}
                aria-label={"Title"}
                aria-invalid={!!task.validationErrors.title.length}
                aria-describedby={errorId}
                title={"Edit Title"}
                ref={editInputRef}
                onChange={(e) => task.title = e.target.value}
                onBlur={finishEditing}
                {...props}
            />
            {
                !!task.validationErrors.title.length && <ErrorsList
                    errors={task.validationErrors.title}
                    id={errorId}
                />
            }
    </div>

});

export const TaskTitle = observer((
    {
        passedTask, 
        editAllowed=false,
        props,
    }: {
        passedTask?: TaskModel, 
        editAllowed?: boolean,
        props?: ComponentPropsWithoutRef<any>,
    }) => {
    const task = useTaskContextOrPassedTask(passedTask);
    const overdue = task.overdue();

    const defaultColorLogic = !task.complete && !overdue && !!task.title.length ? task.color : undefined;
    const formattedProps: ComponentPropsWithoutRef<any> = {
        ...props,
        className: `title${overdue?" overdue":""}${!!!task.title.length?" blank":""}${props&&props.className?" "+props.className:""}`,
        style: {
            color: defaultColorLogic,
            ...(props&&props.style?props.style:undefined),
        }
    };

    // Use p element if not editable
    if (!editAllowed) {
        return <PlainTaskTitle 
            task={task}
            props={formattedProps as ComponentPropsWithoutRef<"p">}
        />;
    }
    else {
        return <EditableTaskTitle
            task={task}
            props={formattedProps as ComponentPropsWithoutRef<"input">}
        />
    }
});

//#endregion 
//#region Description 
export const TaskDescription = observer(forwardRef((
    {
        ref,
        passedTask, 
        editAllowed=false,
        autofocus=false,
    }: {
        ref: RefObject<any>,
        passedTask?: TaskModel, 
        editAllowed?: boolean,
        autofocus?: boolean,
    }) => {
    const task = useTaskContextOrPassedTask(passedTask);

    const props: HTMLProps<any> = {
        className: `description dark-section keep-whitespace`,
        autoFocus: autofocus,
    };

    // Use p element if not editable
    if (!editAllowed) {
        <div {...props}> 
            <p>{task.description}</p>            
        </div>;
    }
    else {
        return <EditableTaskDescription
            ref={ref}
            props={props as ComponentProps<"textarea">}
        />
    }
}));

const EditableTaskDescription = observer(forwardRef((
    {
        ref,
        passedTask,
        props,
    }: {
        ref: RefObject<any>,
        passedTask?: TaskModel,
        props: ComponentProps<"textarea">,
    }
) => {
    const task = useTaskContextOrPassedTask(passedTask);
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
                ref={editInputRef}
                onChange={(e) => task.description = e.target.value}
                onBlur={finishEditing}
                {...props}
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
    const date = type === "start" ? task.start : task.due;
    const overdue = type === "due" && task.overdue();
    return (
        <time dateTime={date} className={`date-time-wrapper${overdue ? " overdue" : ""}`} suppressHydrationWarning > 
            <p className="date">{date.toLocaleString(dateFormat)}</p>
            <p className="time">{date.toLocaleString(DateTime.TIME_SIMPLE)}</p>
        </time>
    );
});
//#endregion 