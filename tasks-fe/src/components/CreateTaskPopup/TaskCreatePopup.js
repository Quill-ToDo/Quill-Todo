import { Fragment, useEffect } from "react";
import { observer } from "mobx-react-lite";
import './new.css';

const errorIdEnd = "-error-list";
const titleName = "Title";
const descName = "Description";
const startName = "Start";
const dueName = "Due";
const timeName = "Time";
const dateName = "Date";
const startTimeName = `${startName} ${timeName}`;
const startDateName = `${startName} ${dateName}`;
const dueTimeName = `${dueName} ${timeName}`;
const dueDateName = `${dueName} ${dateName}`;

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
    return <div>
        <h3>{props.label}</h3>
        <div className={"horizontal-align" + (props.defaultStartBeingUsed && props.label === startName ? " default" : "")}>
            <label className="date">
                {`${props.label} ${dateName}`}
                <input
                    name={`${props.label} ${dateName}`}
                    onChange={props.dateChangeCallback}
                    value={props.date}
                    aria-describedby={props.label+"-date"+errorIdEnd}
                    />
            </label>
            <label className="time">
                {`${props.label} ${timeName}`}
                <div className={"horizontal-align" + (props.defaultStartBeingUsed && props.label === startName ? " default" : "")}>
                    <input
                        id={`${props.label}-time`}
                        data-td-target={`#datetime-picker-${props.label}`}
                        name={`${props.label} ${timeName}`}
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
                        name={`${props.label} time picker`}
                        title={`Choose ${props.label} time`}
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
    </div>
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
    let focusEle = null;

    // Get element with errors to switch focus to
    for (const name in possibleInputs) {
        const field = possibleInputs[name];
        const elem = document.querySelector(field.selector);
        if (field.errors.length) {
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

const checkRemoveErrorOutline = (fieldInfo) => {
    // TODO: Need to make it so that calling this gets the most recent changes from task. Need to get the new
    // Validation errors after they are set.
    const elem = document.querySelector(fieldInfo.selector);
    if (elem.hasAttribute("aria-invalid") && fieldInfo.errors.length) {
        elem.setAttribute("aria-invalid", "false");
    }
}

/**
 * A form to create a new task. It works by editing the fields of a task that has already been created and is marked as being edited
 * in TaskStore.
 */
const TaskCreatePopup = observer((props) => {    
    const taskToCreate = props.taskStore.taskBeingEdited;

    const possibleInputs = {
        titleName: {
            errors: taskToCreate.validationErrors.title,
            selector: getSelector(titleName, 'input') 
        },
        descName: {
            errors: taskToCreate.validationErrors.description,
            selector: getSelector(descName, 'textarea') 
        },
        startDateName: {
            errors: taskToCreate.validationErrors.start.date,
            selector: getSelector(startDateName, 'input')
        },
        startTimeName: {
            errors: taskToCreate.validationErrors.start.time,
            selector: getSelector(startTimeName, 'input')
        },
        dueDateName: {
            errors: taskToCreate.validationErrors.due.date,
            selector: getSelector(dueDateName, 'input')
        },
        dueTimeName: {
            errors: taskToCreate.validationErrors.due.time,
            selector: getSelector(dueTimeName, 'input')
        },
    }

    useEffect(() => {
        const firstInput = document.querySelector(`input[name='${titleName}']`);
        firstInput.focus();

        return () => {
            if (taskToCreate.beingEdited) {
                taskToCreate.abortEditing();
            }
        }
    }, [taskToCreate])


    const startDate = taskToCreate.startDateString;
    const startTime = taskToCreate.startTimeString; 
    const dueDate = taskToCreate.dueDateString;
    const dueTime = taskToCreate.dueTimeString;

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
                            name={titleName}
                            onChange={(e) => {
                                taskToCreate.setTitle(e.target.value);
                                checkRemoveErrorOutline(possibleInputs.titleName);
                            }}
                            value={taskToCreate.title}
                            aria-describedby={titleName+errorIdEnd}
                            required
                            />
                    </label>
                    { taskToCreate.validationErrors.title.length ? errorsList(taskToCreate.validationErrors.title, "title") : null }
                    <label>
                        Description
                        <textarea
                            name={descName}
                            onChange={(e) => {
                                taskToCreate.setDescription(e.target.value);
                                checkRemoveErrorOutline(possibleInputs.descName);
                            }}
                            value={taskToCreate.description}
                            aria-describedby={descName+errorIdEnd}
                        />
                    </label>
                    { taskToCreate.validationErrors.description.length ? errorsList(taskToCreate.validationErrors.description) : null }
                    <div className={"start-due-wrapper horizontal-align"}> 
                        <TimeDateLabel 
                            label={startName}
                            defaultStartBeingUsed={taskToCreate.defaultStartBeingUsed}
                            date={startDate}
                            time={startTime}
                            errors={taskToCreate.validationErrors.start}
                            dateChangeCallback={(e) => {
                                taskToCreate.setStartDateFromString(e.target.value);
                                checkRemoveErrorOutline(possibleInputs.startDateName);
                            }}
                            timeChangeCallback={(e) => {
                                taskToCreate.setStartTimeFromString(e.target.value);
                                checkRemoveErrorOutline(possibleInputs.startTimeName);
                            }}
                        />
                        <TimeDateLabel 
                            label={dueName}
                            defaultStartBeingUsed={taskToCreate.defaultStartBeingUsed}
                            date={dueDate}
                            time={dueTime}
                            fieldInfo={possibleInputs}
                            errors={taskToCreate.validationErrors.due}
                            dateChangeCallback={(e) => {
                                taskToCreate.setDueDateFromString(e.target.value);
                                checkRemoveErrorOutline(possibleInputs.dueDateName);
                            }}
                            timeChangeCallback={(e) => {
                                taskToCreate.setDueTimeFromString(e.target.value);
                                checkRemoveErrorOutline(possibleInputs.dueTimeName);
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