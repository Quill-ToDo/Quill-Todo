import App from "../../App"
import Home from '../Home';
import {
    render,
    screen
} from '@testing-library/react';

it("should render the app without crashing", () => {
    render(<App />);
})

it.todo("should now allow not signed out users to access the home page")
it.todo("should redirect users to home after sign in")
it.todo("Should render the calendar component")


it("should render the list component", () => {
    render(<Home />);
    expect(screen.getByRole("region", {name:"Task list"})).toBeInTheDocument();
})

it.todo("should should a task-creation popup when users click the add button")
it.todo("should show error message if the user tries to create task without title")
it.todo("should show error message if the user tries to create task without due date")
it.todo("should show error message if the user tries to create task with start after due date")
it.todo("should show error message if the user tries to create task with a ill-formed start date")
it.todo("should show error message if the user tries to create task with a ill-formed due date")