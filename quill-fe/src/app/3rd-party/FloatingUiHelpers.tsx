import React, { 
    Dispatch, 
    ForwardedRef, 
    ReactNode, 
    SetStateAction, 
    useEffect, 
    useState
 } from 'react';
import {
    FloatingFocusManager,
    UseFloatingOptions,
    useInteractions,
    FloatingPortal,
    ElementProps,
    useFloating,
    useDismiss,
    offset,
    shift,
    flip,
    ReferenceType,
    size,
  } from '@floating-ui/react';
import { observer } from 'mobx-react-lite';
import { TetheredPopupParams, StandalonePopupParams, SharedPopupProps } from '../@util/Popup';
import { combineClassNamePropAndString } from '@util/constants';
import { Draggable } from '@/util/Draggable';

export const PORTAL_HOLDER_ID = "portal-holder";

const loading = <div className="loading">
    <p>Loading...</p>
</div>;

/**
 * Return the "guts" of the popup with Floating UI content applied as needed
 * 
 * @returns 
 */
const getInnerPopupContent = ({
    innerContent,
    isOpen,
    openChange,
    placement,
    alignment,
    doneLoading, 
    draggable,
    useDragHandle,
    ...props
}: SharedPopupProps 
& {innerContent: ReactNode, isOpen: boolean, openChange: Dispatch<SetStateAction<boolean>>}) => {
    // Configure middleware
    const middleware = [];
    if (placement === "centered") {
        middleware.push(offset(({rects}) => {
            return (
            -rects.floating.width / 2
            );
        }))
    } else {
        middleware.push(offset(10));
    }
    
    middleware.push(shift());
    middleware.push(flip());
    // TODO: Not sure if this is doing anything
    middleware.push(size({apply: ({availableHeight, elements}) => {
        elements.floating.style.maxHeight = availableHeight >= elements.floating.scrollHeight
        ? ''
        : `${availableHeight}px`;
      }}));
    const positioning: UseFloatingOptions = {
        open: isOpen,
        onOpenChange: openChange,
        // "centered" is a placement I made myself, other combos are Floating UI-specific 
        // https://floating-ui.com/docs/useFloating#placement
        placement: placement && placement !== "centered" ? (`${placement}${alignment && alignment !== "middle" ? "-"+alignment : ""}` as Placement) : undefined,
        middleware: middleware,
        // whileElementsMounted: autoUpdate,
    };
    // Configure interactions
    const { refs, floatingStyles, context } = useFloating(positioning);
    const interactions: ElementProps[] = [];
    interactions.push(useDismiss(context, {
        outsidePress: true,
        referencePress: true,
        bubbles: false,
    }));
    const {getReferenceProps, getFloatingProps} = useInteractions(interactions);

    // Apply focus manager to popup content
    const innerPopupContent = <FloatingFocusManager context={context}>
            <div 
                ref={refs.setFloating} 
                style={floatingStyles} 
                {...props}
                {...getFloatingProps()}
                className={combineClassNamePropAndString({className: `floating popup`, props: {...props, ...getFloatingProps()}})}
            >
                { doneLoading ? innerContent : loading }
            </div>
    </FloatingFocusManager>;

    // Make focus-managed inner content draggable if needed 
    const possibleDraggableContent =  draggable ? <Draggable 
        droppable={false} 
        useHandle={useDragHandle} 
        actionTitle='Move popup'
        renderDraggableItem={(draggableProps) => 
            <div 
                    className={combineClassNamePropAndString({className: `popup`, props: {...draggableProps}})}
                    role={"dialog"}
                    {...draggableProps}
                >
                { innerPopupContent }
            </div>
        }/>   
        : innerPopupContent;

    // Portal this shit away
    return {
        content: <FloatingPortal 
                        id={PORTAL_HOLDER_ID}
                    >
                        { possibleDraggableContent }
                    </FloatingPortal>,
        refs: refs,
        referenceProps: getReferenceProps,
    }
}

/** Use Floating UI to create a positioned popup */
export const FloatingUiPopupImplementation = observer((
    {   
        renderPopupContent,
        renderElementToClick,
        placement,
        alignment,
        doneLoading, 
        draggable,
        useDragHandle,
        ...props
    } : TetheredPopupParams) => {
    const [showPopup, setShowPopup] = useState(false);
    const close = () => {
        setShowPopup(false);
    };
    const open = () => {
        setShowPopup(true);
    };
    
    const popupSetup = getInnerPopupContent({
        innerContent: renderPopupContent({closePopup: close}),
        isOpen: showPopup,
        openChange: setShowPopup,
        placement: placement, 
        alignment: alignment, 
        doneLoading: doneLoading,
        draggable: draggable,
        useDragHandle: useDragHandle,
        ...props
    });
    
    return <>
        {/* Anchor element  */}
        { renderElementToClick(
            {
                openPopup: open,
                toApply: {
                    className: combineClassNamePropAndString({className: "popup-anchor", props}),
                    ...popupSetup.referenceProps(),
                },
            },
            popupSetup.refs.setReference as ForwardedRef<HTMLButtonElement>, 
        )} 
        {/* Popup */}
        { showPopup && popupSetup.content }
    </>
})

/**
 * Render a popup positioned near a reference element that will persist even if the
 * reference is unmounted.
 * Returns a method so that the user can set the reference positioning element and
 * a method that opens the popup and a method that closes the popup.
 * Must be wrapped with StandalonePopupContextProvider.
 */
export const setUpFloatingUiStandalonePopup = (
    {
        children,
        setPopupContent,
        placement,
        alignment,
        doneLoading,
        draggable,
        useDragHandle,
        ...props
        
    } : StandalonePopupParams & { setPopupContent: Dispatch<SetStateAction<any>>}  )
    : { 
        openPopup: () => void,
        closePopup: () => void,
        setPopupPositioningAnchor: ((node: ReferenceType | null) => void) & ((node: ReferenceType | null) => void),
    } =>  {
    const [showPopup, setShowPopup] = useState(false);
    
    const popupSetup = getInnerPopupContent({
        innerContent: children,
        isOpen: showPopup,
        openChange: setShowPopup,
        placement: placement, 
        alignment: alignment, 
        doneLoading: doneLoading,
        draggable: draggable,
        useDragHandle: useDragHandle,
        ...props
    });
    
    useEffect(() => {
        if (showPopup) {
            setPopupContent(popupSetup.content);
        }
    }, [showPopup])
    
    const open = () => {
        setShowPopup(true);
    };
    
    const close = () => {
        setShowPopup(false);
        setPopupContent(null);
    };

    return {
        openPopup: open,
        closePopup: close,
        setPopupPositioningAnchor: popupSetup.refs.setReference,
    }
}