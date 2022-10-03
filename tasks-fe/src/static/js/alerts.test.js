import App from "../../App";
import {
    render,
} from '@testing-library/react';
import { addAlert, NOTICE_ALERT } from "./alertEvent";

it("should not let an alert be generated if it is passed a null element", async () => {
    render(<App />);
    expect(() => addAlert(null, NOTICE_ALERT, "This should not generate!!")).toThrow("Target element for alert bubble cannot be null.");

})