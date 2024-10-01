import { observer } from "mobx-react-lite";
import { ComponentPropsWithRef, ComponentPropsWithoutRef, Fragment, ReactNode } from "react";
import { combineClassNamePropAndString } from "./constants";

const getSafeName = (unsafeName: string) => unsafeName.split(" ").join("-").toLowerCase();

/**
 * Render a list of errors for an element.
 * @param errors the list of errors to display.
 * @param errorIdRef the errorIdRef of this list of errors. Make this the props.value of aria-describedby for the element that has errors. 
 * @returns 
 */
export const ErrorsList = observer(({
    errors, 
    id,
    ...props
}: {
    errors: string[], 
    id: string
}) => {
    if (errors.length > 1) {
        return <Fragment> 
            <ul 
                id={id} 
                className={combineClassNamePropAndString({className: "error-list", props: props})} 
                aria-live="polite" 
                {...props}
            >
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
        return <p id={id} className="error-list">{errors[0]}</p>
    }
})

export type FormFieldParams = {
    name: string;
    required: boolean;
    labelProps?: ComponentPropsWithRef<"label">;
    element?: ReactNode;
    type?: "input" | "textarea";
    inputProps?: ComponentPropsWithoutRef<"textarea"> | ComponentPropsWithoutRef<"input">;
    errors?: string[];
}

/**
 * Return a label and corresponding input for a field. 
 * 
 * Either specify an imput element to wrap in a label, or specify a type of input to
 * create either <input /> or <textarea />. 
 * Refs must be 
 * forwarded for the label element so that other form helpers can target the DOM nodes.
 * 
 */
export const FormField = observer((
    {
        name,
        required,
        labelProps,
        element,
        type,
        inputProps,
        errors
    } 
    : FormFieldParams) => {
    const areErrors = errors && !!errors.length;
    if (inputProps === undefined && element === undefined) {
         throw new Error("Either an element or inputProps must be defined for FormField.");
    }
    else if (inputProps !== undefined && element !== undefined) {
        throw new Error("Please only specify inputProps or element for FormField.");
    }
    else if (inputProps !== undefined) {
        if (inputProps.onChange === undefined) {
            throw new Error("Please specify a change event handler for the input element.");
        }
        if (inputProps.value === undefined) {
            throw new Error("Please specify the value of the field.");
        }
    }
    const safeName = getSafeName(name);
    const errorId = `${safeName}-error-list`;
    const moreInputProps: ComponentPropsWithoutRef<"textarea"> | ComponentPropsWithoutRef<"input"> = {
        ...inputProps,
        "required": required,
        "aria-invalid": areErrors,
    }
    const moreLabelProps: ComponentPropsWithRef<"label"> = {
        ...labelProps,
    }
    if (areErrors) {
        moreLabelProps["aria-describedby"] = errorId;
    }
    // If an input element eas provided, use that, otherwise choose between input and textarea inputs
    // based on type
    let inputElement = element ? element : (
        type && type === "textarea" ? <textarea {...moreInputProps as ComponentPropsWithoutRef<"textarea">}/> 
        : <input {...moreInputProps as ComponentPropsWithoutRef<"input">} />
    );
    return <label className={`${safeName}`} {...moreLabelProps}>
        { name }
        { inputElement }
        { areErrors && <ErrorsList errors={errors} id={errorId} />}
    </label>
});