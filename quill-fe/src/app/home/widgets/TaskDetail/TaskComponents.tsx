import { PositionedPopupAndReferenceElement } from "@/app/@util/FloatingUiHelpers";
import { ErrorsList } from "@/app/@util/FormComponents";
import { TaskColorCodes, TaskModel } from "@/store/tasks/TaskModel";
import { UseDismissProps, UseFloatingOptions } from "@floating-ui/react";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";
import { LegacyRef, useCallback, useRef, useState } from "react";

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
                aria-invalid={!!task.validationErrors.colorStringUnderEdit}
            >    
            </input>
            <ErrorsList 
                errors={task.validationErrors.colorStringUnderEdit}
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
        refElement={
            <button
                className="color-bubble-wrapper" 
                onClick={(e) => {
                    e.preventDefault();
                    setShowPicker(true);
                }}
                title="Change task color"
                aria-label="Task color changer"
            >
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="50" fill={task.color}/>
                </svg>
            </button>
        }
        popupElement={
            <ColorGridPicker 
                task={task} 
                closePicker={closePicker} 
            />
        }
    /> 
});

const forms = {
    work: {
        complete: `fa-check-circle round`,
        notComplete: `fa-circle round`
    },
    due: {
        complete: `fa-check-square`,
        notComplete: `fa-square`,
    }
}

const TaskCheckbox = observer(({task, form}: {task: TaskModel, form: "work" | "due"}) => {
    const styleText = !task.complete ? {color: task.color} : {};
    const checkFormat = task.complete ? forms[form].complete : forms[form].notComplete;
    return <i className={`far fa-fw checkmark ${checkFormat}`} style={styleText}></i>;  
})

const TaskDueCheckbox = observer(({task}: {task: TaskModel}) => <TaskCheckbox task={task} form="due" />);

const WorkCheckbox = observer(({task}: {task: TaskModel}) => <TaskCheckbox task={task} form="work" />);

export const TaskTitle = observer(({task, pClasses="", editAllowed=false}: {task: TaskModel, pClasses?: string, editAllowed?: boolean}) => {
    const overdue = task.overdue();
    const props = {
        className: `title${pClasses ? " " + pClasses : ""}${overdue ? " overdue" : ""}`,
        style: {
            color: !task.complete && !overdue ? task.color : undefined,
        },
    };

    // Use p element if not editable
    if (!editAllowed) {
        return <p {...props}>
                { task.complete ? <s>{task.title}</s> : task.title }
        </p>;
    }
    
    const startingText = useRef(task.title);
    
    // Use input elements if editable to try and get a sort of inline effect
    const editInputRef: LegacyRef<HTMLInputElement> = useRef(null);
    const finishEditing = () => {
        if (editInputRef.current && editInputRef.current.value !== startingText.current) {
            task.saveToServer({title: editInputRef.current.value});
        }
    }

    return <input 
            className={props.className}
            style={props.style}
            value={task.title}
            aria-label={"Title"}
            aria-invalid={!!task.validationErrors.title.length}
            title={"Edit Title"}
            ref={editInputRef}
            onChange={(e) => task.setTitle(e.target.value)}
            onBlur={finishEditing}
        />;
})

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