import { ChangeEvent, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import './NewTask.css';
import { ICONS } from "@/util/constants";
import { ColorBubble, TaskTitle } from "@/widgets/TaskDetail/TaskComponents";
import { FormField } from "@util/FormComponents";
import { TaskContext, TaskModel } from "@/store/tasks/TaskModel";
import { DRAGGABLE_HANDLE_CLASS } from "@/app/@util/Draggable";

const OUTER_WRAPPER_NAME = "new-wrapper";

/**
 * A form to create a new task. 
 * It surfaces and edits the editable fields of a task that has already been created 
 * and is marked as "beingCreated"
 * in TaskStore.
 */
export const AddNewTaskPopUp = observer(({
    close, 
    taskToCreate
}: {
        close: () => void,
        taskToCreate: TaskModel | null, 
    }) => {
    const formRef = useRef(null);

    return (!taskToCreate ? <></> : <TaskContext.Provider value={taskToCreate} >
        <div className={OUTER_WRAPPER_NAME}>
            <header className={DRAGGABLE_HANDLE_CLASS}>
                <div className="aligned columns gap">
                    {ICONS.DRAG}
                    <h2 id="popup-title">New Task</h2>
                </div>
                <button className="btn small square end" title="Close" onClick={() => {
                    taskToCreate && taskToCreate.abortTaskCreation();
                    close();
                }}>
                    { ICONS.X }
                </button>
            </header>
            <section className="mid-section" aria-labelledby="popup-title">
                <form 
                    id="add-taskToCreate" 
                    ref={formRef}
                    className="form"
                    onSubmit={(e) =>  {
                        e.preventDefault();
                        if (taskToCreate) { 
                            if (taskToCreate.isValid) {
                                taskToCreate.submitNewTask().then(((value) => {
                                    close();
                                })); 
                            }
                            else {
                                let focusEle = e.target.querySelector(`[aria-invalid="true"]`);
                                !!focusEle && focusEle.focus();
                            }
                        }
                    }}
                >
                    <div id="title-color" className="rows gap">
                        <FormField 
                            name="Color"
                            required={true}
                            element={<ColorBubble />}
                            />
                        <FormField
                            name="Title"
                            required={true}
                            element={<TaskTitle editAllowed={true} {...{autoFocus: true}}/>}
                        />
                    </div>
                    <FormField 
                        name={`Description`}
                        required={false}
                        type={`textarea`}
                        inputProps={
                            { 
                                value: taskToCreate.description,
                                onChange: function (e: ChangeEvent) { e.target && (taskToCreate.description = (e.target as HTMLTextAreaElement).value);}

                            }
                        }
                        errors={taskToCreate.validationErrors.description}
                    />
                    <div className={"start-due-wrapper rows"}> 
                        <div>
                            <div className={"columns gap"}>
                                <FormField 
                                    name={`Start Date`}
                                    required={false}
                                    inputProps={
                                        { 
                                            value: taskToCreate.startDateStringUnderEdit,
                                            onChange: function (e: ChangeEvent) { e.target && taskToCreate.setStartDateStringUnderEdit(e.target.value);},
                                        }
                                    }
                                    errors={taskToCreate.validationErrors.startDateStringUnderEdit}
                                />
                                <FormField 
                                    name={`Start Time`}
                                    required={false}
                                    inputProps={
                                        { 
                                            value: taskToCreate.startTimeStringUnderEdit,
                                            onChange: function (e: ChangeEvent) { e.target && taskToCreate.setStartTimeStringUnderEdit(e.target.value); }
            
                                        }
                                    }
                                    errors={taskToCreate.validationErrors.startTimeStringUnderEdit}
                                />
                            </div>
                        </div>
                        <div>
                            <div className={"columns gap"}>
                                <FormField 
                                    name={`Due Date`}
                                    required={false}
                                    inputProps={
                                        { 
                                            value: taskToCreate.dueDateStringUnderEdit,
                                            onChange: function (e: ChangeEvent) { e.target && taskToCreate.setDueDateStringUnderEdit(e.target.value); }
            
                                        }
                                    }
                                    errors={taskToCreate.validationErrors.due.concat(taskToCreate.validationErrors.workInterval, taskToCreate.validationErrors.dueDateStringUnderEdit)}
                                />
                                <FormField  
                                    name={`Due Time`}
                                    required={false}
                                    inputProps={
                                        { 
                                            value: taskToCreate.dueTimeStringUnderEdit,
                                            onChange: function (e: ChangeEvent) { e.target && taskToCreate.setDueTimeStringUnderEdit(e.target.value); }
            
                                        }
                                    }
                                    errors={ taskToCreate.validationErrors.dueTimeStringUnderEdit}
                                    
                                />
                            </div>
                        </div>
                    </div>
                    <div className="centered">
                        <button id="add-btn" className="btn large text" type="submit" formNoValidate={true}>Add</button>
                    </div>
                </form>
            </section>
        </div>
    </TaskContext.Provider>
    )
})