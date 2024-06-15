import { TaskModel } from "@/store/tasks/TaskModel";
import { DateTime } from "luxon";
import { observer } from "mobx-react-lite";

export const Checkbox = observer(({task, type, checkboxId}: {task: TaskModel, type: TaskModel.VisualStyles, checkboxId: string}) => {
    return <div className="check-box-wrapper">
        <input 
            type="checkbox" 
            id={checkboxId}
            onChange={() => {task.toggleComplete()}}
            checked={task.complete}
            >
        </input>
        {type === "due" ? <TaskDueCheckbox task={task} /> : <WorkCheckbox task={task} />}
    </div>;
});


const placeColorPickerGrid = (task: TaskModel) => {
    // const home = document.getElementById("home-wrapper");
    // home && home.appendChild(<ColorGridPicker task={task}/> as Node)
};

const colorCodes = [
    ["ffooff", "cc00ff", "9900ff", "6600ff", "3300ff", "0000ff"],
    ["ff00cc", "ff33ff", "cc33ff", "9933ff", "6633ff", "3333ff", "0033ff"],
    ["ff0099", "ff33cc", "ff66ff", "cc66ff", "9966ff", "6666ff", "3366ff", "0066ff"],
    ["ff0066", "ff3399", "ff66cc", "ff66cc", "ff99ff", "cc99ff", "9999ff", "6699ff", "3399ff", "0099ff"],
    ["ff0033", "ff3366", "ff6699", "ff99cc", "ffccff", "ccccff", "99ccff", "66ccff", "33ccff", "00ccff"],
    ["ff0000", "ff3333", "ff6666", "ff9999", "ffcccc", "ffffff", "ccffff", "99ffff", "33ffff", "00ffff"],
    ["ff3300", "ff6633", "ff9966", "ffcc99", "ffffcc", "ccffcc", "99ffcc", "66ffcc", "33ffcc", "00ffcc"],
    ["ff6600", "ff9933", "ffcc66", "ffff99", "ccff99", "99ff99", "66ff99", "33ff99", "00ff99"],
    ["ff9900", "ffcc33", "ffff66", "ccff66", "99ff66", "66ff66", "33ff66", "00ff66"],
    ["ffcc00", "ffff33", "ccff33", "99ff33", "66ff33", "33ff33", "00ff33"],
    ["ffff00", "ccff00", "99ff00", "66ff00", "33ff00", "00ff00"],
]

const ColorGridPicker = ({task}: {task: TaskModel}) => {
    // Stay as long as the user is hovering over the colors?
    return <div className="color-picker">
        { colorCodes.map((colorCol: string[]) => { return colorCol.map((color: string) => <div className="color square"></div>) }) }
    </div>
};

export const ColorBubble = observer(({task}: {task: TaskModel}) => {
    return <div className="color-bubble-wrapper" onClick={() => placeColorPickerGrid(task)}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill={task.color}/>
        </svg>
    </div>;
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


export const TaskTitle = observer(({task, pClasses=""}: {task: TaskModel, pClasses?: string}) => {
    const styleText = !task.complete ? {color: task.color} : {};
    return <p className={`title ${pClasses}`} style={styleText}>
            { task.complete ? <s>{task.title}</s> : task.title }
        </p>;  
})

/**
 * Displays the date and time for a task
 * 
 */
export const DateTimeWrapper = observer(({task, type, dateFormat=DateTime.DATE_SIMPLE}: {task: TaskModel, type: "start" | "due", dateFormat?: object}) => {
    const date = type === "start" ? task.start : task.due;
    const overdue = type === "due" && date < DateTime.now() && !task.complete;
    return (
        <time dateTime={date} className={`date-time-wrapper ${overdue && "overdue"}`}> 
            <p className="date">{date.toLocaleString(dateFormat)}</p>
            <p className="time">{date.toLocaleString(DateTime.TIME_SIMPLE)}</p>
        </time>
    );
})