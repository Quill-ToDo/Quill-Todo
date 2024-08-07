import {
    FloatingTree,
    FloatingNode,
    useFloatingNodeId,
    FloatingPortal,
    useFloating,
    useFloatingParentNodeId,
    UseFloatingOptions,
    UseDismissProps,
    useInteractions,
    ElementProps,
    useDismiss,
    FloatingFocusManager,
    FloatingFocusManagerProps,
  } from '@floating-ui/react';
import { observer } from 'mobx-react-lite';
import {  ReactElement, RefObject, useContext } from 'react';
import { AlertWrapperContext } from '../home/widgets/Alerts/AlertWrapper';

// This code is from: https://floating-ui.com/docs/FloatingTree

/**
 * Helper for 3rd party Floating UI package.
 * Given a render prop, the item to popup, 
 * and Floating UI configuration options, return
 * the anchor ref element to be rendered. When the 
 * setState call configured in UseFloatingOptions
 * is called to render the popup, portal it away 
 * and use focus management.
 * @returns the rendered anchor element for the popup
 */
const NestablePopup = observer(({
    renderRef,
    floatingElement,
    useFloatingParams,
    useDismissParams,
    focusManagerProps,
}: {
    renderRef:  (ref: any, props: any) => ReactElement,
    floatingElement: ReactElement,
    useFloatingParams: UseFloatingOptions,
    useDismissParams?: UseDismissProps,
    focusManagerProps?: FloatingFocusManagerProps,
  }) => {
    // Subscribe this component to the <FloatingTree> wrapper:
    const nodeId = useFloatingNodeId();
    const alertWrapperContext: RefObject<any> = useContext(AlertWrapperContext);
   
    // Pass the subscribed `nodeId` to `useFloating`:
    const { refs, floatingStyles, context } = useFloating(useFloatingParams);
    const interactions: ElementProps[] = [];
    if (useDismissParams) {
      interactions.push(useDismiss(context, useDismissParams));
    }
    const {getReferenceProps, getFloatingProps} = useInteractions(interactions);
    // TODO: Need to make sure that ref is being passed through to the render ref methods
    // bc positioning for exisitng popups got messed up
    // maybe change 
    // The ref is actually ebing passed fine, I need to pass the floating options properly
    
    // Wrap the rendered floating element in a `<FloatingNode>`,
    // passing in the subscribed `nodeId`:
    return <>
        { renderRef(refs, getReferenceProps()) } 
        <FloatingNode id={nodeId}>
        { useFloatingParams.open && <FloatingPortal 
          id={"portal-holder"}
          root={alertWrapperContext.current}
          >
              <FloatingFocusManager context={context} {...focusManagerProps}>
              <div 
                className='floating'
                ref={refs.setFloating} 
                style={floatingStyles} 
                {...getFloatingProps()}
              >
                  {floatingElement}
              </div>
          </FloatingFocusManager>
          </FloatingPortal>
        }
        </FloatingNode>
    </>
});

/**
 * Helper for 3rd party Floating UI package.
 * Given a render prop, the item to popup, 
 * and Floating UI configuration options, return
 * the anchor ref element to be rendered. Subscribe to
 * wider popup context and show popup when the state
 * value specified in UseFloatingOptions is called.
 * @returns the rendered anchor element for the popup
 */
export const PositionedPopupAndReferenceElement = observer(({
    renderRef, 
    popupElement,
    popupPositioningOptions,
    dismissPopupOptions,
    popupFocusOptions,
}: {
    renderRef: (ref: any, props: any) => ReactElement,
    popupElement: ReactElement,
    popupPositioningOptions: UseFloatingOptions,
    dismissPopupOptions?: UseDismissProps,
    popupFocusOptions? : FloatingFocusManagerProps,
  }) => {

    const parentId = useFloatingParentNodeId();
    const props = {
        renderRef: renderRef,
        floatingElement: popupElement,
        useFloatingParams: popupPositioningOptions,
        useDismissParams: dismissPopupOptions,
        focusManagerProps: popupFocusOptions,
    }
   
    // This is a root, so we wrap it with the tree
    if (parentId === null) {
      return (
        <FloatingTree>
          <NestablePopup
            {...props}
          />
        </FloatingTree>
      );
    }
   
    return <NestablePopup    
        {...props}
    />;
})