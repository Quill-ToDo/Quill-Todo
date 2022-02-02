import Login from './components/Login';
import { StoreProvider } from "./store/StoreContext";
import AlertBox from './components/AlertWrapper';

function LoginApp() {

  return (
      <StoreProvider>
            <AlertBox />
            <Login />
      </StoreProvider>
  );
}

export default LoginApp;
