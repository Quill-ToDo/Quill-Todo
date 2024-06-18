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
import { ReactElement, cloneElement } from 'react';

// This code is copied from: https://floating-ui.com/docs/FloatingTree

const NestablePopup = observer(({
    refElement, 
    floatingElement,
    useFloatingParams,
    useDismissParams,
    focusManagerProps
}: {
    refElement: ReactElement,
    floatingElement: ReactElement,
    useFloatingParams: UseFloatingOptions,
    useDismissParams?: UseDismissProps,
    focusManagerProps?: FloatingFocusManagerProps,
  }) => {
   
    // Subscribe this component to the <FloatingTree> wrapper:
    const nodeId = useFloatingNodeId();
   
    // Pass the subscribed `nodeId` to `useFloating`:
    const {refs, floatingStyles, context} = useFloating(useFloatingParams);
    const interactions: ElementProps[] = [];
    if (useDismissParams) {
        interactions.push(useDismiss(context, useDismissParams))
    }
    const {getReferenceProps, getFloatingProps} = useInteractions(interactions);
   
    // Wrap the rendered floating element in a `<FloatingNode>`,
    // passing in the subscribed `nodeId`:
    return (
      <>
        {cloneElement(refElement, {ref: refs.setReference, props: getReferenceProps()})}
            <FloatingNode id={nodeId}>
            {useFloatingParams.open && (
                <FloatingPortal>
                    <FloatingFocusManager context={context} {...focusManagerProps}>
                    <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>{floatingElement}</div>
                </FloatingFocusManager>
                </FloatingPortal>
            )}
            </FloatingNode>
      </>
    );
  })

  // This is the component the consumer uses
export const PositionedPopupAndReferenceElement = observer(({
    refElement, 
    popupElement,
    popupPositioningOptions,
    dismissPopupOptions,
    popupFocusOptions,
}: {
    refElement: ReactElement,
    popupElement: ReactElement,
    popupPositioningOptions: UseFloatingOptions,
    dismissPopupOptions?: UseDismissProps,
    popupFocusOptions? : FloatingFocusManagerProps,
  }) => {

    const parentId = useFloatingParentNodeId();
    const props = {
        refElement: refElement,
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