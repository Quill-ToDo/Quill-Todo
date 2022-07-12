import { Fragment, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DateTime } from "luxon";
import '../static/css/new.css';
import '../static/css/datetimepicker.css';
import { 
    TIME_FORMAT,
} from "../constants";
import { TempusDominus, Namespace } from "@eonasdan/tempus-dominus";

const errorIdEnd = "-error-list";

/**
 * @param {string[]} errors List of errors to display 
 * @returns Content of errors list. Separated from the list for performance.
 */
const ErrorsListContent = (errors) => {
    return errors.map((errorText) => {
        return <li key={"error-"+errorText}>
            {errorText}
        </li>
    })
}

/**
 * @param {string[]} errors List of errors to display 
 * @returns List of errors
 */
const errorsList = (errors, idPrefix) => {
    if (errors.length > 1) {
        return <Fragment> 
            <ul id={idPrefix+errorIdEnd} className="error-list" aria-live="polite">
                <ErrorsListContent errors={errors} />
            </ul>
        </Fragment>
    }
    else {
        return <p className="error-list">{errors[0]}</p>
    }
}

/**
 * 
 * A wrapper for time and date form fields.
 * 
 * ---
 * 
 * *Required props:*
 *  - **label** : string - Label that will be used in classes and IDs. "start" or "due" probably.
 *  - **date** : string - The date that will appear in the date form field
 *  - **time** : string - The time that will appear in the time form field
 *  - **errors** : object - Any errors for this field
 *  - **dateChangeCallback** : () => any - Method that will be called when the date is changed
 *  - **timeChangeCallback** : () => any - Method that will be called when the time is changed 
 * 
 * @param {*} props
 * @returns 
 */
const TimeDateLabel = (props) => {
    return <label>
        {props.label.charAt(0).toUpperCase() + props.label.slice(1)}
        <div className={"horizontal-align" + (props.defaultStartBeingUsed && props.label === "start" ? " default" : "")}>
            <label className="date">
                Date
                <input
                    name={`${props.label} date`}
                    onChange={props.dateChangeCallback}
                    value={props.date}
                    aria-describedby={props.label+"-date"+errorIdEnd}
                    />
            </label>
            <label className="time">
                Time
                <div className={"horizontal-align" + (props.defaultStartBeingUsed && props.label === "start" ? " default" : "")}>
                    <input
                        id={`${props.label}-time`}
                        data-td-target={`#datetime-picker-${props.label}`}
                        name={`${props.label} time`}
                        onChange={props.timeChangeCallback}
                        aria-describedby={props.label+"-time"+errorIdEnd}
                        value={props.time}
                    />
                    <button 
                        id={`datetime-picker-${props.label}`} 
                        data-td-target-input={`#${props.label}-time`} 
                        data-td-toggle={`#${props.label}-time`} 
                        className="btn no-shadow datepicker-toggle" 
                        type="button"
                        title="Choose time"
                        >
                        <i className="far fa-clock fa-fw"></i>
                    </button>
                </div>
            </label>
        </div>
        <div className="horizontal-align">
        { props.errors.date.length ? errorsList(props.errors.date, props.label+"-date"+errorIdEnd) : null }
        { props.errors.time.length ? errorsList(props.errors.time, props.label+"-time"+errorIdEnd) : null }
        </div>

    </label>
}

/**
 * @param {string} name Name of DOM element
 * @param {string} type DOM element type
 * @returns A selector string for an element with #new-wrapper with type type and name name.
 */
const getSelector = (name, type) => {
    return `#new-wrapper ${type}[name='${name}']`;
}


/**
 * Handle submission of the form. Validates that the task does not have any errors. If it does, it moves focus to the first field in the form
 * with errors. Otherwise, the task is saved to the DB.
 * 
 * @param {SubmitEvent} event
 * @param {Task} taskToCreate 
 * @returns
 */
const handleSubmit = (event, taskToCreate, possibleInputs) => {
    event.preventDefault();
    var focusEle = null;

    // Get element with errors to switch focus to
    for (const name in possibleInputs) {
        const field = possibleInputs[name];
        const elem = document.querySelector(field.selector);
        if (field.hasErrors) {
            if (!focusEle) {
                focusEle = elem;
            }
            elem.setAttribute("aria-invalid", "true");
        }
        else {
            elem.setAttribute("aria-invalid", "false");
        }
    }

    if (!focusEle) {
        // Valid 
        taskToCreate.finishEditing();
        return;
    }

    focusEle.focus();
}

const checkRemoveErrorOutline = (fieldInfo, task) => {
    // TODO: Need to make it so that calling this gets the most recent changes from task. Need to get the new
    // Validation errors after they are set.
    const elem = document.querySelector(fieldInfo.selector);
    if (elem.hasAttribute("aria-invalid") && !fieldInfo.hasErrors) {
        elem.setAttribute("aria-invalid", "false");
    }
}

/**
 * A form to create a new task. It works by editing the fields of a task that has already been created and is marked as being edited
 * in TaskStore.
 */
const TaskCreatePopup = observer((props) => {    
    const taskStore = props.taskStore;
    const taskToCreate = taskStore.taskBeingEdited;

    const possibleInputs = {
        "title": {
            hasErrors: taskToCreate.validationErrors.title.length,
            selector: getSelector('title', 'input') 
        },
        "description": {
            hasErrors: taskToCreate.validationErrors.description.length,
            selector: getSelector('description', 'textarea') 
        },
        "start date": {
            hasErrors: taskToCreate.validationErrors.start.date.length,
            selector: getSelector('start date', 'input')
        },
        "start time": {
            hasErrors: taskToCreate.validationErrors.start.time.length,
            selector: getSelector('start time', 'input')
        },
        "due date": {
            hasErrors: taskToCreate.validationErrors.due.date.length,
            selector: getSelector('due date', 'input')
        },
        "due time": {
            hasErrors: taskToCreate.validationErrors.due.time.length,
            selector: getSelector('due time', 'input')
        },
    }

    useEffect(() => {
        const firstInput = document.querySelector("input[name='title']");
        firstInput.focus();
        const options = {
            display: {
                components: {
                    calendar: false,
                    date: false, 
                    month: false,
                    year: false,
                    decades: false, 
                }
            },
            container: document.getElementById("root")
        }
        const startPicker = new TempusDominus(document.getElementById('datetime-picker-start'), {...options, defaultDate: new Date (DateTime.now().set({hour: 0, minute: 0, second: 0}).toMillis())});
        const startSubscriptions = startPicker.subscribe(
            [ Namespace.events.change],
            [
                (e) => {
                    const time = DateTime.fromMillis(e.date.getTime()).toFormat(TIME_FORMAT);
                    taskToCreate.setStartTime(time);
                }
            ]
        );
        const duePicker = new TempusDominus(document.getElementById('datetime-picker-due'), {...options, defaultDate: new Date (DateTime.now().set({hour: 23, minute: 59, second: 59}).toMillis())});
        const dueSubscriptions = duePicker.subscribe(
            [ Namespace.events.change],
            [
                (e) => {
                    const time = DateTime.fromMillis(e.date.getTime()).toFormat(TIME_FORMAT);
                    taskToCreate.setDueTime(time);
                }
            ]
        );

        return () => {
            if (taskToCreate.beingEdited) {
                taskToCreate.abortEditing();
            }
            startSubscriptions.unsubscribe();
            startPicker.dispose();
            dueSubscriptions.unsubscribe();
            duePicker.dispose();
        }
    }, [taskToCreate])


    const startDate = taskToCreate.startDate;
    const startTime = taskToCreate.startTime; 
    const dueDate = taskToCreate.dueDate;
    const dueTime = taskToCreate.dueTime;

    return (
        <div id="new-wrapper">
            <section className="mid-section" aria-labelledby="popup-title">
                <div className="title-button-wrapper">
                    <h2 id="popup-title">New Task</h2>
                    <div className="aligned-buttons">
                        <button className="btn btn-red" title="Close" onClick={() => {
                            taskToCreate.abortEditing();
                        }}>
                            <i className="fas fa-times fa-fw fa-2x"></i>
                        </button>
                    </div>
                </div>
                <form id="add-task" className="form" onSubmit={(e) => handleSubmit(e, taskToCreate, possibleInputs)}>
                    <label>
                        Title
                        <input
                            name="title"
                            onChange={(e) => {
                                taskToCreate.setTitle(e.target.value);
                                checkRemoveErrorOutline(possibleInputs["title"], taskToCreate);
                            }}
                            value={taskToCreate.title}
                            aria-describedby={"title"+errorIdEnd}
                            required
                            />
                    </label>
                    { taskToCreate.validationErrors.title.length ? errorsList(taskToCreate.validationErrors.title, "title") : null }
                    <label>
                        Description
                        <textarea
                            name="description"
                            onChange={(e) => {
                                taskToCreate.setDescription(e.target.value);
                                checkRemoveErrorOutline(possibleInputs["description"], taskToCreate);
                            }}
                            value={taskToCreate.description}
                            aria-describedby={"description"+errorIdEnd}
                        />
                    </label>
                    { taskToCreate.validationErrors.description.length ? errorsList(taskToCreate.validationErrors.description) : null }
                    <div className={"start-due-wrapper horizontal-align"}> 
                        <TimeDateLabel 
                            label="start"
                            defaultStartBeingUsed={taskToCreate.defaultStartBeingUsed}
                            date={startDate}
                            time={startTime}
                            errors={taskToCreate.validationErrors.start}
                            dateChangeCallback={(e) => {
                                taskToCreate.setStartDate(e.target.value);
                                checkRemoveErrorOutline(possibleInputs["start date"], taskToCreate);
                            }}
                            timeChangeCallback={(e) => {
                                taskToCreate.setStartTime(e.target.value);
                                checkRemoveErrorOutline(possibleInputs["start time"], taskToCreate);
                            }}
                        />
                        <TimeDateLabel 
                            label="due"
                            defaultStartBeingUsed={taskToCreate.defaultStartBeingUsed}
                            date={dueDate}
                            time={dueTime}
                            fieldInfo={possibleInputs}
                            errors={taskToCreate.validationErrors.due}
                            dateChangeCallback={(e) => {
                                taskToCreate.setDueDate(e.target.value);
                                checkRemoveErrorOutline(possibleInputs["due date"], taskToCreate);
                            }}
                            timeChangeCallback={(e) => {
                                taskToCreate.setDueTime(e.target.value);
                                checkRemoveErrorOutline(possibleInputs["due time"], taskToCreate);
                            }}
                        />
                    </div>
                    <div className="centered">
                        <button id="add-btn" className="btn not-square" type="submit" formNoValidate={true}>Add task</button>
                    </div>
                </form>
            </section>
        </div>
    )
})

export default TaskCreatePopup;