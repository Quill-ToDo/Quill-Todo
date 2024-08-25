'use client'

import DashboardLayout from './home/dashboardLayout';
import AlertWrapper from '@/alerts/AlertWrapper';
import { StoreProvider } from '@/store/StoreProvider';
import { observer } from 'mobx-react-lite';
import { ReactNode } from 'react';
import RootStore from './home/_globalStore/RootStore';

const QuillContext = observer(({
  widgets,
  rootStore,
}:{
  widgets?: ReactNode,
  rootStore?: RootStore,
}) => {
  return (
    <StoreProvider rootStore={rootStore}>
      <AlertWrapper>
          <DashboardLayout>
            {widgets}
          </DashboardLayout>
      </AlertWrapper>
    </StoreProvider>
  )
})

export default QuillContext;