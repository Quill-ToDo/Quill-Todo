import { observer } from "mobx-react-lite";
import { ChangeEventHandler, Fragment, ReactNode } from "react";


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

export const FormField = observer(({
    name, 
    required=false,
    onChange, 
    value="",
    labelClasses="",
    listOfValidationErrors=()=>[],
    contentBeforeInput=null,
    contentAfterInput=null,
    inputContentWrapperClasses="",

 }: {
    name: string,
    required?: boolean,
    onChange: ChangeEventHandler,
    value?: string,
    labelClasses?: string,
    listOfValidationErrors?: Function,
    contentBeforeInput?: ReactNode,
    contentAfterInput?: ReactNode,
    inputContentWrapperClasses?: string,
    })=>{

const inputId = `${name}-form-field`;
const inputElement = <input
    name={name}
    onChange={onChange}
    value={value}
    aria-describedby={inputId}
    aria-invalid={!!listOfValidationErrors.length}
    required={required}
/>;
const innerInputContent = contentAfterInput || contentBeforeInput ? <div className={inputContentWrapperClasses}>
    {contentBeforeInput}
    {inputElement}
    {contentAfterInput}
</div> : inputElement;

return <label className={labelClasses}>
    {name}
    {innerInputContent}
    { listOfValidationErrors && ErrorsList(listOfValidationErrors, inputId) }
</label>
})