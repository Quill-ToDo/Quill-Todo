'use client'

import DashboardLayout from './home/layout';
import List from '@/home/dashboard/@tasks/List';
import {useTaskStore, StoreProvider} from '@/store/StoreProvider';
import { observer } from 'mobx-react-lite';

const Home = observer(() => {
  const taskStore = useTaskStore();
  return (
    // <p>hello world</p>
    <StoreProvider>
      {/* // <AlertWrapper> */}
          <DashboardLayout>
            <List store={taskStore} />
            {/* <Calendar /> */}
          </DashboardLayout>
      {/* //* </AlertWrapper> * */}
    </StoreProvider>
  )
})

export default Home;
