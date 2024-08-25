import {
    render,
} from '@testing-library/react';
import Home from "../page";


it("should render the app without crashing", () => {
    render(<Home />);
})

it.todo("should now allow not signed out users to access the home page")
it.todo("should redirect users to home after sign in")
it.todo("Should render the calendar component")