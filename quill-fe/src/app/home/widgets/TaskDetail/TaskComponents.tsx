import { PositionedPopupAndReferenceElement } from "@/app/@util/FloatingUiHelpers";
import { ErrorsList } from "@/app/@util/FormComponents";
import { TaskColorCodes, TaskModel } from "@/store/tasks/TaskModel";
import { UseDismissProps, UseFloatingOptions, shift, offset } from "@floating-ui/react";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";
import { ComponentProps, HTMLProps, LegacyRef, useCallback, useRef, useState } from "react";
import TaskDetail from "./TaskDetail";
import { UNSET_TASK_TITLE_PLACEHOLDER } from "@/app/@util/constants";


//#region Checkbox
export const Checkbox = observer(({task, type, checkboxId}: {task: TaskModel, type: TaskModel.VisualStyles, checkboxId: string}) => {
    return <div className="check-box-wrapper">
        <input 
            type="checkbox" 
            title={`Mark task ${task.complete ? "uncomplete" : "complete"}`}
            aria-label="task checkbox"
            id={checkboxId}
            onChange={() => {task.toggleComplete()}}
            checked={task.complete}
            >
        </input>
        {type === "due" ? <TaskDueCheckbox task={task} /> : <WorkCheckbox task={task} />}
    </div>;
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

const TaskDueCheckbox = observer(({task}: {task: TaskModel}) => <TaskCheckbox task={task} form="due" />);

const WorkCheckbox = observer(({task}: {task: TaskModel}) => <TaskCheckbox task={task} form="work" />);
//#endregion 
//#region Color Picker
const ColorGridPicker = observer(({task, closePicker}: {
    task: TaskModel, 
    closePicker: () => void, 
}) => {
    const finalTaskColor = useRef(task.color);
    const startingTaskColor = useRef(task.color);
    const closeProcedure = useCallback(() => {
        task.setColor(finalTaskColor.current);
        if (finalTaskColor.current !== startingTaskColor.current) {
            task.saveToServer({color: task.color});
        }
        closePicker();
    }, [finalTaskColor, startingTaskColor]);
    const errorId = `color-${task.id}-errors`;

    return <div 
                className="color-picker popup" 
                onMouseLeave={() => 
                {
                    // Stay open as long as the user is hovering over the picker
                    closeProcedure();
                }}
        > <div className="colors">
            { TaskColorCodes.map((colorCol: {key: string, data: string[]}) => <div className="color-picker-col" key={`${colorCol.key}`}> 
                    { colorCol.data.map((color: string) => 
                        <div
                            className="color-square" 
                            style={{backgroundColor: `#${color}`}} 
                            key={color} 
                            onMouseEnter={() => {
                                task.setColor(`#${color}`);
                            }}
                            onClick={() => {
                                if (!task.validationErrors.colorStringUnderEdit.length) {
                                    finalTaskColor.current = `#${color}`;
                                    closeProcedure();
                                }
                            }}
                        ></div>
                    )}
                </div>          
            )}
        </div>
        <div className="name-and-errors">
            <input 
                value={task.color} 
                readOnly
                aria-invalid={!!task.validationErrors.colorStringUnderEdit.length}
                aria-describedby={errorId}
            >    
            </input>
            <ErrorsList 
                errors={task.validationErrors.colorStringUnderEdit}
                id={errorId}
            />
        </div>
    </div>
})

export const ColorBubble = observer(({task}: {task: TaskModel}) => {
    const [showPicker, setShowPicker] = useState(false);
    const closePicker = () => setShowPicker(false);

    const colorPickerGridPositioning: UseFloatingOptions = {
        open: showPicker,
        onOpenChange: setShowPicker,
        placement: "right-start",
    };
    const dismissOptions: UseDismissProps = {
        outsidePress: true,
        // referencePress: true,
        bubbles: false,
    }

    return <PositionedPopupAndReferenceElement
        popupPositioningOptions={colorPickerGridPositioning}
        dismissPopupOptions={dismissOptions}
        renderRef={(ref, props) => {
            return <button
                className="color-bubble-wrapper" 
                ref={ref}
                onClick={(e) => {
                    e.preventDefault();
                    setShowPicker(true);
                }}
                title="Change task color"
                aria-label="Task color changer"
                {...props}
            >
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="50" fill={task.color}/>
                </svg>
            </button>
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
        placement: "right",
        middleware: [offset(20), shift()],
    };
    const dismissOptions: UseDismissProps = {
        outsidePress: false,
        referencePress: false,
    }

    const displayTitle = task.title ? task.title : UNSET_TASK_TITLE_PLACEHOLDER;

    return <PositionedPopupAndReferenceElement
                popupPositioningOptions={taskDetailsPopupPositioning}
                dismissPopupOptions={dismissOptions}
                renderRef={(ref, floatProps) => {
                    return <button
                            ref={ref}
                            onClick={() => {setShowDetails(true);}}
                            className={props.className}
                            {...floatProps} 
                        >
                        <p style={props.style}> 
                            { task.complete ? <s>{displayTitle}</s> : displayTitle } 
                        </p>
                    </button>
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
    const startingText = useRef(task.title);
    
    // Use input elements if editable to try and get a sort of inline effect
    const editInputRef: LegacyRef<HTMLInputElement> = useRef(null);
    const finishEditing = () => {
        if (editInputRef.current && editInputRef.current.value !== startingText.current) {
            task.saveToServer({title: editInputRef.current.value});
        }
    }

    // const displayTitle = task.title ? task.title : UNSET_TASK_TITLE_PLACEHOLDER;
    const errorId = `detail-${task.id}-title-errors`;

    return <div>
            <input 
                placeholder={UNSET_TASK_TITLE_PLACEHOLDER}
                value={task.title}
                aria-labelabel={"Title"}
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
            color: !task.complete && !overdue ? task.color : undefined,
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
})
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
})
//#endregion 