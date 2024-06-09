import { Fragment, useEffect } from "react";
import { observer } from "mobx-react-lite";
import './NewTask.css';
import { makeDraggable } from "@/util/Draggable";
import { ICONS } from "@/util/constants";
import { ColorBubble } from "../TaskDetail/TaskComponents";
import { FormField } from "@/app/@util/FormComponents";
const ERROR_ID_END = "-error-list";

/**
 * @param {string[]} errors List of errors to display 
 * @returns List of errors
 */
const ErrorsList = (errors, id) => {
    if (errors.length > 1) {
        return <Fragment> 
            <ul id={id} className="error-list" aria-live="polite">
            { 
                errors.map((errorText) => 
                    <li key={"error-"+errorText}>
                        {errorText}
                    </li>
                )
            }
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
 * s
 * ---
 * 
 * *Required props:*
 *  - **label** : string - Label that will be used in classes and IDs. "start" or "due" probably.
 *  - **date** : object - The date that will appear in the date form field
 *       - **name**: string - name of the field
 *       - **id**: string - to use for IDs
 *       - **value**: string - value of the field
 *       - **errors**: list<string> - errors of the field
 *       - **selector**: function () - returns string to use to select this element
 *       - **change**: function (e) - method to call on change
 *  - **time** : object - The time that will appear in the time form field
 *     - Same format as **date** above
 * @param {*} props
 * @returns 
 */
const TimeDateLabel = (props) => {
    const startOrDue = props.label;
    const date = props.date;
    const time = props.time;
    const timeErrorListId = `${time.idPrefix}${ERROR_ID_END}`;
    const dateErrorListId = `${date.idPrefix}${ERROR_ID_END}`;
    return <div>
        <h3>{startOrDue}</h3>
        <div className={"horizontal-align"}>
            <label className={`${date.idPrefix} sublabel`}>
                {date.name}
                <input
                    id={`${date.idPrefix}-input`}
                    name={date.name}
                    onChange={date.change}
                    value={date.value}
                    aria-describedby={dateErrorListId}
                    aria-invalid={date.errorsForInvalidField.length !== 0}
                    />
            </label>
            <label className={`${time.idPrefix} sublabel`}>
                {time.name}
                <div className={"horizontal-align"}>
                    <input
                        id={`${time.idPrefix}-input`}
                        name={time.name}
                        onChange={time.change}
                        value={time.value}
                        aria-describedby={timeErrorListId}
                        aria-invalid={time.errorsForInvalidField.length !== 0}
                    />
                </div>
            </label>
        </div>
        <div className="horizontal-align">
            { date.errorsToDisplay&& date.errorsToDisplay.length ? ErrorsList(date.errorsToDisplay, dateErrorListId) : null }
            { time.errorsToDisplay&& time.errorsToDisplay.length ? ErrorsList(time.errorsToDisplay, timeErrorListId) : null }
        </div>
    </div>
}

/**
 * A form to create a new task. It works by editing the fields of a task that has already been created and is marked as being edited
 * in TaskStore.
 */
const NewTaskPopUp = observer((props) => {
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
            if (field.errorsToDisplay.length) {
                const elem = document.querySelector(field.selectorForFieldElement());
                if (!focusEle) {
                    focusEle = elem;
                }
            }
        }

        if (!focusEle) {
            // Valid 
            taskToCreate.finishEditing();
            return;
        }

        focusEle.focus();
    }
    const taskToCreate = props.taskStore.taskBeingEdited;

    const fields = {
        title: {
            name: `Title`,
            idPrefix: `title`,
            value: taskToCreate.title,
            errorsToDisplay: taskToCreate.validationErrors.title,
            errorsForInvalidField: taskToCreate.validationErrors.title,
            selectorForFieldElement: function () { return getSelector(fields.title.name, 'input'); },
            change: function (e) {
                taskToCreate.setTitle(e.target.value);
            },
        },
        desc: {
            name: `Description`,
            idPrefix: `desc`,
            value: taskToCreate.description,
            errorsToDisplay: taskToCreate.validationErrors.description,
            errorsForInvalidField: taskToCreate.validationErrors.description,
            selectorForFieldElement: function () { return getSelector(fields.desc.name, 'textarea'); },
            change: function (e) {
                taskToCreate.setDescription(e.target.value);
            },
        },
        startDate: {
            name: `Start Date`,
            idPrefix: `startDate`,
            value: taskToCreate.startDateString,
            errorsToDisplay: taskToCreate.validationErrors.startDateString.concat(taskToCreate.validationErrors.start),
            errorsForInvalidField: taskToCreate.validationErrors.startDateString.concat(taskToCreate.validationErrors.start).concat(taskToCreate.validationErrors.workInterval),

            selectorForFieldElement: function () { return getSelector(fields.startDate.name, 'input'); },
            change: function (e) {
                taskToCreate.setStartDateString(e.target.value);
            },
        },
        startTime: {
            name: `Start Time`,
            idPrefix: `startTime`,
            value: taskToCreate.startTimeString,
            errorsToDisplay: taskToCreate.validationErrors.startTimeString,
            errorsForInvalidField: taskToCreate.validationErrors.startTimeString.concat(taskToCreate.validationErrors.workInterval),
            selectorForFieldElement: function () { return getSelector(fields.startTime.name, 'input'); },
            change: function (e) {
                taskToCreate.setStartTimeString(e.target.value);
            },
        },
        dueDate: {
            name: `Due Date`,
            idPrefix: `dueDate`,
            value: taskToCreate.dueDateString,
            errorsToDisplay: taskToCreate.validationErrors.dueDateString.concat(taskToCreate.validationErrors.due),
            errorsForInvalidField: taskToCreate.validationErrors.dueDateString.concat(taskToCreate.validationErrors.due).concat(taskToCreate.validationErrors.workInterval),
            selectorForFieldElement:  function () { return getSelector(fields.dueDate.name, 'input'); },
            change: function (e) {
                taskToCreate.setDueDateString(e.target.value);
            },
        },
        dueTime: {
            name: `Due Time`,
            idPrefix: `dueTime`,
            value: taskToCreate.dueTimeString,
            errorsToDisplay:  taskToCreate.validationErrors.dueTimeString,
            errorsForInvalidField: taskToCreate.validationErrors.dueTimeString.concat(taskToCreate.validationErrors.workInterval),
            selectorForFieldElement:  function () { return getSelector(fields.dueTime.name, 'input'); },
            change: function (e) {
                taskToCreate.setDueTimeString(e.target.value);
            },
        },
        workInterval : {
            name: `Work Range`,
            idPrefix: `startDate`,
            value: '',
            selectorForFieldElement: function () { return getSelector(fields.startDate.name, 'input'); },
            errorsToDisplay: taskToCreate.validationErrors.workInterval,
            errorsForInvalidField: taskToCreate.validationErrors.workInterval,
        },
        color : {
            name: `Color`,
            idPrefix: `color`,
            value: taskToCreate.colorString,
            selectorForFieldElement: function () { return getSelector(fields.color.name, 'input'); },
            errorsToDisplay: taskToCreate.validationErrors.color,
            errorsForInvalidField: taskToCreate.validationErrors.color,
            change: function (e) {
                taskToCreate.setColorString(e.target.value);
            }
        }
    }

    useEffect(() => {
        makeDraggable(document.querySelector("#new-wrapper.popup"));
        const firstInput = document.querySelector(`input[name='${fields.title.name}']`);
        firstInput.focus();

        return () => {
            if (taskToCreate.beingEdited) {
                taskToCreate.abortEditing();
            }
        }
    }, [taskToCreate, fields.title.name])

    return (
        <div id="new-wrapper" className="popup draggable">
            <div className="header-container draggable-handle">
                <h2 id="popup-title">New Task</h2>
                <div className="aligned end">
                    <button className="btn small square btn-red" title="Close" onClick={() => {
                        taskToCreate.abortEditing();
                    }}>
                        { ICONS.X }
                    </button>
                </div>
            </div>
            <section className="mid-section" aria-labelledby="popup-title">
                <form id="add-task" className="form" onSubmit={(e) => handleSubmit(e, taskToCreate, fields)}>
                    <div id="title-color">
                        <FormField 
                             name={fields.title.name}
                             required={true}
                             onChange={fields.title.change}
                             value={fields.title.value}
                             listOfValidationErrors={fields.title.errorsToDisplay}
                             labelClasses={"title"}
                        />
                        <div className="color-label-wrapper">
                            <FormField
                                name={fields.color.name}
                                required={true}
                                onChange={fields.color.change}
                                value={fields.color.value}
                                listOfValidationErrors={fields.color.errorsToDisplay}
                                labelClasses={"color"}
                                contentBeforeInput={<ColorBubble task={taskToCreate}/>}
                                inputContentWrapperClasses="color-label-wrapper"
                            />
                        </div>
                    </div>
                    <label>
                        Description
                        <textarea
                            name={fields.desc.name}
                            onChange={fields.desc.change}
                            value={fields.desc.value}
                            aria-describedby={fields.desc.idPrefix}
                            aria-invalid={fields.desc.errorsForInvalidField.length !== 0}
                        />
                    </label>
                    { fields.desc.errorsToDisplay && ErrorsList(fields.desc.errorsToDisplay, fields.desc.idPrefix) }
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
                        { fields.workInterval.errorsToDisplay && fields.workInterval.errorsToDisplay && ErrorsList(fields.workInterval.errorsToDisplay, fields.workInterval.idPrefix)}
                        <button id="add-btn" className="btn large" type="submit" formNoValidate={true}>+</button>
                    </div>
                </form>
            </section>
        </div>
    )
})

export default NewTaskPopUp;