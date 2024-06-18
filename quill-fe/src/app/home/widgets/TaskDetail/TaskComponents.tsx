import { PositionedPopupAndReferenceElement } from "@/app/@util/FloatingUiHelpers";
import { ErrorsList } from "@/app/@util/FormComponents";
import { TaskModel } from "@/store/tasks/TaskModel";
import { UseDismissProps, UseFloatingOptions } from "@floating-ui/react";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";
import { LegacyRef, useRef, useState } from "react";

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

const colorCodes = [
    { 
        key: "C0",
        data: ["ff00ff", "cc00ff", "9900ff", "6600ff", "3300ff", "0000ff"],
    },
    {
        key: "C1",
        data: ["ff00cc", "ff33ff", "cc33ff", "9933ff", "6633ff", "3333ff", "0033ff"],
    },
    {
        key: "C2",
        data: ["ff0099", "ff33cc", "ff66ff", "cc66ff", "9966ff", "6666ff", "3366ff", "0066ff"],
    },
    {
        key: "C3",
        data: ["ff0066", "ff3399", "ff66cc", "ff99ff", "cc99ff", "9999ff", "6699ff", "3399ff", "0099ff"],
    },
    {
        key: "C4",
        data: ["ff0033", "ff3366", "ff6699", "ff99cc", "ffccff", "ccccff", "99ccff", "66ccff", "33ccff", "00ccff"],
    },
    {
        key: "C5",
        data: ["ff0000", "ff3333", "ff6666", "ff9999", "ffcccc", "ffffff", "ccffff", "99ffff", "33ffff", "00ffff"],
    },
    {
        key: "C6",
        data: ["ff3300", "ff6633", "ff9966", "ffcc99", "ffffcc", "ccffcc", "99ffcc", "66ffcc", "33ffcc", "00ffcc"],
    },
    {
        key: "C7",
        data: ["ff6600", "ff9933", "ffcc66", "ffff99", "ccff99", "99ff99", "66ff99", "33ff99", "00ff99"],
    },
    {
        key: "C8",
        data: ["ff9900", "ffcc33", "ffff66", "ccff66", "99ff66", "66ff66", "33ff66", "00ff66"],
    },
    {
        key: "C9",
        data: ["ffcc00", "ffff33", "ccff33", "99ff33", "66ff33", "33ff33", "00ff33"],
    },
    {
        key: "C10",
        data: ["ffff00", "ccff00", "99ff00", "66ff00", "33ff00", "00ff00"],
    },
]

const ColorGridPicker = observer(({task, closePicker}: {
    task: TaskModel, 
    closePicker: () => void, 
}) => {
    const finalTaskColor = useRef(task.color);
    const startingTaskColor = useRef(task.color);
    if (startingTaskColor.current === "#ffffff") {
        const allColors = colorCodes.flatMap((item: {key: string, data: string[]}) => item.data);
        console.log(allColors);
    }

    const closeProcedure = () => {
        task.setColor(finalTaskColor.current);
        if (finalTaskColor.current !== startingTaskColor.current) {
            task.saveToServer({color: task.color});
        }
        closePicker();
    }

    return <div 
                className="color-picker popup" 
                onMouseLeave={() => 
                {
                    // Stay open as long as the user is hovering over the picker
                    closeProcedure();
                }}
        > <div className="colors">
            { colorCodes.map((colorCol: {key: string, data: string[]}) => <div className="color-picker-col" key={`${colorCol.key}`}> 
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
            <input value={task.color} readOnly></input>
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
        referencePress: true,
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
        className: `title ${pClasses ? pClasses : null}${overdue ? " overdue" : null}`,
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
    const [editMode, setEditMode] = useState(false);
    const inputProps = {
        className: props.className,
        style: props.style,
        value: task.title,
        ariaLabel: "Title",
        title: "Edit title",
    }
    
    // Use input elements if editable to try and get a sort of inline effect
    const editInputRef: LegacyRef<HTMLInputElement> = useRef(null);
    const finishEditing = () => {
        setEditMode(false);
        focus
        if (editInputRef.current && editInputRef.current.value !== startingText.current) {
            task.saveToServer({title: editInputRef.current.value});
        }
    }

    return editMode ? <input {...inputProps} 
            ref={editInputRef}
            onChange={(e) => task.setTitle(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={(e) => {
                if (e.key === "Enter") { 
                    finishEditing();
                }
            }}
        />
        :
        <input {...inputProps} 
            onFocus={() => {
                setEditMode(true);
            }}
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
        <time dateTime={date} className={`date-time-wrapper${overdue ? " overdue" : ""}`}> 
            <p className="date">{date.toLocaleString(dateFormat)}</p>
            <p className="time">{date.toLocaleString(DateTime.TIME_SIMPLE)}</p>
        </time>
    );
})