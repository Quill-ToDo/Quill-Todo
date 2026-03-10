import React, { 
    createContext,
    Dispatch, 
    ForwardedRef, 
    forwardRef,  
    ReactElement, 
    ReactNode, 
    SetStateAction, 
    useContext,  
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
    Placement,
    autoUpdate,
    useFloatingRootContext,
    UseFloatingRootContextOptions,
    FloatingRootContext,
    FloatingContext,
  } from '@floating-ui/react';
import { observer } from 'mobx-react-lite';
import { 
    PopupPositioningConfig,
    POPUP_CLASS,
    POPUP_ANCHOR_CLASS,
    PopupRenderMethod,
    PopupParams,
    PopupAnchorRenderMethods,
} from '@/app/util/Popup';
import { combineClassNamePropAndString } from '@/app/util/jsTools';

export const PORTAL_HOLDER_ID = "portal-holder";

//#region Floating UI

/**
 *  Get Floating UI positioning options to apply to elements
 * @param param0 
 * @returns 
 */
const getFloatingUiPositioning = ({
    showPopup,
    setShowPopup,
    placement,
    popupMargin,
    alignment,
    closeWhenClickOutside,
 }: PopupPositioningConfig 
 & Pick<PopupContextValues, "setShowPopup">
& {showPopup: boolean}) => {
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

    const getProps = (context: FloatingRootContext | FloatingContext) => {
        const interactions: ElementProps[] = [];
        interactions.push(useDismiss(context, {
            // close the popup when click outside of it
            outsidePress: closeWhenClickOutside,
            // close the popup when click anchor element
            // referencePress: true,
            // TODO ? what do
            bubbles: false,
        }));
        // generate the positioning props for the anchor and popup from Floating UI module
        const { getReferenceProps, getFloatingProps } = useInteractions(interactions);
        return {
            getAnchorProps: () => { return {
                ...getReferenceProps(),
                className: combineClassNamePropAndString(`${POPUP_ANCHOR_CLASS}`, getReferenceProps()),
            }},
            getPopupProps: () => {return {
                ...getFloatingProps(),
                className: combineClassNamePropAndString(`${POPUP_CLASS}`, getFloatingProps()),
            }}
        }
    }

    return {
          open: showPopup,
          onOpenChange: setShowPopup,
          placement: placement && placement !== "centered" ? (`${placement}${alignment && alignment !== "middle" ? "-"+alignment : ""}` as Placement) : undefined,
          middleware: middleware,
          whileElementsMounted: autoUpdate,
          getProps,
          // autoUpdate must only be used in this way if popup is conditionally rendered attached to the 
          // isOpen state
    }
}

//#endregion Floating UI
//#region Attached popups

/** Use Floating UI to create a positioned popup that will disappear if the anchor element is 
 * re-rendered
 */
export const FloatingUiAttachedPopup = observer((
    {   
        popupRenderMethod,
        anchorRenderMethod,
        closeWhenClickOutside,
        ...popupPositioningConfig
    } : PopupPositioningConfig & PopupAnchorRenderMethods) => {
    const [showPopup, setShowPopup] = useState(false);
    const {getProps, ...positioning} = getFloatingUiPositioning({
        showPopup, 
        setShowPopup,
        ...popupPositioningConfig,
    });

    const { refs, context, floatingStyles } = useFloating(positioning);

    const popupProps = getProps(context).getPopupProps();
    const anchorProps = getProps(context).getAnchorProps();
    // draggable ? 
    //     <DraggableRenderMethod
    //         ref={mergedPopupRef}
    //         itemData={{
    //             type: "task popup",
    //             showDropPreview: false,
    //         }}
    //         droppable={false} 
    //         useHandle={useDragHandle} 
    //         actionTitle='Move popup'
    //         render={(props, ref) => getPositionedPopup({
    //             closePopup: () => {}, 
    //             ...propsHiddenWhileNotPositioned,
    //             ...props
    //         }, ref)}
    //     />
    //     :                     ;
    return <>
        {/* Anchor element  */}
        { anchorRenderMethod(
            {
                ...anchorProps,
                openPopup: (callback?: Function) => {
                    setShowPopup(true);
                    callback && callback();
                },
            }, 
            refs.setReference
        )} 
        {/* Popup */}
        { showPopup && <FloatingPortal id={PORTAL_HOLDER_ID}>
            <FloatingFocusManager context={context}>
                { !!showPopup ? 
                    popupRenderMethod({
                        ...popupProps,
                        style: floatingStyles,
                        closePopup: (callback?: Function) => {
                            setShowPopup(false);
                            callback && callback();
                        },
                    }, refs.setFloating) as ReactElement
                : <div
                    ref={refs.setFloating}
                    style={floatingStyles}
                >
                    <p>Loading...</p>
                </div> 
                }
            </FloatingFocusManager>
        </FloatingPortal> }
    </>
});

//#endregion Attached popups
//#region Persistent popups


/**
 * Render an anchor element with an attached popup that will persist even if the
 * anchor element is unmounted.
 * Returns a method so that the user can set the reference positioning element and
 * a method that opens the popup and a method that closes the popup.
 * Must be wrapped with PersistentPopupContextProvider.
 */
export const FloatingUiPersistentPopupAnchor = observer((
    {
        anchorRenderMethod,
        popupRenderMethod,
        ...popupPositioningConfig
    } : PopupPositioningConfig & PopupAnchorRenderMethods) => {
    const thisAnchor = useRef<Element | null>(null);
    const {
        setShowPopup,
        setPersistentPopupRenderMethod,
        setCurrentAnchor,
        getAnchorProps,
        setFloatingConfig,
    } = useContext(PersistentPopupContext);
    
    // Make the popup transparent but still in the DOM until it is positioned so floating UI can 
    // get the width and height of the popup for positioning
    // draggable ? 
    //     <DraggableRenderMethod
    //         ref={mergedPopupRef}
    //         itemData={{
    //             type: "task popup",
    //             showDropPreview: false,
    //         }}
    //         droppable={false} 
    //         useHandle={useDragHandle} 
    //         actionTitle='Move popup'
    //         render={(props, ref) => getPositionedPopup({
    //             closePopup: () => {}, 
    //             ...propsHiddenWhileNotPositioned,
    //             ...props
    //         }, ref)}
    //     />
    //     :                     ;

    return anchorRenderMethod(
        {
            ...getAnchorProps(),
            openPopup: (callback?: Function) => {
                // When the popup is opened from this anchor, mark this anchor element as
                // the one that should recieve the floating UI anchor ref for persistent popup positioning. 
                // Also set props for popup rendering in the persistent popup context provider so that the 
                // popup can be rendered within PersistentPopupContextProvider based on this anchor's data. 
                setCurrentAnchor(thisAnchor.current);
                setFloatingConfig(popupPositioningConfig);
                const render: ForwardedRender = (props: PopupParams, ref: ForwardedRef<any>) => popupRenderMethod({
                    ...props,
                }, ref);
                setPersistentPopupRenderMethod((prev: ForwardedRender) => render);
                setShowPopup(true);
                callback && callback();
            },
        }, 
        thisAnchor,
    )
})

type ForwardedRender = PopupRenderMethod;
export type PopupContextValues = {
    setPersistentPopupRenderMethod: Dispatch<SetStateAction<ForwardedRender>>,
    setCurrentAnchor: Dispatch<SetStateAction<Element | null>>,
    getAnchorProps: () => any,
    setShowPopup: Dispatch<SetStateAction<boolean>>,
    setFloatingConfig: Dispatch<SetStateAction<PopupPositioningConfig | null>>
};

export const PersistentPopupContext = createContext<PopupContextValues>({
    setPersistentPopupRenderMethod: () => null,
    getAnchorProps: () => null,
    setCurrentAnchor: () => null,
    setShowPopup: () => null,
    setFloatingConfig: () => null,
});

/**
 * Provide context to allow:
 * - setting popup props elsewhere that are used to render popup element here 
 * - setting popup to show or not show
 * - setting anchor props used to render the anchor element
 * @param param0 
 * @returns 
 */
export const PersistentPopupContextProvider = observer(({children}: {
    children: ReactNode,
}) => {
    // showPopup controls whether popup is shown or not
    const [showPopup, setShowPopup] = useState(false);
    const [thisPopup, setPopup] = useState<HTMLElement | null>(null);
    // Anchor elements are rendered elsewere in AnchorWithPersistentPopupAttached 
    // components. The openPopup method in FloatingUiPersistentPopupAnchor
    // sets popupPositioningConfig and persistentPopupRenderMethod here
    // so the popup associated with that anchors data is the one that's rendered
    const [currentAnchor, setCurrentAnchor] = useState<Element | null>(null);
    const [popupPositioningConfig, setPopupPositioningConfig] = useState<PopupPositioningConfig | {}>({});  
    const [persistentPopupRenderMethod, setPersistentPopupRenderMethod] = useState<ForwardedRender>(() => () => <></>);

    // Use the config specified by the anchor component that laucnhed this popup 
    // to get methods to apply floating interactions via props, and floating positioning needed
    // to generate floating root context
    const { getProps, ...floatingPositioning } = getFloatingUiPositioning({
        showPopup, 
        setShowPopup,
        ...popupPositioningConfig,
    });

    const ops: UseFloatingRootContextOptions = {
        ...floatingPositioning,
        elements: {
            reference: currentAnchor,
            floating: thisPopup,
        }
    };

    const rootContext = useFloatingRootContext(ops);

    // 
    const popup = <PersistentPopup 
        persistentPopupRenderMethod={persistentPopupRenderMethod}
        setShowPopup={setShowPopup}
        rootContext={rootContext}
        ref={setPopup}
        {...getProps(rootContext).getPopupProps()}
    />;
    // Pass the anchor ref and anchor props used to to position the popup in context so that 
    // the anchor element can access them and render them into its returned anchor element.
    return <PersistentPopupContext.Provider
        value={{
            // Allow anchor elsewhere to set the popup as closed or open via context
            setShowPopup,
            // Allow anchor elsewhere to specify the render method used for this popup
            setPersistentPopupRenderMethod,
            // Allow components elsewhere to specify that they are the current anchor
            // (setCurrentAnchor should be used like a ref)
            setCurrentAnchor,
            // Pass props for anchor from here to the element via context
            getAnchorProps: () => getProps(rootContext).getAnchorProps(),
            // Allow anchor elsewhere to specify the config used here via context
            setFloatingConfig: () => setPopupPositioningConfig,
        }}
    >
        { children }
        { showPopup && <FloatingPortal id={PORTAL_HOLDER_ID}>
                    { popup}
                </FloatingPortal> }
    </PersistentPopupContext.Provider>
})

const PersistentPopup = forwardRef<any, {
        persistentPopupRenderMethod : ForwardedRender,
        setShowPopup: PopupContextValues["setShowPopup"],
        rootContext: FloatingRootContext,
        positioning: UseFloatingOptions,
    } & PopupParams
        >(({
        persistentPopupRenderMethod, 
        setShowPopup, 
        rootContext, 
        positioning,
        ...props}, ref) => {
            const {
                context,
                floatingStyles, 
            } = useFloating({
                ...positioning,
                whileElementsMounted: autoUpdate,
                rootContext: rootContext,
            });
            return <FloatingFocusManager context={context as FloatingContext}>
                    { persistentPopupRenderMethod({
                            ...props,
                            style: floatingStyles,
                            closePopup: (callback?: Function) => {
                                setShowPopup(false);
                                callback && callback();
                            },
                        }, ref) as ReactElement }
                </FloatingFocusManager>
})
//#endregion Attached popups
