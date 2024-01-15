import { Fragment, useEffect } from "react";
import { observer } from "mobx-react-lite";
import './new.css';
const ERROR_ID_END = "-error-list";
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
const errorsList = (errors, id) => {
    if (errors.length > 1) {
        return <Fragment> 
            <ul id={id} className="error-list" aria-live="polite">
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
 *  - **dateErrors** : object - Any errors for this field
 *  - **timeErrors"* : object - Any errors for this field
 *  - **dateChangeCallback** : () => any - Method that will be called when the date is changed
 *  - **timeChangeCallback** : () => any - Method that will be called when the time is changed 
 * 
 * @param {*} props
 * @returns 
 */
const TimeDateLabel = (props) => {
    const startOrDue = props.label;
    const date = props.date;
        // name: `Due Date`,
        // value: taskToCreate.dueDateString,
        // errors: taskToCreate.validationErrors.dueDateString,
        // selector: getSelector(dueDateName, 'input'),
        // change: function (e) {
        //     taskToCreate.setDueDateFromString(e.target.value);
        //     checkRemoveErrorOutline(this);
        // }
    const time = props.time;
    return <div>
        <h3>{startOrDue}</h3>
        <div className={"horizontal-align"}>
            <label className={date.id}>
                {date.name}
                <input
                    name={date.name}
                    onChange={date.change}
                    value={date.value}
                    aria-describedby={date.errorId}
                    />
            </label>
            <label className={time.id}>
                {time.name}
                <div className={"horizontal-align"}>
                    <input
                        id={`${startOrDue}-${time.id}`}
                        name={time.name}
                        onChange={time.change}
                        value={time.value}
                        aria-describedby={time.errorId}
                    />
                    <button 
                        id={`datetime-picker-${startOrDue}`} 
                        className="btn no-shadow datepicker-toggle" 
                        type="button"
                        name={`${startOrDue} time picker`}
                        title={`Choose ${startOrDue} time`}
                        >
                        <i className="far fa-clock fa-fw"></i>
                    </button>
                </div>
            </label>
        </div>
        <div className="horizontal-align">
        { date.errors.length ? errorsList(date.errors, date.errorId) : null }
        { time.errors.length ? errorsList(time.errors, time.errorId) : null }
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

    const fields = {
        title: {
            name: `Title`,
            id: `title`,
            value: taskToCreate.title,
            errors: taskToCreate.validationErrors.title,
            selector: function () { return getSelector(this.name, 'input'); },
            change: function (e) {
                taskToCreate.setTitle(e.target.value);
                checkRemoveErrorOutline(this);
            },
            errorId: `title-${ERROR_ID_END}`,
        },
        desc: {
            name: `Description`,
            value: taskToCreate.description,
            errors: taskToCreate.validationErrors.description,
            selector: function () { getSelector(this.name, 'textarea'); },
            change: function (e) {
                taskToCreate.setDescription(e.target.value);
                checkRemoveErrorOutline(this);
            },
            errorId: `desc-${ERROR_ID_END}`,
        },
        startDate: {
            name: `Start Date`,
            value: taskToCreate.startDateString,
            errors: taskToCreate.validationErrors.startDateString,
            selector: function () { return getSelector(this.name, 'input')},
            change: function (e) {
                taskToCreate.setStartDateFromString(e.target.value);
                checkRemoveErrorOutline(this);
            },
            errorId: `startDate-${ERROR_ID_END}`,
        },
        startTime: {
            name: `Start Time`,
            value: taskToCreate.startTimeString,
            errors: function () { return taskToCreate.validationErrors.startTimeString; },
            selector: function () { return getSelector(this.name, 'input'); },
            change: function (e) {
                taskToCreate.setStartTimeFromString(e.target.value);
                checkRemoveErrorOutline(this);
            },
            errorId: `startTime-${ERROR_ID_END}`,
        },
        dueDate: {
            name: `Due Date`,
            value: taskToCreate.dueDateString,
            errors: taskToCreate.validationErrors.dueDateString,
            selector:  function () { return getSelector(this.name, 'input'); },
            change: function (e) {
                taskToCreate.setDueDateFromString(e.target.value);
                checkRemoveErrorOutline(this);
            },
            errorId: `dueDate-${ERROR_ID_END}`,
        },
        dueTime: {
            name: `Due Time`,
            value: taskToCreate.dueTimeString,
            errors:  function () { return taskToCreate.validationErrors.dueTimeName; },
            selector:  function () { return getSelector(this.name, 'input'); },
            change: function (e) {
                taskToCreate.setDueTimeFromString(e.target.value);
                checkRemoveErrorOutline(this);
            },
            errorId: `dueTime-${ERROR_ID_END}`,

        },
    }

    useEffect(() => {
        const firstInput = document.querySelector(`input[name='${fields.title.name}']`);
        firstInput.focus();

        return () => {
            if (taskToCreate.beingEdited) {
                taskToCreate.abortEditing();
            }
        }
    }, [taskToCreate, fields.title.name])

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
                <form id="add-task" className="form" onSubmit={(e) => handleSubmit(e, taskToCreate, fields)}>
                    <label>
                        Title
                        <input
                            name={fields.title.name}
                            onChange={fields.title.change}
                            value={fields.title.value}
                            aria-describedby={fields.title.errorId}
                            required
                            />
                    </label>
                    { fields.title.errors.length ? errorsList(fields.title.errors, fields.title.errorId) : null }
                    <label>
                        Description
                        <textarea
                            name={fields.desc.name}
                            onChange={fields.desc.change}
                            value={fields.desc.value}
                            aria-describedby={fields.desc.errorId}
                        />
                    </label>
                    { fields.desc.errors.length ? errorsList(fields.desc.errors, fields.desc.errorId) : null }
                    <div className={"start-due-wrapper horizontal-align"}> 
                        <TimeDateLabel 
                            label={"Start"}
                            date={fields.startDate}
                            time={fields.startTime}
                        />
                        <TimeDateLabel 
                            label={"Due"} 
                            date={fields.dueDate}
                            time={fields.dueTime}
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