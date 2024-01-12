import Home from './Home';
import { StoreProvider } from "./StoreContext";
import AlertWrapper from './Alerts/AlertWrapper';

function App() {
  return (
      <StoreProvider>
            <AlertWrapper>
                <Home />
            </AlertWrapper>
      </StoreProvider>
  );
}

export default App;
