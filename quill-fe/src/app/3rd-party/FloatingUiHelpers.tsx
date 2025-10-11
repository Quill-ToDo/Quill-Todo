import React, { 
    ComponentPropsWithoutRef,
    createContext,
    Dispatch, 
    ForwardedRef, 
    forwardRef, 
    ReactElement, 
    ReactNode, 
    SetStateAction, 
    useContext, 
    useEffect, 
    useRef, 
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
    size,
    autoPlacement,
    autoUpdate,
    Placement,
    useMergeRefs,
  } from '@floating-ui/react';
import { observer } from 'mobx-react-lite';
import { 
    PopupSetupProps,
    InnerPopupProps,
    POPUP_CLASS,
    POPUP_ANCHOR_CLASS,
    PopupRenderMethod, 
} from '@util/Popup';
import { combineClassNamePropAndString } from '@util/jsTools';
import { Draggable } from '@/util/Draggable';
import { POPUP_POSITIONER_CLASS, TRANSPARENT } from '../@util/constants';

export const PORTAL_HOLDER_ID = "portal-holder";

/**
 *  Get Floating UI positioning options to apply to elements
 * @param param0 
 * @returns 
 */
const getFloatingUiPositioning = ({
    isOpen,
    openChange,
    placement,
    popupMargin,
    alignment,
 }: InnerPopupProps & {isOpen: boolean, openChange: Dispatch<SetStateAction<boolean>>}) => {
    // Configure middleware for Floating UI module
    const middleware = [];
    // Add corresponding middleware configuration for given placement.
    // "centered" is a placement I made myself, other combos are Floating UI-specific 
    // https://floating-ui.com/docs/useFloating#placement
    if (placement === "centered") {
        middleware.push(offset(({rects}) => {
            return (
            -rects.floating.width / 2
            );
        }))
    } else {
        middleware.push(offset(10));
    }
    if (placement == "auto") {
        middleware.push(autoPlacement());
    } 
    if (popupMargin && popupMargin !== 0) {
        middleware.push(offset(popupMargin));
    }
    // shift the floating element to keep it in view
    middleware.push(shift());
    // allow the popup to "flip" to the other side of the anchor element
    middleware.push(flip());
    // TODO: Not sure if this is doing anything
    // Provides data to change the size of a floating element.
    middleware.push(size({apply: ({availableHeight, elements}) => {
        elements.floating.style.maxHeight = availableHeight >= elements.floating.scrollHeight
        ? ''
        : `${availableHeight}px`;
      }}));
    const positioning: UseFloatingOptions = {
        open: isOpen,
        onOpenChange: openChange,
        placement: placement && placement !== "centered" ? (`${placement}${alignment && alignment !== "middle" ? "-"+alignment : ""}` as Placement) : undefined,
        middleware: middleware,
        // autoUpdate must only be used in this way if popup is conditionally rendered attached to the 
        // isOpen state
    };
    // Configure interactions
    const { refs, floatingStyles, context, isPositioned, update, elements } = useFloating(positioning);
    const interactions: ElementProps[] = [];
    // context:
    interactions.push(useDismiss(context, {
        // close the popup when click outside of it
        // outsidePress: true,
        // close the popup when click anchor element
        // referencePress: true,
        // TODO ? what do
        bubbles: false,
    }));
    // generate the positioning props for the anchor and popup from Floating UI module
    const { getReferenceProps, getFloatingProps } = useInteractions(interactions);

    let floatingUiPopupPositioningProps = {
        style: floatingStyles,
        ...getFloatingProps(),
        className: combineClassNamePropAndString(`floating ${POPUP_CLASS}`, getFloatingProps()),
    }
    return {
        floatingUiRefs: refs,
        floatingUiContext: context,
        floatingUiPopupPositioningProps: floatingUiPopupPositioningProps,
        floatingUiPopupIsPositioned: isPositioned,
        getFloatingUiAnchorProps: getReferenceProps,
    }
}

type InnerPopupConfig = {
    content: ReactNode,
    anchorRef: ForwardedRef<any>,
    getAnchorProps: () => ComponentPropsWithoutRef<"button">,
    popupIsPositioned: boolean,
}

/**
 * Return the "guts" of the popup with Floating UI content applied as needed
 * 
 * @returns 
 */
const getPositionedDraggablePopup = ({
    getPositionedPopup,
    isOpen,
    openChange,
    placement,
    alignment,
    doneLoading, 
    draggable,
    useDragHandle,
    popupMargin,
    forwardedPopupRef,
    ...props
}: InnerPopupProps 
& {
    getPositionedPopup: PopupRenderMethod, 
    isOpen: boolean, 
    openChange: Dispatch<SetStateAction<boolean>>,
    forwardedPopupRef?: ForwardedRef<any>,
}): InnerPopupConfig => {
    const {
        floatingUiRefs, 
        floatingUiPopupPositioningProps,
        floatingUiContext, 
        floatingUiPopupIsPositioned, 
        getFloatingUiAnchorProps 
    } = getFloatingUiPositioning({
        isOpen, 
        openChange,
        placement,
        popupMargin,
        alignment
    });

    const mergedRef = useMergeRefs([floatingUiRefs.setFloating, forwardedPopupRef])

    // Make the popup transparent but still in the DOM until it is positioned so floating UI can 
    // get the width and height of the popup for positioning
    const propsHiddenWhileNotPositioned = floatingUiPopupIsPositioned ? floatingUiPopupPositioningProps : {
            ...floatingUiPopupPositioningProps,
            className: combineClassNamePropAndString(TRANSPARENT, floatingUiPopupPositioningProps), 
        }

    const popupWithDraggingApplied = 
    draggable ? 
        <Draggable
            droppable={false} 
            useHandle={useDragHandle} 
            actionTitle='Move popup'
            positioningProps={propsHiddenWhileNotPositioned}
            ref={mergedRef}
        >
            { getPositionedPopup({popupContainerProps:{}, closePopup: () => {}}, null) }
        </Draggable>
        : 
        <div
            ref={mergedRef}
            {...propsHiddenWhileNotPositioned}
            className={combineClassNamePropAndString(POPUP_POSITIONER_CLASS, propsHiddenWhileNotPositioned)}
        >
            { getPositionedPopup({popupContainerProps: {}, closePopup: () => {}}, null) }
        </div>;

    // Portal this shit away
    const popupWithPortalApplied = 
        <FloatingPortal id={PORTAL_HOLDER_ID}>
            <FloatingFocusManager context={floatingUiContext}>
                { doneLoading ? 
                    popupWithDraggingApplied as ReactElement
                : 
                <div
                    ref={mergedRef}
                    {...floatingUiPopupPositioningProps}
                    className={`loading take-full-space centered ${POPUP_POSITIONER_CLASS}`}
                >
                    <p>Loading...</p>
                </div>
                }
            </FloatingFocusManager>
        </FloatingPortal>;

    return {
        content: popupWithPortalApplied,
        popupIsPositioned: floatingUiPopupIsPositioned,
        // Set portal anchor and apply anchor props
        anchorRef: floatingUiRefs.setReference,
        getAnchorProps: () => { 
            const anchorProps = getFloatingUiAnchorProps();
            return {
                ...anchorProps,
                className: combineClassNamePropAndString(POPUP_ANCHOR_CLASS, anchorProps),
            };
        },
    }
}

/** Use Floating UI to create a positioned popup that will disappear if the anchor element is 
 * re-rendered
 */
export const FloatingUiAttachedPopup = observer(forwardRef((
    {   
        popupRenderMethod,
        anchorRenderMethod,
        ...props
    } : PopupSetupProps,
    forwardedRef: ForwardedRef<any>) => {
    const [showPopup, setShowPopup] = useState(false);

    const popupSetup = getPositionedDraggablePopup({
        getPositionedPopup: ({popupContainerProps}, ref) => 
            popupRenderMethod({
                closePopup: (callback?: Function) => {
                        setShowPopup(false);
                        callback && callback();
                    }, 
                popupContainerProps: popupContainerProps 
                }, 
                ref,
            ),
            forwardedPopupRef: forwardedRef,
            isOpen: showPopup,
            openChange: setShowPopup,
            ...props
    });
    
    return <>
        {/* Anchor element  */}
        { anchorRenderMethod(
            {
                openPopup: (callback?: Function) => {
                        setShowPopup(true);
                        callback && callback();
                },
                anchorProps: popupSetup.getAnchorProps(),
            },
            popupSetup.anchorRef, 
        )} 
        {/* Popup */}
        { showPopup && popupSetup.content }
    </>
}))

/**
 * Render a popup positioned near a reference element that will persist even if the
 * reference is unmounted.
 * Returns a method so that the user can set the reference positioning element and
 * a method that opens the popup and a method that closes the popup.
 * Must be wrapped with PersistentPopupContextProvider.
 */
export const FloatingUiPersistentPopup = observer(forwardRef((
    {
        anchorRenderMethod,
        popupRenderMethod,
        ...props
    } : PopupSetupProps, 
    forwardedRef: ForwardedRef<any>) => {
    // Get the ref for the positioning reference/anchor element from FloatingUi
    const { 
        anchorRef: setPopupAnchorRef, 
        setPopupProps, 
        setShowPopup, 
        anchorProps, 
        popupIsPositioned 
    } = useContext(PersistentPopupContext);
    // Maintain a ref to this particular anchor element
    const thisAnchorRef = useRef(null);
    const setPopupAnchor = useMergeRefs([thisAnchorRef, setPopupAnchorRef]);
    const [popupOpenedAttachedToThisAnchor, setPopupOpenedAttachedToThisAnchor] = useState(false); 

    useEffect(() => {
        // Only attach persistent popup positioning to this anchor until the popup is 
        // correctly positioned relative to it from the persistent popup context. so that 
        // if persistent popup is opened from a different anchor the floatingReferenceRef can
        // immediately be switched to the new anchor to re-position it as the content is also re-set
        if (popupIsPositioned) {
            setPopupOpenedAttachedToThisAnchor(false);
        }
    }, [popupIsPositioned]);
        
    return anchorRenderMethod({
            openPopup: (callback?: Function) => {
                // When the popup is opened from this anchor, mark it as being the one that
                // should recieve the floating UI positioning ref. 
                // Also set relevant popup content into the persistent 
                // popup context so that the popup can be rendered in PersistentPopupContextProvider 
                // based on this anchor's data. 
                setPopupOpenedAttachedToThisAnchor(true);
                setPopupProps({
                    popupRenderMethod,
                    anchorRenderMethod,
                    forwardedPopupRef: forwardedRef,
                    ...props
                });
                setShowPopup(true);
                callback && callback();
            }, 
            anchorProps,
        }, 
        // Either set the anchor ref to be just a pointer ref to this element or
        // the floating UI one if this is the anchor which opened the popup
        popupOpenedAttachedToThisAnchor ? setPopupAnchor : thisAnchorRef,  
    );
}))

type PopupParamsNeededInContextProvider = PopupSetupProps & { 
    forwardedPopupRef: ForwardedRef<any>,
};
export const PersistentPopupContext = createContext<{
    setPopupContent?: Dispatch<SetStateAction<ReactNode>>,
    setGetPopupContent?: Dispatch<SetStateAction<(isOpen: boolean, openChange: Dispatch<SetStateAction<boolean>>) => InnerPopupConfig>>,
    showPopup: boolean,
    setShowPopup: Dispatch<SetStateAction<boolean>>,
    anchorRef: ForwardedRef<any> | null,
    anchorProps: ComponentPropsWithoutRef<any>,
    setPopupProps: Dispatch<SetStateAction<PopupParamsNeededInContextProvider>> ,
    popupIsPositioned: boolean,
}>({
    setPopupContent: () => null,
    setGetPopupContent: () => null,
    setPopupProps: () => null,
    showPopup: false,
    setShowPopup: () => null,
    anchorRef: null,
    anchorProps: {},
    popupIsPositioned: false,
});

export const PersistentPopupContextProvider = ({children}: {
    children: ReactNode,
}) => {
    //  1) Anchor elements are rendered elsewere in AnchorWithPersistentPopupAttached components. 
    //     They have attached open popup methods which set the popup setup props here so that the popups
    //     can be rendered here
    const [popupProps, setPopupProps] = useState<PopupParamsNeededInContextProvider>({
        forwardedPopupRef: () => null,
        popupRenderMethod: () => null,
        anchorRenderMethod: () => null,
    }); 
    const [popupContent, setPopupContent] = useState<ReactNode>(null);
    // showPopup controls whether popup is shown or not in floating UI as well
    const [showPopup, setShowPopup] = useState(false);
    const [anchorProps, setAnchorProps] = useState<ComponentPropsWithoutRef<any>>({});

    //  3) based on current popup props, generate popup content to render from this component, 
    //     an anchor ref, and anchor props to pass back to the 
    //     paricular anchor element that opened the popup
    const { content, anchorRef: setPopupAnchor, getAnchorProps, popupIsPositioned } = getPositionedDraggablePopup({
        getPositionedPopup: ({popupContainerProps}, ref) => 
            popupProps.popupRenderMethod({
                    closePopup: (callback?: Function) => {
                        setShowPopup(false);
                        callback && callback();
                    }, 
                    popupContainerProps: popupContainerProps
                }, 
                ref),
            isOpen: showPopup,
            openChange: setShowPopup,
            ...popupProps
        });
    
        // TODO this is currently causing errors because content is changing every time
    //   5) After everything is rendered, listen for changes to the popup content 
    //      base (do to the anchor being set etc.)
    //      and anchor props. render updates popup content as soon as it is received
    useEffect(() => {
        if (showPopup) {
            setPopupContent(content as ReactElement);
            setAnchorProps(getAnchorProps());
        }
    }, [showPopup, content]);

    //  4) Pass the anchor ref and anchor props to position the popup in context data so that 
    //     the anchor element can access them and render them into it's returned anchor element 
    return <PersistentPopupContext.Provider
        value={{
            showPopup: showPopup,
            setShowPopup: setShowPopup,
            setPopupProps: setPopupProps,
            anchorRef: setPopupAnchor,
            anchorProps: anchorProps,
            popupIsPositioned: popupIsPositioned,
        }}
    >
        { children }
        { showPopup && popupContent }
    </PersistentPopupContext.Provider>
}