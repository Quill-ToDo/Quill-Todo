'use client'

import DashboardLayout from './home/dashboardLayout';
import AlertWrapper from '@/alerts/AlertWrapper';
import { StoreProvider } from '@/store/StoreProvider';
import { observer } from 'mobx-react-lite';
import { ReactNode } from 'react';
import RootStore from './home/_globalStore/RootStore';
import { StandalonePopupContextProvider } from '@/util/Popup';

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
        <StandalonePopupContextProvider>
          <DashboardLayout>
            {widgets}
          </DashboardLayout>
        </StandalonePopupContextProvider>
      </AlertWrapper>
    </StoreProvider>
  )
})

export default QuillContext;