import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import './NewTask.css';
import { makeDraggable } from "@/util/Draggable";
import { ICONS } from "@/util/constants";
import { ColorBubble, TaskTitle } from "@/widgets/TaskDetail/TaskComponents";
import { FormField, FormFieldParams, handleSubmit } from "@util/FormComponents";
import { TaskModel } from "../../_globalStore/tasks/TaskModel";

const OUTER_WRAPPER_NAME = "new-wrapper";
const OUTER_WRAPPER_ID = `#${OUTER_WRAPPER_NAME}`;

/**
 * A form to create a new task. 
 * It surfaces and edits the editable fields of a task that has already been created 
 * and is marked as "beingCreated"
 * in TaskStore.
 */
const AddNewTaskPopUp = observer(({close, taskToCreate}: 
    {
        close: () => void, 
        taskToCreate: TaskModel | null, 
    }) => {

    if (!taskToCreate) {
        return null;
    }

    useEffect(() => {
        const popup = document.querySelector(OUTER_WRAPPER_ID);
        popup && makeDraggable(popup as HTMLElement);
        const firstInput = document.querySelector(`input[name='${formData[Object.keys(formData)[0]].name}']`) as HTMLElement;
        firstInput && firstInput.focus();
        
        // return (() => {
        //     if (taskToCreate && taskToCreate.isNewAndUnsubmitted) {
        //         taskToCreate.abortTaskCreation();
        //     }
        // })
    }, [])

    
    const formData: {
        [index: string]: FormFieldParams,
        [index: number]: FormFieldParams,
        title: FormFieldParams, 
        desc: FormFieldParams, 
        startDate: FormFieldParams, 
        startTime: FormFieldParams, 
        dueDate: FormFieldParams, 
        dueTime: FormFieldParams, 
        color: FormFieldParams, 

    } = {
        title: {
            name: `Title`,
            element: <TaskTitle task={taskToCreate} editAllowed={true}/>,
        },
        desc: {
            name: `Description`,
            type: `textarea`,
            value: taskToCreate.description,
            errors: taskToCreate.validationErrors.description,
            onChange: function (e) { e.target && taskToCreate.setDescription(e.target.value); },
        },
        startDate: {
            name: `Start Date`,
            value: taskToCreate.startDateStringUnderEdit,
            errors: taskToCreate.validationErrors.startDateStringUnderEdit,
            onChange: function (e) { e.target && taskToCreate.setStartDateStringUnderEdit(e.target.value); },
        },
        startTime: { 
            name: `Start Time`,
            value: taskToCreate.startTimeStringUnderEdit,
            errors: taskToCreate.validationErrors.startTimeStringUnderEdit,
            onChange: function (e) { e.target && taskToCreate.setStartTimeStringUnderEdit(e.target.value); },
        },
        dueDate: {
            name: `Due Date`,
            value: taskToCreate.dueDateStringUnderEdit,
            errors: taskToCreate.validationErrors.due.concat(taskToCreate.validationErrors.workInterval, taskToCreate.validationErrors.dueDateStringUnderEdit),
            onChange: function (e) { e.target && taskToCreate.setDueDateStringUnderEdit(e.target.value); },
        },
        dueTime: {
            name: `Due Time`,
            value: taskToCreate.dueTimeStringUnderEdit,
            errors:  taskToCreate.validationErrors.dueTimeStringUnderEdit,
            onChange: function (e) { e.target && taskToCreate.setDueTimeStringUnderEdit(e.target.value); },

        },
        color: {
            name: `Color`,
            required: true,
            element: <ColorBubble task={taskToCreate}/>,
        }
    }

    return (
        <div id={OUTER_WRAPPER_NAME} className="popup draggable">
            <div className="header-container draggable-handle">
                <h2 id="popup-title">New Task</h2>
                <div className="aligned end">
                    <button className="btn small square" title="Close" onClick={() => {
                        close();
                        taskToCreate && taskToCreate.abortTaskCreation();
                    }}>
                        { ICONS.X }
                    </button>
                </div>
            </div>
            <section className="mid-section" aria-labelledby="popup-title">
                <form id="add-taskToCreate" className="form" onSubmit={(e) => handleSubmit({
                    outerWidgetId: OUTER_WRAPPER_ID,
                    submitEvent: e,
                    successCallback: () => {
                        if (taskToCreate) { taskToCreate.submitNewTask(); }
                        }, 
                    fieldData: formData, 
                })}>
                    <div id="title-color">
                        <FormField {...formData.color} />
                        <FormField {...formData.title} />
                    </div>
                    <FormField {...formData.desc}/>
                    <div className={"start-due-wrapper horizontal-align"}> 
                        <div>
                            <div className={"horizontal-align"}>
                                <FormField {...formData.startDate} />
                                <FormField {...formData.startTime} />
                            </div>
                        </div>
                        <div>
                            <div className={"horizontal-align"}>
                                <FormField {...formData.dueDate} />
                                <FormField {...formData.dueTime} />
                            </div>
                        </div>
                    </div>
                    <div className="centered">
                        <button id="add-btn" className="btn large text" type="submit" formNoValidate={true}>Add</button>
                    </div>
                </form>
            </section>
        </div>
    )
})

export default AddNewTaskPopUp;