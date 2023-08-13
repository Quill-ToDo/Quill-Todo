import DashboardLayout from './home/layout';
import { StoreProvider } from './home/_globalStore/RootStore';
// import AlertWrapper from './components/AlertWrapper';

export default function Home() {
  return (
    // <p>hello world</p>
    <StoreProvider>
      {/* // <AlertWrapper> */}
          <DashboardLayout>
          {/* // <List store={taskStore} />
            // <p>
            // <Calendar />  */}
          </DashboardLayout>
      {/* //* </AlertWrapper> * */}
    </StoreProvider>
  )
}
