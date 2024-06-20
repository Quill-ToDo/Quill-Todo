import { observer } from "mobx-react-lite";
import { FormEvent, Fragment, ReactNode } from "react";

const getSafeName = (unsafeName: string) => unsafeName.split(" ").join("-").toLowerCase();

const getFieldLabelSelector = ({name, outerWidgetId}: {name: string, type?: string, outerWidgetId: string}) => {
    return `${outerWidgetId} label.${getSafeName(name)}`;
}

/**
 * Render a list of errors for an element.
 * @param errors the list of errors to display.
 * @param id the id of this list of errors. Make this the value of aria-describedby for the element that has errors. 
 * @returns 
 */
export const ErrorsList = ({errors, id}: {errors: string[], id: string}) => {
    if (errors.length > 1) {
        return <Fragment> 
            <ul id={id} className="error-list" aria-live="polite">
            { 
                errors.map((errorText) => 
                    <li key={`error-${errorText}-${id}`}>
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
    let invalid = false;

    // Get element with errors to switch focus to
    for (const fieldName in fieldData) {
        const field: FormFieldParams = fieldData[fieldName];
        if (field.errors && field.errors.length) {
            invalid = true;
            const elem = document.querySelector(getFieldLabelSelector({name: field.name, outerWidgetId: outerWidgetId})) as HTMLElement;
            if (!focusEle) {
                focusEle = elem;
            }
        }
    }

    if (!invalid) {
        successCallback();
        return;
    }

    focusEle && focusEle.focus();
}

export type FormFieldParams = {
    name: string;
    type?: "input" | "textarea";
    onChange?: (e: Event) => void;
    value?: string;
    required?: boolean;
    labelClasses?: string;
    errors?: string[];
    element?: ReactNode;
}

/**
 * Return a label and corresponding input for a field. 
 * 
 * 
 */
export const FormField = observer(({
    name, 
    type="input", 
    required=false,
    onChange, 
    value,
    labelClasses,
    errors=[],
    element,
 }: FormFieldParams) => {
     if (value === undefined && element === undefined) {
         throw new Error("Either element or a value must be defined for form components");
    }
    if ((value !== undefined || onChange !== undefined)&& element !== undefined) {
        throw new Error("Please only specify (value and onChange) or element for form components.");
   }
    let inputElement;
    const safeName = getSafeName(name);
    const id = `${safeName}-error-list`;
    const props = {
        "name": safeName,
        "onChange": onChange,
        "value": value,
        "aria-describedby": id,
        "aria-invalid": !!errors.length,
        "required": required,
    }
    if (value !== undefined) {
        inputElement = type === "input" ? <input
            {...props}
        /> :
        <textarea {...props}/>;
    }
    else {
        inputElement = element;
    }
    return <label className={`${safeName}${labelClasses ? " " + labelClasses : ""} `}>
        {name}
        {inputElement}
    { errors && ErrorsList({errors: errors, id: id}) }
    </label>
});