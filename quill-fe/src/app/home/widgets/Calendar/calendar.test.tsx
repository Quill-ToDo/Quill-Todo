import { CalendarWidget, CALENDAR_WIDGET_NAME } from "./Calendar";
import {
    render,
    screen,
} from '@testing-library/react';
import { testTaskStore, } from "@/app/__testing__/jest.setup.test";

beforeEach(() => {
    render(<CalendarWidget passedStore={testTaskStore}/>);
})

it("should render the calendar", async () => {
    expect(await screen.findByRole("region", {name: CALENDAR_WIDGET_NAME})).toBeInTheDocument();
})

// it.todo("should show a loading ion before the celndar loads")
// it.todo("should show all tasks for the current month on first render")
// it.todo("should show pop-up to add a task to the calendar after clicking on a date")
// it.todo("should add a task to the calendar after selecting a date range")
// it.todo("should add a newly added task to the server database")
// it.todo("should show a newly created task in the list")
// it.todo("should update a task when a user moves an event in the calendar")