import { PositionedPopupAndReferenceElement } from "@/app/@util/FloatingUiHelpers";
import { ErrorsList } from "@/app/@util/FormComponents";
import { TaskColorCodes, TaskModel } from "@/store/tasks/TaskModel";
import { UseDismissProps, UseFloatingOptions, shift, offset, autoPlacement } from "@floating-ui/react";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";
import { ComponentProps, ComponentPropsWithoutRef, DragEvent, DragEventHandler, HTMLProps, ReactNode, RefObject, useCallback, useEffect, useRef, useState } from "react";
import TaskDetail from "./TaskDetail";
import { UNSET_TASK_TITLE_PLACEHOLDER } from "@/app/@util/constants";
import { NOTICE_ALERT, addAlert } from "../Alerts/alertEvent";

const HOVER_CLASS = "hover";

export const TaskWrapper = observer((
    {
        task, 
        properties, 
        keyOverride,
        children
    } : {
        task: TaskModel, 
        properties?: ComponentPropsWithoutRef<"div">
        keyOverride?: string,
        children: ReactNode, 
    }) => {
    return <div 
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
        className={`task-wrapper${task.complete ? " complete" : ""}${properties && properties.className ? " " + properties.className : ""}`}
        >
        {children}
    </div>;
})
//#region Checkbox
export const Checkbox = observer(({task, type, checkboxId}: {task: TaskModel, type: TaskModel.VisualStyles, checkboxId: string}) => {
    return <label 
            className="check-box-wrapper"
            htmlFor={checkboxId}
            title={`Mark task ${task.complete ? "uncomplete" : "complete"}`}
            aria-label="task checkbox"
            tabIndex={0}
            onClick={() => task.toggleComplete()}
        >
        <input 
            type="checkbox" 
            aria-label="task checkbox"
            id={checkboxId}
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
    const errorId = `color-${task.id}-errors`;
    const inputRef = useRef(null);
    const finalTaskColor = useRef(task.color);
    const startingTaskColor = useRef(task.color);

    useEffect(() => {
        inputRef.current && (inputRef.current as HTMLInputElement).select();
    })

    const close = useCallback(() => {
        task.setColor(finalTaskColor.current);
        if (finalTaskColor.current != startingTaskColor.current) {
            task.saveToServer({color: finalTaskColor.current});
        }
        closePicker();
    }, [finalTaskColor, startingTaskColor]);

    return <div 
                className="color-picker popup"
                onMouseLeave={() => task.setColorStringUnderEdit(finalTaskColor.current)}
        > <div className="colors">
            { TaskColorCodes.map((colorCol: {key: string, data: string[]}) => <div className="color-picker-col" key={`${colorCol.key}`}> 
                    { colorCol.data.map((color: string) => 
                        <div
                            className="color-square"
                            style={{backgroundColor: color}} 
                            key={color} 
                            onMouseEnter={() => {
                                task.setColorStringUnderEdit(color);
                            }}
                            onClick={() => {
                                finalTaskColor.current = color;
                                close();
                            }}
                        ></div>
                    )}
                </div>          
            )}
        </div>
        <div className="name-and-errors">
            <input 
                value={task.colorStringUnderEdit} 
                onChange={(e) => {
                    if (task.setColorStringUnderEdit(e.target.value)) {
                        finalTaskColor.current = e.target.value;
                    };
                }}
                ref={inputRef}
                aria-invalid={!!task.validationErrors.colorStringUnderEdit.length}
                aria-describedby={errorId}
            >    
            </input>
            { !!task.validationErrors.color.length && <ErrorsList 
                errors={task.validationErrors.colorStringUnderEdit}
                id={errorId}
            />}
        </div>
    </div>
})

export const ColorBubble = observer(({task}: {task: TaskModel}) => {
    const [showPicker, setShowPicker] = useState(false);
    const closePicker = () => setShowPicker(false);

    const colorPickerGridPositioning: UseFloatingOptions = {
        open: showPicker,
        onOpenChange: setShowPicker,
        placement: "bottom",
        middleware: [
            offset(({rects}) => {
                return (
                  -rects.floating.height / 2
                );
              }),
              shift()],
    };
    const dismissOptions: UseDismissProps = {
        outsidePress: true,
        referencePress: true,
        bubbles: false,
    }

    return <PositionedPopupAndReferenceElement
        popupPositioningOptions={colorPickerGridPositioning}
        dismissPopupOptions={dismissOptions}
        renderRef={(ref, props) => {
            return <div
                    className="color-bubble-wrapper">
                    <input
                        type="color"
                        className="color-bubble-input" 
                        onClick={(e) => {
                            e.preventDefault();
                            setShowPicker(true);
                        }}
                        title="Change task color"
                        aria-label="Task color changer"
                        {...props}
                        >
                    </input>
                    <svg 
                        ref={ref}
                        className="color-bubble" 
                        viewBox="0 0 100 100" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle cx="50" cy="50" r="50" fill={task.color}/>
                    </svg>
            </div>
        }}
        popupElement={
            <ColorGridPicker 
                task={task} 
                closePicker={closePicker} 
            />
        }
    /> 
});
//#endregion 
//#region Title
const PlainTaskTitle = observer((
    {
        task,
        props,
    }: {
        task: TaskModel,
        props: ComponentProps<"p">,
    }
) => {
    const [showDetails, setShowDetails] = useState(false);
    const close = () => setShowDetails(false);
    const taskDetailsPopupPositioning: UseFloatingOptions = {
        open: showDetails,
        onOpenChange: setShowDetails,
        middleware: [offset(20), autoPlacement(), shift()],
    };
    const dismissOptions: UseDismissProps = {
        outsidePress: true,
        referencePress: false,
    }

    const displayTitle = task.title ? task.title : UNSET_TASK_TITLE_PLACEHOLDER;

    return <PositionedPopupAndReferenceElement
                popupPositioningOptions={taskDetailsPopupPositioning}
                dismissPopupOptions={dismissOptions}
                renderRef={(ref, floatProps) => {
                    return (
                        <button
                        type="button"
                            ref={ref}
                            onClick={() => {setShowDetails(true);}}
                            className={props.className}
                            {...floatProps} 
                        >
                            <p style={props.style}> 
                                { task.complete ? <s>{displayTitle}</s> : displayTitle } 
                            </p>
                        </button>
                    )
                }}
                popupElement={
                    <TaskDetail 
                        task={task} 
                        close={close} 
                    />
                }
            />;
});

const EditableTaskTitle = observer((
    {
        task,
        props,
    }: {
        task: TaskModel,
        props: ComponentProps<"input">,
    }
) => {
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
                autoFocus={true}
                value={task.title}
                aria-label={"Title"}
                aria-invalid={!!task.validationErrors.title.length}
                aria-describedby={errorId}
                title={"Edit Title"}
                ref={editInputRef}
                onChange={(e) => task.setTitle(e.target.value)}
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
        task, 
        editAllowed=false,
    }: {
        task: TaskModel, 
        editAllowed?: boolean,
    }) => {
    const overdue = task.overdue();

    const props: HTMLProps<any> = {
        className: `title${overdue ? " overdue" : ""}${!!!task.title.length ? " blank" : "" }`,
        style: {
            color: !task.complete && !overdue && !!task.title.length ? task.color : undefined,
        },
    };

    // Use p element if not editable
    if (!editAllowed) {
        return <PlainTaskTitle 
            task={task}
            props={props as ComponentProps<"p">}
        />;
    }
    else {
        return <EditableTaskTitle
            task={task}
            props={props as ComponentProps<"input">}
        />
    }
});
//#endregion 
//#region Date / Time
/**
 * Displays the date and time for a task
 * 
 */
export const DateTimeWrapper = observer(({task, type, dateFormat=DateTime.DATE_SIMPLE}: {task: TaskModel, type: "start" | "due", dateFormat?: object}) => {
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