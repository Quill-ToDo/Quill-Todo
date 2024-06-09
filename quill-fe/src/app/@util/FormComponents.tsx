import { observer } from "mobx-react-lite";
import { FormEvent, Fragment, ReactNode } from "react";

export const ErrorsList = ({errors, errorListId}: {errors: string[], errorListId?: string}) => {
    if (errors.length > 1) {
        return <Fragment> 
            <ul id={errorListId} className="error-list" aria-live="polite">
            { 
                errors.map((errorText) => 
                    <li key={`error-${errorText}-${errorListId}`}>
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
 * Handle submission of the form. Validates that the task does not have any errors. If it does, it moves focus to the first field in the form
 * with errors. Otherwise, the task is saved to the DB.
 * 
 */
export const handleSubmit = ({
    outerWidgetId,
    submitEvent,
    successCallback,
    fieldData,
}: {
    outerWidgetId: string,
    submitEvent: FormEvent,
    successCallback: () => void,
    fieldData: any, 
    }) => {
    submitEvent.preventDefault();
    let focusEle;

    // Get element with errors to switch focus to
    for (const fieldName in fieldData) {
        const field: FormFieldParams = fieldData[fieldName];
        if (field.errors && field.errors.length) {
            const elem = document.querySelector(getFieldInputSelector({name: field.name, type: field.type, outerWidgetId})) as HTMLElement;
            if (!focusEle) {
                focusEle = elem;
            }
        }
    }

    if (!focusEle) {
        // Valid 
        successCallback();
        return;
    }

    focusEle.focus();
}


const getFieldInputSelector = ({name, type="input", outerWidgetId}: {name: string, type?: string, outerWidgetId: string}) => {
    return `${outerWidgetId}-${name}-${type}`;
}

export type FormFieldParams = {
    name: string;
    type?: "input" | "textarea";
    outerWidgetId: string;
    onChange: (e: Event) => void;
    value: string;
    required?: boolean;
    labelClasses?: string;
    inputContentWrapperClasses?: string;
    errors?: string[];
    contentBeforeInput?: ReactNode;
    contentAfterInput?: ReactNode;
}
export const FormField = observer(({
    name, 
    type="input", 
    outerWidgetId, 
    required=false,
    onChange, 
    value="",
    labelClasses="",
    errors=[],
    contentBeforeInput=null,
    contentAfterInput=null,
    inputContentWrapperClasses="",

 }: FormFieldParams) => {
    const inputId = getFieldInputSelector({name, type, outerWidgetId});
    const errorListId = `${inputId}-error-list`;
    const props = {
        "id": inputId,
        "name": name,
        "onChange": onChange,
        "value": value,
        "aria-describedby": errorListId,
        "aria-invalid": !!errors.length,
        "required": required,
    }
    const inputElement = type === "input" ? <input
        {...props}
    /> :
    <textarea {...props}/>;

    const innerInputContent = contentAfterInput || contentBeforeInput ? <div className={inputContentWrapperClasses}>
        {contentBeforeInput}
        {inputElement}
        {contentAfterInput}
    </div> : inputElement;

    return <label className={labelClasses}>
        {name}
        {innerInputContent}
        { errors && ErrorsList({errors: errors, errorListId: errorListId}) }
    </label>
});